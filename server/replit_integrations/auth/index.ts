import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { signAuthToken, verifyAuthToken } from "./token";
import { pool } from "../../db";

const ANDROID_DEEP_LINK = "rentflo://auth/callback";

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

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
    // Default prune interval is every 60 s, which opens an extra DB connection
    // on each cycle and contributes to pool exhaustion during request bursts.
    // Pruning hourly is sufficient for a 30-day session TTL.
    pruneSessionInterval: 60 * 60, // seconds — prune once per hour
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
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

  app.get("/api/login", (req, res, next) => {
    const isAndroid = req.query.platform === "android";

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
        if (isAndroid) {
          const deepLink = androidRedirect(user);
          if (deepLink) return res.redirect(deepLink);
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    });
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.status(204).end();
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Bearer-token auth (Android app — sessions don't cross WebView/Chrome boundary)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const claims = verifyAuthToken(token);
    if (!claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Shape req.user the way the session path does so downstream routes
    // (req.user.claims.sub etc.) work without branching.
    (req as any).user = {
      claims: { sub: claims.sub, email: claims.email, exp: claims.exp },
    };
    return next();
  }

  // Session-based auth (web)
  const user = req.user as any;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
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
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
export { registerAuthRoutes } from "./routes";
