import Fastify from "fastify";
import { isPaymentMethod, quoteFee, RATES } from "./fees.js";

interface QuoteBody {
  amountMinor: number;
  method: string;
}

export function buildApp() {
  const app = Fastify({
    logger: false,
    // Reject bad input instead of silently coercing types or stripping fields.
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.post<{ Body: QuoteBody }>(
    "/fees/quote",
    {
      schema: {
        body: {
          type: "object",
          required: ["amountMinor", "method"],
          additionalProperties: false,
          properties: {
            amountMinor: { type: "integer", minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
            method: { type: "string", enum: Object.keys(RATES) },
          },
        },
      },
    },
    async (request, reply) => {
      const { amountMinor, method } = request.body;
      if (!isPaymentMethod(method)) {
        return reply.code(400).send({ error: "unsupported method" });
      }
      return quoteFee(amountMinor, method);
    },
  );

  return app;
}
