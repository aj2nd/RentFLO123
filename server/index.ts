import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const httpServer = createServer(app);

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
// CORS for Capacitor mobile app
app.use((req, res, next) => {
  const allowedOrigins = ['https://localhost', 'capacitor://localhost', 'http://localhost'];
  const origin = req.headers.origin as string | undefined;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Rate Limiters ───────────────────────────────────────────────────────────

// Global API limiter: 300 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
  skip: (req) => !req.path.startsWith("/api"),
});

// Auth/login limiter: 30 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});

// Sensitive action limiter (KYC, payments): 20 per 15 minutes per IP.
// Didit status polling is intentionally exempted — it's polled every 3s
// from the client and has its own dedicated, polling-friendly limiter below.
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests for this action. Please try again later." },
  skip: (req) => req.path === "/api/kyc/didit/status",
});

// Polling limiter for Didit status — generous because the client polls
// every 3s for up to 36s (~12 calls) per verification attempt.
const diditPollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many status checks. Please slow down." },
});

// AI/expensive resource limiter (chatbot)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
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
app.use("/api/login", authLimiter);
app.use("/api/callback", authLimiter);
app.use("/api/auth/set-role", authLimiter);
app.use("/api/auth/user-by-email", authLimiter);
app.use("/api/kyc/didit/status", diditPollLimiter);
app.use("/api/kyc", sensitiveLimiter);
app.use("/api/payments", sensitiveLimiter);
app.use("/api/advances", sensitiveLimiter);
app.use("/api/ledgers", sensitiveLimiter);
app.use("/api/agreements/leegality/send", sensitiveLimiter);
app.use("/api/agreements/leegality/webhook", webhookLimiter);
app.use("/api/agreements", sensitiveLimiter);
app.use("/api/push", sensitiveLimiter);
app.use("/api/notifications/rent-due-check", sensitiveLimiter);
app.use("/api/chatbot", aiLimiter);
app.use("/api/cashfree/webhook", webhookLimiter);

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

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Never leak internal error details to clients
    const message =
      status < 500
        ? err.message || "Bad Request"
        : "Internal Server Error";

    if (status >= 500) {
      console.error("Server error:", err.message, err.stack?.split("\n")[1] || "");
    }

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

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
