import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { authRateLimit } from "../lib/rateLimit.js";
import { createAccessToken, createRefreshToken, hashPassword, verifyPassword } from "../lib/security.js";
import { requireUser } from "../lib/auth.js";
import { serializeUser, userInclude } from "../lib/serialize.js";

const ROLES = ["PATIENT", "DOCTOR", "PHARMACY", "ADMIN", "HOSPITAL_ADMIN", "ASHA_WORKER"];
const LANGS = ["pa", "hi", "en"];

/** Accepts +91 / leading 0 / spaces; yields 10 digits. */
const phone = z.string().transform((v, ctx) => {
  let digits = v.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length !== 10) {
    ctx.addIssue({ code: "custom", message: "Phone number must be a valid 10-digit mobile number" });
    return z.NEVER;
  }
  return digits;
});

const registerSchema = z.object({
  phone,
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid email format")).or(z.literal("")).nullish()
    .transform((v) => v || null),
  full_name: z.string().min(2).max(100),
  role: z.enum(ROLES).default("PATIENT"),
  preferred_language: z.enum(LANGS).default("pa"),
  village: z.string().max(100).nullish().default("Nabha City"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  patient_data: z.object({
    age: z.number().int().min(0).max(125).nullish(),
    gender: z.string().max(20).nullish(),
    blood_group: z.string().max(10).nullish(),
    emergency_contact: z.string().max(20).nullish(),
    abha_id: z.string().max(50).nullish(),
    chronic_conditions: z.string().nullish(),
  }).nullish(),
  doctor_data: z.object({
    specialization: z.string().min(2).max(100),
    license_number: z.string().min(3).max(50),
    hospital_name: z.string().min(2).max(150),
    consultation_fee: z.number().min(0).default(0),
    languages_spoken: z.string().max(100).default("Punjabi, Hindi"),
    experience_years: z.number().int().min(0).max(60).default(1),
  }).nullish(),
  pharmacy_data: z.object({
    pharmacy_name: z.string().min(2).max(150),
    license_number: z.string().min(3).max(50),
    address: z.string().min(5).max(255),
    contact_phone: z.string().max(20),
    operating_hours: z.string().max(100).default("08:00 AM - 09:00 PM"),
  }).nullish(),
  hospital_data: z.object({
    hospital_name: z.string().min(2).max(150),
    address: z.string().min(5).max(255),
    emergency_phone: z.string().max(20),
    total_beds: z.number().int().min(0).default(50),
    available_beds: z.number().int().min(0).default(15),
    has_oxygen: z.boolean().default(true),
    has_emergency: z.boolean().default(true),
  }).nullish(),
});

/** Role profile to create alongside the user; ids filled in from the new user. */
function profileFor(p, userId) {
  switch (p.role) {
    case "PATIENT":
      return { patient: { create: { ...(p.patient_data ?? {}) } } };
    case "DOCTOR":
      return { doctor: { create: p.doctor_data ?? {
        specialization: "General Medicine", license_number: `PBI-${String(userId).padStart(4, "0")}`,
        hospital_name: "Civil Hospital Nabha",
      } } };
    case "PHARMACY":
      return { pharmacy: { create: { village: p.village, ...(p.pharmacy_data ?? {
        pharmacy_name: `${p.full_name} Medicos`, license_number: `DL-NABHA-${String(userId).padStart(4, "0")}`,
        address: `${p.village || "Nabha"}, Punjab`, contact_phone: p.phone,
      }) } } };
    case "HOSPITAL_ADMIN":
      return { hospital: { create: p.hospital_data ?? {
        hospital_name: "Sub-Divisional Hospital Nabha", address: "Circular Road, Nabha, Punjab", emergency_phone: p.phone,
      } } };
    default:
      return {};
  }
}

export const authRouter = Router();

authRouter.post("/register", authRateLimit, async (req, res) => {
  const p = parse(registerSchema, req.body);
  if (await prisma.user.findUnique({ where: { phone: p.phone } })) {
    throw new HttpError(400, "A user with this phone number already exists.");
  }
  if (p.email && await prisma.user.findUnique({ where: { email: p.email } })) {
    throw new HttpError(400, "A user with this email address already exists.");
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: {
      phone: p.phone, email: p.email, full_name: p.full_name, role: p.role,
      preferred_language: p.preferred_language, village: p.village,
      hashed_password: await hashPassword(p.password),
    } });
    return tx.user.update({ where: { id: created.id }, data: profileFor(p, created.id), include: userInclude });
  });
  res.status(201).json(serializeUser(user));
});

const loginSchema = z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) });

authRouter.post("/login", authRateLimit, async (req, res) => {
  const { identifier, password } = parse(loginSchema, req.body);
  const user = await prisma.user.findFirst({ where: { OR: [{ phone: identifier }, { email: identifier.toLowerCase() }] } });
  if (!user || !(await verifyPassword(password, user.hashed_password))) {
    throw new HttpError(401, "Incorrect phone number/email or password.");
  }
  if (!user.is_active) throw new HttpError(400, "Account is inactive. Please contact support.");

  res.json({
    access_token: createAccessToken(user.id, user.role),
    refresh_token: createRefreshToken(user.id),
    token_type: "bearer",
    role: user.role,
    preferred_language: user.preferred_language,
    user_id: user.id,
    full_name: user.full_name,
    phone: user.phone,
  });
});

authRouter.get("/me", requireUser, (req, res) => res.json(serializeUser(req.user)));

authRouter.put("/language", requireUser, async (req, res) => {
  const { preferred_language } = parse(z.object({ preferred_language: z.enum(LANGS) }), req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { preferred_language }, include: userInclude });
  res.json(serializeUser(user));
});
