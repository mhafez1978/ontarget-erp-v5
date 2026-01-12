import { db } from "@/lib/db";
import { resolve } from "path";
import { access, constants } from "fs/promises";

/**
 * Check if cold storage is configured and return config
 * Handles Docker environment by converting relative paths to absolute /var/storage/cold
 */
export async function getStorageConfig(): Promise<{
  configured: boolean;
  provider: string;
  basePath: string;
} | null> {
  const globalStorage = await db.storageProvider.findFirst({
    where: {
      scope: "GLOBAL",
      isActive: true,
      isConnected: true,
    },
  });

  if (!globalStorage) {
    return null;
  }

  const config = JSON.parse(globalStorage.config || "{}");

  // Use absolute path /var/storage/cold in production (Docker), or relative path for dev
  let basePath = config.path || "../var/storage/cold";
  if (globalStorage.provider === "LOCAL") {
    // If path is relative and starts with ../, try resolving to the repo-relative path first (good for local dev).
    // If that path does not exist or is not writable, fall back to the Docker-friendly absolute path /var/storage/cold.
    if (basePath.startsWith("../var/storage")) {
      try {
        // Prefer resolving relative to the current project when running locally.
        // Try two candidates: the original parent-relative path and a repo-local path
        const candidate1 = resolve(process.cwd(), basePath); // ../var/storage/cold -> parent/var/storage/cold
        const candidate2 = resolve(
          process.cwd(),
          basePath.replace(/^\.\.(\/)?/, "")
        ); // var/storage/cold inside repo

        let chosen: string | null = null;

        try {
          await access(candidate1, constants.W_OK);
          chosen = candidate1;
          console.log(
            `[getStorageConfig] Using candidate1 path: ${candidate1}`
          );
        } catch (e) {
          // candidate1 not available
        }

        if (!chosen) {
          try {
            await access(candidate2, constants.W_OK);
            chosen = candidate2;
            console.log(
              `[getStorageConfig] Using candidate2 path: ${candidate2}`
            );
          } catch (e) {
            // candidate2 not available
          }
        }

        if (chosen) {
          basePath = chosen;
        } else {
          // Fallback to the Docker absolute path
          console.warn(
            `[getStorageConfig] Neither candidate path exists/writable (candidate1=${candidate1}, candidate2=${candidate2}). Falling back to /var/storage/cold`
          );
          basePath = "/var/storage/cold";
        }
      } catch (err) {
        // In case of any unexpected error, use the safe Docker path
        console.error(
          "[getStorageConfig] Error while resolving storage path:",
          err
        );
        basePath = "/var/storage/cold";
      }
    }
  } else {
    basePath = "";
  }

  return {
    configured: true,
    provider: globalStorage.provider,
    basePath,
  };
}
