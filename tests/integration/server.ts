import { spawn, ChildProcess } from "child_process";
import http from "http";

let proc: ChildProcess | null = null;
const PORT = 4010;

function waitForReady(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, (res) => {
          // Any HTTP status means server is up
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error("Server did not start in time"));
          } else {
            setTimeout(tryOnce, 500);
          }
        });
    };
    tryOnce();
  });
}

export async function startNext(): Promise<void> {
  if (proc) return;
  proc = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "dev", "-p", String(PORT)],
    {
      env: { ...process.env },
      stdio: "inherit",
    }
  );

  await waitForReady(`http://localhost:${PORT}/api/get-location`);
}

export async function stopNext(): Promise<void> {
  if (!proc) return;
  proc.kill();
  proc = null;
}

export const baseUrl = `http://localhost:${PORT}`;
