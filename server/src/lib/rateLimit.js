import { redis } from "../redis.js";
import { config } from "../config.js";
import { HttpError } from "./http.js";

/** Fixed one-minute window per client IP, shared across server instances via Redis. */
export async function authRateLimit(req, _res, next) {
  const key = `rl:auth:${req.ip}:${Math.floor(Date.now() / 60000)}`;
  let count;
  try {
    if (redis.status === "wait") await redis.connect();
    [[, count]] = await redis.multi().incr(key).expire(key, 60).exec();
  } catch {
    return next(); // Redis down: fail open so login keeps working
  }
  if (count > config.rateLimitPerMinute) {
    throw new HttpError(429, "Too many authentication attempts. Please try again after 60 seconds.");
  }
  next();
}
