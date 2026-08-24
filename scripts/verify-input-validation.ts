import assert from "node:assert/strict";
import { createServer } from "node:http";
import express from "express";
import { z } from "zod";
import { createPropertyRequestSchema } from "../shared/schema";
import {
  emptyBodySchema,
  idParamsSchema,
  sanitizedText,
  sanitizeRequestBody,
  upiQrQuerySchema,
  validateRequest,
} from "../server/input-validation";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/api", sanitizeRequestBody);

app.get("/api/resources/:id", validateRequest({ params: idParamsSchema, query: upiQrQuerySchema }), (_req, res) => {
  res.status(204).end();
});
app.post("/api/empty", validateRequest({ body: emptyBodySchema }), (_req, res) => {
  res.status(204).end();
});
app.post("/api/text", validateRequest({ body: z.object({ text: sanitizedText(1, 100) }).strict() }), (req, res) => {
  res.json(req.body);
});
app.post("/api/cashfree/webhook", (req, res) => {
  res.json(req.body);
});

const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not start validation verification server");
const baseUrl = `http://127.0.0.1:${address.port}`;

async function request(path: string, init: RequestInit) {
  return fetch(`${baseUrl}${path}`, init);
}

try {
  assert.equal(createPropertyRequestSchema.safeParse({
    address: "1 Test Street",
    monthlyRent: 10000,
    payoutDay: 5,
    role: "ADMIN",
  }).success, false, "property requests must reject privileged unknown fields");

  assert.equal((await request("/api/resources/not-a-uuid?data=upi%3A%2F%2Fpay%3Fpa%3Da%40b", { method: "GET" })).status, 400,
    "malformed route parameters must be rejected");
  assert.equal((await request("/api/resources/7aa2c8b5-89fa-4ad5-a24a-5b0b9cf2b23f?data=x&unexpected=1", { method: "GET" })).status, 400,
    "unknown query fields must be rejected");
  assert.equal((await request("/api/empty", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "SUCCESS" }),
  })).status, 400, "bodyless mutations must reject unexpected fields");

  const sanitized = await request("/api/text", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: '<img src=x onerror="alert(1)">Safe text' }),
  });
  assert.equal(sanitized.status, 200, "sanitized text request should remain valid");
  assert.equal((await sanitized.json()).text, "Safe text", "HTML must be removed before route use");

  const webhook = await request("/api/cashfree/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ marker: "<signed-payload>" }),
  });
  assert.equal((await webhook.json()).marker, "<signed-payload>", "signed webhook bodies must not be mutated before signature verification");

  console.log("Verified strict server input validation, query and parameter rejection, sanitization, and signed-webhook preservation.");
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
