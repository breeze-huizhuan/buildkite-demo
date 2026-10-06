import { describe, expect, it } from "vitest";
import { isPaymentMethod, quoteFee } from "../src/fees.js";

describe("quoteFee", () => {
  it("applies percent + fixed fee for cards", () => {
    expect(quoteFee(10_000, "card")).toEqual({
      amountMinor: 10_000,
      feeMinor: 320,
      netMinor: 9_680,
      method: "card",
    });
  });

  it("applies percent-only fee for bank transfers", () => {
    expect(quoteFee(10_000, "bank_transfer").feeMinor).toBe(80);
  });

  it("rounds to the nearest minor unit", () => {
    expect(quoteFee(1_005, "bank_transfer").feeMinor).toBe(8);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects invalid amount %s", (amount) => {
    expect(() => quoteFee(amount, "card")).toThrow(RangeError);
  });
});

describe("isPaymentMethod", () => {
  it("accepts known methods only", () => {
    expect(isPaymentMethod("card")).toBe(true);
    expect(isPaymentMethod("crypto")).toBe(false);
    expect(isPaymentMethod("toString")).toBe(false);
    expect(isPaymentMethod(42)).toBe(false);
  });
});
