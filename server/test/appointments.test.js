import { describe, expect, it } from "vitest";
import { api, registerAndLogin } from "./helpers.js";

const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };

const doctor = (phone = "9812300001") => registerAndLogin(phone, "DOCTOR");
const patient = (phone = "9812300002") => registerAndLogin(phone, "PATIENT");

const book = (who, doc, overrides = {}) => api().post("/api/v1/appointments").set(who.headers).send({
  doctor_id: doc.user.doctor_profile.id, appointment_date: dayOffset(1),
  appointment_time: "10:30 AM", symptom_summary: "Fever for 3 days", ...overrides,
});

const setStatus = (who, id, status) =>
  api().patch(`/api/v1/appointments/${id}/status`).set(who.headers).send({ status });

describe("appointments", () => {
  it("patient books an appointment", async () => {
    const [d, p] = [await doctor(), await patient()];
    const res = await book(p, d);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: "SCHEDULED", is_demo: false, appointment_date: dayOffset(1),
      doctor_name: d.user.full_name, patient_name: p.user.full_name,
    });
  });

  it("rejects past dates, unknown doctors and non-patients", async () => {
    const [d, p] = [await doctor(), await patient()];
    expect((await book(p, d, { appointment_date: dayOffset(-1) })).status).toBe(400);
    expect((await book(p, d, { doctor_id: 99999 })).status).toBe(404);
    expect((await book(d, d)).status).toBe(403);
    expect((await book(p, d, { appointment_date: "tomorrow" })).status).toBe(422);
  });

  it("each side sees only their own appointments", async () => {
    const [d, p] = [await doctor(), await patient()];
    const [d2, p2] = [await doctor("9812300003"), await patient("9812300004")];
    await book(p, d);
    await book(p2, d2);
    for (const who of [p, d]) {
      const mine = (await api().get("/api/v1/appointments").set(who.headers)).body;
      expect(mine).toHaveLength(1);
      expect(mine[0].patient_name).toBe(p.user.full_name);
    }
  });

  it("enforces status rules", async () => {
    const [d, p, stranger] = [await doctor(), await patient(), await patient("9812300005")];
    const first = (await book(p, d)).body.id;
    const second = (await book(p, d, { appointment_time: "11:30 AM" })).body.id;

    expect((await setStatus(stranger, first, "CANCELLED")).status).toBe(404);
    expect((await setStatus(p, first, "COMPLETED")).status).toBe(403);
    expect((await setStatus(d, first, "COMPLETED")).body.status).toBe("COMPLETED");
    expect((await setStatus(p, first, "CANCELLED")).status).toBe(400); // already done
    expect((await setStatus(p, second, "CANCELLED")).body.status).toBe("CANCELLED");
  });
});

describe("slots", () => {
  it("one live booking per doctor slot; cancelling frees it", async () => {
    const [d, p, p2] = [await doctor(), await patient(), await patient("9812300006")];
    const first = await book(p, d);
    expect(first.status).toBe(201);
    const clash = await book(p2, d);
    expect(clash.status).toBe(409);
    expect(clash.body.detail).toContain("already booked");

    await setStatus(p, first.body.id, "CANCELLED");
    expect((await book(p2, d)).status).toBe(201);
  });
});
