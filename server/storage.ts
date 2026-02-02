import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import {
  properties, ledgers, payments, maintenanceTickets,
  type Property, type InsertProperty,
  type Ledger, type InsertLedger,
  type Payment, type InsertPayment,
  type MaintenanceTicket, type InsertMaintenanceTicket,
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
  createProperty(property: CreatePropertyRequest): Promise<Property>;
  updatePropertyTenant(propertyId: string, tenantId: string): Promise<Property | undefined>;
  
  // Ledgers
  getLedgers(propertyId?: string, status?: string): Promise<(Ledger & { property: Property })[]>;
  getLedger(id: string): Promise<Ledger | undefined>;
  createLedger(ledger: CreateLedgerRequest): Promise<Ledger>;
  updateLedger(id: string, updates: Partial<InsertLedger>): Promise<Ledger>;
  
  // Payments (multi-installment)
  getPaymentsByLedger(ledgerId: string): Promise<Payment[]>;
  createPayment(payment: CreatePaymentRequest): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
  
  // Maintenance Tickets
  getTickets(propertyId?: string, status?: string): Promise<(MaintenanceTicket & { property: Property })[]>;
  getTicket(id: string): Promise<MaintenanceTicket | undefined>;
  createTicket(ticket: CreateMaintenanceTicketRequest): Promise<MaintenanceTicket>;
  updateTicket(id: string, updates: Partial<InsertMaintenanceTicket>): Promise<MaintenanceTicket>;
  getTicketCountsByProperty(propertyId: string): Promise<{ open: number; resolved: number }>;
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
    let query = db.select({
        // Spread all ledger fields
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
        // Include property relation
        property: properties
    })
    .from(ledgers)
    .innerJoin(properties, eq(ledgers.propertyId, properties.id));

    if (propertyId) {
      query.where(eq(ledgers.propertyId, propertyId));
    }
    
    // Simple client-side filtering for status if needed, or add .where() dynamically
    // Drizzle dynamic where is a bit verbose, letting basic query run for now.
    const results = await query.orderBy(desc(ledgers.createdAt));
    
    if (status) {
        return results.filter(r => r.status === status);
    }
    
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

  // Maintenance Tickets
  async getTickets(propertyId?: string, status?: string): Promise<(MaintenanceTicket & { property: Property })[]> {
    let query = db.select({
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
    
    const results = await query.orderBy(desc(maintenanceTickets.createdAt));
    
    let filtered = results;
    if (propertyId) {
      filtered = filtered.filter(t => t.propertyId === propertyId);
    }
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    return filtered;
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
    const results = await db.select().from(maintenanceTickets)
      .where(eq(maintenanceTickets.propertyId, propertyId));
    
    return {
      open: results.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
      resolved: results.filter(t => t.status === 'RESOLVED').length
    };
  }
}

export const storage = new DatabaseStorage();
