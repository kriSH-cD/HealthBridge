import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { requireRoles, requireUser } from "../lib/auth.js";
import { isoDate } from "../lib/serialize.js";
import {
  documentNumber, prescriptionInclude, recordInclude, serializePrescription, serializeRecord,
} from "../lib/clinical.js";

const include = { patient: { include: { user: true } }, doctor: { include: { user: true } } };

const serialize = (a) => ({
  id: a.id,
  appointment_number: a.appointment_number,
  patient_id: a.patient_id,
  doctor_id: a.doctor_id,
  patient_name: a.patient.user.full_name,
  doctor_name: a.doctor.user.full_name,
  appointment_date: isoDate(a.appointment_date),
  appointment_time: a.appointment_time,
  appointment_type: a.appointment_type,
  status: a.status,
  symptom_summary: a.symptom_summary,
  notes: a.notes,
  is_demo: a.is_demo,
  created_at: a.created_at,
});

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, server local time

const bookSchema = z.object({
  doctor_id: z.number().int().positive(),
  appointment_date: z.iso.date(),
  appointment_time: z.string().trim().min(1).max(20),
  appointment_type: z.enum(["IN_PERSON", "TELECONSULTATION"]).default("IN_PERSON"),
  symptom_summary: z.string().max(2000).nullish(),
});

const statusSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  notes: z.string().max(2000).nullish(),
});

export const appointmentsRouter = Router();

appointmentsRouter.post("/", ...requireRoles("PATIENT"), async (req, res) => {
  const p = parse(bookSchema, req.body);
  if (!req.user.patient) throw new HttpError(400, "Patient profile missing");
  if (p.appointment_date < today()) throw new HttpError(400, "Appointment date is in the past");

  const doctor = await prisma.doctor.findUnique({ where: { id: p.doctor_id }, include: { user: true } });
  if (!doctor || !doctor.user.is_active) throw new HttpError(404, "Doctor not found");
  if (!doctor.is_available) throw new HttpError(400, "Doctor is not accepting appointments");

  const appointment = await prisma.appointment.create({
    data: {
      appointment_number: documentNumber("APT"),
      patient_id: req.user.patient.id,
      doctor_id: doctor.id,
      appointment_date: new Date(`${p.appointment_date}T00:00:00Z`),
      appointment_time: p.appointment_time,
      appointment_type: p.appointment_type,
      symptom_summary: p.symptom_summary ?? null,
      is_demo: false,
    },
    include,
  }).catch((e) => {
    if (e.code === "P2002") throw new HttpError(409, "This time slot is already booked with this doctor");
    throw e;
  });
  res.status(201).json(serialize(appointment));
});

appointmentsRouter.get("/", requireUser, async (req, res) => {
  const { role, patient, doctor } = req.user;
  const where = role === "PATIENT" && patient ? { patient_id: patient.id }
    : role === "DOCTOR" && doctor ? { doctor_id: doctor.id }
    : null;
  if (!where) return res.json([]);
  const items = await prisma.appointment.findMany({
    where, include, orderBy: [{ appointment_date: "asc" }, { appointment_time: "asc" }],
  });
  res.json(items.map(serialize));
});

/** Doctor completes / marks no-show / cancels; patient can only cancel. */
appointmentsRouter.patch("/:id/status", requireUser, async (req, res) => {
  const p = parse(statusSchema, req.body);
  const appointment = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) || 0 } });
  const isPatient = appointment && appointment.patient_id === req.user.patient?.id;
  const isDoctor = appointment && appointment.doctor_id === req.user.doctor?.id;
  if (!isPatient && !isDoctor) throw new HttpError(404, "Appointment not found");

  if (appointment.status !== "SCHEDULED") throw new HttpError(400, "Only scheduled appointments can change");
  if (p.status === "SCHEDULED") throw new HttpError(400, "Appointment is already scheduled");
  if (isPatient && !isDoctor && p.status !== "CANCELLED") throw new HttpError(403, "Patients can only cancel");

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: p.status, ...(p.notes != null && { notes: p.notes }) },
    include,
  });
  res.json(serialize(updated));
});

const completeSchema = z.object({
  title: z.string().trim().min(1).max(150).default("OPD visit"),
  diagnosis: z.string().trim().min(1).max(5000),
  clinical_notes: z.string().max(5000).nullish(),
  vitals: z.record(z.string().max(30), z.union([z.string().max(30), z.number()])).nullish(),
  is_confidential: z.boolean().default(false),
  prescription: z.object({
    instructions: z.string().max(2000).nullish(),
    valid_days: z.number().int().min(1).max(365).default(30),
    items: z.array(z.object({
      medicine_id: z.number().int().positive(),
      dosage: z.string().trim().min(1).max(50),
      frequency: z.string().trim().min(1).max(50),
      duration_days: z.number().int().min(1).max(365),
      quantity_prescribed: z.number().int().min(1).max(1000),
      instructions: z.string().max(255).nullish(),
    })).min(1).max(20),
  }).nullish(),
});

const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

/**
 * Doctor closes a visit: writes the visit note, optionally a prescription, and marks it COMPLETED.
 * All-or-nothing, so a completed visit always has its note.
 */
appointmentsRouter.post("/:id/complete", ...requireRoles("DOCTOR"), async (req, res) => {
  const p = parse(completeSchema, req.body);
  const appointment = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) || 0 } });
  if (!appointment || appointment.doctor_id !== req.user.doctor?.id) throw new HttpError(404, "Appointment not found");
  if (appointment.status !== "SCHEDULED") throw new HttpError(400, "Only scheduled appointments can be completed");

  const visit = { appointment_id: appointment.id, patient_id: appointment.patient_id, doctor_id: appointment.doctor_id };
  const today = new Date(`${new Date().toLocaleDateString("en-CA")}T00:00:00Z`);

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.medicalRecord.create({
      data: {
        ...visit, record_number: documentNumber("REC"), record_type: "GENERAL_VISIT", record_date: today,
        title: p.title, diagnosis: p.diagnosis, clinical_notes: p.clinical_notes ?? null,
        vitals: p.vitals ?? undefined, is_confidential: p.is_confidential, is_demo: false,
      },
      include: recordInclude,
    });
    const prescription = p.prescription && await tx.prescription.create({
      data: {
        ...visit, prescription_number: documentNumber("RX"), issue_date: today,
        valid_until: addDays(today, p.prescription.valid_days), diagnosis: p.diagnosis,
        instructions: p.prescription.instructions ?? null, is_demo: false,
        items: { create: p.prescription.items.map((i) => ({ ...i, instructions: i.instructions ?? null })) },
      },
      include: prescriptionInclude,
    });
    const updated = await tx.appointment.update({ where: { id: appointment.id }, data: { status: "COMPLETED" }, include });
    return { appointment: serialize(updated), record: serializeRecord(record), prescription: prescription ? serializePrescription(prescription) : null };
  }).catch((e) => {
    if (e.code === "P2003") throw new HttpError(422, "Unknown medicine in prescription");
    throw e;
  });
  res.status(201).json(result);
});
