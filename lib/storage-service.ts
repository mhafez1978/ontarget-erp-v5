import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

// ============================================================================
// HYBRID STORAGE SERVICE - Subscription-Based Architecture
// ============================================================================
// ESSENTIAL Plan: Uses global storage (Super Admin controls)
// GROWTH Plan: Can use custom storage + optional backup (charged add-on)
// ENTERPRISE Plan: Must use custom storage, no backup to global
// ============================================================================

export interface StorageConfig {
  provider: string;
  config: {
    // LOCAL
    path?: string;

    // AWS S3
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    region?: string;

    // Google Drive
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    folderId?: string;

    // OneDrive
    tenantId?: string;

    // DigitalOcean
    accessKey?: string;
    secretKey?: string;
    space?: string;
    endpoint?: string;
  };
}

export interface StorageDestination {
  primary: {
    provider: string;
    path: string;
    config: Record<string, unknown>;
  };
  backup?: {
    provider: string;
    path: string;
    config: Record<string, unknown>;
  };
}

/**
 * Get active global storage configuration from StorageProvider table
 */
async function getGlobalStorage(): Promise<{
  provider: string;
  config: Record<string, unknown>;
} | null> {
  const globalStorage = await db.storageProvider.findFirst({
    where: {
      scope: "GLOBAL",
      isActive: true,
      isConnected: true,
    },
  });

  if (!globalStorage) {
    // Fallback to default LOCAL storage
    return {
      provider: "LOCAL",
      config: { path: "../var/storage/cold" },
    };
  }

  return {
    provider: globalStorage.provider,
    config: JSON.parse(globalStorage.config || "{}"),
  };
}

/**
 * Get company-specific storage configuration from StorageProvider table
 */
async function getCompanySpecificStorage(companyId: string): Promise<{
  provider: string;
  config: Record<string, unknown>;
  enableGlobalBackup: boolean;
} | null> {
  const companyStorage = await db.storageProvider.findFirst({
    where: {
      companyId: companyId,
      isActive: true,
      isConnected: true,
    },
  });

  if (!companyStorage) {
    return null;
  }

  return {
    provider: companyStorage.provider,
    config: JSON.parse(companyStorage.config || "{}"),
    enableGlobalBackup: companyStorage.enableGlobalBackup,
  };
}

/**
 * Get storage configuration for a company based on subscription plan
 * ESSENTIAL: Uses global storage only
 * GROWTH: Can override + optional backup to global (if storageBackupEnabled)
 * ENTERPRISE: Must use custom storage, no backup
 */
export async function getCompanyStorage(
  companyId: string
): Promise<StorageDestination> {
  // Get company with subscription info
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      storageBackupEnabled: true,
      subscriberSubscriptions: {
        select: {
          plan: true,
          status: true,
        },
        where: {
          status: { in: ["TRIAL", "ACTIVE"] },
        },
        take: 1,
      },
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  const subscription = company.subscriberSubscriptions[0];
  const plan = subscription?.plan || "ESSENTIAL";

  // Get global storage (Super Admin configured)
  const globalStorage = await getGlobalStorage();

  // Get company-specific storage if exists
  const companyStorage = await getCompanySpecificStorage(companyId);

  // ESSENTIAL PLAN: Must use global storage only
  if (plan === "ESSENTIAL") {
    if (!globalStorage) {
      throw new Error(
        "Global storage not configured. Contact system administrator."
      );
    }

    return {
      primary: {
        provider: globalStorage.provider,
        path: `${company.name}/HR-Docs`,
        config: globalStorage.config,
      },
    };
  }

  // GROWTH PLAN: Can use custom storage + optional backup
  if (plan === "GROWTH") {
    if (companyStorage) {
      // Company has custom storage configured
      const result: StorageDestination = {
        primary: {
          provider: companyStorage.provider,
          path: `HR-Docs`,
          config: companyStorage.config,
        },
      };

      // Add backup if enabled (charged feature)
      if (
        company.storageBackupEnabled &&
        companyStorage.enableGlobalBackup &&
        globalStorage
      ) {
        result.backup = {
          provider: globalStorage.provider,
          path: `${company.name}/HR-Docs`,
          config: globalStorage.config,
        };
      }

      return result;
    } else {
      // No custom storage, use global
      if (!globalStorage) {
        throw new Error(
          "Global storage not configured. Contact system administrator."
        );
      }

      return {
        primary: {
          provider: globalStorage.provider,
          path: `${company.name}/HR-Docs`,
          config: globalStorage.config,
        },
      };
    }
  }

  // ENTERPRISE PLAN: Must use custom storage, no backup
  if (plan === "ENTERPRISE") {
    if (!companyStorage) {
      throw new Error(
        "Enterprise plan requires custom storage configuration. Please configure storage in Settings."
      );
    }

    return {
      primary: {
        provider: companyStorage.provider,
        path: `HR-Docs`,
        config: companyStorage.config,
      },
      // No backup for Enterprise - they manage their own redundancy
    };
  }

  // Fallback to global storage
  if (!globalStorage) {
    throw new Error(
      "Global storage not configured. Contact system administrator."
    );
  }

  return {
    primary: {
      provider: globalStorage.provider,
      path: `${company.name}/HR-Docs`,
      config: globalStorage.config,
    },
  };
}

/**
 * Get super admin global storage configuration (NEW SYSTEM)
 * Reads from StorageProvider table with scope=GLOBAL
 */
export async function getSuperAdminStorage(): Promise<StorageConfig | null> {
  const globalStorage = await getGlobalStorage();

  if (!globalStorage) {
    return null;
  }

  return {
    provider: globalStorage.provider,
    config: globalStorage.config as StorageConfig["config"],
  };
}

