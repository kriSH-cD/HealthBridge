import { describe, expect, it } from "vitest";
import { api, login } from "./helpers.js";
import { config } from "../src/config.js";

describe("auth", () => {
  it("registers a patient, logs in, reads /me, changes language", async () => {
    const reg = await api().post("/api/v1/auth/register").send({
      phone: "+91 98123 45670", email: "Test.Patient@Example.com", full_name: "Karamjit Singh",
      role: "PATIENT", preferred_language: "pa", village: "Duladdi", password: "securepassword123",
      patient_data: { age: 45, gender: "Male", blood_group: "B+", chronic_conditions: "Diabetes Type 2" },
    });
    expect(reg.status).toBe(201);
    expect(reg.body).toMatchObject({ phone: "9812345670", email: "test.patient@example.com", role: "PATIENT", village: "Duladdi" });
    expect(reg.body.patient_profile).toMatchObject({ age: 45, blood_group: "B+" });
    expect(reg.body).not.toHaveProperty("hashed_password");

    const tok = await api().post("/api/v1/auth/login").send({ identifier: "9812345670", password: "securepassword123" });
    expect(tok.status).toBe(200);
    expect(tok.body).toMatchObject({ role: "PATIENT", token_type: "bearer", preferred_language: "pa" });
    const headers = { Authorization: `Bearer ${tok.body.access_token}` };

    const me = await api().get("/api/v1/auth/me").set(headers);
    expect(me.body.full_name).toBe("Karamjit Singh");

    const lang = await api().put("/api/v1/auth/language").set(headers).send({ preferred_language: "hi" });
    expect(lang.body.preferred_language).toBe("hi");
  });

  it("creates role profiles for doctor and pharmacy", async () => {
    const doc = await api().post("/api/v1/auth/register").send({
      phone: "9812345671", full_name: "Dr. Tarsem Singh", role: "DOCTOR", password: "doctorpassword123",
      doctor_data: { specialization: "Cardiology", license_number: "PB-MC-2016-1234", hospital_name: "Civil Hospital Nabha", consultation_fee: 100 },
    });
    expect(doc.status).toBe(201);
    expect(doc.body.doctor_profile).toMatchObject({ specialization: "Cardiology", consultation_fee: 100, is_available: true });

    const ph = await api().post("/api/v1/auth/register").send({
      phone: "9812345672", full_name: "Singh Medicos", role: "PHARMACY", password: "pharmacypassword123", village: "Alhoran",
      pharmacy_data: { pharmacy_name: "Singh Medical Store", license_number: "PB-RET-2023-999", address: "Alhoran Gate, Nabha", contact_phone: "9812345672" },
    });
    expect(ph.status).toBe(201);
    expect(ph.body.pharmacy_profile.pharmacy_name).toBe("Singh Medical Store");
  });

  it("rejects duplicates, bad input, bad credentials and missing tokens", async () => {
    const body = { phone: "9812345673", full_name: "User One", role: "PATIENT", password: "password123" };
    await api().post("/api/v1/auth/register").send(body);
    const dup = await api().post("/api/v1/auth/register").send(body);
    expect(dup.status).toBe(400);
    expect(dup.body.detail).toContain("already exists");

    expect((await api().post("/api/v1/auth/register").send({ ...body, phone: "12345" })).status).toBe(422);
    expect((await api().post("/api/v1/auth/login").send({ identifier: "9999999999", password: "x" })).status).toBe(401);
    expect((await api().get("/api/v1/auth/me")).status).toBe(401);
    expect((await api().get("/api/v1/auth/me").set({ Authorization: "Bearer junk" })).status).toBe(401);
  });

  it("refresh tokens cannot be used as access tokens", async () => {
    await api().post("/api/v1/auth/register").send({ phone: "9812345674", full_name: "User Two", password: "password123" });
    const tok = await api().post("/api/v1/auth/login").send({ identifier: "9812345674", password: "password123" });
    expect((await api().get("/api/v1/auth/me").set({ Authorization: `Bearer ${tok.body.refresh_token}` })).status).toBe(401);
    expect((await api().get("/api/v1/auth/me").set(await login("9812345674"))).status).toBe(200);
  });

  it("rate limits auth attempts per IP via redis", async () => {
    const limit = config.rateLimitPerMinute;
    config.rateLimitPerMinute = 3;
    try {
      const attempt = () => api().post("/api/v1/auth/login").send({ identifier: "9999999999", password: "x" });
      for (let i = 0; i < 3; i++) expect((await attempt()).status).toBe(401);
      expect((await attempt()).status).toBe(429);
    } finally {
      config.rateLimitPerMinute = limit;
    }
  });
});
