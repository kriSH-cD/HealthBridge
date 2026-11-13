import request from "supertest";
import { app } from "../src/app.js";

export const api = () => request(app);

export async function login(identifier, password = "password123") {
  const res = await api().post("/api/v1/auth/login").send({ identifier, password });
  if (res.status !== 200) throw new Error(`login ${identifier}: ${res.status} ${JSON.stringify(res.body)}`);
  return { Authorization: `Bearer ${res.body.access_token}` };
}

/** Registers a user (profile defaults per role) and returns { user, headers }. */
export async function registerAndLogin(phone, role, extra = {}) {
  const res = await api().post("/api/v1/auth/register")
    .send({ phone, full_name: `${role} ${phone.slice(-2)}`, role, password: "password123", ...extra });
  if (res.status !== 201) throw new Error(`register ${phone}: ${res.status} ${JSON.stringify(res.body)}`);
  return { user: res.body, headers: await login(phone) };
}
