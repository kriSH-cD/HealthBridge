import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";

export const ambulancesRouter = Router();

const createEmergencyRequestSchema = z.object({
  caller_name: z.string().trim().min(2, "Caller name required").max(100),
  caller_phone: z.string().trim().min(7, "Valid phone number required").max(20),
  pickup_village: z.string().trim().min(2, "Pickup village required").max(100),
  pickup_landmark: z.string().trim().max(255).optional(),
  destination_hospital_id: z.number().int().positive().optional(),
  ambulance_id: z.number().int().positive().optional(),
  triage_severity: z.enum(["CRITICAL", "URGENT", "NORMAL"]).default("URGENT"),
  chief_complaint: z.string().trim().min(3, "Chief complaint description required"),
  patient_name: z.string().trim().max(100).optional(),
  patient_age: z.number().int().min(0).max(130).optional(),
  notes: z.string().trim().optional(),
  auto_assign: z.boolean().default(true),
});

const updateRequestStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "DISPATCHED",
    "EN_ROUTE",
    "ARRIVED_SCENE",
    "TRANSPORTING",
    "COMPLETED",
    "CANCELLED",
  ]),
  notes: z.string().trim().optional(),
});

/**
 * Public: Aggregate summary of ambulances and emergency operations.
 */
ambulancesRouter.get("/summary", async (_req, res) => {
  const [ambulances, activeRequests] = await Promise.all([
    prisma.ambulance.findMany(),
    prisma.emergencyRequest.count({
      where: {
        status: { in: ["PENDING", "DISPATCHED", "EN_ROUTE", "ARRIVED_SCENE", "TRANSPORTING"] },
      },
    }),
  ]);

  const total_ambulances = ambulances.length;
  const available_ambulances = ambulances.filter((a) => a.status === "AVAILABLE").length;
  const dispatched_ambulances = ambulances.filter((a) => a.status === "DISPATCHED").length;
  const als_count = ambulances.filter((a) => a.ambulance_type === "ALS").length;
  const bls_count = ambulances.filter((a) => a.ambulance_type === "BLS").length;
  const oxygen_equipped = ambulances.filter((a) => a.has_oxygen).length;
  const ventilator_equipped = ambulances.filter((a) => a.has_ventilator).length;

  res.json({
    total_ambulances,
    available_ambulances,
    dispatched_ambulances,
    als_count,
    bls_count,
    oxygen_equipped,
    ventilator_equipped,
    active_emergency_requests: activeRequests,
    helpline_number: "108",
    civil_hospital_hotline: "01765-220102",
  });
});

/**
 * Public: List all ambulances in Nabha 108 rapid response fleet.
 */
