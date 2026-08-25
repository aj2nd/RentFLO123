type PropertyPriceSource = { monthlyRent: number };
type PaymentAmount = { amount: number; status: string };

const DEFAULT_PAYOUT_FEE_BPS = 500;

export function payoutFeeBasisPoints(): number {
  const configured = Number(process.env.RENTFLO_PAYOUT_FEE_BPS ?? DEFAULT_PAYOUT_FEE_BPS);
  return Number.isInteger(configured) && configured >= 0 && configured <= 10_000
    ? configured
    : DEFAULT_PAYOUT_FEE_BPS;
}

export function outstandingRent(property: PropertyPriceSource, payments: PaymentAmount[]): number {
  const successfulPaid = payments
    .filter((payment) => payment.status === "SUCCESS")
    .reduce((total, payment) => total + payment.amount, 0);
  return Math.max(0, property.monthlyRent - successfulPaid);
}

export function ownerPayout(property: PropertyPriceSource): number {
  return Math.floor(property.monthlyRent * (10_000 - payoutFeeBasisPoints()) / 10_000);
}
