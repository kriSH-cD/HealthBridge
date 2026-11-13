import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/index.js";
import { config } from "./config.js";

export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
