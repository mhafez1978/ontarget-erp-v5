import { db } from "@/lib/db";
import { UserRole, CompanyMemberRole, FolderType } from "@prisma/client";

/**
 * File Permission Service
 * Handles all permission checks for file and folder operations
 */

interface User {
  id: string;
  role: UserRole;
  ownedCompanies: { id: string }[];
  companyMemberships: {
    companyId: string;
    role: CompanyMemberRole;
  }[];
}

/**
 * Check if user can access a folder
 */
export async function canUserAccessFolder(
  userId: string,
  folderId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedCompanies: { select: { id: true } },
      companyMemberships: { select: { companyId: true, role: true } },
    },
  });

  if (!user) return false;

  const folder = await db.fileFolder.findUnique({
    where: { id: folderId },
    select: {
      companyId: true,
      type: true,
      ownerId: true,
    },
  });

  if (!folder) return false;

  return canAccess(user, folder.companyId, folder.type, folder.ownerId);
}

/**
 * Check if user can upload to a folder
 */
export async function canUserUploadToFolder(
  userId: string,
  folderId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedCompanies: { select: { id: true } },
      companyMemberships: { select: { companyId: true, role: true } },
    },
  });

  if (!user) return false;

  const folder = await db.fileFolder.findUnique({
    where: { id: folderId },
    select: {
      companyId: true,
      type: true,
      ownerId: true,
    },
  });

  if (!folder) return false;

  // SUPER_ADMIN can upload anywhere
  if (user.role === "SUPER_ADMIN") return true;

  // Company owner can upload anywhere in their company
  if (user.ownedCompanies.some((c) => c.id === folder.companyId)) return true;

  // Check company membership
  const membership = user.companyMemberships.find(
    (m) => m.companyId === folder.companyId
  );

  if (!membership) return false;

  // ADMIN and MANAGER can upload anywhere in company
  if (membership.role === "ADMIN" || membership.role === "MANAGER") {
    return true;
  }

  // STAFF can upload to:
  // - Shared folders
  // - Their own EMPLOYEE folder
  if (membership.role === "STAFF") {
    if (folder.type === "SHARED") return true;
    if (folder.type === "EMPLOYEE" && folder.ownerId === userId) return true;
    return false;
  }

  // CONTRACTOR can only upload to their own folder
  if (membership.role === "CONTRACTOR") {
    return folder.type === "CONTRACTOR" && folder.ownerId === userId;
  }

  return false;
}

/**
 * Check if user can delete a file
 */
export async function canUserDeleteFile(
  userId: string,
  fileId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedCompanies: { select: { id: true } },
      companyMemberships: { select: { companyId: true, role: true } },
    },
  });

  if (!user) return false;

  const file = await db.fileRecord.findUnique({
    where: { id: fileId },
    include: {
      folder: {
        select: {
          companyId: true,
          type: true,
          ownerId: true,
        },
      },
    },
  });

  if (!file) return false;

  // SUPER_ADMIN can delete any file
  if (user.role === "SUPER_ADMIN") return true;

  // Company owner can delete any file in their company
  if (user.ownedCompanies.some((c) => c.id === file.folder.companyId)) {
    return true;
  }

  // Check company membership
  const membership = user.companyMemberships.find(
    (m) => m.companyId === file.folder.companyId
  );

  if (!membership) return false;

  // ADMIN and MANAGER can delete any file in company
  if (membership.role === "ADMIN" || membership.role === "MANAGER") {
    return true;
  }

  // STAFF and CONTRACTOR can only delete files they uploaded
  return file.uploadedById === userId;
}

/**
 * Check if user can download a file
 */
export async function canUserDownloadFile(
  userId: string,
  fileId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedCompanies: { select: { id: true } },
      companyMemberships: { select: { companyId: true, role: true } },
    },
  });

  if (!user) return false;

  const file = await db.fileRecord.findUnique({
    where: { id: fileId },
    include: {
      folder: {
        select: {
          companyId: true,
          type: true,
          ownerId: true,
        },
      },
    },
  });

  if (!file) return false;

  return canAccess(
    user,
    file.folder.companyId,
    file.folder.type,
    file.folder.ownerId
  );
}

