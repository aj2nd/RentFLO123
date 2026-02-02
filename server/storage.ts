import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  properties, ledgers,
  type Property, type InsertProperty,
  type Ledger, type InsertLedger,
  type CreatePropertyRequest,
  type CreateLedgerRequest
} from "@shared/schema";

export interface IStorage {
  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: CreatePropertyRequest): Promise<Property>;
  
  // Ledgers
  getLedgers(propertyId?: string, status?: string): Promise<(Ledger & { property: Property })[]>;
  getLedger(id: string): Promise<Ledger | undefined>;
  createLedger(ledger: CreateLedgerRequest): Promise<Ledger>;
  updateLedger(id: string, updates: Partial<InsertLedger>): Promise<Ledger>;
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
}

export const storage = new DatabaseStorage();
