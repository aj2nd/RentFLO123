import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoots = ["client", "server", "shared", "scripts"];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

async function collectSourceFiles(relativeDirectory: string): Promise<string[]> {
  const directory = path.join(root, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(relativePath);
    return sourceExtensions.has(path.extname(entry.name)) ? [relativePath] : [];
  }));
  return files.flat();
}

const sourceFiles = (await Promise.all(sourceRoots.map(collectSourceFiles)))
  .flat()
  .filter((relativePath) => relativePath !== "scripts/verify-password-security.ts");
const sourceContents = await Promise.all(sourceFiles.map(async (relativePath) => ({
  relativePath,
  content: await readFile(path.join(root, relativePath), "utf8"),
})));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const authIndex = await readFile(path.join(root, "server/replit_integrations/auth/index.ts"), "utf8");
const userModel = await readFile(path.join(root, "shared/models/auth.ts"), "utf8");
const authStorage = await readFile(path.join(root, "server/replit_integrations/auth/storage.ts"), "utf8");

for (const file of sourceContents) {
  if (/\b(password|passwd)\b/i.test(file.content)) {
    throw new Error(`Unexpected password-handling code or text found in ${file.relativePath}`);
  }
  if (/console\.(?:log|info|warn|error)\([^\n]*(?:req\.body|JSON\.stringify\(req\.body)/.test(file.content)) {
    throw new Error(`Potential raw request-body logging found in ${file.relativePath}`);
  }
}

for (const dependencyName of ["passport-local", "@types/passport-local", "bcrypt", "bcryptjs", "argon2"]) {
  if (packageJson.dependencies?.[dependencyName] || packageJson.devDependencies?.[dependencyName]) {
    throw new Error(`Unexpected local-password dependency declared: ${dependencyName}`);
  }
}

if (!authIndex.includes('new URL("https://accounts.google.com")') || !authIndex.includes('scope: "openid email profile"')) {
  throw new Error("Google OpenID Connect provider configuration is missing.");
}

if (/\bpassword\b/i.test(userModel) || /\bpassword\b/i.test(authStorage)) {
  throw new Error("A user password field or password persistence path exists in the application model.");
}

console.log(`Verified Google OIDC-only authentication, no local password field or password logging path, and no local-password dependency across ${sourceFiles.length} source files.`);
