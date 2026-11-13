import { Router } from "express";
import { prisma } from "../db.js";
import { requireRoles } from "../lib/auth.js";
import { serializeUser, userInclude } from "../lib/serialize.js";

const contains = (v) => (v ? { contains: String(v), mode: "insensitive" } : undefined);

async function listUsers(role, req, extra = {}) {
  const users = await prisma.user.findMany({
    where: { role, is_active: true, village: contains(req.query.village), ...extra },
    include: userInclude,
    orderBy: { id: "asc" },
  });
  return users.map(serializeUser);
}

export const usersRouter = Router();

usersRouter.get("/doctors", async (req, res) => {
  const spec = contains(req.query.specialization);
  res.json(await listUsers("DOCTOR", req, spec ? { doctor: { specialization: spec } } : {}));
});

usersRouter.get("/pharmacies", async (req, res) => res.json(await listUsers("PHARMACY", req)));

usersRouter.get("/patients", ...requireRoles("DOCTOR", "ASHA_WORKER", "HOSPITAL_ADMIN"), async (req, res) => {
  const patients = await prisma.user.findMany({ where: { role: "PATIENT" }, include: userInclude, orderBy: { id: "asc" } });
  res.json(patients.map(serializeUser));
});
