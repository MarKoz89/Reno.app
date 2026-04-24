import { neon } from "@neondatabase/serverless";

let cachedSql: ReturnType<typeof neon> | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL must be configured for backend project persistence.",
    );
  }

  return databaseUrl;
}

export function getSql() {
  if (!cachedSql) {
    cachedSql = neon(getDatabaseUrl());
  }

  return cachedSql;
}
