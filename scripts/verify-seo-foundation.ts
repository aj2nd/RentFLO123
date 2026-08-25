import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const html = readFileSync(path.join(root, "client/index.html"), "utf8");
const robots = readFileSync(path.join(root, "client/public/robots.txt"), "utf8");
const sitemap = readFileSync(path.join(root, "client/public/sitemap.xml"), "utf8");
const staticServer = readFileSync(path.join(root, "server/static.ts"), "utf8");

assert.match(html, /<link rel="canonical" href="https:\/\/rentflo\.in\/" \/>/);
assert.match(html, /<meta property="og:url" content="https:\/\/rentflo\.in\/" \/>/);
assert.match(html, /"@type":"Organization"/);
assert.match(html, /"@type":"WebSite"/);
assert.doesNotMatch(html, /SearchAction/);
assert.match(robots, /Sitemap: https:\/\/rentflo\.in\/sitemap\.xml/);
assert.match(sitemap, /<loc>https:\/\/rentflo\.in\/<\/loc>/);
assert.match(staticServer, /X-Robots-Tag", "noindex, nofollow, noarchive/);

console.log("SEO foundation verification passed.");
