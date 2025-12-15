import { db } from "@/lib/db";

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
    // If path is relative and starts with ../, resolve to /var/storage/cold for Docker
    if (basePath.startsWith("../var/storage")) {
      basePath = "/var/storage/cold";
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