/**
 * Update company storage backup preference
 * Controls whether Growth plan customers get backup to global storage
 */
export async function updateCompanyStorageBackup(
  companyId: string,
  enabled: boolean
): Promise<void> {
  await db.company.update({
    where: { id: companyId },
    data: { storageBackupEnabled: enabled },
  });
}

/**
 * Build file path for storage
 */
export function buildStoragePath(
  companyName: string,
  category: "HR-Docs" | "Invoices" | "Contracts" | "Other",
  fileName: string
): string {
  return `${companyName}/${category}/${fileName}`;
}

/**
 * LOCAL storage implementation
 */
async function uploadToLocal(
  filePath: string,
  buffer: Buffer
): Promise<string> {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, buffer);

  return filePath;
}

async function listFromLocal(
  basePath: string
): Promise<Array<{ name: string; size: number; mtime: Date }>> {
  try {
    const files = await fs.readdir(basePath, {
      recursive: true,
      withFileTypes: true,
    });
    const fileDetails = [];

    for (const file of files) {
      if (file.isFile()) {
        const fullPath = path.join(basePath, file.name);
        const stats = await fs.stat(fullPath);
        fileDetails.push({
          name: file.name,
          size: stats.size,
          mtime: stats.mtime,
        });
      }
    }

    return fileDetails;
  } catch (error) {
    console.error("Error listing local files:", error);
    return [];
  }
}

async function downloadFromLocal(filePath: string): Promise<Buffer> {
  return await fs.readFile(filePath);
}

async function deleteFromLocal(filePath: string): Promise<void> {
  await fs.unlink(filePath);
}

/**
 * Upload file to storage with subscription-based backup rules
 *
 * ESSENTIAL: Primary = Global storage (e.g., ../var/storage/cold/CompanyName/...)
 * GROWTH: Primary = Company storage, Backup = Global (if backup enabled)
 * ENTERPRISE: Primary = Company storage only, no backup
 */
export async function uploadDocument(
  companyId: string,
  category: "HR-Docs" | "Invoices" | "Contracts" | "Other",
  fileName: string,
  fileBuffer: Buffer
): Promise<{
  primaryPath: string;
  backupPath?: string;
  storageProvider: string;
}> {
  const storage = await getCompanyStorage(companyId);
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // Build paths
  const primaryPath = buildStoragePath(company.name, category, fileName);
  let backupPath: string | undefined;

  // Upload to primary storage
  if (storage.primary.provider === "LOCAL") {
    const basePath =
      (storage.primary.config.path as string) || "../var/storage/cold";
    const fullPath = `${basePath}/${primaryPath}`;
    await uploadToLocal(fullPath, fileBuffer);
  }
  // TODO: Add S3, Google Drive, OneDrive, DigitalOcean implementations

  // Upload to backup storage if configured (Growth plan with backup enabled)
  if (storage.backup) {
    backupPath = buildStoragePath(company.name, category, fileName);

    if (storage.backup.provider === "LOCAL") {
      const backupBasePath =
        (storage.backup.config.path as string) || "../var/storage/cold";
      const fullPath = `${backupBasePath}/${backupPath}`;
      await uploadToLocal(fullPath, fileBuffer);
    }
    // TODO: Add other provider backups
  }

  // Return full paths
  const primaryFullPath =
    storage.primary.provider === "LOCAL"
      ? `${
          (storage.primary.config.path as string) || "../var/storage/cold"
        }/${primaryPath}`
      : primaryPath;

  const backupFullPath =
    backupPath && storage.backup
      ? storage.backup.provider === "LOCAL"
        ? `${
            (storage.backup.config.path as string) || "../var/storage/cold"
          }/${backupPath}`
        : backupPath
      : undefined;

  return {
    primaryPath: primaryFullPath,
    backupPath: backupFullPath,
    storageProvider: storage.primary.provider,
  };
}

/**
 * Download file from storage
 */
export async function downloadDocument(
  filePath: string,
  provider: string
): Promise<Buffer> {
  if (provider === "LOCAL") {
    return await downloadFromLocal(filePath);
  }
  // TODO: Add other providers

  throw new Error(`Provider ${provider} not implemented`);
}

/**
 * Delete file from storage
 */
export async function deleteDocument(
  filePath: string,
  provider: string
): Promise<void> {
  if (provider === "LOCAL") {
    await deleteFromLocal(filePath);
  }
  // TODO: Add other providers
}

/**
 * List files in company storage (for file explorer)
 */
export async function listCompanyFiles(
  companyId: string,
  category: "HR-Docs" | "Invoices" | "Contracts" | "Other" | "All" = "All"
): Promise<
  Array<{
    name: string;
    size: number;
    type: string;
    path: string;
    uploadedAt: Date;
    category: string;
  }>
> {
  const storage = await getCompanyStorage(companyId);
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  if (!company) {
    return [];
  }

  const basePath =
    storage.primary.provider === "LOCAL"
      ? `../var/storage/cold/${company.name}`
      : storage.primary.path;

  if (storage.primary.provider === "LOCAL") {
    const files = await listFromLocal(basePath);
    // Filter files by category if not "All"
    const filteredFiles = files.filter((file) => {
      if (category === "All") return true;
      // Check if file path includes the category folder
      return file.name.startsWith(`${category}/`);
    });
    return filteredFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: "", // TODO: Detect MIME type
      path: `${basePath}/${file.name}`,
      uploadedAt: file.mtime,
      category: category === "All" ? "Other" : category, // TODO: Detect from path
    }));
  }

  // TODO: Add other providers
  return [];
}
