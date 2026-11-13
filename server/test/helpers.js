import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";

export const api = () => request(app);

export async function login(identifier, password = "password123") {
  const res = await api().post("/api/v1/auth/login").send({ identifier, password });
  if (res.status !== 200) throw new Error(`login ${identifier}: ${res.status} ${JSON.stringify(res.body)}`);
  return { Authorization: `Bearer ${res.body.access_token}` };
}

/** Registers a user (profile defaults per role) and returns { user, headers }. */
export async function registerAndLogin(phone, role, extra = {}) {
  const res = await api().post("/api/v1/auth/register")
    .send({ phone, full_name: `${role} ${phone.slice(-2)}`, role, password: "password123", ...extra });
  if (res.status !== 201) throw new Error(`register ${phone}: ${res.status} ${JSON.stringify(res.body)}`);
  return { user: res.body, headers: await login(phone) };
}

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
