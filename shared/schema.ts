import { pgTable, text, integer, timestamp, varchar, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Export everything from auth models
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  address: text("address").notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(), // Landlord
  tenantId: varchar("tenant_id").references(() => users.id), // Tenant (optional initially)
  pendingTenantEmail: text("pending_tenant_email"), // Email of tenant awaiting auto-match
  monthlyRent: integer("monthly_rent").notNull(),
  payoutDay: integer("payout_day").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ownerIdIdx:  index("properties_owner_id_idx").on(table.ownerId),
  tenantIdIdx: index("properties_tenant_id_idx").on(table.tenantId),
}));

export const ledgers = pgTable("ledgers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  amountAdvanced: integer("amount_advanced").default(0).notNull(), // What we paid owner
  amountCollected: integer("amount_collected").default(0).notNull(), // What tenant paid us (sum of payments)
  status: text("status", { enum: ['ARREARS', 'SETTLED', 'EXPOSED'] }).default('ARREARS').notNull(),
  monthYear: text("month_year").notNull(), // e.g. "2024-02"
  proofOfTransferUrl: text("proof_of_transfer_url"), // Screenshot of bank transfer
  processedBy: varchar("processed_by").references(() => users.id), // Admin who processed it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  propertyIdIdx:    index("ledgers_property_id_idx").on(table.propertyId),
  statusIdx:        index("ledgers_status_idx").on(table.status),
  propertyMonthIdx: index("ledgers_property_month_idx").on(table.propertyId, table.monthYear),
}));

// === PAYMENTS TABLE - Multiple installments per ledger ===
// Flow for UPI manual-verification payments:
//   1. Tenant clicks "Pay Rent" → UPI app deep-link opens.
//   2. Tenant returns to RentFLO and submits the UTR (12-digit ref) + optional screenshot.
//   3. Row inserted with status PENDING_VERIFICATION. Ledger NOT updated yet.
//   4. Admin reviews UTR against bank statement → flips status to SUCCESS (or FAILED).
//   5. On SUCCESS, ledger.amountCollected is recomputed from all SUCCESS payments.
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ledgerId: varchar("ledger_id").references(() => ledgers.id).notNull(),
  amount: integer("amount").notNull(), // Amount in rupees (same unit as monthlyRent)
  // Gateway order/payment IDs. Column names retained for back-compat — these
  // now hold Cashfree order_id / cf_payment_id for the CASHFREE flow, and were
  // previously used for Razorpay. Unused for manual-verify flow.
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id").unique(),
  // UPI manual-verification fields
  transactionRef: text("transaction_ref"), // UTR / 12-digit reference number from the UPI app
  proofScreenshotUrl: text("proof_screenshot_url"), // optional screenshot of UPI receipt
  paymentMethod: text("payment_method", { enum: ['UPI_MANUAL', 'RAZORPAY', 'CASHFREE'] }).default('UPI_MANUAL').notNull(),
  verifiedBy: varchar("verified_by").references(() => users.id), // admin who verified
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  status: text("status", {
    enum: ['PENDING', 'PENDING_VERIFICATION', 'SUCCESS', 'FAILED'],
  }).default('PENDING').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Database-enforced uniqueness on UTR (case-normalized at insert) to prevent
  // racy duplicate submissions from slipping past the application-level check.
  // Partial index — ignores rows that have no transaction reference yet.
  uniqueTxnRef: uniqueIndex("payments_transaction_ref_unique")
    .on(table.transactionRef)
    .where(sql`${table.transactionRef} IS NOT NULL`),
  // Indexes for high-frequency lookups by gateway order ID and ledger ID.
  ledgerIdIdx: index("payments_ledger_id_idx").on(table.ledgerId),
  orderIdIdx:  index("payments_order_id_idx").on(table.razorpayOrderId),
  statusIdx:   index("payments_status_idx").on(table.status),
}));

// === MAINTENANCE TICKETS TABLE ===
export const maintenanceTickets = pgTable("maintenance_tickets", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  photoUrl: text("photo_url"), // Base64 or URL of uploaded photo
  status: text("status", { enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] }).default('OPEN').notNull(),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  propertyIdIdx: index("maintenance_tickets_property_id_idx").on(table.propertyId),
  tenantIdIdx:   index("maintenance_tickets_tenant_id_idx").on(table.tenantId),
  statusIdx:     index("maintenance_tickets_status_idx").on(table.status),
}));

// === RELATIONS ===
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
    relationName: "ownerProperties",
  }),
  tenant: one(users, {
    fields: [properties.tenantId],
    references: [users.id],
    relationName: "tenantProperties",
  }),
  ledgers: many(ledgers),
}));

