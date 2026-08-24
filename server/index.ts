// Must be first import: db.ts and other modules read process.env at
// module-load time, so dotenv has to populate the env before they resolve.
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool, connectWithRetry } from "./db";

const app = express();
const httpServer = createServer(app);

// Railway forwards requests through a single trusted reverse proxy. Configure
// this before every limiter so req.ip is the originating client, not Railway.
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://sdk.cashfree.com", "https://*.cashfree.com"],
        styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc:         ["'self'", "data:", "blob:", "https:"],
        fontSrc:        ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc:     ["'self'", "https://*.cashfree.com", "https://*.didit.me", "https://api.leegality.com", "wss:", "ws:"],
        frameSrc:       ["'self'", "https://*.cashfree.com", "https://*.didit.me", "https://verify.didit.me", "https://*.leegality.com"],
        objectSrc:      ["'none'"],
        baseUri:        ["'self'"],
        formAction:     ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
); 
// ── CORS for Capacitor Android app ──────────────────────────────────────────
// The Android WebView origin is https://localhost (Capacitor 4+) or
// capacitor://localhost (older); http://localhost is the dev fallback. The
// web SPA is served same-origin so it doesn't need CORS — only allow the
// native/dev origins here, scoped to /api/*.
const CAPACITOR_ORIGINS = new Set([
  "https://localhost",
  "capacitor://localhost",
  "http://localhost",
]);

app.use("/api", (req, res, next) => {
  const origin = req.headers.origin;
  const isCapacitor = !!origin && CAPACITOR_ORIGINS.has(origin);
  if (isCapacitor) {
    res.setHeader("Access-Control-Allow-Origin", origin!);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
  }
  next();
});

// ── Rate Limiters ───────────────────────────────────────────────────────────

// Global API limiter: 240 requests per 15 minutes per originating IP.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
  skip: (req) => !req.path.startsWith("/api"),
});

// Authentication starts may redirect to a provider and are much stricter than
// general API traffic. RentFLO has no local signup or password-reset route:
// Google OIDC owns those flows.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});

const oauthCallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication callbacks. Please try again later." },
});

const accountDiscoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many account lookups. Please try again later." },
});

// Sensitive action limiter (KYC, payments): 12 per 15 minutes per IP.
// Didit status polling is intentionally exempted — it's polled every 3s
// from the client and has its own dedicated, polling-friendly limiter below.
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests for this action. Please try again later." },
  skip: (req) => req.originalUrl.split("?")[0] === "/api/kyc/didit/status",
});

// Polling limiter for Didit status — generous because the client polls
// every 3s for up to 36s (~12 calls) per verification attempt.
const diditPollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many status checks. Please slow down." },
});

// AI/expensive resource limiter (chatbot): network-level backstop. A stricter
// authenticated per-account cap is applied immediately before OpenAI work.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

// Cashfree order and verification requests make provider calls. They receive
// a network-level limit here plus a per-account limit at the route handler.
const paymentProviderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment-provider requests. Please try again later." },
});

// A Didit session creation request contacts the external KYC provider. Polling
// has its own separate policy above to preserve the expected verification UI.
const diditStartLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification starts. Please try again later." },
});

// Webhook limiter (Cashfree) — high enough for legit traffic, low enough to deter abuse
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests." },
});

app.use(globalLimiter);
app.use("/api/login", loginLimiter);
app.use("/api/auth/google/callback", oauthCallbackLimiter);
app.use("/api/auth/user-by-email", accountDiscoveryLimiter);
app.use("/api/kyc/didit/status", diditPollLimiter);
app.use("/api/kyc/didit/start", diditStartLimiter);
app.use("/api/kyc", sensitiveLimiter);
app.use("/api/payments", sensitiveLimiter);
app.use("/api/advances", sensitiveLimiter);
app.use("/api/ledgers", sensitiveLimiter);
app.use("/api/ledgers/:ledgerId/payments", paymentProviderLimiter);
app.use("/api/cashfree/verify", paymentProviderLimiter);
app.use("/api/agreements/leegality/send", sensitiveLimiter);
app.use("/api/agreements/leegality/webhook", webhookLimiter);
app.use("/api/agreements", sensitiveLimiter);
app.use("/api/push", sensitiveLimiter);
app.use("/api/notifications/rent-due-check", sensitiveLimiter);
app.use("/api/chatbot", aiLimiter);
app.use("/api/cashfree/webhook", webhookLimiter);
app.use("/api/kyc/didit/webhook", webhookLimiter);

