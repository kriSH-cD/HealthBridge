import { defineConfig } from "vitest/config";

const testEnv = {
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://sehatsetu:sehatsetu@localhost:5432/sehatsetu_test",
  REDIS_URL: process.env.TEST_REDIS_URL ?? "redis://localhost:6379/15",
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
