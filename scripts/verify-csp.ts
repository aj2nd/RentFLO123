import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [html, server] = await Promise.all([
  readFile("client/index.html", "utf8"),
  readFile("server/index.ts", "utf8"),
]);

const executableScriptHashes = [...html.matchAll(/<script(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/script>/gi)]
  .filter((match) => !/\bsrc\s*=|application\/ld\+json/i.test(match.groups?.attributes ?? ""))
  .map((match) => `'sha256-${createHash("sha256").update(match.groups?.body ?? "", "utf8").digest("base64")}'`);

assert.equal(executableScriptHashes.length, 2, "expected exactly two executable static inline scripts");
for (const hash of executableScriptHashes) {
  assert.ok(server.includes(hash), `CSP must authorize inline script hash ${hash}`);
}

const cspBlock = server.slice(server.indexOf("contentSecurityPolicy:"), server.indexOf("crossOriginEmbedderPolicy:"));
assert.match(cspBlock, /defaultSrc:\s*\["'self'"\]/);
assert.match(cspBlock, /objectSrc:\s*\["'none'"\]/);
assert.match(cspBlock, /baseUri:\s*\["'self'"\]/);
assert.match(cspBlock, /frameAncestors:\s*\["'none'"\]/);
assert.match(cspBlock, /reportUri:\s*\[CSP_REPORT_ENDPOINT\]/);
assert.match(cspBlock, /"report-to":\s*\["csp"\]/);
const scriptSrc = cspBlock.match(/scriptSrc:\s*\[([^\]]+)\]/)?.[1] ?? "";
assert.doesNotMatch(scriptSrc, /'unsafe-eval'|'unsafe-inline'/, "script CSP must not permit broad inline or eval execution");

assert.match(server, /app\.post\(\s*CSP_REPORT_ENDPOINT/);
assert.match(server, /limit:\s*"32kb"/);
assert.match(server, /const cspReportLimiter[\s\S]*?max:\s*20/);
assert.match(server, /Reporting-Endpoints/);
assert.match(server, /Report-To/);

console.log("Verified CSP directives, exact inline-script hashes, modern/legacy report headers, and bounded report collection.");
