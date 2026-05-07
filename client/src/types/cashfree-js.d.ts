declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeMode = "sandbox" | "production";

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal" | "_top";
    returnUrl?: string;
  }

  export interface CashfreeCheckoutResult {
    error?: { code?: string; message?: string; type?: string };
    redirect?: boolean;
    paymentDetails?: {
      paymentMessage?: string;
      paymentId?: string;
      [k: string]: unknown;
    };
  }

  export interface Cashfree {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }

  export function load(opts: { mode: CashfreeMode }): Promise<Cashfree>;
}
