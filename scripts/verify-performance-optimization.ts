import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const app = readFileSync(path.join(root, "client/src/App.tsx"), "utf8");
const html = readFileSync(path.join(root, "client/index.html"), "utf8");

const lazyRoutes = [
  "AdminDashboard", "AdminMaintenance", "AdminMessages", "OwnerImageDashboard",
  "TenantDashboard", "Ledger", "Verify", "AgreementPage", "Messages",
  "Maintenance", "ProfilePage", "NotificationsPage", "LandingPage",
];

for (const component of lazyRoutes) {
  assert.match(app, new RegExp(`const ${component} = lazy\\(`), `${component} must remain route-lazy`);
}

assert.match(app, /<Suspense fallback=\{<LoadingScreen\s*\/>\}>/, "routes must use a loading fallback");
assert.doesNotMatch(app, /import AdminDashboard from/, "admin dashboard must not be in the entry bundle");
assert.doesNotMatch(html, /Noto\+Sans\+Devanagari|Noto\+Sans\+Kannada/, "unused language font families must not block first load");
assert.match(html, /rentflo-header-wordmark\.png/, "HTML splash must use the lightweight shared wordmark");
assert.doesNotMatch(html, /<img src="\/logo-icon\.png"/, "HTML splash must not request the old 600 KB logo icon");

console.log("Performance optimization verification passed.");