ambulancesRouter.get("/", async (req, res) => {
  const where = {};

  if (req.query.status) {
    where.status = req.query.status;
  }
  if (req.query.ambulance_type) {
    where.ambulance_type = req.query.ambulance_type;
  }
  if (req.query.has_oxygen !== undefined) {
    where.has_oxygen = req.query.has_oxygen === "true" || req.query.has_oxygen === true;
  }
  if (req.query.has_ventilator !== undefined) {
    where.has_ventilator = req.query.has_ventilator === "true" || req.query.has_ventilator === true;
  }
  if (req.query.q) {
    const q = String(req.query.q).trim();
    where.OR = [
      { vehicle_number: { contains: q, mode: "insensitive" } },
      { station_location: { contains: q, mode: "insensitive" } },
      { driver_name: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.ambulance.findMany({
    where,
    orderBy: [
      { status: "asc" }, // AVAILABLE first
      { ambulance_type: "asc" }, // ALS first
      { id: "asc" },
    ],
  });

  res.json(items);
});

/**
 * Public: List active and historical emergency requests.
 */
ambulancesRouter.get("/requests", async (req, res) => {
  const where = {};
  if (req.query.status) {
    where.status = req.query.status;
  }
  if (req.query.triage_severity) {
    where.triage_severity = req.query.triage_severity;
  }
  if (req.query.pickup_village) {
    where.pickup_village = { contains: String(req.query.pickup_village).trim(), mode: "insensitive" };
  }

  const items = await prisma.emergencyRequest.findMany({
    where,
    include: {
      ambulance: true,
      destination_hospital: true,
    },
    orderBy: { created_at: "desc" },
    take: Number(req.query.limit) || 50,
  });

  res.json(items);
});

/**
 * Public: Create rapid 108 Emergency Ambulance dispatch request.
 */
ambulancesRouter.post("/requests", async (req, res) => {
  const payload = parse(createEmergencyRequestSchema, req.body);

  let targetAmbulanceId = payload.ambulance_id || null;
  let targetHospitalId = payload.destination_hospital_id || null;

  // Auto-find default destination hospital if unspecified (Sub-Divisional Civil Hospital Nabha)
  if (!targetHospitalId) {
    const civilHospital = await prisma.hospital.findFirst({
      where: { hospital_name: { contains: "Civil Hospital", mode: "insensitive" } },
    });
    if (civilHospital) {
      targetHospitalId = civilHospital.id;
    }
  }

  // Auto-assign available ambulance if requested
  if (!targetAmbulanceId && payload.auto_assign) {
    // Prefer ALS for CRITICAL, otherwise nearest available BLS/ALS
    const preferredType = payload.triage_severity === "CRITICAL" ? "ALS" : undefined;
    const availableAmbulances = await prisma.ambulance.findMany({
      where: {
        status: "AVAILABLE",
        ...(preferredType ? { ambulance_type: preferredType } : {}),
      },
      orderBy: { id: "asc" },
    });

    const candidate = availableAmbulances.length > 0
      ? availableAmbulances[0]
      : await prisma.ambulance.findFirst({ where: { status: "AVAILABLE" } });

    if (candidate) {
      targetAmbulanceId = candidate.id;
      // Mark ambulance as DISPATCHED
      await prisma.ambulance.update({
        where: { id: candidate.id },
        data: { status: "DISPATCHED" },
      });
    }
  }

  const reqCount = await prisma.emergencyRequest.count();
  const requestNumber = `EMR-NBH-2026-${String(reqCount + 1).padStart(4, "0")}`;

  const createdRequest = await prisma.emergencyRequest.create({
    data: {
      request_number: requestNumber,
      caller_name: payload.caller_name,
      caller_phone: payload.caller_phone,
      pickup_village: payload.pickup_village,
      pickup_landmark: payload.pickup_landmark,
      destination_hospital_id: targetHospitalId,
      ambulance_id: targetAmbulanceId,
      triage_severity: payload.triage_severity,
      chief_complaint: payload.chief_complaint,
      patient_name: payload.patient_name || payload.caller_name,
      patient_age: payload.patient_age,
      status: targetAmbulanceId ? "DISPATCHED" : "PENDING",
      notes: payload.notes,
      dispatched_at: targetAmbulanceId ? new Date() : null,
      is_demo: true,
    },
    include: {
      ambulance: true,
      destination_hospital: true,
    },
  });

  res.status(201).json(createdRequest);
});

/**
 * Public: Update status of an emergency request (e.g., ARRIVED_SCENE, COMPLETED).
 */
ambulancesRouter.patch("/requests/:id/status", async (req, res) => {
  const id = Number(req.params.id) || 0;
  const payload = parse(updateRequestStatusSchema, req.body);

  const existing = await prisma.emergencyRequest.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Emergency request not found");

  const updateData = {
    status: payload.status,
    ...(payload.notes ? { notes: payload.notes } : {}),
  };

  if (payload.status === "COMPLETED" || payload.status === "CANCELLED") {
    updateData.completed_at = new Date();
    // Free assigned ambulance back to AVAILABLE
    if (existing.ambulance_id) {
      await prisma.ambulance.update({
        where: { id: existing.ambulance_id },
        data: { status: "AVAILABLE" },
      });
    }
  } else if (payload.status === "DISPATCHED" && !existing.dispatched_at) {
    updateData.dispatched_at = new Date();
  }

  const updated = await prisma.emergencyRequest.update({
    where: { id },
    data: updateData,
    include: {
      ambulance: true,
      destination_hospital: true,
    },
  });

  res.json(updated);
});

/**
 * Public: Get single ambulance details.
 */
ambulancesRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id) || 0;
  const item = await prisma.ambulance.findUnique({
    where: { id },
    include: {
      emergency_requests: {
        orderBy: { created_at: "desc" },
        take: 5,
      },
    },
  });

  if (!item) throw new HttpError(404, "Ambulance not found");
  res.json(item);
});
