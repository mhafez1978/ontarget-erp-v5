import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: datasource url must live here, not in schema.prisma
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "prisma/seed.mjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
}) satisfies PrismaConfig;

export declare type PrismaConfig = {
  experimental?: {
    externalTables?: boolean;
    adapter?: boolean;
    studio?: boolean;
    extensions?: boolean;
  };
  schema?: string;
  migrations?: {
    path?: string;
    seed?: string;
    initShadowDb?: string;
  };
  views?: {
    path?: string;
  };
  typedSql?: {
    path?: string;
  };
  datasource?: {
    url: string;
    shadowDatabaseUrl?: string;
  };
};
