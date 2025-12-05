import { PrismaClient } from "@prisma/client";
import config from "../prisma.config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL ?? config.datasource?.url,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
