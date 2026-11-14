import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { requireUser } from "../lib/auth.js";
import { isoDate } from "../lib/serialize.js";

// Doctor and patient live on the appointment, not the consultation.
const include = {
  appointment: { include: { doctor: { include: { user: true } }, patient: { include: { user: true } } } },
};

const serialize = ({ appointment: { doctor, patient, ...appointment }, ...c }) => serializeFlat({
  ...c, appointment, doctor, patient, doctor_id: appointment.doctor_id, patient_id: appointment.patient_id,
});

const serializeFlat = (c) => ({
  id: c.id,
  appointment_id: c.appointment_id,
  appointment_number: c.appointment?.appointment_number ?? null,
  appointment_date: c.appointment?.appointment_date ? isoDate(c.appointment.appointment_date) : null,
  appointment_time: c.appointment?.appointment_time ?? null,
  appointment_type: c.appointment?.appointment_type ?? "TELECONSULTATION",
  symptom_summary: c.appointment?.symptom_summary ?? null,
  doctor_id: c.doctor_id,
  patient_id: c.patient_id,
  room_id: c.room_id,
  status: c.status,
  consultation_type: c.consultation_type,
  start_time: c.start_time,
  end_time: c.end_time,
  doctor_notes: c.doctor_notes,
  quality_rating: c.quality_rating,
  low_bandwidth_fallback: c.low_bandwidth_fallback,
  created_at: c.created_at,
  updated_at: c.updated_at,
  doctor: c.doctor ? {
    id: c.doctor.id,
    user_id: c.doctor.user_id,
    full_name: c.doctor.user?.full_name?.replace(" [DEMO DATA]", "") ?? "Doctor",
    specialization: c.doctor.specialization,
    qualification: c.doctor.qualification,
    hospital_name: c.doctor.hospital_name,
    license_number: c.doctor.license_number,
    languages_spoken: c.doctor.languages_spoken,
    village: c.doctor.user?.village,
  } : null,
  patient: c.patient ? {
    id: c.patient.id,
    user_id: c.patient.user_id,
    full_name: c.patient.user?.full_name?.replace(" [DEMO DATA]", "") ?? "Patient",
    age: c.patient.age,
    gender: c.patient.gender,
    village: c.patient.user?.village ?? "Nabha",
    phone: c.patient.user?.phone,
    abha_id: c.patient.abha_id,
    chronic_conditions: c.patient.chronic_conditions,
    allergies: c.patient.allergies,
  } : null,
  ice_servers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
});

// Ephemeral signaling & chat buses with 15-minute TTL cleanup
const roomSignals = new Map();
const roomChats = new Map();

const pruneExpired = (map) => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [roomId, items] of map.entries()) {
    const valid = items.filter((it) => it.timestamp >= cutoff);
    if (valid.length === 0) {
      map.delete(roomId);
    } else {
      map.set(roomId, valid);
    }
  }
};

const initiateSchema = z.object({
  appointment_id: z.number().int().positive(),
  consultation_type: z.enum(["AUDIO", "VIDEO", "CHAT"]).default("VIDEO"),
});

const updateStatusSchema = z.object({
  status: z.enum(["INITIATED", "CONNECTED", "COMPLETED", "FAILED"]),
  doctor_notes: z.string().max(4000).nullish(),
  quality_rating: z.number().int().min(1).max(5).nullish(),
});

const fallbackSchema = z.object({
  low_bandwidth_fallback: z.boolean().default(true),
  consultation_type: z.enum(["AUDIO", "VIDEO", "CHAT"]).default("AUDIO"),
  reason: z.string().max(500).nullish(),
});

const signalSchema = z.object({
  type: z.string().min(1).max(50),
  data: z.any(),
  target: z.string().nullish(),
});

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export const consultationsRouter = Router();

