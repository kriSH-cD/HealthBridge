import Redis from "ioredis";
import { config } from "./config.js";

// Fail fast instead of queueing commands forever when Redis is down.
export const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
redis.on("error", () => {}); // reported via /health; callers handle failures
