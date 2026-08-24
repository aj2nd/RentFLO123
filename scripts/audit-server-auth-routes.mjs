import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = "/home/ubuntu/RentFLO123/server";

async function listTs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listTs(path) : entry.name.endsWith(".ts") ? [path] : [];
  }));
  return nested.flat();
}

const routePattern = /app\.(get|post|put|patch|delete)\(\s*(["'`][^"'`]+["'`]|[\w.]+)[\s\S]{0,900}?\{[\s\S]{0,120}?/g;
const files = await listTs(root);
const routes = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(routePattern)) {
    const snippet = match[0];
    const line = source.slice(0, match.index).split("\n").length;
    routes.push({
      file: relative("/home/ubuntu/RentFLO123", file),
      line,
      method: match[1].toUpperCase(),
      path: match[2],
      hasIsAuthenticated: /\bisAuthenticated\b/.test(snippet),
      hasRoleGuard: /\brequireRole\b/.test(snippet),
      hasPropertyGuard: /\brequirePropertyAccess\b/.test(snippet),
      hasLedgerGuard: /\brequireLedgerAccess\b/.test(snippet),
    });
  }
}

routes.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
await writeFile("/home/ubuntu/rentflo-server-route-inventory.json", JSON.stringify(routes, null, 2) + "\n");
console.log(`Inventoried ${routes.length} route declarations.`);
