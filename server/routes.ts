import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import Razorpay from "razorpay";
import xss from "xss";

function sanitizeStrings(obj: any): any {
  if (typeof obj === 'string') return xss(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeStrings);
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeStrings(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

const sanitizeBody: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeStrings(req.body);
  }
  next();
};

const requireRole = (...roles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await authStorage.getUser(userId);
    if (!user || !roles.includes(user.role || '')) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};

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

  // === GLOBAL MIDDLEWARE ===
  app.use("/api", sanitizeBody);

  // === API ROUTES ===

  // Properties
  app.get(api.properties.list.path, isAuthenticated, async (req, res) => {
    const properties = await storage.getProperties();
    res.json(properties);
  });

  app.post(api.properties.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const input = api.properties.create.input.parse(req.body);
      // Enforce: ownerId must be the logged-in user (unless admin)
      const user = await authStorage.getUser(userId);
      if (user?.role !== 'ADMIN') {
        input.ownerId = userId;
      }
      const property = await storage.createProperty(input);

      // Auto-create a ledger for the current month
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await storage.createLedger({
        propertyId: property.id,
        amountAdvanced: 0,
        amountCollected: 0,
        status: 'ARREARS',
        monthYear,
      });

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

  app.get(api.properties.get.path, isAuthenticated, async (req, res) => {
    const property = await storage.getProperty(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  });

  // My properties — filtered by the logged-in user's role
  app.get("/api/properties/mine", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await authStorage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (user.role === "OWNER") {
      const props = await storage.getPropertiesByOwnerId(userId);
      return res.json(props);
    }
    if (user.role === "TENANT") {
      const props = await storage.getPropertiesByTenantId(userId);
      return res.json(props);
    }
    // ADMIN sees all
    const props = await storage.getProperties();
    return res.json(props);
  });

  // Look up properties by owner email (for tenant join)
  app.get("/api/properties/by-owner-email", isAuthenticated, async (req, res) => {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }
    const props = await storage.getPropertiesByOwnerEmail(email);
    res.json(props);
  });

  // Join property as tenant
  app.post("/api/properties/:id/join", isAuthenticated, async (req: any, res) => {
    const { id } = req.params;
    const userId = req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.tenantId) {
      return res.status(400).json({ message: 'Property already has a tenant' });
    }

    const updated = await storage.updatePropertyTenant(id, userId);
    res.json(updated);
  });

  // Ledgers
  app.get(api.ledgers.list.path, isAuthenticated, async (req, res) => {
    const { propertyId, status } = req.query;
    const ledgers = await storage.getLedgers(
        typeof propertyId === 'string' ? propertyId : undefined,
        typeof status === 'string' ? status : undefined
    );
    res.json(ledgers);
  });

  // Manual Payout (Admin)
  app.post(api.ledgers.payOwner.path, isAuthenticated, requireRole('ADMIN'), async (req, res) => {
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
  app.post('/api/ledgers/:id/create-order', isAuthenticated, async (req, res) => {
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

  // Razorpay Webhook - Payment Verification (handles partial payments)
  // NOTE: Intentionally unauthenticated - Razorpay sends webhook callbacks without session cookies.
  // Security is enforced via HMAC signature verification below.
  app.post('/api/razorpay/webhook', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    try {
      const razorpay = getRazorpay();
      if (!razorpay) {
        return res.status(500).json({ message: 'Razorpay not configured' });
      }
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const ledgerId = order.notes?.ledgerId as string;

      if (ledgerId) {
        const ledger = await storage.getLedger(ledgerId);
        const property = ledger ? await storage.getProperty(ledger.propertyId) : null;
        
        if (ledger && property) {
          const amountPaid = Number(order.amount_paid) / 100; // amount_paid for partial payments
          
          // Update or find the payment record
          const existingPayments = await storage.getPaymentsByLedger(ledgerId);
          const pendingPayment = existingPayments.find(p => p.razorpayOrderId === razorpay_order_id);
          
          if (pendingPayment) {
            await storage.updatePayment(pendingPayment.id, {
              razorpayPaymentId: razorpay_payment_id,
              status: 'SUCCESS',
            });
          }
          
          // Sum all successful payments for this ledger
          const allPayments = await storage.getPaymentsByLedger(ledgerId);
          const totalCollected = allPayments
            .filter(p => p.status === 'SUCCESS')
            .reduce((sum, p) => sum + p.amount, 0);
          
          // Determine if fully settled (collected >= monthly rent)
          const isSettled = totalCollected >= property.monthlyRent;

          await storage.updateLedger(ledgerId, {
            amountCollected: totalCollected,
            status: isSettled ? 'SETTLED' : (ledger.amountAdvanced > 0 ? 'EXPOSED' : 'ARREARS'),
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
  app.post(api.ledgers.collectRent.path, isAuthenticated, requireRole('ADMIN'), async (req, res) => {
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
  app.get(api.admin.dashboard.path, isAuthenticated, requireRole('ADMIN'), async (req, res) => {
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

  // === PARTIAL PAYMENTS (Split Engine) ===
  
  // Get all payments (for ledger view)
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    const payments = await storage.getAllPayments();
    res.json(payments);
  });

  // Get payments for a ledger
  app.get(api.payments.listByLedger.path, isAuthenticated, async (req, res) => {
    const { ledgerId } = req.params;
    const payments = await storage.getPaymentsByLedger(String(ledgerId));
    res.json(payments);
  });

  // Create partial payment with Razorpay
  app.post(api.payments.create.path, isAuthenticated, async (req, res) => {
    const { ledgerId } = req.params;
    const ledger = await storage.getLedger(ledgerId);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    const property = await storage.getProperty(ledger.propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ 
        message: 'Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to secrets.' 
      });
    }

    try {
      const input = api.payments.create.input.parse(req.body);
      const amountInPaise = input.amount * 100;
      
      // Create Razorpay order with partial_payment enabled
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `partial_${ledgerId}_${Date.now()}`,
        partial_payment: true, // CRITICAL: Enable partial payments
        first_payment_min_amount: 100, // Minimum 1 rupee
        notes: {
          ledgerId: ledgerId,
          propertyId: property.id,
          monthYear: ledger.monthYear,
          paymentType: 'partial',
        }
      });

      // Create payment record in pending state
      const payment = await storage.createPayment({
        ledgerId: ledgerId,
        amount: input.amount,
        razorpayOrderId: order.id,
        status: 'PENDING',
      });

      res.json({
        payment,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID!,
      });
    } catch (err: any) {
      console.error('Partial payment order creation failed:', err);
      return res.status(500).json({ 
        message: 'Failed to create payment order', 
        error: err.message 
      });
    }
  });

  // === MAINTENANCE TICKETS ===
  
  // Get all tickets
  app.get(api.tickets.list.path, isAuthenticated, async (req, res) => {
    const { propertyId, status } = req.query;
    const tickets = await storage.getTickets(
      typeof propertyId === 'string' ? propertyId : undefined,
      typeof status === 'string' ? status : undefined
    );
    res.json(tickets);
  });

  // Create ticket (Tenant)
  app.post(api.tickets.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.tickets.create.input.parse(req.body);
      const ticket = await storage.createTicket(input);
      res.status(201).json(ticket);
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

  // Resolve ticket (Admin)
  app.post(api.tickets.resolve.path, isAuthenticated, requireRole('ADMIN'), async (req, res) => {
    const { id } = req.params;
    const ticket = await storage.getTicket(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updated = await storage.updateTicket(id, {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      // resolvedBy would come from session in production
    });
    res.json(updated);
  });

  // Get ticket counts by property
  app.get(api.tickets.countsByProperty.path, isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const counts = await storage.getTicketCountsByProperty(id);
    res.json(counts);
  });

  // === KYC ROUTES ===
  
  // Submit KYC documents
  app.post("/api/kyc/submit", async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { fullLegalName, panNumber, aadhaarNumber, kycDocumentUrl, bankAccountNumber, ifscCode, cancelledChequeUrl } = req.body;

    if (!fullLegalName) {
      return res.status(400).json({ message: 'Full legal name is required' });
    }
    if (!panNumber && !aadhaarNumber) {
      return res.status(400).json({ message: 'Either PAN number or Aadhaar number is required' });
    }

    const updated = await authStorage.updateUser(userId, {
      fullLegalName,
      panNumber,
      aadhaarNumber,
      kycDocumentUrl,
      bankAccountNumber,
      ifscCode,
      cancelledChequeUrl,
      isVerified: false, // Set to false, admin will verify
    });

    res.json(updated);
  });

  // Get users pending KYC verification (Admin only)
  app.get("/api/kyc/pending", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const pendingUsers = await authStorage.getUsersPendingVerification();
    res.json(pendingUsers);
  });

  // Verify user (Admin only)
  app.post("/api/kyc/verify/:userId", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const { userId } = req.params;
    
    const updated = await authStorage.updateUser(userId, {
      isVerified: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updated);
  });

  // ─── AGREEMENT ROUTES ────────────────────────────────────────────────────
  // GET /api/agreements/mine — fetch agreement for the logged-in user's property
  app.get("/api/agreements/mine", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const dbUser = await authStorage.getUser(userId);
    if (!dbUser?.role || dbUser.role === 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let userProperties: any[] = [];
    if (dbUser.role === 'OWNER') {
      userProperties = await storage.getPropertiesByOwnerId(userId);
    } else {
      userProperties = await storage.getPropertiesByTenantId(userId);
    }

    if (!userProperties.length) {
      return res.json({ property: null, agreement: null });
    }

    const property = userProperties[0];
    const agreement = await storage.getAgreementByProperty(property.id);
    return res.json({ property, agreement: agreement || null });
  });

  // POST /api/agreements/sign — submit digital signature for the tripartite agreement
  app.post("/api/agreements/sign", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const dbUser = await authStorage.getUser(userId);
    if (!dbUser?.role || dbUser.role === 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { signatureUrl, propertyId } = req.body;
    if (!signatureUrl || !propertyId) {
      return res.status(400).json({ message: 'signatureUrl and propertyId are required' });
    }

    // Verify the user owns or rents this property
    const property = await storage.getProperty(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const isOwner = property.ownerId === userId;
    const isTenant = property.tenantId === userId;
    if (!isOwner && !isTenant) {
      return res.status(403).json({ message: 'You are not associated with this property' });
    }

    const agreement = await storage.signAgreement(propertyId, isOwner ? 'OWNER' : 'TENANT', signatureUrl);
    return res.json(agreement);
  });

  // Get all users (Admin only)
  app.get("/api/users", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const users = await authStorage.getAllUsers();
    res.json(users);
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
