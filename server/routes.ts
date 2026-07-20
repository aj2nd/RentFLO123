import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { submitPaymentProofSchema, verifyPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import xss from "xss";
import { initVapid, getVapidPublicKey, createNotification } from "./push";

import {
  diditConfigured,
  createDiditSession,
  getDiditDecision,
  verifyDiditWebhook,
  diditWebhookSecretConfigured,
  DIDIT_APPROVED_STATUSES,
  type DiditDecision,
} from "./didit";
// leegality removed — agreements are now signed physically
import OpenAI from "openai";
import {
  encryptPII,
  publicUser,
  timingSafeEqualStr,
  requirePropertyAccess,
  requireLedgerAccess,
} from "./security";

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

// === CASHFREE PAYMENT GATEWAY ===
// We call Cashfree's PG REST API directly (no SDK) to keep deps minimal.
// Sandbox base: https://sandbox.cashfree.com/pg
// Production base: https://api.cashfree.com/pg
const CASHFREE_API_VERSION = "2025-01-01";
function cashfreeBaseUrl(): string {
  // Sandbox keys start with "TEST" — flip base accordingly.
  const appId = process.env.CASHFREE_APP_ID || "";
  return appId.startsWith("TEST")
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";
}
function cashfreeConfigured(): boolean {
  return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}
function cashfreeHeaders(): Record<string, string> {
  return {
    "x-client-id": process.env.CASHFREE_APP_ID!,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
    "x-api-version": CASHFREE_API_VERSION,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}
async function cashfreeCreateOrder(body: any): Promise<any> {
  const res = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.error_description)) || `Cashfree create order failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
async function cashfreeFetchOrder(orderId: string): Promise<any> {
  const res = await fetch(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: cashfreeHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data && data.message) || `Cashfree fetch order failed (${res.status})`);
  return data;
}
async function cashfreeFetchOrderPayments(orderId: string): Promise<any[]> {
  const res = await fetch(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}/payments`, {
    method: "GET",
    headers: cashfreeHeaders(),
  });
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error((data && data.message) || `Cashfree fetch order payments failed (${res.status})`);
  return Array.isArray(data) ? data : [];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH SETUP ===
  await setupAuth(app);
  registerAuthRoutes(app);

  // === PUSH NOTIFICATIONS INIT ===
  await initVapid();

  // === GLOBAL MIDDLEWARE ===
  app.use("/api", sanitizeBody);

  // === API ROUTES ===

  // Properties — list is scoped to the caller. Admin sees all; OWNER sees own; TENANT sees own.
  app.get(api.properties.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const u = await authStorage.getUser(userId);
    if (u?.role === "ADMIN") return res.json(await storage.getProperties());
    if (u?.role === "OWNER") return res.json(await storage.getPropertiesByOwnerId(userId));
    if (u?.role === "TENANT") return res.json(await storage.getPropertiesByTenantId(userId));
    return res.json([]);
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

  // My properties — filtered by the logged-in user's role
  // IMPORTANT: must be registered BEFORE /api/properties/:id to avoid "mine" matching as an id
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

  app.get(api.properties.get.path, isAuthenticated, async (req: any, res) => {
    const access = await requirePropertyAccess(req, res, req.params.id);
    if (!access) return;
    res.json(access.property);
  });

  // Look up properties by owner email (for tenant join). Returns only address/id —
  // no owner PII — and only properties without a tenant (the only ones a tenant
  // could legitimately join). Limits enumeration value.
  app.get("/api/properties/by-owner-email", isAuthenticated, async (req, res) => {
    const { email } = req.query;
    if (!email || typeof email !== "string" || email.length > 254) {
      return res.status(400).json({ message: "Email is required" });
    }
    const props = await storage.getPropertiesByOwnerEmail(email);
    const safe = props
      .filter((p) => !p.tenantId)
      .map((p) => ({ id: p.id, address: p.address, monthlyRent: p.monthlyRent, payoutDay: p.payoutDay }));
    res.json(safe);
  });

  // Join property as tenant — INVITATION-ONLY.
  // Caller must (a) have TENANT role, (b) be authenticated with the email the
  // owner pre-registered as `pendingTenantEmail`. This prevents any random
  // logged-in user from claiming arbitrary vacant properties.
  app.post("/api/properties/:id/join", isAuthenticated, async (req: any, res) => {
    const { id } = req.params;
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const caller = await authStorage.getUser(userId);
    if (!caller || caller.role !== 'TENANT') {
      return res.status(403).json({ message: 'Only tenants can join properties' });
    }

    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.tenantId) {
      return res.status(400).json({ message: 'Property already has a tenant' });
    }

    const callerEmail = (caller.email || '').toLowerCase();
    const invited = (property.pendingTenantEmail || '').toLowerCase();
    if (!invited || !callerEmail || invited !== callerEmail) {
      return res.status(403).json({
        message: 'You are not invited to this property. Ask the landlord to add your email.',
      });
    }

    const updated = await storage.updatePropertyTenant(id, userId);
    res.json(updated);
  });

  // Ledgers — scoped. ADMIN sees all; non-admins only see ledgers for properties they own/rent.
  app.get(api.ledgers.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const u = await authStorage.getUser(userId);
    const { propertyId, status } = req.query;

    // If propertyId is given, verify access first.
    if (typeof propertyId === "string") {
      const access = await requirePropertyAccess(req, res, propertyId);
      if (!access) return;
      const ledgers = await storage.getLedgers(propertyId, typeof status === "string" ? status : undefined);
      return res.json(ledgers);
    }

    const all = await storage.getLedgers(undefined, typeof status === "string" ? status : undefined);
    if (u?.role === "ADMIN") return res.json(all);
    const allowed = all.filter((l) => l.property.ownerId === userId || l.property.tenantId === userId);
    res.json(allowed);
  });

  // Manual Payout (Admin)
  app.post(api.ledgers.payOwner.path, isAuthenticated, requireRole('ADMIN'), async (req, res) => {
    const id = req.params.id as string;
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
        status: ledger.amountCollected >= input.amountAdvanced ? 'SETTLED' : 'EXPOSED',
      });

      // Push notification to the property owner
      const prop = await storage.getProperty(ledger.propertyId);
      if (prop?.ownerId) {
        createNotification(
          prop.ownerId,
          "Rent Advanced",
          `₹${input.amountAdvanced.toLocaleString('en-IN')} has been credited to your account for ${ledger.monthYear}.`,
          "RENT_ADVANCED",
          "/owner"
        ).catch(() => {});
      }
      
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

  // Create Cashfree Order for Tenant Payment — only the tenant of the property may create.
  app.post('/api/ledgers/:id/create-order', isAuthenticated, async (req: any, res) => {
    const { id } = req.params;
    const access = await requireLedgerAccess(req, res, id);
    if (!access) return;
    const { ledger, property, role } = access;
    if (role !== "TENANT" && role !== "ADMIN") {
      return res.status(403).json({ message: "Only the tenant of this property can pay rent" });
    }

    if (!cashfreeConfigured()) {
      return res.status(503).json({ message: "Payment gateway not configured" });
    }

    try {
      const userId = req.user?.claims?.sub as string;
      const u = await authStorage.getUser(userId);
      const orderId = `rent_${id}_${Date.now()}`;
      const order = await cashfreeCreateOrder({
        order_id: orderId,
        order_amount: property.monthlyRent,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_email: u?.email || `tenant_${userId}@rentflo.app`,
          customer_phone: (u as any)?.phoneNumber || "9999999999",
          customer_name: (u as any)?.fullLegalName || u?.email || "Tenant",
        },
        order_meta: {
          notify_url: `${req.protocol}://${req.get("host")}/api/cashfree/webhook`,
        },
        order_note: `Rent for ${ledger.monthYear}`,
        order_tags: { ledgerId: id, propertyId: property.id, monthYear: ledger.monthYear },
      });

      res.json({
        orderId: order.order_id,
        paymentSessionId: order.payment_session_id,
        amount: property.monthlyRent,
        currency: "INR",
      });
    } catch (err: any) {
      console.error('Cashfree order creation failed:', err?.message || err);
      return res.status(502).json({ message: 'Failed to create payment order' });
    }
  });

  // Cashfree Webhook - Payment Verification (handles partial payments)
  // SECURITY:
  //  - HMAC-SHA256 over `${timestamp}${rawBody}` using CASHFREE_SECRET_KEY,
  //    base64-encoded. Compared via timing-safe equal.
  //  - Computed over RAW request body (not parsed/sanitized) to avoid drift.
  //  - Idempotent: if a payment row with the same cf_payment_id is already SUCCESS,
  //    we return 200 without re-counting.
  // The DB columns `razorpay_order_id` / `razorpay_payment_id` are reused as
  // generic gateway-order-id / gateway-payment-id (no migration needed).
  app.post('/api/cashfree/webhook', async (req: any, res) => {
    try {
      const cryptoMod = await import('crypto');
      const secret = process.env.CASHFREE_SECRET_KEY || '';
      if (!secret) return res.status(503).json({ message: 'Payment gateway not configured' });

      const headerSig = (req.headers['x-webhook-signature'] as string) || '';
      const headerTs = (req.headers['x-webhook-timestamp'] as string) || '';
      const rawBody: Buffer | undefined = req.rawBody as Buffer | undefined;

      if (!headerSig || !headerTs || !rawBody) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const expected = cryptoMod
        .createHmac('sha256', secret)
        .update(headerTs + rawBody.toString('utf8'))
        .digest('base64');
      if (!timingSafeEqualStr(expected, headerSig)) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const parsed = JSON.parse(rawBody.toString('utf8'));
      const data = parsed?.data || {};
      const orderInfo = data?.order || {};
      const paymentInfo = data?.payment || {};
      const cf_order_id: string | undefined = orderInfo.order_id;
      const cf_payment_id: string | undefined =
        paymentInfo.cf_payment_id?.toString?.() || paymentInfo.payment_id?.toString?.();
      const paymentStatus: string = paymentInfo.payment_status || '';
      const eventType: string = parsed?.type || '';

      // Only act on successful payment events. Both the event type AND the
      // payment status must indicate success — otherwise we ignore deterministically.
      const isSuccess =
        eventType === 'PAYMENT_SUCCESS_WEBHOOK' && paymentStatus === 'SUCCESS';
      if (!isSuccess) {
        return res.json({ status: 'ok', ignored: true });
      }

      if (!cf_order_id || !cf_payment_id) {
        return res.json({ status: 'ok', ignored: true });
      }

      // Look up the original ledger via our pre-created payment row, or fall
      // back to fetching the order from Cashfree to read order_tags.ledgerId.
      const allPaymentsForLookup = await storage.getAllPayments();
      const matchingRow = allPaymentsForLookup.find((p) => p.razorpayOrderId === cf_order_id);
      let ledgerId: string | undefined = matchingRow?.ledgerId;

      if (!ledgerId) {
        try {
          const order = await cashfreeFetchOrder(cf_order_id);
          ledgerId = order?.order_tags?.ledgerId;
        } catch {
          /* fall through */
        }
      }
      if (!ledgerId) return res.json({ status: 'ok' });

      const ledger = await storage.getLedger(ledgerId);
      const property = ledger ? await storage.getProperty(ledger.propertyId) : null;
      if (!ledger || !property) return res.json({ status: 'ok' });

      const existingPayments = await storage.getPaymentsByLedger(ledgerId);

      // IDEMPOTENCY: if this cf_payment_id already recorded as SUCCESS, no-op.
      const alreadyProcessed = existingPayments.some(
        (p) => p.razorpayPaymentId === cf_payment_id && p.status === 'SUCCESS',
      );
      if (alreadyProcessed) return res.json({ status: 'ok', idempotent: true });

      const pendingPayment = existingPayments.find((p) => p.razorpayOrderId === cf_order_id);
      let amountPaid = 0;
      if (pendingPayment) {
        await storage.updatePayment(pendingPayment.id, {
          razorpayPaymentId: cf_payment_id,
          status: 'SUCCESS',
        });
        amountPaid = pendingPayment.amount;
      } else {
        // No pre-created payment row (e.g. /create-order flow). Insert a
        // SUCCESS row so totals reconcile. Cashfree amounts are in rupees.
        // The DB has a unique index on razorpay_payment_id — concurrent
        // duplicate webhook deliveries will fail the second insert; we catch
        // that and treat it as already-processed.
        amountPaid = Number(paymentInfo.payment_amount || orderInfo.order_amount || 0);
        try {
          await storage.createPayment({
            ledgerId,
            amount: amountPaid,
            razorpayOrderId: cf_order_id,
            razorpayPaymentId: cf_payment_id,
            paymentMethod: 'CASHFREE',
            status: 'SUCCESS',
          });
        } catch (e: any) {
          const code = e?.code || e?.cause?.code;
          if (code === '23505') {
            return res.json({ status: 'ok', idempotent: true });
          }
          throw e;
        }
      }

      const allPayments = await storage.getPaymentsByLedger(ledgerId);
      const totalCollected = allPayments
        .filter((p) => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);

      const isSettled = totalCollected >= property.monthlyRent;
      await storage.updateLedger(ledgerId, {
        amountCollected: totalCollected,
        status: isSettled ? 'SETTLED' : (ledger.amountAdvanced > 0 ? 'EXPOSED' : 'ARREARS'),
      });

      if (property.tenantId) {
        createNotification(
          property.tenantId,
          'Payment Received',
          `₹${amountPaid.toLocaleString('en-IN')} received for ${ledger.monthYear}. ${isSettled ? 'Rent fully settled!' : 'Partial payment recorded.'}`,
          'RENT_COLLECTED',
          '/tenant',
        ).catch(() => {});
      }
      if (property.ownerId) {
        createNotification(
          property.ownerId,
          'Tenant Payment',
          `Your tenant paid ₹${amountPaid.toLocaleString('en-IN')} for ${ledger.monthYear}.`,
          'RENT_COLLECTED',
          '/owner',
        ).catch(() => {});
      }

      res.json({ status: 'ok' });
    } catch (err: any) {
      console.error('Webhook processing error:', err?.message || err);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Verify Payment (fallback if webhook hasn't fired) — tenant calls this after
  // the Cashfree modal closes; we fetch the order's payments from Cashfree and
  // reconcile the ledger using the same logic as the webhook. Idempotent: the
  // unique index on razorpay_payment_id ensures we never double-count.
  app.post('/api/cashfree/verify/:orderId', isAuthenticated, async (req: any, res) => {
    const orderId = req.params.orderId as string;
    if (!cashfreeConfigured()) {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }
    try {
      const payments = await cashfreeFetchOrderPayments(orderId);
      const successPayment = payments.find((p) => p?.payment_status === 'SUCCESS');
      if (!successPayment) {
        return res.json({ status: 'pending', settled: false });
      }
      const cf_payment_id = successPayment.cf_payment_id?.toString?.() || successPayment.payment_id?.toString?.();
      const amount = Number(successPayment.payment_amount || 0);

      // Look up ledger via pre-created payment row, or via order_tags.
      const allRows = await storage.getAllPayments();
      const matching = allRows.find((p) => p.razorpayOrderId === orderId);
      let ledgerId: string | undefined = matching?.ledgerId;
      if (!ledgerId) {
        try {
          const order = await cashfreeFetchOrder(orderId);
          ledgerId = order?.order_tags?.ledgerId;
        } catch { /* ignore */ }
      }
      if (!ledgerId) return res.json({ status: 'ok', settled: false });

      const ledger = await storage.getLedger(ledgerId);
      const property = ledger ? await storage.getProperty(ledger.propertyId) : null;
      if (!ledger || !property) return res.json({ status: 'ok', settled: false });

      // Authorization: only the tenant on this property (or admin) may verify.
      const userId = req.user?.claims?.sub as string;
      const u = await authStorage.getUser(userId);
      const isAdmin = u?.role === 'ADMIN';
      const isTenant = property.tenantId === userId;
      if (!isAdmin && !isTenant) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const existingPayments = await storage.getPaymentsByLedger(ledgerId);
      const alreadyProcessed = existingPayments.some(
        (p) => p.razorpayPaymentId === cf_payment_id && p.status === 'SUCCESS',
      );

      if (!alreadyProcessed) {
        const pending = existingPayments.find((p) => p.razorpayOrderId === orderId);
        if (pending) {
          await storage.updatePayment(pending.id, {
            razorpayPaymentId: cf_payment_id,
            status: 'SUCCESS',
          });
        } else {
          try {
            await storage.createPayment({
              ledgerId,
              amount,
              razorpayOrderId: orderId,
              razorpayPaymentId: cf_payment_id,
              paymentMethod: 'CASHFREE',
              status: 'SUCCESS',
            });
          } catch (e: any) {
            // Unique-index race with the webhook: treat as already processed.
            if ((e?.code || e?.cause?.code) !== '23505') throw e;
          }
        }

        const refreshed = await storage.getPaymentsByLedger(ledgerId);
        const totalCollected = refreshed
          .filter((p) => p.status === 'SUCCESS')
          .reduce((sum, p) => sum + p.amount, 0);
        const isSettled = totalCollected >= property.monthlyRent;
        await storage.updateLedger(ledgerId, {
          amountCollected: totalCollected,
          status: isSettled ? 'SETTLED' : (ledger.amountAdvanced > 0 ? 'EXPOSED' : 'ARREARS'),
        });
      }

      const finalLedger = await storage.getLedger(ledgerId);
      const settled = (finalLedger?.amountCollected ?? 0) >= property.monthlyRent;
      return res.json({
        status: 'ok',
        settled,
        paymentId: cf_payment_id,
        amount,
      });
    } catch (err: any) {
      console.error('Cashfree verify failed:', err?.message || err);
      return res.status(502).json({ message: 'Failed to verify payment' });
    }
  });

  // Collect Rent (Manual/Testing - also updates ledger after successful payment)
  app.post(api.ledgers.collectRent.path, isAuthenticated, requireRole('ADMIN'), async (req, res) => {
    const id = req.params.id as string;
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

  // List all payments — scoped to caller. ADMIN sees all; OWNER/TENANT see only
  // payments for their own properties.
  app.get("/api/payments", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const u = await authStorage.getUser(userId);
    const all = await storage.getAllPayments();
    if (u?.role === "ADMIN") return res.json(all);

    // Build allowed ledger set for this user.
    const ledgers = await storage.getLedgers();
    const allowedLedgerIds = new Set(
      ledgers
        .filter((l) => l.property.ownerId === userId || l.property.tenantId === userId)
        .map((l) => l.id),
    );
    res.json(all.filter((p) => allowedLedgerIds.has(p.ledgerId)));
  });

  // Get payments for a ledger — must own/rent the property.
  app.get(api.payments.listByLedger.path, isAuthenticated, async (req: any, res) => {
    const { ledgerId } = req.params;
    const access = await requireLedgerAccess(req, res, String(ledgerId));
    if (!access) return;
    const payments = await storage.getPaymentsByLedger(String(ledgerId));
    res.json(payments);
  });

  // Create partial payment with Cashfree — only the tenant of the property may pay.
  app.post(api.payments.create.path, isAuthenticated, async (req: any, res) => {
    const { ledgerId } = req.params;
    const access = await requireLedgerAccess(req, res, ledgerId);
    if (!access) return;
    const { ledger, property, role } = access;
    if (role !== "TENANT" && role !== "ADMIN") {
      return res.status(403).json({ message: "Only the tenant of this property can pay rent" });
    }

    if (!cashfreeConfigured()) {
      return res.status(503).json({ message: "Payment gateway not configured" });
    }

    try {
      const input = api.payments.create.input.parse(req.body);

      // Bound amount: must be >0 and <= remaining due (avoid overpayment exploits).
      const existing = await storage.getPaymentsByLedger(ledgerId);
      const alreadyPaid = existing
        .filter((p) => p.status === "SUCCESS")
        .reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, property.monthlyRent - alreadyPaid);
      if (input.amount <= 0 || input.amount > remaining + 0) {
        return res.status(400).json({
          message: `Amount must be between 1 and ${remaining}`,
        });
      }

      const userId = req.user?.claims?.sub as string;
      const u = await authStorage.getUser(userId);
      const orderId = `partial_${ledgerId}_${Date.now()}`;
      const order = await cashfreeCreateOrder({
        order_id: orderId,
        order_amount: input.amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_email: u?.email || `tenant_${userId}@rentflo.app`,
          customer_phone: (u as any)?.phoneNumber || "9999999999",
          customer_name: (u as any)?.fullLegalName || u?.email || "Tenant",
        },
        order_meta: {
          notify_url: `${req.protocol}://${req.get("host")}/api/cashfree/webhook`,
        },
        order_note: `Partial rent for ${ledger.monthYear}`,
        order_tags: {
          ledgerId,
          propertyId: property.id,
          monthYear: ledger.monthYear,
          paymentType: 'partial',
        },
      });

      const payment = await storage.createPayment({
        ledgerId: ledgerId,
        amount: input.amount,
        razorpayOrderId: order.order_id,
        paymentMethod: 'CASHFREE',
        status: 'PENDING',
      });

      res.json({
        payment,
        orderId: order.order_id,
        paymentSessionId: order.payment_session_id,
        amount: input.amount,
        currency: 'INR',
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Partial payment order creation failed:', err?.message || err);
      return res.status(502).json({ message: 'Failed to create payment order' });
    }
  });

  // === MANUAL UPI PAYMENT VERIFICATION ===
  // Tenant submits proof (UTR + optional screenshot) after returning from their
  // UPI app. The payment is recorded in PENDING_VERIFICATION state — the ledger
  // is NOT credited until an admin verifies the UTR against the bank statement.
  app.post("/api/ledgers/:id/submit-payment-proof", isAuthenticated, async (req: any, res) => {
    const { id: ledgerId } = req.params;
    const access = await requireLedgerAccess(req, res, ledgerId);
    if (!access) return;
    const { property, role } = access;
    if (role !== "TENANT") {
      return res.status(403).json({ message: "Only the tenant can submit payment proof" });
    }

    let input;
    try {
      input = submitPaymentProofSchema.parse(req.body);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }

    // Bound amount: must not exceed remaining due across SUCCESS + PENDING_VERIFICATION.
    const existing = await storage.getPaymentsByLedger(ledgerId);
    const counted = existing
      .filter((p) => p.status === "SUCCESS" || p.status === "PENDING_VERIFICATION")
      .reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, property.monthlyRent - counted);
    if (input.amount > remaining) {
      return res.status(400).json({
        message: `Amount exceeds remaining due (₹${remaining})`,
      });
    }

    // Reject duplicate UTRs across the entire system (prevents reusing the same
    // reference number for multiple ledgers).
    const dupSearch = await storage.getAllPayments();
    const dup = dupSearch.find(
      (p) =>
        p.transactionRef &&
        p.transactionRef.toUpperCase() === input.transactionRef.toUpperCase() &&
        p.status !== "FAILED",
    );
    if (dup) {
      return res.status(409).json({ message: "This transaction reference has already been submitted" });
    }

    let payment;
    try {
      payment = await storage.createPayment({
        ledgerId,
        amount: input.amount,
        transactionRef: input.transactionRef.toUpperCase(),
        proofScreenshotUrl: input.proofScreenshotUrl || null,
        paymentMethod: "UPI_MANUAL",
        status: "PENDING_VERIFICATION",
      });
    } catch (e: any) {
      // Catches the partial unique index on transaction_ref (race-safe
      // duplicate guard at the DB layer).
      if (e?.code === "23505") {
        return res.status(409).json({ message: "This transaction reference has already been submitted" });
      }
      throw e;
    }

    // Notify all admins so they can verify quickly.
    const allUsers = await authStorage.getAllUsers();
    const admins = allUsers.filter((u: any) => u.role === "ADMIN");
    for (const admin of admins) {
      createNotification(
        admin.id,
        "Payment Awaiting Verification",
        `Tenant submitted UTR ${input.transactionRef.toUpperCase()} for ₹${input.amount.toLocaleString("en-IN")} — please verify.`,
        "RENT_COLLECTED",
        "/admin",
      ).catch(() => {});
    }

    res.json(payment);
  });

  // Admin: list all payments awaiting verification.
  app.get(
    "/api/admin/payments/pending-verification",
    isAuthenticated,
    requireRole("ADMIN"),
    async (_req, res) => {
      const list = await storage.getPendingVerificationPayments();
      res.json(list);
    },
  );

  // Admin: verify a payment (UTR confirmed against bank statement).
  app.post(
    "/api/payments/:id/verify",
    isAuthenticated,
    requireRole("ADMIN"),
    async (req: any, res) => {
      const adminId = req.user?.claims?.sub;
      try {
        const { payment, ledger } = await storage.verifyPayment(req.params.id, adminId);
        const property = await storage.getProperty(ledger.propertyId);

        // Notify tenant: payment confirmed.
        if (property?.tenantId) {
          createNotification(
            property.tenantId,
            "Payment Verified",
            `Your payment of ₹${payment.amount.toLocaleString("en-IN")} has been verified.`,
            "RENT_COLLECTED",
            "/tenant",
          ).catch(() => {});
        }
        // Notify owner.
        if (property?.ownerId) {
          createNotification(
            property.ownerId,
            "Tenant Payment Verified",
            `Your tenant's payment of ₹${payment.amount.toLocaleString("en-IN")} for ${ledger.monthYear} has been verified.`,
            "RENT_COLLECTED",
            "/owner",
          ).catch(() => {});
        }
        res.json({ payment, ledger });
      } catch (err: any) {
        const status = err?.status || 500;
        return res.status(status).json({ message: status === 500 ? "Internal Server Error" : err.message });
      }
    },
  );

  // Admin: reject a payment (UTR not found / mismatch).
  app.post(
    "/api/payments/:id/reject",
    isAuthenticated,
    requireRole("ADMIN"),
    async (req: any, res) => {
      const adminId = req.user?.claims?.sub;
      let parsed;
      try {
        parsed = verifyPaymentSchema.parse(req.body);
      } catch (err: any) {
        if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
        throw err;
      }
      const reason = parsed.rejectionReason || "Could not verify against bank statement";
      try {
        const updated = await storage.rejectPayment(req.params.id, adminId, reason);
        const ledger = await storage.getLedger(updated.ledgerId);
        const property = ledger ? await storage.getProperty(ledger.propertyId) : null;
        if (property?.tenantId) {
          createNotification(
            property.tenantId,
            "Payment Rejected",
            `Your payment of ₹${updated.amount.toLocaleString("en-IN")} could not be verified. Reason: ${reason}`,
            "RENT_COLLECTED",
            "/tenant",
          ).catch(() => {});
        }
        res.json(updated);
      } catch (err: any) {
        const status = err?.status || 500;
        return res.status(status).json({ message: status === 500 ? "Internal Server Error" : err.message });
      }
    },
  );


  // === MAINTENANCE TICKETS ===
  
  // List tickets — scoped. ADMIN sees all; non-admins see only their property tickets.
  app.get(api.tickets.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const u = await authStorage.getUser(userId);
    const { propertyId, status } = req.query;

    if (typeof propertyId === "string") {
      const access = await requirePropertyAccess(req, res, propertyId);
      if (!access) return;
      const tickets = await storage.getTickets(propertyId, typeof status === "string" ? status : undefined);
      return res.json(tickets);
    }

    const all = await storage.getTickets(undefined, typeof status === "string" ? status : undefined);
    if (u?.role === "ADMIN") return res.json(all);
    res.json(all.filter((t) => t.property.ownerId === userId || t.property.tenantId === userId));
  });

  // Create ticket — only the tenant of the property may create.
  app.post(api.tickets.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.tickets.create.input.parse(req.body);
      const userId = req.user?.claims?.sub;
      const access = await requirePropertyAccess(req, res, input.propertyId);
      if (!access) return;
      if (access.role !== "TENANT" && access.role !== "ADMIN") {
        return res.status(403).json({ message: "Only the tenant can report issues" });
      }
      // Force tenantId to authenticated user (don't trust client-supplied tenantId)
      input.tenantId = userId;
      const ticket = await storage.createTicket(input);

      // Notify all admins about new maintenance request
      const allUsers = await authStorage.getAllUsers();
      const admins = allUsers.filter((u: any) => u.role === 'ADMIN');
      for (const admin of admins) {
        createNotification(
          admin.id,
          "New Maintenance Request",
          `"${ticket.title}" reported for property ${ticket.propertyId.slice(0, 8)}…`,
          "MAINTENANCE_CREATED",
          "/admin/maintenance"
        ).catch(() => {});
      }

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
  app.post(api.tickets.resolve.path, isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const { id } = req.params;
    const ticket = await storage.getTicket(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updated = await storage.updateTicket(id, {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    });

    // Notify tenant their issue was resolved
    createNotification(
      ticket.tenantId,
      "Issue Resolved",
      `Your maintenance request "${ticket.title}" has been resolved.`,
      "MAINTENANCE_RESOLVED",
      "/tenant"
    ).catch(() => {});

    res.json(updated);
  });

  // Get ticket counts by property — must own/rent the property.
  app.get(api.tickets.countsByProperty.path, isAuthenticated, async (req: any, res) => {
    const { id } = req.params;
    const access = await requirePropertyAccess(req, res, id);
    if (!access) return;
    const counts = await storage.getTicketCountsByProperty(id);
    res.json(counts);
  });

  // === KYC ROUTES ===
  
  // Submit KYC documents — strictly validated, PII encrypted at rest.
  const kycSchema = z.object({
    fullLegalName: z.string().trim().min(2).max(100),
    panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid PAN format").optional().or(z.literal("")),
    aadhaarNumber: z.string().trim().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),
    kycDocumentUrl: z.string().max(2_000_000).optional().or(z.literal("")),
    bankAccountNumber: z.string().trim().regex(/^\d{9,18}$/, "Invalid bank account").optional().or(z.literal("")),
    ifscCode: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Invalid IFSC").optional().or(z.literal("")),
    cancelledChequeUrl: z.string().max(2_000_000).optional().or(z.literal("")),
  });

  app.post("/api/kyc/submit", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let input: z.infer<typeof kycSchema>;
    try {
      input = kycSchema.parse(req.body);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
    if (!input.panNumber && !input.aadhaarNumber) {
      return res.status(400).json({ message: 'Either PAN number or Aadhaar number is required' });
    }

    const updated = await authStorage.updateUser(userId, {
      fullLegalName: input.fullLegalName,
      panNumber: input.panNumber ? encryptPII(input.panNumber.toUpperCase()) : null,
      aadhaarNumber: input.aadhaarNumber ? encryptPII(input.aadhaarNumber) : null,
      kycDocumentUrl: input.kycDocumentUrl || null,
      bankAccountNumber: input.bankAccountNumber ? encryptPII(input.bankAccountNumber) : null,
      ifscCode: input.ifscCode ? input.ifscCode.toUpperCase() : null,
      cancelledChequeUrl: input.cancelledChequeUrl || null,
      isVerified: false,
    });

    // Never echo back raw PII even to the user — return masked.
    res.json(publicUser(updated));
  });

  // Get users pending KYC verification (Admin only) — PII masked.
  app.get("/api/kyc/pending", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const pendingUsers = await authStorage.getUsersPendingVerification();
    res.json(pendingUsers.map(publicUser));
  });

  // Verify user (Admin only).
  app.post("/api/kyc/verify/:userId", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const { userId } = req.params;
    const updated = await authStorage.updateUser(userId, { isVerified: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(publicUser(updated));
  });

  // === DIDIT E-KYC ===
  // Flow:
  //   1) Client POSTs /api/kyc/didit/start → server creates a Didit session
  //      bound to DIDIT_WORKFLOW_ID, stores the session_id on the user, and
  //      returns the hosted verification URL.
  //   2) Client opens that URL (full-page nav). Didit redirects back to our
  //      app on the configured callback once the user completes the flow.
  //   3) Client polls /api/kyc/didit/status. As soon as Didit reports an
  //      "Approved" decision, we capture full_name + last-4 of any document
  //      number returned, encrypt them, and flip isVerified=true.
  //   Webhook (/api/kyc/didit/webhook) is best-effort — we still re-fetch the
  //   decision before trusting any state change.
  app.post("/api/kyc/didit/start", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!diditConfigured()) {
      return res.status(503).json({ message: 'E-KYC provider not configured' });
    }
    try {
      const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || req.protocol;
      const host = (req.headers['x-forwarded-host'] as string)?.split(',')[0] || req.get('host');
      // Owners start KYC from the /verify page and should return there.
      // Tenants start from their dashboard and should return to /tenant.
      const me = await authStorage.getUser(userId);
      const returnPath = me?.role === 'OWNER' ? '/verify?kyc=didit' : '/tenant?kyc=didit';
      const callback = `${proto}://${host}${returnPath}`;
      console.log(`[didit] creating session for role=${me?.role} with callback=${callback}`);
      const session = await createDiditSession({
        callback,
        vendor_data: userId,
      });
      await authStorage.updateUser(userId, {
        diditSessionId: session.session_id,
      });
      return res.json({
        id: session.session_id,
        url: session.url,
        status: session.status,
      });
    } catch (err: any) {
      console.error('[didit] start failed:', err?.message || err);
      return res.status(502).json({ message: err?.message || 'Failed to start Didit session' });
    }
  });

  // Shared finalize: applied identically by `/status` polling and by webhook
  // re-fetches so a verified user always ends up with the same record shape
  // regardless of which path completes first.
  async function finalizeDiditKyc(user: any, decision: DiditDecision) {
    const idv = decision.id_verification || {};
    const name: string | undefined =
      (typeof idv.full_name === 'string' && idv.full_name) ||
      (typeof idv.first_name === 'string' && typeof idv.last_name === 'string'
        ? `${idv.first_name} ${idv.last_name}`.trim()
        : undefined) ||
      undefined;
    const docNumber: string | undefined = typeof idv.document_number === 'string'
      ? idv.document_number
      : undefined;
    const docLast4 = docNumber ? docNumber.replace(/\s+/g, '').slice(-4) : undefined;
    const docType = typeof idv.document_type === 'string' ? idv.document_type.toUpperCase() : '';
    const isAadhaar = docType.includes('AADHAAR') || docType.includes('AADHAR');
    const isPan = docType.includes('PAN');
    await authStorage.updateUser(user.id, {
      fullLegalName: name || user.fullLegalName || null,
      aadhaarNumber: isAadhaar && docLast4
        ? encryptPII(`XXXXXXXX${docLast4}`)
        : user.aadhaarNumber,
      panNumber: isPan && docLast4
        ? encryptPII(`XXXXXX${docLast4}`)
        : user.panNumber,
      isVerified: true,
      diditCompletedAt: new Date(),
    });
  }

  app.get("/api/kyc/didit/status", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!diditConfigured()) {
      return res.status(503).json({ message: 'E-KYC provider not configured' });
    }
    const me = await authStorage.getUser(userId);
    if (!me?.diditSessionId) {
      return res.json({ status: 'not_started', verified: false });
    }
    if (me.isVerified) {
      return res.json({ status: 'verified', verified: true });
    }
    try {
      const decision = await getDiditDecision(me.diditSessionId);
      const approved = DIDIT_APPROVED_STATUSES.has(decision.status);
      if (!approved) {
        return res.json({ status: decision.status, verified: false });
      }
      await finalizeDiditKyc(me, decision);
      return res.json({ status: 'verified', verified: true });
    } catch (err: any) {
      console.error('[didit] status check failed:', err?.message || err);
      return res.status(502).json({ message: err?.message || 'Failed to check Didit status' });
    }
  });

  // Webhook: Didit POSTs decision events here.
  // We treat the body as advisory — the actual verification flip is done by
  // re-fetching the decision via the API. BUT we still strictly enforce the
  // signature when DIDIT_WEBHOOK_SECRET is configured: an invalid signature
  // gets a 401 and we do nothing. (If the secret isn't configured at all, we
  // log a warning and accept the webhook as a passive ping — the re-fetch
  // step ensures we never trust the body itself for state changes.)
  app.post("/api/kyc/didit/webhook", async (req: any, res) => {
    try {
      const sig = (req.headers['x-signature'] || req.headers['x-didit-signature']) as string | undefined;
      const rawBody: Buffer | undefined = req.rawBody as Buffer | undefined;

      if (diditWebhookSecretConfigured()) {
        if (!rawBody || !sig || !verifyDiditWebhook(rawBody, sig)) {
          console.warn('[didit] webhook rejected — invalid or missing signature');
          return res.status(401).json({ message: 'Invalid signature' });
        }
      } else {
        console.warn('[didit] webhook accepted without signature verification — set DIDIT_WEBHOOK_SECRET to enforce');
      }

      const event = req.body || {};
      const sessionId: string | undefined = event.session_id || event.id;
      console.log(`[didit] webhook received session=${sessionId} status=${event.status}`);
      if (!sessionId) {
        return res.status(200).json({ ok: true });
      }
      const user = await authStorage.getUserByDiditSessionId(sessionId);
      if (user && !user.isVerified) {
        try {
          const decision = await getDiditDecision(sessionId);
          if (DIDIT_APPROVED_STATUSES.has(decision.status)) {
            await finalizeDiditKyc(user, decision);
          }
        } catch (e: any) {
          console.error('[didit] webhook re-fetch failed:', e?.message || e);
        }
      }
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('[didit] webhook error:', err?.message || err);
      return res.status(200).json({ ok: true });
    }
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

  // GET /api/agreements/all — admin: list all agreements enriched with property + party info
  app.get("/api/agreements/all", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const allAgreements = await storage.getAllAgreements();
    const enriched = await Promise.all(allAgreements.map(async (agr) => {
      const property = await storage.getProperty(agr.propertyId);
      const owner  = property?.ownerId  ? await authStorage.getUser(property.ownerId)  : null;
      const tenant = property?.tenantId ? await authStorage.getUser(property.tenantId) : null;
      return {
        ...agr,
        property: property ? { address: property.address, monthlyRent: property.monthlyRent } : null,
        owner:  owner  ? { firstName: owner.firstName,  lastName: owner.lastName,  email: owner.email  } : null,
        tenant: tenant ? { firstName: tenant.firstName, lastName: tenant.lastName, email: tenant.email } : null,
      };
    }));
    return res.json(enriched);
  });

  // POST /api/agreements/:propertyId/mark-signed — admin: mark agreement as FULLY_SIGNED
  app.post("/api/agreements/:propertyId/mark-signed", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const { propertyId } = req.params;
    const agreement = await storage.markAgreementSigned(propertyId);

    // Notify both parties
    const property = await storage.getProperty(propertyId);
    if (property) {
      const notifyUsers = [property.ownerId, property.tenantId].filter(Boolean) as string[];
      for (const uid of notifyUsers) {
        await createNotification(uid, {
          title: 'Agreement Signed',
          body: 'Your rental agreement has been confirmed as physically signed by RentFLO.',
          type: 'RENT_ADVANCED',
          url: '/agreement',
        }).catch(() => {});
      }
    }
    return res.json(agreement);
  });

  // Get all users (Admin only) — PII (PAN/Aadhaar/bank) returned masked.
  app.get("/api/users", isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    const users = await authStorage.getAllUsers();
    res.json(users.map(publicUser));
  });

  // === PUSH NOTIFICATION ROUTES ===

  // Get VAPID public key
  app.get("/api/push/vapid-key", (_req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  // Subscribe to push — strict validation; storage rejects hijack attempts.
  const pushSubSchema = z.object({
    endpoint: z.string().url().max(2000),
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  });
  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    let input: z.infer<typeof pushSubSchema>;
    try {
      input = pushSubSchema.parse(req.body);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
    try {
      await storage.savePushSubscription({ userId, ...input });
    } catch (err: any) {
      if (err?.status === 403) return res.status(403).json({ message: "Subscription endpoint conflict" });
      throw err;
    }
    res.json({ ok: true });
  });

  // Unsubscribe from push — only deletes the caller's own endpoint.
  app.post("/api/push/unsubscribe", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : null;
    if (endpoint && userId) await storage.deletePushSubscription(endpoint, userId);
    res.json({ ok: true });
  });

  // Consolidated badge counts — single request replaces separate unread-count polls
  app.get("/api/user/badge-counts", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const [notifications, messages] = await Promise.all([
      storage.getUnreadCount(userId),
      storage.getUnreadMessageCount(userId),
    ]);
    res.json({ notifications, messages });
  });

  // List notifications for current user
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const notifs = await storage.getNotifications(userId);
    res.json(notifs);
  });

  // Unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const count = await storage.getUnreadCount(userId);
    res.json({ count });
  });

  // Mark all notifications as read
  app.post("/api/notifications/read", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    await storage.markNotificationsRead(userId);
    res.json({ ok: true });
  });

  // Rent due reminder check — creates an in-app notification if rent is due within 3 days
  app.post("/api/notifications/rent-due-check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const userProperties = await storage.getPropertiesByTenantId(userId);
      if (!userProperties.length) return res.json({ created: false });

      const property = userProperties[0];
      const now = new Date();
      const payoutDay = property.payoutDay;

      // Calculate next due date
      let dueDate = new Date(now.getFullYear(), now.getMonth(), payoutDay);
      if (dueDate <= now) {
        dueDate = new Date(now.getFullYear(), now.getMonth() + 1, payoutDay);
      }
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue > 3) return res.json({ created: false, daysUntilDue });

      // Check if we already sent a reminder this month
      const existingNotifs = await storage.getNotifications(userId);
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const alreadySent = existingNotifs.some(
        n => n.type === "RENT_DUE" && n.createdAt && new Date(n.createdAt).toISOString().startsWith(thisMonthKey.replace("-", "-").slice(0, 7))
      );
      if (alreadySent) return res.json({ created: false, reason: "already_sent" });

      await storage.createNotification({
        userId,
        title: daysUntilDue <= 0 ? "Rent Due Today!" : `Rent Due in ${daysUntilDue} Day${daysUntilDue === 1 ? "" : "s"}`,
        body: `Your rent of ₹${property.monthlyRent.toLocaleString()} for ${property.address} is due on ${dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`,
        type: "RENT_DUE",
        url: "/tenant",
      });

      res.json({ created: true, daysUntilDue });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed Data — DEV ONLY. Never seed test users into a production DB.
  if (process.env.NODE_ENV !== "production" && process.env.SEED_DEV_DATA === "true") {
    await seedDatabase();
  }

  // Messaging
  registerMessagingRoutes(app);

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

