import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { requireRoles, requireUser } from "../lib/auth.js";
import { isoDate } from "../lib/serialize.js";

const include = {
  patient: { include: { user: true } },
  doctor: { include: { user: true } },
  appointment: true,
  items: { include: { medicine: true } },
};

const serialize = (rx) => ({
  id: rx.id,
  prescription_number: rx.prescription_number,
  appointment_id: rx.appointment_id,
  patient_id: rx.patient_id,
  doctor_id: rx.doctor_id,
  patient_name: rx.patient?.user?.full_name?.replace(" [DEMO DATA]", "") ?? "Patient",
  patient_phone: rx.patient?.user?.phone ?? "",
  patient_village: rx.patient?.user?.village ?? "Nabha",
  patient_age: rx.patient?.age ?? null,
  patient_gender: rx.patient?.gender ?? null,
  patient_blood_group: rx.patient?.blood_group ?? null,
  patient_abha_id: rx.patient?.abha_id ?? null,
  doctor_name: rx.doctor?.user?.full_name?.replace(" [DEMO DATA]", "") ?? "Doctor",
  doctor_license: rx.doctor?.license_number ?? "",
  doctor_hospital: rx.doctor?.hospital_name ?? "",
  doctor_specialization: rx.doctor?.specialization ?? "",
  doctor_qualification: rx.doctor?.qualification ?? "MBBS",
  issue_date: rx.issue_date ? isoDate(rx.issue_date) : null,
  valid_until: rx.valid_until ? isoDate(rx.valid_until) : null,
  diagnosis: rx.diagnosis,
  instructions: rx.instructions,
  is_dispensed: rx.is_dispensed,
  is_demo: rx.is_demo,
  created_at: rx.created_at,
  items: (rx.items || []).map((item) => ({
    id: item.id,
    prescription_id: item.prescription_id,
    medicine_id: item.medicine_id,
    medicine_name: item.medicine?.name ?? "Medicine",
    generic_name: item.medicine?.generic_name ?? "",
    dosage: item.dosage,
    frequency: item.frequency,
    duration_days: item.duration_days,
    quantity_prescribed: item.quantity_prescribed,
    instructions: item.instructions,
    price: item.medicine?.price ?? 0,
    category: item.medicine?.category ?? "TABLET",
    strength: item.medicine?.strength ?? "",
  })),
});

const dayOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
};

const createItemSchema = z.object({
  medicine_id: z.number().int().positive(),
  dosage: z.string().trim().min(1).max(50),
  frequency: z.string().trim().min(1).max(50),
  duration_days: z.number().int().min(1).max(365).default(5),
  quantity_prescribed: z.number().int().min(1).max(1000).default(10),
  instructions: z.string().max(255).nullish(),
});

const createPrescriptionSchema = z.object({
  patient_id: z.number().int().positive(),
  appointment_id: z.number().int().positive().nullish(),
  diagnosis: z.string().trim().min(1).max(500),
  instructions: z.string().max(2000).nullish(),
  valid_until: z.iso.date().nullish(),
  items: z.array(createItemSchema).min(1, "At least one medicine is required"),
});

export const prescriptionsRouter = Router();

/** List prescriptions according to role. */
prescriptionsRouter.get("/", requireUser, async (req, res) => {
  const { role, patient, doctor } = req.user;
  const { status, search } = req.query;

  let where = {};
  if (role === "PATIENT" && patient) {
    where = { patient_id: patient.id };
  } else if (role === "DOCTOR" && doctor) {
    where = { doctor_id: doctor.id };
  } else if (["PHARMACY", "ADMIN", "HOSPITAL_ADMIN", "ASHA_WORKER"].includes(role)) {
    where = {};
  } else {
    return res.json([]);
  }

  if (status === "dispensed") {
    where.is_dispensed = true;
  } else if (status === "pending") {
    where.is_dispensed = false;
  }

  if (search) {
    const s = String(search).trim();
    where.OR = [
      { prescription_number: { contains: s, mode: "insensitive" } },
      { patient: { user: { full_name: { contains: s, mode: "insensitive" } } } },
      { patient: { user: { phone: { contains: s } } } },
    ];
  }

  const items = await prisma.prescription.findMany({
    where,
    include,
    orderBy: [{ created_at: "desc" }],
    take: 100,
  });

  res.json(items.map(serialize));
});

/** Get single prescription by ID or by prescription_number. */
prescriptionsRouter.get("/:idOrNumber", requireUser, async (req, res) => {
  const param = req.params.idOrNumber;
  const isNumeric = /^\d+$/.test(param);

  const rx = await prisma.prescription.findFirst({
    where: isNumeric ? { id: Number(param) } : { prescription_number: param },
    include,
  });

  if (!rx) throw new HttpError(404, "Prescription not found");

  // Patients can only view their own prescription
  if (req.user.role === "PATIENT" && req.user.patient && rx.patient_id !== req.user.patient.id) {
    throw new HttpError(403, "Access denied to this prescription");
  }

  res.json(serialize(rx));
});

