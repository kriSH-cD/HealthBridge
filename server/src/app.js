import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { HttpError } from "./lib/http.js";
import { healthCheck, healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { medicinesRouter } from "./routes/medicines.js";
import { prescriptionsRouter } from "./routes/prescriptions.js";
import { consultationsRouter } from "./routes/consultations.js";
import { hospitalsRouter } from "./routes/hospitals.js";
import { ambulancesRouter } from "./routes/ambulances.js";
import { seedRouter } from "./routes/seed.js";
import { patientPrescriptionsRouter, recordsRouter } from "./routes/records.js";

export const app = express();
app.set("trust proxy", 1); // real client IP behind the Vite/Docker proxy, for rate limiting
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: "100kb" }));

const v1 = express.Router();
v1.use(healthRouter);
v1.use("/auth", authRouter);
v1.use("/users", usersRouter);
v1.use("/appointments", appointmentsRouter);
v1.use("/medicines", medicinesRouter);
v1.use("/prescriptions", prescriptionsRouter);
v1.use("/consultations", consultationsRouter);
v1.use("/hospitals", hospitalsRouter);
v1.use("/ambulances", ambulancesRouter);
v1.use("/seed", seedRouter);
v1.use("/records/prescriptions", patientPrescriptionsRouter);
v1.use("/records", recordsRouter);
app.use("/api/v1", v1);
app.get("/api/health", healthCheck);

if (config.webDist) {
  app.use(express.static(config.webDist));
  // Client-side routes (/dashboard, /consultation/:id) all load the SPA.
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile("index.html", { root: config.webDist }));
}

app.get("/", (_req, res) => res.json({
  platform: config.projectName,
  region: config.region,
  version: config.version,
  status: "operational",
  api_v1: "/api/v1",
}));

app.use((_req, _res, next) => next(new HttpError(404, "Not Found")));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ detail: err.detail });
  if (err.type === "entity.parse.failed") return res.status(422).json({ detail: "Invalid JSON body" });
  console.error(err);
  res.status(500).json({ detail: "Internal Server Error" });
});