/**
 * Check if user can create a folder
 */
export async function canUserCreateFolder(
  userId: string,
  companyId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedCompanies: { select: { id: true } },
      companyMemberships: { select: { companyId: true, role: true } },
    },
  });

  if (!user) return false;

  // SUPER_ADMIN can create folders anywhere
  if (user.role === "SUPER_ADMIN") return true;

  // Company owner can create folders
  if (user.ownedCompanies.some((c) => c.id === companyId)) return true;

  // Check company membership
  const membership = user.companyMemberships.find(
    (m) => m.companyId === companyId
  );

  if (!membership) return false;

  // Only ADMIN can create folders
  return membership.role === "ADMIN";
}

/**
 * Helper function to check access based on user role and folder type
 */
function canAccess(
  user: User,
  companyId: string,
  folderType: FolderType,
  folderId: string | null
): boolean {
  // SUPER_ADMIN has access to everything
  if (user.role === "SUPER_ADMIN") return true;

  // Company owner has access to all company files
  if (user.ownedCompanies.some((c) => c.id === companyId)) return true;

  // Check company membership
  const membership = user.companyMemberships.find(
    (m) => m.companyId === companyId
  );

  if (!membership) return false;

  // ADMIN and MANAGER have access to all company files
  if (membership.role === "ADMIN" || membership.role === "MANAGER") {
    return true;
  }

  // STAFF access rules:
  // - Can access SHARED folders
  // - Can access their own EMPLOYEE folder
  // - Cannot access other employee folders
  // - Cannot access CONTRACTOR folders
  if (membership.role === "STAFF") {
    if (folderType === "SHARED") return true;
    if (folderType === "EMPLOYEE" && folderId === user.id) return true;
    return false;
  }

  // CONTRACTOR access rules:
  // - Can only access their own CONTRACTOR folder
  if (membership.role === "CONTRACTOR") {
    return folderType === "CONTRACTOR" && folderId === user.id;
  }

  // SUPPLIER has no file access by default
  return false;
}

/**
 * Get user's accessible folders for a company
 */
export async function getUserAccessibleFolders(
  userId: string,
  companyId: string
): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedCompanies: { select: { id: true } },
      companyMemberships: { select: { companyId: true, role: true } },
    },
  });

  if (!user) return [];

  // SUPER_ADMIN and company owners see all folders
  if (
    user.role === "SUPER_ADMIN" ||
    user.ownedCompanies.some((c) => c.id === companyId)
  ) {
    const allFolders = await db.fileFolder.findMany({
      where: { companyId },
      select: { id: true },
    });
    return allFolders.map((f) => f.id);
  }

  // Check company membership
  const membership = user.companyMemberships.find(
    (m) => m.companyId === companyId
  );

  if (!membership) return [];

  // ADMIN and MANAGER see all folders
  if (membership.role === "ADMIN" || membership.role === "MANAGER") {
    const allFolders = await db.fileFolder.findMany({
      where: { companyId },
      select: { id: true },
    });
    return allFolders.map((f) => f.id);
  }

  // STAFF sees SHARED folders and their own EMPLOYEE folder
  if (membership.role === "STAFF") {
    const accessibleFolders = await db.fileFolder.findMany({
      where: {
        companyId,
        OR: [{ type: "SHARED" }, { type: "EMPLOYEE", ownerId: userId }],
      },
      select: { id: true },
    });
    return accessibleFolders.map((f) => f.id);
  }

  // CONTRACTOR sees only their own folder
  if (membership.role === "CONTRACTOR") {
    const contractorFolder = await db.fileFolder.findFirst({
      where: {
        companyId,
        type: "CONTRACTOR",
        ownerId: userId,
      },
      select: { id: true },
    });
    return contractorFolder ? [contractorFolder.id] : [];
  }

  return [];
}
