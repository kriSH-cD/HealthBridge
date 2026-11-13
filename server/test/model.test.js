// Constraints the database enforces on its own, whatever the API does.
import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { registerAndLogin } from "./helpers.js";

async function visit() {
  const doctor = (await registerAndLogin("9812300101", "DOCTOR")).user.doctor_profile;
  const patient = (await registerAndLogin("9812300102", "PATIENT")).user.patient_profile;
  const other = (await registerAndLogin("9812300103", "PATIENT")).user.patient_profile;
  const appointment = await prisma.appointment.create({ data: {
    appointment_number: "APT-T1", patient_id: patient.id, doctor_id: doctor.id,
    appointment_date: new Date("2030-01-01T00:00:00Z"), appointment_time: "10:00 AM",
  } });
  return { doctor, patient, other, appointment };
}

describe("data model", () => {
  it("rejects a prescription whose patient differs from its visit", async () => {
    const { doctor, other, appointment } = await visit();
    await expect(prisma.prescription.create({ data: {
      prescription_number: "RX-T1", appointment_id: appointment.id, patient_id: other.id, doctor_id: doctor.id,
    } })).rejects.toThrow(/Foreign key constraint/);
  });

  it("rejects a record whose patient differs from its visit", async () => {
    const { doctor, other, appointment } = await visit();
    await expect(prisma.medicalRecord.create({ data: {
      record_number: "REC-T1", title: "x", appointment_id: appointment.id, patient_id: other.id, doctor_id: doctor.id,
    } })).rejects.toThrow(/Foreign key constraint/);
  });

  it("accepts matching visit links", async () => {
    const { doctor, patient, appointment } = await visit();
    const rx = await prisma.prescription.create({ data: {
      prescription_number: "RX-T2", appointment_id: appointment.id, patient_id: patient.id, doctor_id: doctor.id,
    } });
    expect(rx.appointment_id).toBe(appointment.id);
  });
});
