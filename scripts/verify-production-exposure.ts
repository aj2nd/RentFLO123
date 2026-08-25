import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import express from "express";
import { blockProductionArtifactMiddleware, isBlockedProductionArtifactPath } from "../server/production-exposure";

for (const candidate of ["/.git/HEAD", "/.git/config", "/assets/app.js.map", "/assets/app.js.map.gz", "/.env", "/.env.production", "/@vite/client", "/vite.config.ts"]) {
  assert.equal(isBlockedProductionArtifactPath(candidate), true, `${candidate} must be blocked in production`);
}
assert.equal(isBlockedProductionArtifactPath("/assets/app.js"), false, "normal hashed client assets must remain servable");
assert.equal(isBlockedProductionArtifactPath("/.well-known/assetlinks.json"), false, "Android App Links path must remain servable");

const app = express();
app.disable("x-powered-by");
app.use(blockProductionArtifactMiddleware);
app.use((_req, res) => res.status(204).end());
const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to bind production-exposure test server.");
const origin = `http://127.0.0.1:${address.port}`;
try {
  for (const candidate of ["/.git/HEAD", "/assets/app.js.map", "/.env", "/@vite/client"]) {
    const response = await fetch(`${origin}${candidate}`);
    assert.equal(response.status, 404, `${candidate} must return a real 404, not a SPA fallback response`);
    assert.equal(response.headers.get("cache-control"), "no-store", `${candidate} must not be cached`);
    assert.equal(response.headers.get("x-powered-by"), null, "Express implementation header must be disabled");
  }
  assert.equal((await fetch(`${origin}/assets/app.js`)).status, 204, "non-sensitive assets must pass through");
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
}

const distFiles = await walk("dist");
assert.equal(distFiles.some((file) => file.endsWith(".map")), false, "production dist must not contain source-map files");
assert.equal(distFiles.some((file) => file.split(path.sep).includes(".git")), false, "production dist must not contain Git metadata");
for (const file of distFiles.filter((file) => /\.(?:js|cjs|css)$/.test(file))) {
  const content = await readFile(file, "utf8");
  assert.doesNotMatch(content, /sourceMappingURL=/, `${file} must not reference a public source map`);
}

const [viteConfig, buildScript, index, staticServer] = await Promise.all([
  readFile("vite.config.ts", "utf8"),
  readFile("script/build.ts", "utf8"),
  readFile("server/index.ts", "utf8"),
  readFile("server/static.ts", "utf8"),
]);
assert.match(viteConfig, /sourcemap: false/, "Vite production builds must explicitly disable source maps");
assert.match(viteConfig, /!isProduction \? \[runtimeErrorOverlay\(\)\] : \[\]/, "runtime error overlay must be development-only");
assert.match(buildScript, /sourcemap: false/, "server bundle must explicitly disable source maps");
assert.match(buildScript, /process\.env\.NODE_ENV": '"production"'/, "server bundle must compile with production mode");
assert.match(index, /app\.disable\("x-powered-by"\)/, "production responses must not disclose Express implementation details");
assert.match(staticServer, /blockProductionArtifactMiddleware/, "sensitive artifact paths must be blocked before static and SPA fallback handlers");

console.log("Verified production mode, disabled debug overlay, source-map-free build output, blocked Git/environment/Vite paths, and removed Express implementation disclosure.");
