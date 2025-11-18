import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

// Company Storage Service
// Handles hierarchical storage with fallback and backup:
// 1. DEFAULT: Local storage
// 2. LEVEL 1: Super Admin global storage (if configured)
// 3. LEVEL 2: Company override storage (primary) + Super Admin backup

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
 * Get storage configuration for a company
 * Returns primary storage and backup (if company has override)
 */
export async function getCompanyStorage(
  companyId: string
): Promise<StorageDestination> {
  // Get company storage settings
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      storageProvider: true,
      storageConfig: true,
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // Get super admin (root company) global storage
  const rootCompany = await db.company.findFirst({
    where: { isRoot: true },
    select: {
      storageProvider: true,
      storageConfig: true,
    },
  });

  const superAdminStorage = rootCompany?.storageProvider
    ? {
        provider: rootCompany.storageProvider,
        config: (rootCompany.storageConfig as Record<string, unknown>) || {},
      }
    : null;

  // Determine primary and backup storage
  if (company.storageProvider === "INHERIT" || !company.storageProvider) {
    // Use super admin storage or default to LOCAL
    const primaryProvider = superAdminStorage?.provider || "LOCAL";
    const primaryConfig = superAdminStorage?.config || {
      path: "/var/storage/cold",
    };

    return {
      primary: {
        provider: primaryProvider,
        path: `${company.name}/HR-Docs`,
        config: primaryConfig,
      },
    };
  } else {
    // Company has override - use it as primary, super admin as backup
    const primaryProvider = company.storageProvider;
    const primaryConfig =
      (company.storageConfig as Record<string, unknown>) || {};

    return {
      primary: {
        provider: primaryProvider,
        path: `HR-Docs`,
        config: primaryConfig,
      },
      backup: superAdminStorage
        ? {
            provider: superAdminStorage.provider,
            path: `${company.name}/HR-Docs`,
            config: superAdminStorage.config,
          }
        : undefined,
    };
  }
}

/**
 * Get super admin global storage configuration
 */
export async function getSuperAdminStorage(): Promise<StorageConfig | null> {
  const rootCompany = await db.company.findFirst({
    where: { isRoot: true },
    select: {
      storageProvider: true,
      storageConfig: true,
    },
  });

  if (
    !rootCompany?.storageProvider ||
    rootCompany.storageProvider === "LOCAL"
  ) {
    return {
      provider: "LOCAL",
      config: { path: "/var/storage/cold" },
    };
  }

  return {
    provider: rootCompany.storageProvider,
    config: (rootCompany.storageConfig as Record<string, unknown>) || {},
  };
}

/**
 * Update company storage configuration
 */
export async function updateCompanyStorage(
  companyId: string,
  userId: string,
  storageProvider: string,
  storageConfig: Record<string, unknown>
): Promise<void> {
  await db.company.update({
    where: { id: companyId },
    data: {
      storageProvider,
      storageConfig: storageConfig as never,
      storageConfiguredAt: new Date(),
      storageConfiguredBy: userId,
    },
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
 * Upload file to storage (primary and backup if configured)
 */
export async function uploadDocument(
  companyId: string,
  category: "HR-Docs" | "Invoices" | "Contracts" | "Other",
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
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
    const fullPath = `/var/storage/cold/${primaryPath}`;
    await uploadToLocal(fullPath, fileBuffer);
  }
  // TODO: Add S3, Google Drive, OneDrive, DigitalOcean implementations

  // Upload to backup storage if configured
  if (storage.backup) {
    backupPath = buildStoragePath(company.name, category, fileName);

    if (storage.backup.provider === "LOCAL") {
      const fullPath = `/var/storage/cold/${backupPath}`;
      await uploadToLocal(fullPath, fileBuffer);
    }
    // TODO: Add other provider backups
  }

  return {
    primaryPath:
      storage.primary.provider === "LOCAL"
        ? `/var/storage/cold/${primaryPath}`
        : primaryPath,
    backupPath: backupPath
      ? storage.backup?.provider === "LOCAL"
        ? `/var/storage/cold/${backupPath}`
        : backupPath
      : undefined,
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
      ? `/var/storage/cold/${company.name}`
      : storage.primary.path;

  if (storage.primary.provider === "LOCAL") {
    const files = await listFromLocal(basePath);
    return files.map((file) => ({
      name: file.name,
      size: file.size,
      type: "", // TODO: Detect MIME type
      path: `${basePath}/${file.name}`,
      uploadedAt: file.mtime,
      category: "Other", // TODO: Detect from path
    }));
  }

  // TODO: Add other providers
  return [];
}
