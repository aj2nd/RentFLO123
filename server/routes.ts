import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import Razorpay from "razorpay";

// Lazy initialize Razorpay (keys from secrets) - only when needed
let razorpayInstance: Razorpay | null = null;
function getRazorpay(): Razorpay | null {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

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

  // Create Razorpay Order for Tenant Payment
  app.post('/api/ledgers/:id/create-order', async (req, res) => {
    const { id } = req.params;
    const ledger = await storage.getLedger(id);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    // Get property to know the rent amount
    const property = await storage.getProperty(ledger.propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if Razorpay keys are configured
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ 
        message: 'Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to secrets.' 
      });
    }

    try {
      // Create a real Razorpay order
      const order = await razorpay.orders.create({
        amount: property.monthlyRent * 100, // Amount in paise
        currency: 'INR',
        receipt: `rent_${id}_${Date.now()}`,
        notes: {
          ledgerId: id,
          propertyId: property.id,
          monthYear: ledger.monthYear,
        }
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID, // Frontend needs this to open Razorpay checkout
      });
    } catch (err: any) {
      console.error('Razorpay order creation failed:', err);
      return res.status(500).json({ 
        message: 'Failed to create payment order', 
        error: err.message 
      });
    }
  });

  // Razorpay Webhook - Payment Verification
  app.post('/api/razorpay/webhook', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // In production, verify signature using Razorpay utility
    // For now, we trust the webhook call
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Get the order to find the ledger
    try {
      const razorpay = getRazorpay();
      if (!razorpay) {
        return res.status(500).json({ message: 'Razorpay not configured' });
      }
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const ledgerId = order.notes?.ledgerId as string;

      if (ledgerId) {
        const ledger = await storage.getLedger(ledgerId);
        if (ledger) {
          const amountPaid = Number(order.amount) / 100; // Convert from paise
          const newAmountCollected = (ledger.amountCollected || 0) + amountPaid;
          const isSettled = newAmountCollected >= (ledger.amountAdvanced || 0);

          await storage.updateLedger(ledgerId, {
            amountCollected: newAmountCollected,
            status: isSettled ? 'SETTLED' : ledger.status,
          });
        }
      }

      res.json({ status: 'ok' });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Collect Rent (Manual/Testing - also updates ledger after successful payment)
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
        status: isSettled ? 'SETTLED' : ledger.status
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