// ── Body Parsing (with size limits) ─────────────────────────────────────────
app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "2mb" }));

// ── Public account-deletion page ────────────────────────────────────────────
// Required by Google Play Store "Data Deletion URL" field. Must be a
// publicly crawlable URL that explains how users can request account and
// data deletion — including users who never installed the app. Rendered
// inline so Google's policy crawler sees the content on first paint
// instead of an empty SPA shell.
const DELETE_ACCOUNT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index, follow">
<title>Delete Your Account — RentFLO</title>
<meta name="description" content="Request deletion of your RentFLO account and personal data.">
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0F0F0F;color:#E5E5E5;line-height:1.6;-webkit-font-smoothing:antialiased}
  .wrap{max-width:720px;margin:0 auto;padding:48px 24px}
  h1{font-size:32px;margin:0 0 8px;color:#fff;letter-spacing:-0.02em}
  h2{font-size:20px;margin:32px 0 12px;color:#fff;letter-spacing:-0.01em}
  p,li{font-size:16px;color:#B5B5B5}
  ol,ul{padding-left:20px}
  li{margin:6px 0}
  a{color:#6FFFE9;text-decoration:none}
  a:hover{text-decoration:underline}
  .lede{font-size:18px;color:#D4D4D4;margin-bottom:32px}
  .card{background:#1A1A1A;border:1px solid #2A2A2A;padding:24px;margin:16px 0}
  .label{font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#6FFFE9;margin-bottom:4px}
  footer{margin-top:48px;padding-top:24px;border-top:1px solid #2A2A2A;font-size:14px;color:#777}
</style>
</head>
<body>
<div class="wrap">
  <h1>Delete Your RentFLO Account</h1>
  <p class="lede">You can permanently delete your RentFLO account and the personal data associated with it. Here's how.</p>

  <h2>If you have the app installed</h2>
  <ol>
    <li>Open the RentFLO app and sign in.</li>
    <li>Go to <strong>Profile</strong>.</li>
    <li>Tap <strong>Delete Account</strong> and confirm.</li>
  </ol>
  <p>Your account is removed from our active systems immediately and you will be signed out.</p>

  <h2>If you cannot access the app</h2>
  <p>Email us from the address registered to your account:</p>
  <div class="card">
    <div class="label">Send to</div>
    <a href="mailto:help@rentflo.in?subject=Account%20Deletion%20Request">help@rentflo.in</a>
    <div class="label" style="margin-top:16px">Subject</div>
    <div>Account Deletion Request</div>
    <div class="label" style="margin-top:16px">Include</div>
    <div>Your registered email and a brief confirmation that you wish to delete your account.</div>
  </div>
  <p>We will verify your identity, action your request within 7 business days, and confirm completion by email.</p>

  <h2>What gets deleted</h2>
  <ul>
    <li>Your profile (name, email, phone, address)</li>
    <li>KYC documents and identity verification records held by RentFLO</li>
    <li>Property details, tenant/landlord relationships, and ledger entries linked to your account</li>
    <li>Maintenance tickets, messages, and notifications</li>
    <li>Push subscriptions and session data</li>
  </ul>

  <h2>What is retained, and why</h2>
  <p>Some records must be retained to meet legal and regulatory obligations under Indian law:</p>
  <ul>
    <li><strong>Transaction records</strong> (rent advances, repayments, GST invoices) — retained for up to 8 years under the Income Tax Act, 1961 and applicable RBI guidelines.</li>
    <li><strong>KYC records</strong> — retained for a minimum of 5 years after the last transaction under the Prevention of Money Laundering Act, 2002.</li>
    <li><strong>Signed agreements</strong> processed by our e-signature partner are retained as required by the Indian Evidence Act and Information Technology Act.</li>
  </ul>
  <p>Retained records are anonymized where possible and cannot be linked to your active profile after deletion.</p>

  <h2>Third-party processors</h2>
  <p>RentFLO shares limited data with the processors below. Deletion requests are forwarded to each processor with which your data was shared:</p>
  <ul>
    <li><strong>Cashfree Payments</strong> — payment processing</li>
    <li><strong>Didit</strong> — identity verification (KYC)</li>
    <li><strong>Leegality</strong> — digital signatures and agreement storage</li>
    <li><strong>Google</strong> — OAuth sign-in (no additional data shared beyond the OAuth token)</li>
  </ul>
  <p>Processor retention is governed by their own policies and applicable law; please refer to their privacy policies for details.</p>

  <h2>Questions</h2>
  <p>Contact our Grievance Officer at <a href="mailto:help@rentflo.in">help@rentflo.in</a>. We respond within 30 days as required under the Digital Personal Data Protection Act, 2023.</p>

  <footer>
    &copy; 2026 RentFLO Technologies Pvt. Ltd. &nbsp;·&nbsp;
    <a href="/privacy">Privacy Policy</a> &nbsp;·&nbsp;
    <a href="/terms">Terms of Service</a>
  </footer>
</div>
</body>
</html>`;

app.get(["/delete-account", "/delete-account.html"], (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.type("html").send(DELETE_ACCOUNT_HTML);
});

// ── API Cache-Control ────────────────────────────────────────────────────────
// Prevent browsers and intermediate caches from storing sensitive API responses.
// Static assets are handled separately by serveStatic with long-lived headers.
app.use("/api", (_req, res, next) => {
  // no-store: browser and all intermediate caches must not store the response.
  // Pragma: no-cache covers HTTP/1.0 proxies that don't understand Cache-Control.
  // Vary: Cookie: tells shared proxy caches that the response differs per
  // session cookie — prevents User A's response from being served to User B.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");
  next();
});

// ── Request Logging (no sensitive response bodies) ───────────────────────────
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const SENSITIVE_PATHS = ["/api/auth/user", "/api/kyc", "/api/payments", "/api/advances"];

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const isSensitive = SENSITIVE_PATHS.some((p) => path.startsWith(p));
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms${isSensitive ? "" : ""}`;
      log(logLine);
    }
  });

  next();
});

// ── Graceful shutdown & process resilience ───────────────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  // Don't exit — let Railway restart if it becomes truly unrecoverable
});

async function shutdown() {
  log("shutting down...");
  httpServer.close();
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

(async () => {
  // ── Health check (no DB needed — must respond before routes are registered) ─
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // ── API routes + session/auth (DB-dependent) ─────────────────────────────
  // connectWithRetry probes the pool up to 5×(3 s apart) so the session store
  // isn't set up against a DB that isn't ready yet (avoids FATAL: 57P03).
  // Wrapped in try-catch so any remaining failure only disables API routes —
  // the health check and SPA continue to serve.
  try {
    await connectWithRetry();
    await registerRoutes(httpServer, app);
  } catch (err) {
    console.error("[startup] Failed to initialize routes/database — API routes may be unavailable:", err);
  }

  // ── Static / SPA serving ─────────────────────────────────────────────────
  // Always attempted, even when DB init failed above.
  if (process.env.NODE_ENV === "production") {
    try {
      serveStatic(app);
    } catch (err) {
      console.error("[startup] serveStatic failed:", err);
    }
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ── Global error handler (must be last middleware) ────────────────────────
  // Logs the full error object so Railway shows the complete stack trace.
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    console.error(err); // full stack visible in Railway logs

    const status = err.status || err.statusCode || 500;

    // Never leak internal error details to clients
    const message =
      status < 500
        ? err.message || "Bad Request"
        : "Internal Server Error";

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