export const ledgersRelations = relations(ledgers, ({ one, many }) => ({
  property: one(properties, {
    fields: [ledgers.propertyId],
    references: [properties.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  ledger: one(ledgers, {
    fields: [payments.ledgerId],
    references: [ledgers.id],
  }),
}));

export const maintenanceTicketsRelations = relations(maintenanceTickets, ({ one }) => ({
  property: one(properties, {
    fields: [maintenanceTickets.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [maintenanceTickets.tenantId],
    references: [users.id],
    relationName: "ticketTenant",
  }),
  resolver: one(users, {
    fields: [maintenanceTickets.resolvedBy],
    references: [users.id],
    relationName: "ticketResolver",
  }),
}));

// === AGREEMENTS TABLE — Tripartite digital contract ===
export const agreements = pgTable("agreements", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: varchar("property_id").references(() => properties.id).notNull().unique(),
  ownerSignatureUrl: text("owner_signature_url"),
  ownerSignedAt: timestamp("owner_signed_at"),
  tenantSignatureUrl: text("tenant_signature_url"),
  tenantSignedAt: timestamp("tenant_signed_at"),
  status: text("status", {
    enum: ['PENDING', 'OWNER_SIGNED', 'TENANT_SIGNED', 'FULLY_SIGNED'],
  }).default('PENDING').notNull(),
  // Leegality e-sign fields
  leegalityDocumentId: text("leegality_document_id"),
  leegalitySignedUrl: text("leegality_signed_url"),
  leegalitySentAt: timestamp("leegality_sent_at"),
  leegalityCompletedAt: timestamp("leegality_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agreementsRelations = relations(agreements, ({ one }) => ({
  property: one(properties, {
    fields: [agreements.propertyId],
    references: [properties.id],
  }),
}));

// === PUSH SUBSCRIPTIONS TABLE ===
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
}));

// === IN-APP NOTIFICATIONS TABLE ===
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type", { enum: ['RENT_ADVANCED', 'RENT_COLLECTED', 'MAINTENANCE_CREATED', 'MAINTENANCE_RESOLVED', 'RENT_DUE', 'MESSAGE_RECEIVED'] }).notNull(),
  read: boolean("read").default(false).notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx:   index("notifications_user_id_idx").on(table.userId),
  userReadIdx: index("notifications_user_read_idx").on(table.userId, table.read),
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// === MESSAGES TABLE ===
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  propertyIdIdx:    index("messages_property_id_idx").on(table.propertyId),
  receiverReadIdx:  index("messages_receiver_read_idx").on(table.receiverId, table.read),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  property: one(properties, {
    fields: [messages.propertyId],
    references: [properties.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "messageSender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "messageReceiver",
  }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// === ZOD SCHEMAS ===
export const insertPropertySchema = createInsertSchema(properties).omit({ 
  id: true, 
  createdAt: true 
});

export const insertLedgerSchema = createInsertSchema(ledgers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Tenant-submitted UPI proof payload — strict validation.
export const submitPaymentProofSchema = z.object({
  amount: z.number().int().positive().max(10_000_000),
  // UTR is typically 12 digits, but some banks issue 16 or 22-char alphanumeric refs.
  // Accept 6–32 alphanumeric to be liberal but bounded.
  transactionRef: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6,32}$/, "UTR must be 6–32 alphanumeric characters"),
  proofScreenshotUrl: z
    .string()
    .trim()
    .max(2048)
    .url("Screenshot link must be a valid URL")
    .refine((u) => /^https?:\/\//i.test(u), "URL must start with http(s)://")
    .optional()
    .or(z.literal("")),
});
export type SubmitPaymentProofRequest = z.infer<typeof submitPaymentProofSchema>;

export const verifyPaymentSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(500).optional(),
});

export const insertMaintenanceTicketSchema = createInsertSchema(maintenanceTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  resolvedBy: true,
});

// === EXPLICIT API TYPES ===
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Ledger = typeof ledgers.$inferSelect;
export type InsertLedger = z.infer<typeof insertLedgerSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type MaintenanceTicket = typeof maintenanceTickets.$inferSelect;
export type InsertMaintenanceTicket = z.infer<typeof insertMaintenanceTicketSchema>;

export type CreatePropertyRequest = InsertProperty;
export type CreateLedgerRequest = InsertLedger;
export type CreatePaymentRequest = InsertPayment;
export type CreateMaintenanceTicketRequest = InsertMaintenanceTicket;

export const insertAgreementSchema = createInsertSchema(agreements).omit({
  id: true,
  createdAt: true,
});
export type Agreement = typeof agreements.$inferSelect;
export type InsertAgreement = z.infer<typeof insertAgreementSchema>;

// Specific request types for actions
export type MarkPaidRequest = {
  amountAdvanced: number;
  proofOfTransferUrl?: string;
};

export type CollectRentRequest = {
  amountCollected: number;
};
