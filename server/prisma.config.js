import { defineConfig } from "prisma/config";

try { process.loadEnvFile(); } catch { /* no .env: rely on real env vars */ }

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
