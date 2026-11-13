import { Router } from "express";
import { prisma } from "../db.js";
import { config } from "../config.js";
import { HttpError } from "../lib/http.js";
import { seedDatabase } from "../seed.js";

export const seedRouter = Router();

seedRouter.post("/seed-demo-data", async (_req, res) => {
  if (!config.enableDemoSeed) throw new HttpError(404, "Not Found");
  const seeded_counts = await seedDatabase(prisma);
  res.json({
    status: "success",
    message: "Synthetic Nabha rural health records seeded successfully.",
    note: "ALL RECORDS ARE MARKED AS DEMO DATA AND DO NOT REPRESENT REAL PATIENTS.",
    seeded_counts,
    demo_credentials: {
      password_for_all_accounts: "password123",
      doctor: "9876543201",
      pharmacy: "9876543301",
      patient: "9876543101",
      hospital_admin: "9876543401",
      asha_worker: "9876543501",
    },
  });
});
