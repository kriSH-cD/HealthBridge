import { Router } from "express";
import { prisma } from "../db.js";

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
