import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH SETUP ===
  await setupAuth(app);
  registerAuthRoutes(app);

  // === API ROUTES ===

  // Properties
  app.get(api.properties.list.path, async (req, res) => {
    const properties = await storage.getProperties();
    res.json(properties);
  });

  app.post(api.properties.create.path, async (req, res) => {
    try {
      const input = api.properties.create.input.parse(req.body);
      const property = await storage.createProperty(input);
      res.status(201).json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.properties.get.path, async (req, res) => {
    const property = await storage.getProperty(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  });

  // Ledgers
  app.get(api.ledgers.list.path, async (req, res) => {
    const { propertyId, status } = req.query;
    const ledgers = await storage.getLedgers(
        typeof propertyId === 'string' ? propertyId : undefined,
        typeof status === 'string' ? status : undefined
    );
    res.json(ledgers);
  });

  // Manual Payout (Admin)
  app.post(api.ledgers.payOwner.path, async (req, res) => {
    const { id } = req.params;
    const ledger = await storage.getLedger(id);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    try {
      const input = api.ledgers.payOwner.input.parse(req.body);
      
      // Update ledger
      const updated = await storage.updateLedger(id, {
        amountAdvanced: input.amountAdvanced,
        proofOfTransferUrl: input.proofOfTransferUrl,
        // If we paid the owner, but haven't collected enough from tenant yet, we are EXPOSED.
        // If we already collected enough, we might be SETTLED.
        status: ledger.amountCollected >= input.amountAdvanced ? 'SETTLED' : 'EXPOSED',
      });
      
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  // Collect Rent (Tenant/Webhook)
  app.post(api.ledgers.collectRent.path, async (req, res) => {
    const { id } = req.params;
    const ledger = await storage.getLedger(id);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    try {
      const input = api.ledgers.collectRent.input.parse(req.body);
      
      const newAmountCollected = (ledger.amountCollected || 0) + input.amountCollected;
      const isSettled = newAmountCollected >= (ledger.amountAdvanced || 0);

      const updated = await storage.updateLedger(id, {
        amountCollected: newAmountCollected,
        status: isSettled ? 'SETTLED' : ledger.status // Keep existing status if not settled (e.g. stay EXPOSED or ARREARS)
      });

      res.json(updated);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });
  
  // Admin Dashboard Stats
  app.get(api.admin.dashboard.path, async (req, res) => {
      const ledgers = await storage.getLedgers();
      const properties = await storage.getProperties();
      
      const stats = {
          totalAdvanced: ledgers.reduce((sum, l) => sum + (l.amountAdvanced || 0), 0),
          totalCollected: ledgers.reduce((sum, l) => sum + (l.amountCollected || 0), 0),
          pendingPayouts: ledgers.filter(l => l.status === 'ARREARS' || (l.amountAdvanced === 0)).length,
          activeProperties: properties.length
      };
      
      res.json(stats);
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
    const existingProperties = await storage.getProperties();
    if (existingProperties.length > 0) return;
    
    console.log("Seeding database...");
    
    // Create Users (Simulated via Auth Storage if possible, or just mock IDs if we can't create auth users easily)
    // Since Auth uses a separate table, let's just create placeholder Users in the auth table if it's empty.
    // However, we don't have direct access to check "all users" easily without adding a method.
    // For simplicity, we'll create a dummy user via upsert to ensure IDs exist.
    
    const owner = await authStorage.upsertUser({
        id: "user_owner_1",
        email: "owner@rentbro.com",
        firstName: "Steve",
        lastName: "Jobs",
    });
    
    const tenant = await authStorage.upsertUser({
        id: "user_tenant_1",
        email: "tenant@rentbro.com",
        firstName: "Elon",
        lastName: "Musk",
    });
    
    const admin = await authStorage.upsertUser({
        id: "user_admin_1",
        email: "admin@rentbro.com",
        firstName: "Admin",
        lastName: "User",
    });

    // Create Property
    const prop1 = await storage.createProperty({
        address: "1 Infinite Loop, Cupertino, CA",
        ownerId: owner.id,
        tenantId: tenant.id,
        monthlyRent: 20000,
        payoutDay: 1
    });
    
    const prop2 = await storage.createProperty({
        address: "Gigafactory, Austin, TX",
        ownerId: owner.id,
        tenantId: tenant.id,
        monthlyRent: 50000,
        payoutDay: 5
    });

    // Create Ledgers (Current Month)
    await storage.createLedger({
        propertyId: prop1.id,
        amountAdvanced: 0,
        amountCollected: 0,
        status: 'ARREARS',
        monthYear: '2024-02'
    });
    
    await storage.createLedger({
        propertyId: prop2.id,
        amountAdvanced: 47500, // 50k - 5%
        amountCollected: 0,
        status: 'EXPOSED', // We paid, they haven't
        monthYear: '2024-02',
        proofOfTransferUrl: "https://example.com/receipt.png"
    });
    
    console.log("Seeding complete.");
}
