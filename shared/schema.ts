import { pgTable, text, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export everything from auth models
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  address: text("address").notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(), // Landlord
  tenantId: varchar("tenant_id").references(() => users.id), // Tenant (optional initially)
  monthlyRent: integer("monthly_rent").notNull(),
  payoutDay: integer("payout_day").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ledgers = pgTable("ledgers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  amountAdvanced: integer("amount_advanced").default(0).notNull(), // What we paid owner
  amountCollected: integer("amount_collected").default(0).notNull(), // What tenant paid us
  status: text("status", { enum: ['ARREARS', 'SETTLED', 'EXPOSED'] }).default('ARREARS').notNull(),
  monthYear: text("month_year").notNull(), // e.g. "2024-02"
  proofOfTransferUrl: text("proof_of_transfer_url"), // Screenshot of bank transfer
  processedBy: varchar("processed_by").references(() => users.id), // Admin who processed it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const ledgersRelations = relations(ledgers, ({ one }) => ({
  property: one(properties, {
    fields: [ledgers.propertyId],
    references: [properties.id],
  }),
}));

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

// === EXPLICIT API TYPES ===
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Ledger = typeof ledgers.$inferSelect;
export type InsertLedger = z.infer<typeof insertLedgerSchema>;

export type CreatePropertyRequest = InsertProperty;
export type CreateLedgerRequest = InsertLedger;

// Specific request types for actions
export type MarkPaidRequest = {
  amountAdvanced: number;
  proofOfTransferUrl?: string;
};

export type CollectRentRequest = {
  amountCollected: number;
};
