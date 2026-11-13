import { execSync } from "node:child_process";
import pg from "pg";

// Create the test database if missing, then apply migrations to it.
export default async function () {
  const url = new URL(process.env.DATABASE_URL);
  const dbName = url.pathname.slice(1);
  url.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: process.env });
}