// ── Messaging Routes ──────────────────────────────────────────────────────────
export function registerMessagingRoutes(app: Express) {
  // GET /api/messages/:propertyId — fetch all messages for a property
  app.get('/api/messages/:propertyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { propertyId } = req.params;
      const property = await storage.getProperty(propertyId);
      if (!property) return res.status(404).json({ message: 'Property not found' });

      // Only owner or tenant of this property may read
      if (property.ownerId !== userId && property.tenantId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const msgs = await storage.getMessages(propertyId);
      // Mark messages as read for this user
      await storage.markMessagesRead(propertyId, userId);
      res.json(msgs);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // POST /api/messages/:propertyId — send a message
  app.post('/api/messages/:propertyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { propertyId } = req.params;
      const property = await storage.getProperty(propertyId);
      if (!property) return res.status(404).json({ message: 'Property not found' });

      if (property.ownerId !== userId && property.tenantId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const body = (req.body.body || '').trim();
      if (!body) return res.status(400).json({ message: 'Message body is required' });
      if (body.length > 2000) return res.status(400).json({ message: 'Message too long' });

      const receiverId = property.ownerId === userId ? property.tenantId! : property.ownerId;
      if (!receiverId) return res.status(400).json({ message: 'No counterparty on this property yet' });

      const msg = await storage.sendMessage({ propertyId, senderId: userId, receiverId, body });

      // Notify receiver (fire-and-forget — does not block response)
      const senderRole = property.ownerId === userId ? 'owner' : 'tenant';
      const preview = body.length > 80 ? body.slice(0, 80) + '…' : body;
      createNotification(
        receiverId,
        "New Message",
        `Message from your ${senderRole}: ${preview}`,
        "MESSAGE_RECEIVED",
        "/messages"
      ).catch(() => {});

      res.status(201).json(msg);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // GET /api/messages/unread/count — unread count for badge
  app.get('/api/messages/unread/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (e) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // GET /api/admin/messages — all properties with active conversations (admin only)
  app.get('/api/admin/messages', isAuthenticated, requireRole('ADMIN'), async (_req, res) => {
    try {
      // Single query: get all messages joined with properties, then group in JS
      const { db } = await import("./db");
      const { messages: msgsTable, properties: propsTable } = await import("@shared/schema");
      const { eq: eqFn, desc: descFn } = await import("drizzle-orm");

      const rows = await db
        .select({ msg: msgsTable, property: propsTable })
        .from(msgsTable)
        .innerJoin(propsTable, eqFn(msgsTable.propertyId, propsTable.id))
        .orderBy(descFn(msgsTable.createdAt));

      // Group by propertyId
      const grouped = new Map<string, { property: typeof rows[0]['property']; msgs: typeof rows[0]['msg'][] }>();
      for (const { msg, property } of rows) {
        if (!grouped.has(property.id)) grouped.set(property.id, { property, msgs: [] });
        grouped.get(property.id)!.msgs.push(msg);
      }

      const conversations = Array.from(grouped.values()).map(({ property, msgs }) => ({
        property,
        messageCount: msgs.length,
        lastMessage: msgs[0] ?? null,
        unreadCount: msgs.filter(m => !m.read).length,
      }));

      res.json(conversations);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // GET /api/admin/messages/:propertyId — full thread for one property (admin only)
  app.get('/api/admin/messages/:propertyId', isAuthenticated, requireRole('ADMIN'), async (req, res) => {
    try {
      const propertyId = req.params.propertyId as string;
      const property = await storage.getProperty(propertyId);
      if (!property) return res.status(404).json({ message: 'Property not found' });
      const msgs = await storage.getMessages(propertyId);
      res.json({ property, messages: msgs });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // === AI CHATBOT ===
  let openai: OpenAI | null = null;
  function getOpenAI(): OpenAI {
    if (!openai) {
      if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }
      openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
    }
    return openai;
  }

  const chatSchema = z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string().min(1).max(4000),
        }),
      )
      .min(1)
      .max(20),
    userContext: z
      .object({
        role: z.string().max(50).optional(),
        name: z.string().max(100).optional(),
        property: z.string().max(500).optional(),
        monthlyRent: z.number().int().nonnegative().optional(),
      })
      .optional(),
  });

  app.post("/api/chatbot", isAuthenticated, async (req: any, res) => {
    try {
      let parsed: z.infer<typeof chatSchema>;
      try {
        parsed = chatSchema.parse(req.body);
      } catch (err: any) {
        if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
        throw err;
      }
      const { messages, userContext } = parsed;
      // Strip any client-supplied "system" messages — only our trusted prompt allowed.
      const safeMessages = messages.filter((m) => m.role !== "system");

      // Build context-aware system prompt
      const systemPrompt = `You are RentFLO Assistant, a helpful AI for the RentFLO rent-advance platform. You help landlords (owners) and tenants manage their rent, payments, KYC verification, maintenance tickets, and rental agreements.

User context:
- Role: ${userContext?.role || 'unknown'}
- Name: ${userContext?.name || 'User'}
${userContext?.property ? `- Property: ${userContext.property}` : ''}
${userContext?.monthlyRent ? `- Monthly Rent: ₹${userContext.monthlyRent.toLocaleString()}` : ''}

You can help with:
- Explaining rent advance status (ARREARS, EXPOSED, SETTLED)
- KYC verification process (PAN, Aadhaar, bank details)
- Payment and split payment questions
- Maintenance ticket status
- Rental agreement signing
- How to navigate the platform

Keep answers concise, friendly, and specific to rent/property management in India. Use ₹ for currency. If a question is unrelated to the platform or property management, politely redirect to relevant topics.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      const stream = await getOpenAI().chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...safeMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
        max_completion_tokens: 800,
      });

      // Abort upstream request if client disconnects (saves tokens + CPU)
      let clientGone = false;
      req.on("close", () => {
        clientGone = true;
        try { (stream as any).controller?.abort?.(); } catch {}
      });

      for await (const chunk of stream) {
        if (clientGone) break;
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      if (!clientGone) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (err: any) {
      console.error("Chatbot error:", err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Something went wrong." })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
}
