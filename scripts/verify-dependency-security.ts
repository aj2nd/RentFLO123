import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const { stdout } = await execFile("pnpm", ["audit", "--json"], {
  cwd: process.cwd(),
  maxBuffer: 2 * 1024 * 1024,
});
const audit = JSON.parse(stdout);
assert.deepEqual(audit.advisories, {}, "registry audit must report no remaining advisory records");
assert.deepEqual(audit.actions, [], "registry audit must not recommend remaining remediation actions");
assert.deepEqual(audit.metadata?.vulnerabilities, {
  info: 0,
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0,
}, "registry audit must report zero vulnerabilities at every severity");

const [manifest, workspace, lockfile] = await Promise.all([
  readFile("package.json", "utf8"),
  readFile("pnpm-workspace.yaml", "utf8"),
  readFile("pnpm-lock.yaml", "utf8"),
]);

for (const expected of [
  'esbuild: "0.28.2"',
  'fast-uri: "3.1.6"',
  'brace-expansion: "5.0.9"',
  'js-yaml: "4.3.1"',
]) {
  assert.ok(workspace.includes(expected), `security override missing: ${expected}`);
}
assert.match(manifest, /"@tanstack\/react-query": "\^5\.102\.2"/, "safe React Query patch update must be pinned in manifest");
assert.match(manifest, /"@replit\/vite-plugin-runtime-error-modal": "\^0\.0\.6"/, "safe development overlay update must be pinned in manifest");
assert.match(lockfile, /esbuild@0\.28\.2/, "lockfile must resolve patched esbuild");
assert.match(lockfile, /fast-uri@3\.1\.6/, "lockfile must resolve patched fast-uri");
assert.match(lockfile, /brace-expansion@5\.0\.9/, "lockfile must resolve patched brace-expansion");
assert.match(lockfile, /js-yaml@4\.3\.1/, "lockfile must resolve patched js-yaml");

console.log("Verified zero pnpm audit advisories, patched transitive security resolutions, and the two conservative direct dependency updates.");
