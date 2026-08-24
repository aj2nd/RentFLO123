import { readFile, writeFile } from "node:fs/promises";

const routes = JSON.parse(await readFile("/home/ubuntu/rentflo-server-route-inventory.json", "utf8"));
const sourceFiles = new Map();
for (const route of routes.filter((entry) => entry.path.includes(":") || entry.path.includes(".path"))) {
  if (!sourceFiles.has(route.file)) {
    sourceFiles.set(route.file, await readFile(`/home/ubuntu/RentFLO123/${route.file}`, "utf8"));
  }
}

const report = routes
  .filter((route) => route.path.includes(":"))
  .map((route) => {
    const source = sourceFiles.get(route.file);
    const lines = source.split("\n");
    const excerpt = lines.slice(route.line - 1, route.line + 90).join("\n");
    return {
      ...route,
      hasAdminGuard: /requireRole\(['"]ADMIN/.test(excerpt) || /requireLegacyConversationAdmin/.test(excerpt),
      hasPropertyOwnership: /requirePropertyAccess|property\.ownerId !== userId|property\.tenantId !== userId/.test(excerpt),
      hasLedgerOwnership: /requireLedgerAccess/.test(excerpt),
      hasCurrentUserBinding: /req\.user\?\.claims\?\.sub|req\.user\.claims\.sub/.test(excerpt),
    };
  });

await writeFile("/home/ubuntu/rentflo-idor-route-inventory.json", JSON.stringify(report, null, 2) + "\n");
console.log(`Inventoried ${report.length} ID-parameterized route declarations.`);
