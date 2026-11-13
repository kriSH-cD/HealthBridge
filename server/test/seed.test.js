import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { seedDatabase } from "../src/seed.js";
import { api, login } from "./helpers.js";
import { config } from "../src/config.js";

describe("seedDatabase", () => {
  it("creates the demo counts with demo flags", async () => {
    const stats = await seedDatabase(prisma);
    expect(stats).toMatchObject({ patients: 20, doctors: 8, pharmacies: 5, medicines: 30, appointments: 15 });
    expect(stats.medical_records).toBeGreaterThanOrEqual(6);
    expect(stats.prescriptions).toBeGreaterThanOrEqual(4);
    expect(stats.consultations).toBeGreaterThanOrEqual(3);
    expect(stats.notifications).toBeGreaterThanOrEqual(3);
    expect(stats.audit_logs).toBeGreaterThanOrEqual(3);

    const patients = await prisma.patient.findMany({ include: { user: true } });
    expect(patients).toHaveLength(20);
    for (const p of patients) {
      expect(p.user.is_demo).toBe(true);
      expect(p.user.full_name).toContain("[DEMO DATA]");
    }

    const doctors = await prisma.doctor.findMany({ include: { user: true } });
    expect(doctors).toHaveLength(8);
    for (const d of doctors) {
      expect(d.user.is_demo).toBe(true);
      expect(d.license_number).toContain("PB-MC");
    }

    const medicines = await prisma.medicine.findMany();
    expect(medicines).toHaveLength(30);
    for (const m of medicines) {
      expect(m.is_demo).toBe(true);
      expect(m.price).toBeGreaterThan(0);
    }
  });

  it("is idempotent for keyed rows", async () => {
    await seedDatabase(prisma);
    const second = await seedDatabase(prisma);
    expect(second).toMatchObject({
      doctors: 0, pharmacies: 0, patients: 0, medicines: 0, inventory: 0, appointments: 0,
      medical_records: 0, prescriptions: 0, prescription_items: 0, consultations: 0,
    });
    expect(await prisma.user.count()).toBe(33);
    expect(await prisma.medicine.count()).toBe(30);
    expect(await prisma.pharmacyInventory.count()).toBe(150);
    expect(await prisma.appointment.count()).toBe(15);
  });

  it("lets a demo doctor log in", async () => {
    await seedDatabase(prisma);
    await login("9876543201");
  });
});

describe("POST /seed/seed-demo-data", () => {
  it("is 404 unless ENABLE_DEMO_SEED is on", async () => {
    expect((await api().post("/api/v1/seed/seed-demo-data")).status).toBe(404);
    config.enableDemoSeed = true;
    try {
      const res = await api().post("/api/v1/seed/seed-demo-data");
      expect(res.status).toBe(200);
      expect(res.body.note).toContain("DEMO DATA");
      expect(res.body.seeded_counts.doctors).toBe(8);
    } finally {
      config.enableDemoSeed = false;
    }
  });
});
