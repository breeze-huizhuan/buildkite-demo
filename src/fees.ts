// Placeholder rates for demo purposes only. Not real pricing.
export const RATES = {
  card: { percentBps: 290, fixedMinor: 30 },
  bank_transfer: { percentBps: 80, fixedMinor: 0 },
} as const;

export type PaymentMethod = keyof typeof RATES;

export interface FeeQuote {
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  method: PaymentMethod;
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && Object.hasOwn(RATES, value);
}

/** Quote the fee for an amount in minor units (e.g. cents). */
export function quoteFee(amountMinor: number, method: PaymentMethod): FeeQuote {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new RangeError("amountMinor must be a positive integer");
  }
  const rate = RATES[method];
  const feeMinor = Math.round((amountMinor * rate.percentBps) / 10_000) + rate.fixedMinor;
  return { amountMinor, feeMinor, netMinor: amountMinor - feeMinor, method };
}
