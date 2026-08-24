import type { RequestHandler } from "express";
import { z } from "zod";
import xss from "xss";

const signedWebhookPaths = new Set([
  "/api/cashfree/webhook",
  "/api/kyc/didit/webhook",
]);

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
};

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return xss(value, xssOptions);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)]));
  }
  return value;
}

// Sanitization is deliberately skipped for signed provider webhooks. Their raw
// payload must be verified before parsing, and webhook data is separately
// schema-checked after the signature check in the handler.
export const sanitizeRequestBody: RequestHandler = (req, _res, next) => {
  const requestPath = req.originalUrl.split("?")[0];
  if (!signedWebhookPaths.has(requestPath) && req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};

type RequestSchemas = Partial<Record<"body" | "params" | "query", z.ZodTypeAny>>;

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, res, next) => {
    for (const [source, schema] of Object.entries(schemas) as Array<[keyof RequestSchemas, z.ZodTypeAny]>) {
      const candidate = source === "body" && req.body === undefined ? {} : req[source];
      const parsed = schema.safeParse(candidate);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return res.status(400).json({
          message: issue?.message || `Invalid ${source}`,
          field: issue?.path.join("."),
        });
      }
      if (source === "query") {
        res.locals.validatedQuery = parsed.data;
      } else {
        (req as any)[source] = parsed.data;
      }
    }
    next();
  };
}

export const resourceIdSchema = z.string().uuid("Invalid resource identifier");
export const idParamsSchema = z.object({ id: resourceIdSchema }).strict();
export const propertyIdParamsSchema = z.object({ propertyId: resourceIdSchema }).strict();
export const ledgerIdParamsSchema = z.object({ ledgerId: resourceIdSchema }).strict();
export const paymentIdParamsSchema = z.object({ id: resourceIdSchema }).strict();
export const userIdParamsSchema = z.object({ userId: resourceIdSchema }).strict();
export const ticketIdParamsSchema = z.object({ id: resourceIdSchema }).strict();
export const orderIdParamsSchema = z.object({
  orderId: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/, "Invalid payment order identifier"),
}).strict();

export const emailQuerySchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254),
}).strict();
export const upiQrQuerySchema = z.object({
  data: z.string().min(1).max(2048),
}).strict();
export const loginQuerySchema = z.object({
  platform: z.literal("android").optional(),
}).strict();
export const ledgerQuerySchema = z.object({
  propertyId: resourceIdSchema.optional(),
  status: z.enum(["ARREARS", "SETTLED", "EXPOSED"]).optional(),
}).strict();
export const ticketQuerySchema = z.object({
  propertyId: resourceIdSchema.optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
}).strict();
export const emptyBodySchema = z.object({}).strict();

export const documentParamsSchema = z.object({
  userId: resourceIdSchema,
  documentType: z.enum(["kyc", "cheque"]),
}).strict();

export const conversationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(2_147_483_647),
}).strict();

export const sanitizedText = (min: number, max: number) => z.string()
  .max(max)
  .transform((value) => xss(value.trim(), xssOptions).trim())
  .pipe(z.string().min(min).max(max));

export const bearerTokenSchema = z.string()
  .max(4096)
  .regex(/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "Invalid authorization header");
