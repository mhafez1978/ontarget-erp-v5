import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL ?? process.env.NEXT_PUBLIC_DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const db = prisma;

declare global {
  var prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV !== "production") {
  // Reuse the same Prisma client instance during development to avoid exhausting
  // database connections when modules are reloaded.
  globalThis.prisma = globalThis.prisma ?? prisma;
}
