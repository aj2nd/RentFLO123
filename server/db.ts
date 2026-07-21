import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or RAILWAY_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// SSL: required on Railway and most managed Postgres providers.
// Set DATABASE_SSL=false explicitly to disable (e.g. local dev with no SSL).
const sslConfig =
  process.env.DATABASE_SSL === "false"
    ? false
    : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,      // release idle connections after 30s
  connectionTimeoutMillis: 5_000, // fail fast if the pool is exhausted
  ssl: sslConfig,
});

// Surface pool errors so they don't silently crash the process.
pool.on("error", (err) => {
  console.error("[pg-pool] unexpected client error", err.message);
});

export const db = drizzle(pool, { schema });