/** Role-aware consultation listing */
consultationsRouter.get("/", requireUser, async (req, res) => {
  const { role, patient, doctor } = req.user;
  let where = {};

  if (req.query.appointment_id) {
    where.appointment_id = Number(req.query.appointment_id);
  }

  if (role === "PATIENT" && patient) {
    where.appointment = { patient_id: patient.id };
  } else if (role === "DOCTOR" && doctor) {
    where.appointment = { doctor_id: doctor.id };
  } else if (!["ADMIN", "HOSPITAL_ADMIN", "ASHA_WORKER"].includes(role)) {
    return res.json([]);
  }

  if (req.query.status) {
    where.status = req.query.status;
  }

  const items = await prisma.consultation.findMany({
    where,
    include,
    orderBy: { created_at: "desc" },
    take: 50,
  });

  res.json(items.map(serialize));
});

/** Create or retrieve consultation for appointment */
consultationsRouter.post("/", requireUser, async (req, res) => {
  const p = parse(initiateSchema, req.body);
  const { role, patient, doctor } = req.user;

  const appointment = await prisma.appointment.findUnique({
    where: { id: p.appointment_id },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });

  if (!appointment) throw new HttpError(404, "Appointment not found");

  const isPatient = patient && appointment.patient_id === patient.id;
  const isDoctor = doctor && appointment.doctor_id === doctor.id;
  const isStaff = ["ADMIN", "HOSPITAL_ADMIN", "ASHA_WORKER"].includes(role);

  if (!isPatient && !isDoctor && !isStaff) {
    throw new HttpError(403, "Not authorized to access consultation for this appointment");
  }

  // Check if consultation already exists
  let consultation = await prisma.consultation.findUnique({
    where: { appointment_id: appointment.id },
    include,
  });

  if (!consultation) {
    const cleanAptNum = appointment.appointment_number.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const roomId = `sehatsetu-nabha-room-${cleanAptNum}`;

    consultation = await prisma.consultation.create({
      data: {
        appointment_id: appointment.id,
        room_id: roomId,
        status: "INITIATED",
        consultation_type: p.consultation_type,
        low_bandwidth_fallback: false,
      },
      include,
    });
  }

  res.status(201).json(serialize(consultation));
});

/** Lookup consultation by room_id */
consultationsRouter.get("/:roomId", requireUser, async (req, res) => {
  const { role, patient, doctor } = req.user;
  const consultation = await prisma.consultation.findUnique({
    where: { room_id: req.params.roomId },
    include,
  });

  if (!consultation) throw new HttpError(404, "Consultation room not found");

  const isPatient = patient && consultation.appointment.patient_id === patient.id;
  const isDoctor = doctor && consultation.appointment.doctor_id === doctor.id;
  const isStaff = ["ADMIN", "HOSPITAL_ADMIN", "ASHA_WORKER"].includes(role);

  if (!isPatient && !isDoctor && !isStaff) {
    throw new HttpError(403, "Not authorized to access this consultation room");
  }

  res.json(serialize(consultation));
});

/** Update status: CONNECTED, COMPLETED, FAILED */
consultationsRouter.patch("/:roomId/status", requireUser, async (req, res) => {
  const p = parse(updateStatusSchema, req.body);
  const consultation = await prisma.consultation.findUnique({
    where: { room_id: req.params.roomId },
  });

  if (!consultation) throw new HttpError(404, "Consultation room not found");

  const updateData = {
    status: p.status,
    ...(p.doctor_notes != null && { doctor_notes: p.doctor_notes }),
    ...(p.quality_rating != null && { quality_rating: p.quality_rating }),
  };

  if (p.status === "CONNECTED" && !consultation.start_time) {
    updateData.start_time = new Date();
  }

  if (p.status === "COMPLETED") {
    updateData.end_time = new Date();
    // Auto-mark appointment completed
    await prisma.appointment.update({
      where: { id: consultation.appointment_id },
      data: { status: "COMPLETED" },
    }).catch(() => {});
  }

  const updated = await prisma.consultation.update({
    where: { id: consultation.id },
    data: updateData,
    include,
  });

  res.json(serialize(updated));
});

