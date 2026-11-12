import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { requireRoles } from "../lib/auth.js";

export const hospitalsRouter = Router();

export const serializeHospital = (h) => {
  const occupied_beds = Math.max(0, h.total_beds - h.available_beds);
  const occupancy_rate = h.total_beds > 0 ? Math.round((occupied_beds / h.total_beds) * 100) : 0;
  let bed_status = "AVAILABLE";
  if (h.available_beds === 0) {
    bed_status = "FULL";
  } else if (h.available_beds <= 5) {
    bed_status = "CRITICAL";
  }

  return {
    id: h.id,
    user_id: h.user_id,
    hospital_name: h.hospital_name,
    address: h.address,
    emergency_phone: h.emergency_phone,
    total_beds: h.total_beds,
    available_beds: h.available_beds,
    occupied_beds,
    occupancy_rate,
    bed_status,
    has_oxygen: h.has_oxygen,
    has_emergency: h.has_emergency,
    created_at: h.created_at,
    updated_at: h.updated_at,
  };
};

/**
 * Public: List all Nabha hospitals, CHCs, and PHCs with real-time bed and oxygen availability.
 * Query filters: q (search name/address), has_oxygen (boolean), has_emergency (boolean), available_only (boolean).
 */
hospitalsRouter.get("/", async (req, res) => {
  const where = {};

  if (req.query.q) {
    const q = String(req.query.q).trim();
    where.OR = [
      { hospital_name: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  if (req.query.has_oxygen !== undefined) {
    where.has_oxygen = req.query.has_oxygen === "true" || req.query.has_oxygen === true;
  }

  if (req.query.has_emergency !== undefined) {
    where.has_emergency = req.query.has_emergency === "true" || req.query.has_emergency === true;
  }

  if (req.query.available_only === "true" || req.query.available_only === true) {
    where.available_beds = { gt: 0 };
  }

  const items = await prisma.hospital.findMany({
    where,
    orderBy: [
      { has_emergency: "desc" },
      { available_beds: "desc" },
      { id: "asc" },
    ],
  });

  res.json(items.map(serializeHospital));
});

/**
 * Public: Summary stats across all Nabha hospitals.
 */
hospitalsRouter.get("/summary", async (_req, res) => {
  const hospitals = await prisma.hospital.findMany();

  const total_facilities = hospitals.length;
  const total_beds = hospitals.reduce((sum, h) => sum + h.total_beds, 0);
  const total_available_beds = hospitals.reduce((sum, h) => sum + h.available_beds, 0);
  const total_occupied_beds = Math.max(0, total_beds - total_available_beds);
  const overall_occupancy_rate = total_beds > 0 ? Math.round((total_occupied_beds / total_beds) * 100) : 0;
  const oxygen_facilities = hospitals.filter((h) => h.has_oxygen).length;
  const emergency_facilities = hospitals.filter((h) => h.has_emergency).length;
  const critical_facilities = hospitals.filter((h) => h.available_beds <= 5).length;

  res.json({
    total_facilities,
    total_beds,
    total_available_beds,
    total_occupied_beds,
    overall_occupancy_rate,
    oxygen_facilities,
    emergency_facilities,
    critical_facilities,
    last_updated: hospitals.length > 0 ? hospitals[0].updated_at : new Date().toISOString(),
  });
});

/**
 * Public: Get single hospital details by ID.
 */
hospitalsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id) || 0;
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) throw new HttpError(404, "Hospital not found");
  res.json(serializeHospital(hospital));
});

const updateBedsSchema = z.object({
  available_beds: z.number().int().min(0).max(5000).optional(),
  total_beds: z.number().int().min(1).max(5000).optional(),
  has_oxygen: z.boolean().optional(),
  has_emergency: z.boolean().optional(),
  emergency_phone: z.string().min(5).max(20).optional(),
});

/**
 * Protected: Update bed availability and emergency status.
 * Accessible to HOSPITAL_ADMIN, DOCTOR, and ADMIN.
 */
hospitalsRouter.patch("/:id/beds", ...requireRoles("HOSPITAL_ADMIN", "DOCTOR", "ADMIN"), async (req, res) => {
  const id = Number(req.params.id) || 0;
  const data = parse(updateBedsSchema, req.body);

  const existing = await prisma.hospital.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Hospital not found");

  // Authorization: HOSPITAL_ADMIN can update their own hospital, ADMIN can update any
  if (req.user.role === "HOSPITAL_ADMIN" && existing.user_id !== req.user.id) {
    throw new HttpError(403, "Cannot update other hospitals");
  }

  // Validate that available_beds does not exceed total_beds
  const targetTotal = data.total_beds !== undefined ? data.total_beds : existing.total_beds;
  const targetAvailable = data.available_beds !== undefined ? data.available_beds : existing.available_beds;

  if (targetAvailable > targetTotal) {
    throw new HttpError(400, "Available beds cannot exceed total beds");
  }

  const updated = await prisma.hospital.update({
    where: { id },
    data: {
      ...data,
      updated_at: new Date(),
    },
  });

  res.json(serializeHospital(updated));
});
