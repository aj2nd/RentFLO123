import { z } from 'zod';
import { insertPropertySchema, insertLedgerSchema, properties, ledgers } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  properties: {
    list: {
      method: 'GET' as const,
      path: '/api/properties',
      responses: {
        200: z.array(z.custom<typeof properties.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties',
      input: insertPropertySchema,
      responses: {
        201: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/properties/:id',
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ledgers: {
    list: {
      method: 'GET' as const,
      path: '/api/ledgers', // Can filter by status, propertyId via query params
      input: z.object({
        status: z.enum(['ARREARS', 'SETTLED', 'EXPOSED']).optional(),
        propertyId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof ledgers.$inferSelect & { property: typeof properties.$inferSelect }>()),
      },
    },
    // Admin manually marks owner as paid
    payOwner: {
      method: 'POST' as const,
      path: '/api/ledgers/:id/pay-owner',
      input: z.object({
        amountAdvanced: z.number(),
        proofOfTransferUrl: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof ledgers.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    // Tenant pays rent (or webhook)
    collectRent: {
      method: 'POST' as const,
      path: '/api/ledgers/:id/collect-rent',
      input: z.object({
        amountCollected: z.number(),
      }),
      responses: {
        200: z.custom<typeof ledgers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Create Razorpay order for tenant payment
    createOrder: {
      method: 'POST' as const,
      path: '/api/ledgers/:id/create-order',
      responses: {
        200: z.object({
          orderId: z.string(),
          amount: z.number(),
          currency: z.string(),
          keyId: z.string(),
        }),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    }
  },
  admin: {
    dashboard: {
        method: 'GET' as const,
        path: '/api/admin/dashboard',
        responses: {
            200: z.object({
                totalAdvanced: z.number(),
                totalCollected: z.number(),
                pendingPayouts: z.number(),
                activeProperties: z.number()
            })
        }
    }
  }
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type PropertyInput = z.infer<typeof api.properties.create.input>;
export type LedgerListResponse = z.infer<typeof api.ledgers.list.responses[200]>;
export type PayOwnerInput = z.infer<typeof api.ledgers.payOwner.input>;
export type CollectRentInput = z.infer<typeof api.ledgers.collectRent.input>;
