import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // You likely don't need this unless you use Database Views
  // experimental: {
  //   externalTables: true,
  // },
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "prisma/seed.mjs",
    // REMOVE THIS LINE BELOW - It is causing the SQL error
    // initShadowDb: "prisma/init-shadow-db.ts",
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
