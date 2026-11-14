// Load demo data from the command line, so the public /seed endpoint can stay off in production.
import { prisma } from "./db.js";
import { seedDatabase } from "./seed.js";

console.log(await seedDatabase(prisma));
await prisma.$disconnect();