/** Update low bandwidth fallback */
consultationsRouter.patch("/:roomId/fallback", requireUser, async (req, res) => {
  const p = parse(fallbackSchema, req.body);
  const consultation = await prisma.consultation.findUnique({
    where: { room_id: req.params.roomId },
  });

  if (!consultation) throw new HttpError(404, "Consultation room not found");

  const updated = await prisma.consultation.update({
    where: { id: consultation.id },
    data: {
      low_bandwidth_fallback: p.low_bandwidth_fallback,
      consultation_type: p.consultation_type,
    },
    include,
  });

  // Broadcast fallback signal to room
  const signals = roomSignals.get(req.params.roomId) || [];
  signals.push({
    id: randomUUID(),
    sender_id: req.user.id,
    sender_name: req.user.full_name?.replace(" [DEMO DATA]", ""),
    sender_role: req.user.role,
    type: "fallback_change",
    data: {
      low_bandwidth_fallback: p.low_bandwidth_fallback,
      consultation_type: p.consultation_type,
      reason: p.reason || "Rural 2G/3G network conditions detected",
    },
    timestamp: Date.now(),
  });
  roomSignals.set(req.params.roomId, signals);

  res.json(serialize(updated));
});

/** WebRTC Signaling: Send SDP offer/answer/candidate */
consultationsRouter.post("/:roomId/signal", requireUser, async (req, res) => {
  const p = parse(signalSchema, req.body);
  const { roomId } = req.params;

  pruneExpired(roomSignals);

  const signals = roomSignals.get(roomId) || [];
  const signalMsg = {
    id: randomUUID(),
    sender_id: req.user.id,
    sender_name: req.user.full_name?.replace(" [DEMO DATA]", ""),
    sender_role: req.user.role,
    type: p.type,
    data: p.data,
    target: p.target ?? null,
    timestamp: Date.now(),
  };

  signals.push(signalMsg);
  // Keep last 100 signals
  if (signals.length > 100) signals.splice(0, signals.length - 100);
  roomSignals.set(roomId, signals);

  res.status(201).json({ success: true, timestamp: signalMsg.timestamp });
});

/** WebRTC Signaling: Poll signals */
consultationsRouter.get("/:roomId/signals", requireUser, async (req, res) => {
  const { roomId } = req.params;
  const since = Number(req.query.since) || 0;

  pruneExpired(roomSignals);

  const signals = roomSignals.get(roomId) || [];
  const unread = signals.filter(
    (s) => s.timestamp > since && s.sender_id !== req.user.id
  );

  res.json(unread);
});

/** In-Call Text Chat: Send message */
consultationsRouter.post("/:roomId/chat", requireUser, async (req, res) => {
  const p = parse(chatSchema, req.body);
  const { roomId } = req.params;

  pruneExpired(roomChats);

  const chats = roomChats.get(roomId) || [];
  const chatMsg = {
    id: randomUUID(),
    sender_id: req.user.id,
    sender_name: req.user.full_name?.replace(" [DEMO DATA]", ""),
    sender_role: req.user.role,
    message: p.message,
    timestamp: Date.now(),
  };

  chats.push(chatMsg);
  if (chats.length > 200) chats.splice(0, chats.length - 200);
  roomChats.set(roomId, chats);

  res.status(201).json(chatMsg);
});

/** In-Call Text Chat: Get messages */
consultationsRouter.get("/:roomId/chat", requireUser, async (req, res) => {
  const { roomId } = req.params;
  const since = Number(req.query.since) || 0;

  pruneExpired(roomChats);

  const chats = roomChats.get(roomId) || [];
  const messages = since > 0 ? chats.filter((m) => m.timestamp > since) : chats;

  res.json(messages);
});
