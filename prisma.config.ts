import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: datasource url must live here, not in schema.prisma
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // NOTE: automatic seeding disabled by default. We previously pointed this
    // to `prisma/seed.mjs` which caused `prisma migrate reset` to attempt to
    // run a missing script in some environments (spawn ENOENT). Keep seeding
    // as a manual operation — see `package.json` scripts or `prisma/seed.*`.
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
