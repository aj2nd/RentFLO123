import { db } from "./db";
import { eq, desc, sql, or, and, count, inArray } from "drizzle-orm";
import {
  properties, ledgers, payments, maintenanceTickets, agreements,
  pushSubscriptions, notifications, messages,
  type Property, type InsertProperty,
  type Ledger, type InsertLedger,
  type Payment, type InsertPayment,
  type MaintenanceTicket, type InsertMaintenanceTicket,
  type Agreement,
  type PushSubscription, type InsertPushSubscription,
  type Notification, type InsertNotification,
  type Message, type InsertMessage,
  type CreatePropertyRequest,
  type CreateLedgerRequest,
  type CreatePaymentRequest,
  type CreateMaintenanceTicketRequest
} from "@shared/schema";

export interface IStorage {
  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  getPropertiesByOwnerEmail(email: string): Promise<Property[]>;
  getPropertiesByOwnerId(ownerId: string): Promise<Property[]>;
  getPropertiesByTenantId(tenantId: string): Promise<Property[]>;
  createProperty(property: CreatePropertyRequest): Promise<Property>;
  updatePropertyTenant(propertyId: string, tenantId: string): Promise<Property | undefined>;
  
  // Ledgers
  getLedgers(propertyId?: string, status?: string): Promise<(Ledger & { property: Property })[]>;
  getLedger(id: string): Promise<Ledger | undefined>;
  createLedger(ledger: CreateLedgerRequest): Promise<Ledger>;
  updateLedger(id: string, updates: Partial<InsertLedger>): Promise<Ledger>;
  
  // Payments (multi-installment)
  getAllPayments(): Promise<Payment[]>;
  getPaymentsByLedger(ledgerId: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPendingVerificationPayments(): Promise<(Payment & { ledger: Ledger & { property: Property } })[]>;
  createPayment(payment: CreatePaymentRequest): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
  // Atomic verify: flips PENDING_VERIFICATION → SUCCESS and recomputes ledger.amountCollected.
  verifyPayment(paymentId: string, adminId: string): Promise<{ payment: Payment; ledger: Ledger }>;
  rejectPayment(paymentId: string, adminId: string, reason: string): Promise<Payment>;
  
  // Maintenance Tickets
  getTickets(propertyId?: string, status?: string): Promise<(MaintenanceTicket & { property: Property })[]>;
  getTicket(id: string): Promise<MaintenanceTicket | undefined>;
  createTicket(ticket: CreateMaintenanceTicketRequest): Promise<MaintenanceTicket>;
  updateTicket(id: string, updates: Partial<InsertMaintenanceTicket>): Promise<MaintenanceTicket>;
  getTicketCountsByProperty(propertyId: string): Promise<{ open: number; resolved: number }>;

  // Batch property lookup
  getPropertiesByIds(ids: string[]): Promise<Property[]>;

  // Payments — indexed lookups
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;
  getPaymentByTransactionRef(ref: string): Promise<Payment | undefined>;
  getPaymentsByUserProperties(userId: string): Promise<Payment[]>;

  // Agreements
  getAgreementByProperty(propertyId: string): Promise<Agreement | undefined>;
  getOrCreateAgreement(propertyId: string): Promise<Agreement>;
  getAllAgreements(): Promise<Agreement[]>;
  markAgreementSigned(propertyId: string): Promise<Agreement>;
  markOwnerSigned(propertyId: string): Promise<Agreement>;
  markTenantSigned(propertyId: string): Promise<Agreement>;

  // Push Subscriptions
  savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string, userId?: string): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markNotificationsRead(userId: string): Promise<void>;
  createNotification(notif: InsertNotification): Promise<Notification>;

