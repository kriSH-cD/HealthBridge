import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("health", () => {
  it("root reports operational", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.platform).toContain("SehatSetu");
    expect(res.body.region).toBe("Nabha, Patiala, Punjab");
  });

  it.each(["/api/v1/health", "/api/health"])("%s reports db and redis healthy", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("online");
    expect(res.body.database.status).toBe("healthy");
    expect(res.body.cache.status).toBe("healthy");
    expect(res.body.supported_languages).toContain("pa");
  });
});
