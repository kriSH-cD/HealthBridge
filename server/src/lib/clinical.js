import { randomUUID } from "node:crypto";
import { isoDate } from "./serialize.js";

/** Human-readable unique number, e.g. RX-3F9A1C0B2D. */
export const documentNumber = (prefix) => `${prefix}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

export const recordInclude = { doctor: { include: { user: true } }, patient: { include: { user: true } } };
export const prescriptionInclude = { ...recordInclude, items: { include: { medicine: true }, orderBy: { id: "asc" } } };

export const serializeRecord = (r) => ({
  id: r.id,
  record_number: r.record_number,
  appointment_id: r.appointment_id,
  record_type: r.record_type,
  title: r.title,
  diagnosis: r.diagnosis,
  clinical_notes: r.clinical_notes,
  vitals: r.vitals,
  record_date: isoDate(r.record_date),
  is_confidential: r.is_confidential,
  patient_name: r.patient.user.full_name,
  doctor_name: r.doctor?.user.full_name ?? null,
  created_at: r.created_at,
});

export const serializePrescription = (p) => ({
  id: p.id,
  prescription_number: p.prescription_number,
  appointment_id: p.appointment_id,
  issue_date: isoDate(p.issue_date),
  valid_until: p.valid_until && isoDate(p.valid_until),
  diagnosis: p.diagnosis,
  instructions: p.instructions,
  is_dispensed: p.is_dispensed,
  patient_name: p.patient.user.full_name,
  doctor_name: p.doctor.user.full_name,
  items: p.items.map((i) => ({
    medicine_id: i.medicine_id,
    medicine_name: i.medicine.name,
    strength: i.medicine.strength,
    dosage: i.dosage,
    frequency: i.frequency,
    duration_days: i.duration_days,
    quantity_prescribed: i.quantity_prescribed,
    instructions: i.instructions,
  })),
  created_at: p.created_at,
});
