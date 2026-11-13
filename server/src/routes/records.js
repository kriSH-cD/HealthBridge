import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { requireRoles } from "../lib/auth.js";
import { prescriptionInclude, recordInclude, serializePrescription, serializeRecord } from "../lib/clinical.js";

/**
 * Whose history may this user read?
 * Patients: their own. Doctors: a patient they have had an appointment with (logged to audit_logs).
 */
async function resolvePatient(req, action) {
  if (req.user.role === "PATIENT") {
    if (!req.user.patient) throw new HttpError(400, "Patient profile missing");
    return { patientId: req.user.patient.id, doctorId: null };
  }
  const { patient_id } = parse(z.object({ patient_id: z.coerce.number().int().positive() }), req.query);
  const doctorId = req.user.doctor?.id;
  const treated = doctorId && await prisma.appointment.findFirst({ where: { doctor_id: doctorId, patient_id }, select: { id: true } });
  if (!treated) throw new HttpError(403, "You can only view patients you have an appointment with");

  await prisma.auditLog.create({ data: {
    user_id: req.user.id, action, resource_type: "Patient", resource_id: String(patient_id),
    ip_address: req.ip, user_agent: req.get("user-agent")?.slice(0, 255) ?? null,
  } });
  return { patientId: patient_id, doctorId };
}

export const recordsRouter = Router();

recordsRouter.get("/", ...requireRoles("PATIENT", "DOCTOR"), async (req, res) => {
  const { patientId, doctorId } = await resolvePatient(req, "VIEW_MEDICAL_RECORDS");
  const records = await prisma.medicalRecord.findMany({
    // Confidential notes stay between the patient and the doctor who wrote them.
    where: { patient_id: patientId, ...(doctorId && { OR: [{ is_confidential: false }, { doctor_id: doctorId }] }) },
    include: recordInclude,
    orderBy: [{ record_date: "desc" }, { id: "desc" }],
  });
  res.json(records.map(serializeRecord));
});

export const prescriptionsRouter = Router();

prescriptionsRouter.get("/", ...requireRoles("PATIENT", "DOCTOR"), async (req, res) => {
  const { patientId } = await resolvePatient(req, "VIEW_PRESCRIPTIONS");
  const prescriptions = await prisma.prescription.findMany({
    where: { patient_id: patientId },
    include: prescriptionInclude,
    orderBy: [{ issue_date: "desc" }, { id: "desc" }],
  });
  res.json(prescriptions.map(serializePrescription));
});
