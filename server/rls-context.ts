import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { pool } from "./db";

export type RlsIdentity = {
  userId: string;
  role: "TENANT" | "OWNER" | "ADMIN";
};

/**
 * Runs database work inside one transaction with a trusted, transaction-local
 * PostgreSQL RLS identity. Callers must construct the identity from the
 * verified server session—never from browser supplied values.
 *
 * This helper is intentionally not wired into the existing storage layer yet.
 * Enabling RLS before each request path has migrated to this helper would
 * disrupt legitimate database access.
 */
export async function withRlsContext<T>(
  identity: RlsIdentity,
  work: (db: ReturnType<typeof drizzle<typeof schema>>) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.user_id', $1, true)", [identity.userId]);
    await client.query("SELECT set_config('app.user_role', $1, true)", [identity.role]);
    const requestDb = drizzle(client, { schema });
    const result = await work(requestDb);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