/** Doctor creates a new digital prescription. */
prescriptionsRouter.post("/", ...requireRoles("DOCTOR"), async (req, res) => {
  const p = parse(createPrescriptionSchema, req.body);
  if (!req.user.doctor) throw new HttpError(400, "Doctor profile missing");

  const patient = await prisma.patient.findUnique({
    where: { id: p.patient_id },
    include: { user: true },
  });
  if (!patient) throw new HttpError(404, "Patient not found");

  // Validate all medicine_ids exist
  const medIds = p.items.map((i) => i.medicine_id);
  const foundMeds = await prisma.medicine.findMany({
    where: { id: { in: medIds } },
  });
  if (foundMeds.length !== new Set(medIds).size) {
    throw new HttpError(400, "One or more prescribed medicines are invalid");
  }

  const code = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  const year = new Date().getFullYear();
  const prescriptionNumber = `RX-NBH-${year}-${code}`;

  const validUntilStr = p.valid_until ?? dayOffset(30);
  const validUntilDate = new Date(`${validUntilStr}T00:00:00Z`);
  const issueDate = new Date(`${new Date().toLocaleDateString("en-CA")}T00:00:00Z`);

  const created = await prisma.$transaction(async (tx) => {
    const rx = await tx.prescription.create({
      data: {
        prescription_number: prescriptionNumber,
        patient_id: p.patient_id,
        doctor_id: req.user.doctor.id,
        appointment_id: p.appointment_id ?? null,
        diagnosis: p.diagnosis,
        instructions: p.instructions ?? null,
        issue_date: issueDate,
        valid_until: validUntilDate,
        is_dispensed: false,
        is_demo: false,
        items: {
          create: p.items.map((it) => ({
            medicine_id: it.medicine_id,
            dosage: it.dosage,
            frequency: it.frequency,
            duration_days: it.duration_days,
            quantity_prescribed: it.quantity_prescribed,
            instructions: it.instructions ?? null,
          })),
        },
      },
      include,
    });

    // If associated with a scheduled appointment, mark appointment completed
    if (p.appointment_id) {
      await tx.appointment.updateMany({
        where: { id: p.appointment_id, status: "SCHEDULED" },
        data: { status: "COMPLETED" },
      });
    }

    // Notify patient
    await tx.notification.create({
      data: {
        user_id: patient.user_id,
        title: "ਨਵੀਂ ਪਰਚੀ ਜਾਰੀ ਕੀਤੀ ਗਈ (New Prescription)",
        message: `Dr. ${req.user.full_name?.replace(" [DEMO DATA]", "")} has issued prescription #${rx.prescription_number} for ${p.diagnosis}.`,
        notification_type: "PRESCRIPTION_READY",
        language: patient.user?.preferred_language || "pa",
      },
    });

    return rx;
  });

  res.status(201).json(serialize(created));
});

/** Pharmacy dispenses prescription and updates inventory. */
prescriptionsRouter.post("/:id/dispense", ...requireRoles("PHARMACY"), async (req, res) => {
  const pharmacy = req.user.pharmacy;
  if (!pharmacy) throw new HttpError(400, "Pharmacy profile missing");

  const rx = await prisma.prescription.findUnique({
    where: { id: Number(req.params.id) || 0 },
    include,
  });

  if (!rx) throw new HttpError(404, "Prescription not found");
  if (rx.is_dispensed) throw new HttpError(400, "Prescription has already been dispensed");

  if (rx.valid_until) {
    const todayStr = new Date().toLocaleDateString("en-CA");
    if (isoDate(rx.valid_until) < todayStr) {
      throw new HttpError(400, "Prescription has expired");
    }
  }

  const updatedRx = await prisma.$transaction(async (tx) => {
    // For each item, decrement matching stock from this pharmacy if available
    for (const item of rx.items) {
      const inv = await tx.pharmacyInventory.findFirst({
        where: {
          pharmacy_id: pharmacy.id,
          medicine_id: item.medicine_id,
          stock_quantity: { gt: 0 },
        },
        orderBy: { expiry_date: "asc" },
      });

      if (inv) {
        const deductQty = Math.min(inv.stock_quantity, item.quantity_prescribed);
        const newQty = inv.stock_quantity - deductQty;
        await tx.pharmacyInventory.update({
          where: { id: inv.id },
          data: {
            stock_quantity: newQty,
            is_available: newQty > 0,
          },
        });
      }
    }

    const dispensed = await tx.prescription.update({
      where: { id: rx.id },
      data: { is_dispensed: true },
      include,
    });

    if (rx.patient?.user_id) {
      await tx.notification.create({
        data: {
          user_id: rx.patient.user_id,
          title: "ਦਵਾਈਆਂ ਦਿੱਤੀਆਂ ਗਈਆਂ (Prescription Dispensed)",
          message: `Your prescription #${rx.prescription_number} has been dispensed by ${pharmacy.pharmacy_name}.`,
          notification_type: "PRESCRIPTION_READY",
          language: rx.patient?.user?.preferred_language || "pa",
        },
      });
    }

    return dispensed;
  });

  res.json({
    message: "Prescription dispensed successfully",
    prescription: serialize(updatedRx),
  });
});
