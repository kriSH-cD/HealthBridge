import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "../src/db.js";
import { seedDatabase } from "../src/seed.js";
import { api } from "./helpers.js";

describe("ambulances and emergency requests routes", () => {
  beforeEach(async () => {
    await seedDatabase(prisma);
  });

  it("lists all Nabha 108 rapid response ambulances", async () => {
    const res = await api().get("/api/v1/ambulances");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    const als = res.body.find((a) => a.ambulance_type === "ALS");
    expect(als).toBeDefined();
    expect(als.has_oxygen).toBe(true);
    expect(als.has_ventilator).toBe(true);
    expect(als.driver_phone).toBeTruthy();
    expect(als.station_location).toContain("Nabha");
  });

  it("filters ambulances by status, type, and search query", async () => {
    // Filter available
    const availRes = await api().get("/api/v1/ambulances?status=AVAILABLE");
    expect(availRes.status).toBe(200);
    for (const a of availRes.body) {
      expect(a.status).toBe("AVAILABLE");
    }

    // Filter by type ALS
    const alsRes = await api().get("/api/v1/ambulances?ambulance_type=ALS");
    expect(alsRes.status).toBe(200);
    for (const a of alsRes.body) {
      expect(a.ambulance_type).toBe("ALS");
    }

    // Search query for Bhadson
    const searchRes = await api().get("/api/v1/ambulances?q=Bhadson");
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.length).toBeGreaterThanOrEqual(1);
    expect(searchRes.body[0].station_location).toContain("Bhadson");
  });

  it("returns fleet summary metrics", async () => {
    const res = await api().get("/api/v1/ambulances/summary");
    expect(res.status).toBe(200);
    expect(res.body.total_ambulances).toBeGreaterThanOrEqual(4);
    expect(res.body.available_ambulances).toBeGreaterThanOrEqual(1);
    expect(res.body.als_count).toBeGreaterThanOrEqual(1);
    expect(res.body.bls_count).toBeGreaterThanOrEqual(1);
    expect(res.body.helpline_number).toBe("108");
    expect(res.body.civil_hospital_hotline).toBe("01765-220102");
  });

  it("creates an emergency 108 request with auto-assignment of an available ambulance", async () => {
    const payload = {
      caller_name: "Gurpreet Singh",
      caller_phone: "+91-98765-11111",
      pickup_village: "Bir Bhadson",
      pickup_landmark: "Near Bus Adda",
      triage_severity: "CRITICAL",
      chief_complaint: "Acute respiratory distress and cyanosis",
      patient_name: "Harjeet Kaur",
      patient_age: 60,
      auto_assign: true,
    };

    const res = await api().post("/api/v1/ambulances/requests").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.request_number).toContain("EMR-NBH-2026-");
    expect(res.body.caller_name).toBe("Gurpreet Singh");
    expect(res.body.pickup_village).toBe("Bir Bhadson");
    expect(res.body.triage_severity).toBe("CRITICAL");
    expect(res.body.status).toBe("DISPATCHED");
    expect(res.body.ambulance_id).toBeTruthy();
    expect(res.body.ambulance).toBeDefined();
    expect(res.body.destination_hospital).toBeDefined();

    // Verify assigned ambulance is now marked DISPATCHED
    const ambRes = await api().get(`/api/v1/ambulances/${res.body.ambulance_id}`);
    expect(ambRes.status).toBe(200);
    expect(ambRes.body.status).toBe("DISPATCHED");
  });

  it("updates request status and frees ambulance on completion", async () => {
    // 1. Create a request
    const createRes = await api().post("/api/v1/ambulances/requests").send({
      caller_name: "Sukhdev Singh",
      caller_phone: "+91-98765-22222",
      pickup_village: "Duladdi",
      triage_severity: "URGENT",
      chief_complaint: "Fractured arm from tractor accident",
      auto_assign: true,
    });
    expect(createRes.status).toBe(201);
    const assignedAmbId = createRes.body.ambulance_id;

    // 2. Update status to COMPLETED
    const updateRes = await api()
      .patch(`/api/v1/ambulances/requests/${createRes.body.id}/status`)
      .send({
        status: "COMPLETED",
        notes: "Patient safely delivered to emergency OPD.",
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("COMPLETED");
    expect(updateRes.body.completed_at).toBeTruthy();

    // 3. Verify ambulance was freed back to AVAILABLE
    if (assignedAmbId) {
      const ambCheck = await api().get(`/api/v1/ambulances/${assignedAmbId}`);
      expect(ambCheck.status).toBe(200);
      expect(ambCheck.body.status).toBe("AVAILABLE");
    }
  });
});
