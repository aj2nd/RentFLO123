import helmet from "helmet";

export function createRentfloSecurityHeaders(options: {
  production: boolean;
  cspReportEndpoint: string;
  inlineScriptHashes: string[];
}) {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...options.inlineScriptHashes, "https://sdk.cashfree.com", "https://*.cashfree.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://*.cashfree.com", "https://*.didit.me", "https://api.leegality.com", "wss:", ...(options.production ? [] : ["ws:"])],
        frameSrc: ["'self'", "https://*.cashfree.com", "https://*.didit.me", "https://verify.didit.me", "https://*.leegality.com"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        mediaSrc: ["'self'", "data:", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        reportUri: [options.cspReportEndpoint],
        "report-to": ["csp"],
      },
    },
    // Cross-origin embedding would break third-party KYC/payment frames, so it
    // remains disabled. The explicit opener/resource policies preserve the
    // same-origin isolation that the live app already used.
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    strictTransportSecurity: options.production ? { maxAge: 31_536_000, includeSubDomains: true } : false,
  });
}
