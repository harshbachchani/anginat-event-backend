import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export default prisma;

// npx prisma migrate dev --name Initialized
// npx prisma generate
