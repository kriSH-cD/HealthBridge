import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "../src/db.js";
import { seedDatabase } from "../src/seed.js";
import { api, login } from "./helpers.js";

describe("hospitals routes", () => {
  beforeEach(async () => {
    await seedDatabase(prisma);
  });

  it("lists all Nabha hospitals publicly with bed and oxygen availability", async () => {
    const res = await api().get("/api/v1/hospitals");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    const civil = res.body.find((h) => h.hospital_name.includes("Civil Hospital"));
    expect(civil).toBeDefined();
    expect(civil.total_beds).toBe(100);
    expect(civil.available_beds).toBeGreaterThan(0);
    expect(civil.has_oxygen).toBe(true);
    expect(civil.has_emergency).toBe(true);
    expect(civil.emergency_phone).toBeTruthy();
    expect(civil.occupancy_rate).toBeDefined();
    expect(civil.bed_status).toBe("AVAILABLE");
  });

  it("filters hospitals by query, oxygen availability, and emergency status", async () => {
    // Search query for Bhadson
    const searchRes = await api().get("/api/v1/hospitals?q=Bhadson");
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.length).toBeGreaterThanOrEqual(1);
    expect(searchRes.body[0].hospital_name).toContain("Bhadson");

    // Filter has_oxygen=true
    const oxygenRes = await api().get("/api/v1/hospitals?has_oxygen=true");
    expect(oxygenRes.status).toBe(200);
    for (const h of oxygenRes.body) {
      expect(h.has_oxygen).toBe(true);
    }

    // Filter available_only=true
    const availRes = await api().get("/api/v1/hospitals?available_only=true");
    expect(availRes.status).toBe(200);
    for (const h of availRes.body) {
      expect(h.available_beds).toBeGreaterThan(0);
    }
  });

  it("returns summary statistics for the Nabha emergency dashboard", async () => {
    const res = await api().get("/api/v1/hospitals/summary");
    expect(res.status).toBe(200);
    expect(res.body.total_facilities).toBeGreaterThanOrEqual(4);
    expect(res.body.total_beds).toBeGreaterThan(100);
    expect(res.body.total_available_beds).toBeGreaterThan(0);
    expect(res.body.oxygen_facilities).toBeGreaterThanOrEqual(3);
    expect(res.body.emergency_facilities).toBeGreaterThanOrEqual(2);
    expect(res.body.overall_occupancy_rate).toBeGreaterThan(0);
  });

  it("gets a single hospital by ID and returns 404 for unknown hospital", async () => {
    const listRes = await api().get("/api/v1/hospitals");
    const first = listRes.body[0];

    const res = await api().get(`/api/v1/hospitals/${first.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(first.id);
    expect(res.body.hospital_name).toBe(first.hospital_name);

    const notFound = await api().get("/api/v1/hospitals/99999");
    expect(notFound.status).toBe(404);
  });

  it("updates available beds and emergency status with role authorization", async () => {
    // Unauthenticated request should be rejected with 401
    const listRes = await api().get("/api/v1/hospitals");
    const target = listRes.body[0];

    const unauth = await api().patch(`/api/v1/hospitals/${target.id}/beds`).send({ available_beds: 10 });
    expect(unauth.status).toBe(401);

    // Patient cannot update beds (403)
    const patientHeaders = await login("9876543101");
    const patientRes = await api()
      .patch(`/api/v1/hospitals/${target.id}/beds`)
      .set(patientHeaders)
      .send({ available_beds: 10 });
    expect(patientRes.status).toBe(403);

    // Doctor can update beds
    const doctorHeaders = await login("9876543201");
    const updateRes = await api()
      .patch(`/api/v1/hospitals/${target.id}/beds`)
      .set(doctorHeaders)
      .send({
        available_beds: 15,
        has_oxygen: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.available_beds).toBe(15);
    expect(updateRes.body.has_oxygen).toBe(true);

    // Rejects available_beds > total_beds (400)
    const invalidRes = await api()
      .patch(`/api/v1/hospitals/${target.id}/beds`)
      .set(doctorHeaders)
      .send({
        available_beds: target.total_beds + 50,
      });
    expect(invalidRes.status).toBe(400);
  });

  it("classifies oxygen source telemetry and provides critical bed alert status", async () => {
    const listRes = await api().get("/api/v1/hospitals");
    expect(listRes.status).toBe(200);

    const civil = listRes.body.find((h) => h.hospital_name.includes("Civil"));
    expect(civil).toBeDefined();
    expect(civil.oxygen_type).toBe("OXYGEN_PLANT");

    const duladdi = listRes.body.find((h) => h.hospital_name.includes("Duladdi"));
    if (duladdi) {
      expect(duladdi.oxygen_type).toBe("OXYGEN_CONCENTRATOR");
    }

    const summaryRes = await api().get("/api/v1/hospitals/summary");
    expect(summaryRes.status).toBe(200);
    expect(typeof summaryRes.body.critical_bed_alert).toBe("boolean");
  });
});
