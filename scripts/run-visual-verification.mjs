#!/usr/bin/env node

import { spawn } from "child_process";
import net from "net";
import process from "process";
import { fileURLToPath } from "url";
import { dirname, resolve as resolvePath } from "path";
import { runVisualRegression } from "../test-comprehensive.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRONTEND_PORT = Number(process.env.LCMDESIGNER_PORT ?? 1420);
const FRONTEND_HOST = process.env.LCMDESIGNER_HOST ?? "127.0.0.1";
const SCREENSHOT_DIR = resolvePath(__dirname, "../test-screenshots");

async function waitForPort(port, host, timeoutMs = 20000, pollInterval = 500) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect({ port, host }, () => {
        socket.end();
        resolve();
      });

      socket.on("error", (error) => {
        socket.destroy();
        if (Date.now() - start >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port} (${error.message})`));
          return;
        }
        setTimeout(tryConnect, pollInterval);
      });
    };

    tryConnect();
  });
}

async function ensureDevServer() {
  try {
    await waitForPort(FRONTEND_PORT, FRONTEND_HOST, 1000, 200);
    console.log(`ℹ️  Reusing existing dev server at http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
    return { process: null, reused: true };
  } catch {
    // No server yet, spawn a new one
  }

  console.log("▶️  Starting frontend dev server...");
  const child = spawn(
    "npm",
    ["--prefix", "frontend", "run", "dev", "--", "--host", FRONTEND_HOST, "--port", String(FRONTEND_PORT)],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        BROWSER: "none"
      }
    }
  );

  const stopServer = () => {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  };

  process.on("exit", stopServer);
  process.on("SIGINT", () => {
    stopServer();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    stopServer();
    process.exit(143);
  });

  try {
    await waitForPort(FRONTEND_PORT, FRONTEND_HOST, 20000, 400);
    console.log(`✅ Frontend ready at http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
    return { process: child, reused: false, stopServer };
  } catch (error) {
    stopServer();
    throw error;
  }
}

async function main() {
  const { process: devProcess, reused, stopServer } = await ensureDevServer();
  const baseUrl = `http://${FRONTEND_HOST}:${FRONTEND_PORT}/app/projects/proj-2`;

  try {
    await runVisualRegression({
      baseUrl,
      screenshotDir: SCREENSHOT_DIR
    });
  } finally {
    if (!reused && devProcess) {
      console.log("🛑 Stopping dev server...");
      stopServer?.();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

main().catch((error) => {
  console.error("❌ Visual verification failed:", error.message);
  process.exitCode = 1;
});
