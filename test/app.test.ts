import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

const app = buildApp();
afterAll(() => app.close());

describe("routes", () => {
  it("GET /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("POST /fees/quote returns a quote", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/fees/quote",
      payload: { amountMinor: 10_000, method: "card" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ feeMinor: 320, netMinor: 9_680 });
  });

  it.each([
    { amountMinor: 0, method: "card" },
    { amountMinor: 100, method: "crypto" },
    { amountMinor: "100", method: "card", extra: true },
    { method: "card" },
  ])("POST /fees/quote rejects %j", async (payload) => {
    const res = await app.inject({ method: "POST", url: "/fees/quote", payload });
    expect(res.statusCode).toBe(400);
  });
});
