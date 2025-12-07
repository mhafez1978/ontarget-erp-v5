Seeding is disabled by default in this repo's Prisma configuration.

Why:

- The project used to configure an automatic seed script (e.g. `prisma/seed.mjs`) in `prisma.config.ts` and `package.json`.
- In some environments (CI or production hosts) the seed file may not exist or may not be executable which caused `prisma migrate reset` to fail with ENOENT.

What changed:

- Automatic seeding has been disabled in `prisma.config.ts` to avoid Prisma trying to auto-run a missing seed script during migration operations.

How to run seeds manually (if needed):

- If you intentionally want to seed (local/dev), run one of the package scripts:

  npm run seed # will run node prisma/seed.mjs
  npm run seed:ts # will run ts-node prisma/seed.ts
  npm run seed:check # will run node prisma/seed.mjs --check

Notes:

- Keep an eye on CI scripts (e.g. scripts/ci-seed-check.sh) if you rely on automated seed checks — re-enable or modify them intentionally.
- If you'd prefer automatic seeding, set `migrations.seed` in `prisma.config.ts` to an executable command (for example `node prisma/seed.mjs`) and ensure a seed file exists and is accessible on all environments.
