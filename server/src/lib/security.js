import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const hashPassword = (password) => bcrypt.hash(password, 12);

export async function verifyPassword(password, hash) {
  try { return await bcrypt.compare(password, hash); } catch { return false; }
}

const sign = (payload, expiresIn) =>
  jwt.sign(payload, config.secretKey, { algorithm: "HS256", expiresIn });

export const createAccessToken = (userId, role) =>
  sign({ sub: String(userId), role }, config.accessTokenMinutes * 60);

export const createRefreshToken = (userId) =>
  sign({ sub: String(userId), type: "refresh" }, config.refreshTokenDays * 86400);

export function decodeToken(token) {
  try { return jwt.verify(token, config.secretKey, { algorithms: ["HS256"] }); } catch { return null; }
}
