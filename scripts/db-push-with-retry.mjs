import { spawn } from "node:child_process";

const attempts = Number(process.env.DB_PUSH_ATTEMPTS ?? 6);
const delayMs = Number(process.env.DB_PUSH_RETRY_DELAY_MS ?? 10_000);
const timeoutMs = Number(process.env.DB_PUSH_TIMEOUT_MS ?? 90_000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runPush() {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["exec", "drizzle-kit", "push", "--config", "drizzle.config.ts"], {
      stdio: "inherit",
      env: process.env,
    });

    const timer = setTimeout(() => {
      console.error(`[db:push] Timed out after ${timeoutMs}ms; terminating this attempt.`);
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      console.error(`[db:push] Could not start drizzle-kit: ${error.message}`);
      resolve(1);
    });

    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  console.log(`[db:push] Attempt ${attempt}/${attempts}`);
  const exitCode = await runPush();

  if (exitCode === 0) {
    console.log("[db:push] Schema synchronized successfully.");
    process.exit(0);
  }

  if (attempt < attempts) {
    console.warn(`[db:push] Attempt failed with exit code ${exitCode}; retrying in ${delayMs}ms.`);
    await sleep(delayMs);
  } else {
    console.error("[db:push] All attempts failed; refusing to complete the deployment.");
    process.exit(exitCode || 1);
  }
}
