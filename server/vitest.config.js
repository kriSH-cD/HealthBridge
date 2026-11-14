import { defineConfig } from "vitest/config";

const isDocker = process.env.DATABASE_URL?.includes("@db:") || false;
const defaultDbUrl = isDocker
  ? "postgresql://sehatsetu:sehatsetu@db:5432/sehatsetu_test"
  : "postgresql://sehatsetu:sehatsetu@localhost:5432/sehatsetu_test";
const defaultRedisUrl = isDocker
  ? "redis://redis:6379/15"
  : "redis://localhost:6379/15";

const testEnv = {
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? defaultDbUrl,
  REDIS_URL: process.env.TEST_REDIS_URL ?? defaultRedisUrl,
  SECRET_KEY: "test-secret",
  ENABLE_DEMO_SEED: "false",
};
Object.assign(process.env, testEnv); // globalSetup runs in this process and needs the test DB url too

export default defineConfig({
  test: {
    env: testEnv,
    globalSetup: "./test/globalSetup.js",
    setupFiles: "./test/setup.js",
    fileParallelism: false, // one shared test database
    testTimeout: 20000,
  },
});
