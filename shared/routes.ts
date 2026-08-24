import { z } from 'zod';
import { createPropertyRequestSchema, insertLedgerSchema, createMaintenanceTicketRequestSchema, properties, ledgers, payments, maintenanceTickets } from './schema';

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
      input: createPropertyRequestSchema,
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
        propertyId: z.string().uuid().optional(),
      }).strict().optional(),
      responses: {
        200: z.array(z.custom<typeof ledgers.$inferSelect & { property: typeof properties.$inferSelect }>()),
      },
    },
    // Admin manually marks owner as paid
    payOwner: {
      method: 'POST' as const,
      path: '/api/ledgers/:id/pay-owner',
      input: z.object({
        amountAdvanced: z.number().finite().int().positive().max(10_000_000),
        proofOfTransferUrl: z.string().trim().url().max(2048).refine((value) => /^https:/.test(value), "Proof URL must use HTTPS").optional().or(z.literal("")),
      }).strict(),
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
        amountCollected: z.number().finite().int().positive().max(10_000_000),
      }).strict(),
      responses: {
        200: z.custom<typeof ledgers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Create Cashfree order for tenant payment
    createOrder: {
      method: 'POST' as const,
      path: '/api/ledgers/:id/create-order',
      responses: {
        200: z.object({
          orderId: z.string(),
          paymentSessionId: z.string(),
          amount: z.number(),
          currency: z.string(),
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
  },
  payments: {
    listByLedger: {
      method: 'GET' as const,
      path: '/api/ledgers/:ledgerId/payments',
      responses: {
        200: z.array(z.custom<typeof payments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/ledgers/:ledgerId/payments',
      input: z.object({
        amount: z.number().finite().int().positive().max(10_000_000), // Amount in rupees
      }).strict(),
      responses: {
        200: z.object({
          payment: z.custom<typeof payments.$inferSelect>(),
          orderId: z.string(),
          paymentSessionId: z.string(),
          amount: z.number(),
          currency: z.string(),
        }),
        500: errorSchemas.internal,
      },
    },
  },
  tickets: {
    list: {
      method: 'GET' as const,
      path: '/api/tickets',
      responses: {
        200: z.array(z.custom<typeof maintenanceTickets.$inferSelect & { property: typeof properties.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tickets',
      input: createMaintenanceTicketRequestSchema,
      responses: {
        201: z.custom<typeof maintenanceTickets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    resolve: {
      method: 'POST' as const,
      path: '/api/tickets/:id/resolve',
      responses: {
        200: z.custom<typeof maintenanceTickets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    countsByProperty: {
      method: 'GET' as const,
      path: '/api/properties/:id/ticket-counts',
      responses: {
        200: z.object({
          open: z.number(),
          resolved: z.number(),
        }),
      },
    },
  },
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
