require("dotenv").config();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Set it in your environment or .env before running Prisma migrations."
  );
}

module.exports = {
  datasource: {
    url: url,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
};
