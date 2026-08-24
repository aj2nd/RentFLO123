import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, Request, RequestHandler, Response } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { bearerTokenSchema, emptyBodySchema, loginQuerySchema, validateRequest } from "../../input-validation";
import { signAuthToken, verifyAuthToken } from "./token";
import { pool } from "../../db";
import { decryptPII, encryptPII } from "../../security";
import { encryptLegacySensitiveUsers } from "../../migrations/encrypt-sensitive-users";

const ANDROID_DEEP_LINK = "rentflo://auth/callback";
// A dedicated name prevents an invalid session from a prior deployment or
// SESSION_SECRET from being reused after a production migration.
const SESSION_COOKIE_NAME = "__Host-rentflo.sid";
const LEGACY_SESSION_COOKIE_NAME = "rentflo.sid";
const SESSION_ENVELOPE_KEY = "__rentflo_encrypted_session";
// Web sessions are deliberately short-lived and fixed-duration. A user must
// sign in again after seven days, even if an OAuth refresh occurs meanwhile.
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// connect-pg-simple expects its fallback TTL in seconds, not milliseconds.
const SESSION_TTL_SECONDS = SESSION_MAX_AGE_MS / 1000;
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

function clearSessionCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  // Clear names issued by older releases while users naturally migrate to the
  // host-only cookie above. The legacy cookie never grants a new session.
  res.clearCookie(LEGACY_SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  res.clearCookie("connect.sid", SESSION_COOKIE_OPTIONS);
}

function rejectExpiredSession(req: Request, res: Response) {
  req.session?.destroy(() => undefined);
  clearSessionCookies(res);
  return res.status(401).json({ message: "Session expired. Please sign in again." });
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL("https://accounts.google.com"),
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    );
  },
  { maxAge: 3600 * 1000 }
);

