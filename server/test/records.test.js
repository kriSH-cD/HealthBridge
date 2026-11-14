import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { api, registerAndLogin, scheduledVisit } from "./helpers.js";

async function completedVisit({ confidential = false } = {}) {
  const v = await scheduledVisit();
  await api().post(`/api/v1/appointments/${v.appt.id}/complete`).set(v.doctor.headers).send({
    diagnosis: "Viral fever", is_confidential: confidential,
    prescription: { items: [{ medicine_id: v.medicine.id, dosage: "500 mg", frequency: "1-0-1", duration_days: 3, quantity_prescribed: 6 }] },
  });
  return v;
}

describe("records and prescriptions", () => {
  it("patient sees their own history", async () => {
    const { patient } = await completedVisit();
    const records = (await api().get("/api/v1/records").set(patient.headers)).body;
    expect(records.map((r) => r.diagnosis)).toEqual(["Viral fever"]);
    const rxs = (await api().get("/api/v1/records/prescriptions").set(patient.headers)).body;
    expect(rxs[0].items[0].medicine_name).toBe("Paracetamol");
  });

  it("treating doctor can read, with an audit entry; other doctors cannot", async () => {
    const { doctor, patient } = await completedVisit();
    const patientId = patient.user.patient_profile.id;
    const res = await api().get(`/api/v1/records?patient_id=${patientId}`).set(doctor.headers);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const log = await prisma.auditLog.findFirst({ where: { action: "VIEW_MEDICAL_RECORDS" } });
    expect(log).toMatchObject({ user_id: doctor.user.id, resource_id: String(patientId) });

    const stranger = await registerAndLogin("9812300041", "DOCTOR");
    expect((await api().get(`/api/v1/records?patient_id=${patientId}`).set(stranger.headers)).status).toBe(403);
    expect((await api().get(`/api/v1/records/prescriptions?patient_id=${patientId}`).set(stranger.headers)).status).toBe(403);
    expect((await api().get("/api/v1/records").set(doctor.headers)).status).toBe(422); // patient_id required
  });

  it("confidential notes are hidden from other treating doctors", async () => {
    const { patient } = await completedVisit({ confidential: true });
    const second = await registerAndLogin("9812300042", "DOCTOR");
    const d = new Date(); d.setDate(d.getDate() + 2);
    const appt = await api().post("/api/v1/appointments").set(patient.headers).send({
      doctor_id: second.user.doctor_profile.id, appointment_date: d.toLocaleDateString("en-CA"), appointment_time: "09:00 AM",
    });
    expect(appt.status).toBe(201);
    const seen = (await api().get(`/api/v1/records?patient_id=${patient.user.patient_profile.id}`).set(second.headers)).body;
    expect(seen).toEqual([]);
    expect((await api().get("/api/v1/records").set(patient.headers)).body).toHaveLength(1);
  });

  it("pharmacies cannot read records", async () => {
    const ph = await registerAndLogin("9812300043", "PHARMACY");
    expect((await api().get("/api/v1/records").set(ph.headers)).status).toBe(403);
  });
});