  // Messages
  getMessages(propertyId: string): Promise<Message[]>;
  sendMessage(msg: InsertMessage): Promise<Message>;
  markMessagesRead(propertyId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Properties
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getPropertiesByIds(ids: string[]): Promise<Property[]> {
    if (!ids.length) return [];
    return db.select().from(properties).where(inArray(properties.id, ids));
  }

  async createProperty(insertProperty: CreatePropertyRequest): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async getPropertiesByOwnerEmail(email: string): Promise<Property[]> {
    const { users } = await import("@shared/schema");
    const result = await db
      .select({ property: properties })
      .from(properties)
      .innerJoin(users, eq(properties.ownerId, users.id))
      .where(eq(users.email, email));
    return result.map(r => r.property);
  }

  async getPropertiesByOwnerId(ownerId: string): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.ownerId, ownerId));
  }

  async getPropertiesByTenantId(tenantId: string): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.tenantId, tenantId));
  }

  async updatePropertyTenant(propertyId: string, tenantId: string): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ tenantId })
      .where(eq(properties.id, propertyId))
      .returning();
    return property;
  }

  // Ledgers
  async getLedgers(propertyId?: string, status?: string): Promise<(Ledger & { property: Property })[]> {
    const conditions = [];
    if (propertyId) conditions.push(eq(ledgers.propertyId, propertyId));
    if (status) conditions.push(eq(ledgers.status, status as 'ARREARS' | 'SETTLED' | 'EXPOSED'));

    const baseQuery = db.select({
        id: ledgers.id,
        propertyId: ledgers.propertyId,
        amountAdvanced: ledgers.amountAdvanced,
        amountCollected: ledgers.amountCollected,
        status: ledgers.status,
        monthYear: ledgers.monthYear,
        proofOfTransferUrl: ledgers.proofOfTransferUrl,
        processedBy: ledgers.processedBy,
        createdAt: ledgers.createdAt,
        updatedAt: ledgers.updatedAt,
        property: properties,
    })
    .from(ledgers)
    .innerJoin(properties, eq(ledgers.propertyId, properties.id));

    const results = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(desc(ledgers.createdAt))
      : await baseQuery.orderBy(desc(ledgers.createdAt));

    return results;
  }

  async getLedger(id: string): Promise<Ledger | undefined> {
    const [ledger] = await db.select().from(ledgers).where(eq(ledgers.id, id));
    return ledger;
  }

  async createLedger(insertLedger: CreateLedgerRequest): Promise<Ledger> {
    const [ledger] = await db.insert(ledgers).values(insertLedger).returning();
    return ledger;
  }

  async updateLedger(id: string, updates: Partial<InsertLedger>): Promise<Ledger> {
    const [updated] = await db.update(ledgers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ledgers.id, id))
      .returning();
    return updated;
  }

  // Payments
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByLedger(ledgerId: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.ledgerId, ledgerId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: CreatePaymentRequest): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db.update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [p] = await db.select().from(payments).where(eq(payments.id, id));
    return p;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    const [p] = await db.select().from(payments).where(eq(payments.razorpayOrderId, orderId));
    return p;
  }

  async getPaymentByTransactionRef(ref: string): Promise<Payment | undefined> {
    const [p] = await db.select().from(payments)
      .where(eq(payments.transactionRef, ref.toUpperCase()));
    return p;
  }

  // Return payments scoped to properties this user owns or rents — avoids
  // loading the entire payments table for non-admin users.
  async getPaymentsByUserProperties(userId: string): Promise<Payment[]> {
    const userProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(or(eq(properties.ownerId, userId), eq(properties.tenantId, userId)));
    if (!userProperties.length) return [];
    const propertyIds = userProperties.map((p) => p.id);

    const rows = await db
      .select({ payment: payments })
      .from(payments)
      .innerJoin(ledgers, eq(payments.ledgerId, ledgers.id))
      .where(inArray(ledgers.propertyId, propertyIds))
      .orderBy(desc(payments.createdAt));
    return rows.map((r) => r.payment);
  }

  async getPendingVerificationPayments(): Promise<(Payment & { ledger: Ledger & { property: Property } })[]> {
    const rows = await db
      .select()
      .from(payments)
      .innerJoin(ledgers, eq(payments.ledgerId, ledgers.id))
      .innerJoin(properties, eq(ledgers.propertyId, properties.id))
      .where(eq(payments.status, 'PENDING_VERIFICATION'))
      .orderBy(desc(payments.createdAt));
    return rows.map((r: any) => ({
      ...r.payments,
      ledger: { ...r.ledgers, property: r.properties },
    }));
  }

  // Atomic verification — flips status to SUCCESS, recomputes the ledger's
  // amountCollected from all SUCCESS rows, and updates the ledger status.
  // Done in a transaction so a failed status update can never leave the ledger
  // out of sync with the payments table.
  async verifyPayment(paymentId: string, adminId: string): Promise<{ payment: Payment; ledger: Ledger }> {
    return await db.transaction(async (tx) => {
      // Conditional update — only flip if still PENDING_VERIFICATION. This
      // closes the verify/reject race: if a concurrent admin already moved the
      // row to SUCCESS or FAILED, this returns 0 rows and we 409 out without
      // touching the ledger.
      const [updatedPmt] = await tx
        .update(payments)
        .set({ status: 'SUCCESS', verifiedBy: adminId, verifiedAt: new Date(), rejectionReason: null })
        .where(and(eq(payments.id, paymentId), eq(payments.status, 'PENDING_VERIFICATION')))
        .returning();
      if (!updatedPmt) {
        // Distinguish "not found" vs "wrong state" for a clearer error.
        const [exists] = await tx.select().from(payments).where(eq(payments.id, paymentId));
        if (!exists) throw Object.assign(new Error("Payment not found"), { status: 404 });
        throw Object.assign(
          new Error(`Cannot verify a payment in state ${exists.status}`),
          { status: 409 },
        );
      }
      const pmt = updatedPmt;

      const [ledger] = await tx.select().from(ledgers).where(eq(ledgers.id, pmt.ledgerId));
      const [property] = await tx.select().from(properties).where(eq(properties.id, ledger.propertyId));

      const successRows = await tx
        .select()
        .from(payments)
        .where(and(eq(payments.ledgerId, pmt.ledgerId), eq(payments.status, 'SUCCESS')));
      const totalCollected = successRows.reduce((s, p) => s + p.amount, 0);
      const isSettled = totalCollected >= property.monthlyRent;

      const [updatedLedger] = await tx
        .update(ledgers)
        .set({
          amountCollected: totalCollected,
          status: isSettled ? 'SETTLED' : (ledger.amountAdvanced > 0 ? 'EXPOSED' : 'ARREARS'),
          updatedAt: new Date(),
        })
        .where(eq(ledgers.id, pmt.ledgerId))
        .returning();

      return { payment: updatedPmt, ledger: updatedLedger };
    });
  }

  async rejectPayment(paymentId: string, adminId: string, reason: string): Promise<Payment> {
    // Race-safe: only flip if still PENDING_VERIFICATION. Since pending rows
    // were never credited to the ledger, no ledger recompute is needed here.
    const [updated] = await db
      .update(payments)
      .set({ status: 'FAILED', verifiedBy: adminId, verifiedAt: new Date(), rejectionReason: reason })
      .where(and(eq(payments.id, paymentId), eq(payments.status, 'PENDING_VERIFICATION')))
      .returning();
    if (!updated) {
      const [exists] = await db.select().from(payments).where(eq(payments.id, paymentId));
      if (!exists) throw Object.assign(new Error("Payment not found"), { status: 404 });
      throw Object.assign(
        new Error(`Cannot reject a payment in state ${exists.status}`),
        { status: 409 },
      );
    }
    return updated;
  }

  // Maintenance Tickets
  async getTickets(propertyId?: string, status?: string): Promise<(MaintenanceTicket & { property: Property })[]> {
    const conditions = [];
    if (propertyId) conditions.push(eq(maintenanceTickets.propertyId, propertyId));
    if (status) conditions.push(eq(maintenanceTickets.status, status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'));

    const baseQuery = db.select({
      id: maintenanceTickets.id,
      propertyId: maintenanceTickets.propertyId,
      tenantId: maintenanceTickets.tenantId,
      title: maintenanceTickets.title,
      description: maintenanceTickets.description,
      photoUrl: maintenanceTickets.photoUrl,
      status: maintenanceTickets.status,
      resolvedBy: maintenanceTickets.resolvedBy,
      resolvedAt: maintenanceTickets.resolvedAt,
      createdAt: maintenanceTickets.createdAt,
      updatedAt: maintenanceTickets.updatedAt,
      property: properties
    })
    .from(maintenanceTickets)
    .innerJoin(properties, eq(maintenanceTickets.propertyId, properties.id));

    const results = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(desc(maintenanceTickets.createdAt))
      : await baseQuery.orderBy(desc(maintenanceTickets.createdAt));

    return results;
  }

  async getTicket(id: string): Promise<MaintenanceTicket | undefined> {
    const [ticket] = await db.select().from(maintenanceTickets).where(eq(maintenanceTickets.id, id));
    return ticket;
  }

  async createTicket(insertTicket: CreateMaintenanceTicketRequest): Promise<MaintenanceTicket> {
    const [ticket] = await db.insert(maintenanceTickets).values(insertTicket).returning();
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<InsertMaintenanceTicket> & { resolvedBy?: string; resolvedAt?: Date }): Promise<MaintenanceTicket> {
    const [updated] = await db.update(maintenanceTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceTickets.id, id))
      .returning();
    return updated;
  }

  async getTicketCountsByProperty(propertyId: string): Promise<{ open: number; resolved: number }> {
    const [openRow] = await db
      .select({ count: count() })
      .from(maintenanceTickets)
      .where(and(
        eq(maintenanceTickets.propertyId, propertyId),
        sql`${maintenanceTickets.status} IN ('OPEN','IN_PROGRESS')`
      ));
    const [resolvedRow] = await db
      .select({ count: count() })
      .from(maintenanceTickets)
      .where(and(
        eq(maintenanceTickets.propertyId, propertyId),
        eq(maintenanceTickets.status, 'RESOLVED')
      ));
    return { open: openRow?.count ?? 0, resolved: resolvedRow?.count ?? 0 };
  }

  // Agreements
  async getAgreementByProperty(propertyId: string): Promise<Agreement | undefined> {
    const [agreement] = await db.select().from(agreements).where(eq(agreements.propertyId, propertyId));
    return agreement;
  }

  async getOrCreateAgreement(propertyId: string): Promise<Agreement> {
    const existing = await this.getAgreementByProperty(propertyId);
    if (existing) return existing;
    // Use ON CONFLICT to handle the race where two requests arrive simultaneously.
    // The unique index on propertyId guarantees at most one row.
    const [created] = await db
      .insert(agreements)
      .values({ propertyId, status: 'PENDING' })
      .onConflictDoNothing()
      .returning();
    if (created) return created;
    // Another concurrent request won the race — fetch the row it inserted.
    const [fetched] = await db.select().from(agreements).where(eq(agreements.propertyId, propertyId));
    return fetched;
  }

  async getAllAgreements(): Promise<Agreement[]> {
    return db.select().from(agreements).orderBy(desc(agreements.id));
  }

  async markAgreementSigned(propertyId: string): Promise<Agreement> {
    const agreement = await this.getOrCreateAgreement(propertyId);
    const now = new Date();
    const [updated] = await db.update(agreements)
      .set({ status: 'FULLY_SIGNED', ownerSignedAt: now, tenantSignedAt: now })
      .where(eq(agreements.id, agreement.id))
      .returning();
    return updated;
  }

  async markOwnerSigned(propertyId: string): Promise<Agreement> {
    const agreement = await this.getOrCreateAgreement(propertyId);
    const now = new Date();
    const alreadyTenantSigned = agreement.status === 'TENANT_SIGNED' || agreement.status === 'FULLY_SIGNED';
    const newStatus = alreadyTenantSigned ? 'FULLY_SIGNED' : 'OWNER_SIGNED';
    const [updated] = await db.update(agreements)
      .set({
        status: newStatus,
        ownerSignedAt: now,
        ...(alreadyTenantSigned && !agreement.tenantSignedAt ? { tenantSignedAt: now } : {}),
      })
      .where(eq(agreements.id, agreement.id))
      .returning();
    return updated;
  }

  async markTenantSigned(propertyId: string): Promise<Agreement> {
    const agreement = await this.getOrCreateAgreement(propertyId);
    const now = new Date();
    const alreadyOwnerSigned = agreement.status === 'OWNER_SIGNED' || agreement.status === 'FULLY_SIGNED';
    const newStatus = alreadyOwnerSigned ? 'FULLY_SIGNED' : 'TENANT_SIGNED';
    const [updated] = await db.update(agreements)
      .set({
        status: newStatus,
        tenantSignedAt: now,
        ...(alreadyOwnerSigned && !agreement.ownerSignedAt ? { ownerSignedAt: now } : {}),
      })
      .where(eq(agreements.id, agreement.id))
      .returning();
    return updated;
  }

  // Push Subscriptions
  // SECURITY: Atomic ownership-preserving upsert. The ON CONFLICT update only
  // fires when the existing row already belongs to the same user — this closes
  // the check-then-upsert race. If another user owns the endpoint, the update
  // is skipped and `returning()` yields no rows; we then verify and reject.
  async savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    const rows = await db
      .insert(pushSubscriptions)
      .values(sub)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: sub.p256dh, auth: sub.auth },
        where: eq(pushSubscriptions.userId, sub.userId),
      })
      .returning();
    if (rows.length === 0) {
      throw Object.assign(new Error("Endpoint already registered to another user"), { status: 403 });
    }
    return rows[0];
  }

  // SECURITY: Only delete if the endpoint belongs to the requesting user.
  async deletePushSubscription(endpoint: string, userId?: string): Promise<void> {
    if (userId) {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
    } else {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    }
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return row?.count ?? 0;
  }

  async markNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async createNotification(notif: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notif).returning();
    return created;
  }

  // Messages
  async getMessages(propertyId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.propertyId, propertyId))
      .orderBy(messages.createdAt);
  }

  async sendMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  async markMessagesRead(propertyId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(and(eq(messages.propertyId, propertyId), eq(messages.receiverId, userId)));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.read, false)));
    return row?.count ?? 0;
  }
}

export const storage = new DatabaseStorage();
