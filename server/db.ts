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

/**
 * Attempt to acquire a test connection from the pool, retrying on failure.
 * This lets Express start immediately while Railway's DB container is still
 * warming up, instead of crashing on the first connection attempt.
 *
 * Does NOT throw after exhausting retries — the server will start anyway
 * and individual requests will fail with proper error responses.
 */
export async function connectWithRetry(
  retries = 5,
  delayMs = 3_000
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log("[db] Database connection established");
      return;
    } catch (err) {
      console.error(
        `[db] Connection attempt ${attempt}/${retries} failed:`,
        (err as Error).message
      );
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  // Log and continue — the try-catch in index.ts will handle route init failure
  console.error(
    "[db] Could not connect after all retries. " +
    "Server will start, but DB-dependent routes will fail until the database is reachable."
  );
}
