import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { safeHttpsUrl, safeImageSource, safeInternalPath } from "../client/src/lib/safe-url";

(globalThis as any).window = { location: { origin: "https://rentflo.in" } };

assert.equal(safeInternalPath("/messages?thread=owner#latest"), "/messages?thread=owner#latest");
assert.equal(safeInternalPath("javascript:alert(1)"), null);
assert.equal(safeInternalPath("//attacker.example"), null);
assert.equal(safeInternalPath("/safe\\path"), null);

assert.equal(safeHttpsUrl("https://verification.didit.me/session/123", "didit.me"), "https://verification.didit.me/session/123");
assert.equal(safeHttpsUrl("https://attacker.example", "didit.me"), null);
assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
assert.equal(safeHttpsUrl("https://user:pass@example.com"), null);

assert.ok(safeImageSource("https://cdn.example.com/proof.png"));
assert.ok(safeImageSource("data:image/png;base64,aGVsbG8="));
assert.equal(safeImageSource("data:image/svg+xml;base64,PHN2Zz4="), null);
assert.equal(safeImageSource("javascript:alert(1)"), null);

const clientSources = await Promise.all([
  "client/src/components/ReceiptModal.tsx",
  "client/src/pages/Agreement.tsx",
  "client/src/components/ui/chart.tsx",
].map((path) => readFile(path, "utf8")));
const forbidden = /dangerouslySetInnerHTML|\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/;
assert.equal(clientSources.some((source) => forbidden.test(source)), false, "raw HTML injection APIs must not remain in client render paths");

const notificationSource = await readFile("client/src/pages/Notifications.tsx", "utf8");
const workerSource = await readFile("client/public/sw.js", "utf8");
const pushSource = await readFile("server/push.ts", "utf8");
assert.match(notificationSource, /safeInternalPath\(notif\.url\)/);
assert.match(workerSource, /candidate\.startsWith\("\/"\)/);
assert.match(pushSource, /safeInternalPath\(url\)/);

console.log("Verified XSS-safe rendering, raw HTML API removal, and URL/image navigation guards.");
