import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { api, registerAndLogin } from "./helpers.js";

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString("en-CA"); };

/** Doctor + patient with one scheduled visit and one medicine in the catalogue. */
export async function scheduledVisit() {
  const doctor = await registerAndLogin("9812300031", "DOCTOR");
  const patient = await registerAndLogin("9812300032", "PATIENT");
  const medicine = await prisma.medicine.create({ data: { name: "Paracetamol", generic_name: "Paracetamol", strength: "500 mg" } });
  const appt = (await api().post("/api/v1/appointments").set(patient.headers).send({
    doctor_id: doctor.user.doctor_profile.id, appointment_date: tomorrow(), appointment_time: "10:00 AM",
  })).body;
  return { doctor, patient, medicine, appt };
}

const complete = (who, id, body) => api().post(`/api/v1/appointments/${id}/complete`).set(who.headers).send(body);

describe("completing a visit", () => {
  it("writes the note and prescription and completes the visit atomically", async () => {
    const { doctor, medicine, appt } = await scheduledVisit();
    const res = await complete(doctor, appt.id, {
      diagnosis: "Viral fever", clinical_notes: "Rest, fluids", vitals: { bp: "120/80", temp_c: 38.4 },
      prescription: { instructions: "After food", items: [
        { medicine_id: medicine.id, dosage: "500 mg", frequency: "1-0-1", duration_days: 3, quantity_prescribed: 6 },
      ] },
    });
    expect(res.status).toBe(201);
    expect(res.body.appointment.status).toBe("COMPLETED");
    expect(res.body.record).toMatchObject({ diagnosis: "Viral fever", vitals: { bp: "120/80", temp_c: 38.4 }, appointment_id: appt.id });
    expect(res.body.prescription.items[0]).toMatchObject({ medicine_name: "Paracetamol", frequency: "1-0-1", quantity_prescribed: 6 });
    expect(res.body.prescription.valid_until > res.body.prescription.issue_date).toBe(true);
  });

  it("note-only completion has no prescription", async () => {
    const { doctor, appt } = await scheduledVisit();
    const res = await complete(doctor, appt.id, { diagnosis: "Healthy" });
    expect(res.status).toBe(201);
    expect(res.body.prescription).toBeNull();
  });

  it("rolls back everything when a medicine is unknown", async () => {
    const { doctor, appt } = await scheduledVisit();
    const res = await complete(doctor, appt.id, { diagnosis: "x", prescription: { items: [
      { medicine_id: 99999, dosage: "1", frequency: "1-0-0", duration_days: 1, quantity_prescribed: 1 },
    ] } });
    expect(res.status).toBe(422);
    expect((await prisma.appointment.findUnique({ where: { id: appt.id } })).status).toBe("SCHEDULED");
    expect(await prisma.medicalRecord.count()).toBe(0);
  });

  it("only the visit's doctor, only once, and diagnosis is required", async () => {
    const { doctor, patient, appt } = await scheduledVisit();
    const otherDoctor = await registerAndLogin("9812300033", "DOCTOR");
    expect((await complete(otherDoctor, appt.id, { diagnosis: "x" })).status).toBe(404);
    expect((await complete(patient, appt.id, { diagnosis: "x" })).status).toBe(403);
    expect((await complete(doctor, appt.id, {})).status).toBe(422);
    expect((await complete(doctor, appt.id, { diagnosis: "x" })).status).toBe(201);
    expect((await complete(doctor, appt.id, { diagnosis: "x" })).status).toBe(400);
  });
});
