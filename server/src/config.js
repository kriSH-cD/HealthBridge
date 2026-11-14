const env = process.env;

export const config = {
  // Built frontend to serve from this server (single-service deploy); unset in dev.
  webDist: env.WEB_DIST,
  port: Number(env.PORT ?? 8000),
  databaseUrl: env.DATABASE_URL ?? "postgresql://sehatsetu:sehatsetu@localhost:5432/sehatsetu",
  redisUrl: env.REDIS_URL ?? "redis://localhost:6379",
  secretKey: env.SECRET_KEY ?? "change_me_in_production",
  accessTokenMinutes: Number(env.ACCESS_TOKEN_EXPIRE_MINUTES ?? 60 * 24),
  refreshTokenDays: Number(env.REFRESH_TOKEN_EXPIRE_DAYS ?? 7),
  // Unauthenticated demo seeding; keep off outside local dev.
  enableDemoSeed: env.ENABLE_DEMO_SEED === "true",
  rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE ?? 30),
  corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173").split(","),
  projectName: "SehatSetu (ਸਿਹਤ ਸੇਤੂ)",
  version: "1.0.0",
  region: "Nabha, Patiala, Punjab",
  supportedLanguages: ["pa", "hi", "en"],
};

if (env.NODE_ENV === "production" && config.secretKey === "change_me_in_production") {
  throw new Error("Set SECRET_KEY in production: the default lets anyone forge login tokens");
}
