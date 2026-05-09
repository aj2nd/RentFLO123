import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, text } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ['TENANT', 'OWNER', 'ADMIN'] }),
  // KYC Fields
  isVerified: boolean("is_verified").default(false),
  fullLegalName: text("full_legal_name"),
  panNumber: text("pan_number"),
  aadhaarNumber: text("aadhaar_number"),
  kycDocumentUrl: text("kyc_document_url"),
  // Landlord-specific fields
  bankAccountNumber: text("bank_account_number"),
  ifscCode: text("ifsc_code"),
  cancelledChequeUrl: text("cancelled_cheque_url"),
  // Setu Digilocker E-KYC fields
  digilockerRequestId: text("digilocker_request_id"), // Setu request id (used for polling)
  digilockerCompletedAt: timestamp("digilocker_completed_at"),
  // Didit E-KYC fields
  diditSessionId: text("didit_session_id").unique(), // Didit session id (used for polling/webhook lookup)
  diditCompletedAt: timestamp("didit_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserRole = 'TENANT' | 'OWNER' | 'ADMIN' | null;
