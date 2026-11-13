import { Router } from "express";
import { prisma } from "../db.js";
import { redis } from "../redis.js";
import { config } from "../config.js";

async function probe(fn) {
  try { await fn(); return "healthy"; } catch (e) { return `unhealthy: ${e.message}`; }
}

export async function healthCheck(_req, res) {
  const [dbStatus, redisStatus] = await Promise.all([
    probe(() => prisma.$queryRaw`SELECT 1`),
    probe(async () => { if (redis.status === "wait") await redis.connect(); await redis.ping(); }),
  ]);
  res.json({
    status: dbStatus === "healthy" ? "online" : "degraded",
    service: config.projectName,
    version: config.version,
    timestamp: new Date().toISOString(),
    database: { status: dbStatus, type: "PostgreSQL" },
    cache: { status: redisStatus, type: "Redis" },
    region: config.region,
    supported_languages: config.supportedLanguages,
  });
}

export const healthRouter = Router().get("/health", healthCheck);
