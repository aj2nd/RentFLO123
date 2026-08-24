import { pool } from "../db";
import { encryptPII, isEncryptedPII } from "../security";

const SENSITIVE_COLUMNS = [
  "full_legal_name",
  "pan_number",
  "aadhaar_number",
  "kyc_document_url",
  "bank_account_number",
  "ifsc_code",
  "cancelled_cheque_url",
] as const;

/**
 * Idempotently rewrites legacy readable KYC and financial fields with the
 * current AES-GCM envelope. Session rows migrate lazily in EncryptedPgStore.
 */
export async function encryptLegacySensitiveUsers(): Promise<void> {
  const result = await pool.query(`SELECT id, ${SENSITIVE_COLUMNS.join(", ")} FROM users`);
  for (const row of result.rows) {
    const values = SENSITIVE_COLUMNS.map((column) => {
      const value = row[column] as string | null;
      return value && !isEncryptedPII(value) ? encryptPII(value) : value;
    });
    if (!values.some((value, index) => value !== row[SENSITIVE_COLUMNS[index]])) continue;
    await pool.query(
      `UPDATE users SET
        full_legal_name = $1,
        pan_number = $2,
        aadhaar_number = $3,
        kyc_document_url = $4,
        bank_account_number = $5,
        ifsc_code = $6,
        cancelled_cheque_url = $7,
        updated_at = NOW()
       WHERE id = $8`,
      [...values, row.id],
    );
  }
}