async function ensureSessionStoreTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    );
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sessions_pkey'
      ) THEN
        ALTER TABLE "sessions"
          ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid");
      END IF;
    END $$;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "IDX_sessions_expire"
      ON "sessions" ("expire");
  `);
}

export function getSession() {
  const pgStore = connectPg(session);
  class EncryptedPgStore extends pgStore {
    get(sid: string, callback: (error: any, stored?: any) => void) {
      return super.get(sid, (error: any, stored: any) => {
        if (error || !stored) return callback(error, stored);
        const envelope = stored[SESSION_ENVELOPE_KEY];
        if (typeof envelope === "string") {
          try {
            const decrypted = decryptPII(envelope);
            if (!decrypted) throw new Error("Unable to decrypt session");
            return callback(null, JSON.parse(decrypted));
          } catch {
            return this.destroy(sid, () => callback(null));
          }
        }

        // Existing readable sessions are rewritten encrypted on their next use.
        return this.set(sid, stored, (saveError: any) => callback(saveError, stored));
      });
    }

    set(sid: string, stored: any, callback?: (error?: any) => void) {
      const encrypted = encryptPII(JSON.stringify(stored));
      return super.set(sid, { [SESSION_ENVELOPE_KEY]: encrypted } as any, callback);
    }
  }

  const sessionStore = new EncryptedPgStore({
    pool: pool as any,
    // The server creates this table explicitly before middleware setup so the
    // production bundle never needs connect-pg-simple's external table.sql.
    createTableIfMissing: false,
    ttl: SESSION_TTL_SECONDS,
    tableName: "sessions",
    // Default prune interval is every 60 s, which opens an extra DB connection
    // on each cycle and contributes to pool exhaustion during request bursts.
    // Pruning hourly is sufficient for the fixed seven-day session lifetime.
    pruneSessionInterval: 60 * 60, // seconds — prune once per hour
  });
  return session({
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_MS,
    },
    // Never extend the browser cookie just because an authenticated request
    // occurred; the server also enforces the fixed session-issued timestamp.
    rolling: false,
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["given_name"] || claims["first_name"],
    lastName: claims["family_name"] || claims["last_name"],
    profileImageUrl: claims["picture"] || claims["profile_image_url"],
  });
}

function androidRedirect(user: any): string | null {
  const sub = user?.claims?.sub;
  const email = user?.claims?.email;
  if (!sub) return null;
  const token = signAuthToken({ sub, email });
  return `${ANDROID_DEEP_LINK}?token=${encodeURIComponent(token)}`;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  await ensureSessionStoreTable();
  await encryptLegacySensitiveUsers();
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const strategyName = "google";
  const strategy = new Strategy(
    {
      name: strategyName,
      config,
      scope: "openid email profile",
      callbackURL: `https://rentflo.in/api/auth/google/callback`,
    },
    verify
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", validateRequest({ query: loginQuerySchema }), (req, res, next) => {
    const isAndroid = res.locals.validatedQuery.platform === "android";

    if (req.isAuthenticated()) {
      if (isAndroid) {
        const deepLink = androidRedirect(req.user);
        if (deepLink) return res.redirect(deepLink);
      }
      return res.redirect("/");
    }

    // Persist platform on the session so the OAuth callback knows where to send
    // the user back. The session cookie travels with the user through the
    // Google redirect (it lives on rentflo.in), so this flag is intact when the
    // callback fires. Save synchronously before the redirect or the Postgres
    // write may lose the race against the 302 response.
    (req.session as any).androidAuth = isAndroid;
    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      passport.authenticate("google", {
        scope: ["openid", "email", "profile"],
      })(req, res, next);
    });
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err: any, user: any) => {
      if (err || !user) return res.redirect("/api/login");
      req.logIn(user, (loginErr: any) => {
        if (loginErr) return res.redirect("/api/login");
        const isAndroid = (req.session as any).androidAuth === true;
        (req.session as any).androidAuth = false;
        // This stamp is server-side session data, not a browser-readable token.
        // It caps a web login even if the user continues to make requests.
        (req.session as any).authIssuedAt = Date.now();
        req.session.cookie.maxAge = SESSION_MAX_AGE_MS;
        // Passport mutates the session asynchronously. Save it before the
        // redirect so Railway has persisted the logged-in user before the SPA
        // immediately asks /api/auth/user for its identity.
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          if (isAndroid) {
            const deepLink = androidRedirect(user);
            if (deepLink) return res.redirect(deepLink);
          }
          return res.redirect("/");
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        clearSessionCookies(res);
        res.redirect("/");
      });
    });
  });

  app.post("/api/logout", validateRequest({ body: emptyBodySchema }), (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        clearSessionCookies(res);
        res.status(204).end();
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const attachVerifiedAccount = async (userId: string) => {
    const account = await authStorage.getUser(userId);
    if (!account) return null;
    (req as any).currentUser = account;
    return account;
  };

  // Bearer-token auth (Android app — sessions don't cross WebView/Chrome boundary)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const header = bearerTokenSchema.safeParse(authHeader);
    if (!header.success) return res.status(401).json({ message: "Unauthorized" });
    const token = header.data.slice(7);
    const claims = verifyAuthToken(token);
    if (!claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Shape req.user the way the session path does so downstream routes
    // (req.user.claims.sub etc.) work without branching.
    (req as any).user = {
      claims: { sub: claims.sub, email: claims.email, exp: claims.exp },
    };
    if (!(await attachVerifiedAccount(claims.sub))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }

  // Session-based auth (web)
  const user = req.user as any;
  const userId = user?.claims?.sub;
  const issuedAt = Number((req.session as any)?.authIssuedAt);
  const nowMs = Date.now();
  const hasValidSessionWindow = Number.isFinite(issuedAt)
    && issuedAt > 0
    && issuedAt <= nowMs + 60_000
    && nowMs - issuedAt <= SESSION_MAX_AGE_MS;
  if (!req.isAuthenticated() || !userId || !user.expires_at || !hasValidSessionWindow) {
    if (req.isAuthenticated()) return rejectExpiredSession(req, res);
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    if (!(await attachVerifiedAccount(userId))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    if (!(await attachVerifiedAccount(userId))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  } catch (error) {
    return rejectExpiredSession(req, res);
  }
};
export { registerAuthRoutes } from "./routes";
