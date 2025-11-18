import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check access to company
    let hasAccess = false;
    let isAdmin = false;
    let staffRecord = null;

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          OR: [
            { ownerId: user.id },
            {
              subscriberSubscriptions: {
                some: {
                  rootCompany: {
                    ownerId: user.id,
                  },
                  status: {
                    in: ["ACTIVE", "TRIAL"],
                  },
                },
              },
            },
          ],
        },
      });
      hasAccess = !!company;
      isAdmin = true;
    } else {
      // Check if user is staff/manager/contractor in this company
      staffRecord = await db.companyStaff.findFirst({
        where: {
          userId: user.id,
          companyId,
        },
      });
      hasAccess = !!staffRecord;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Get folder tree based on user role
    let folders;

    if (isAdmin) {
      // Admin sees everything
      folders = await db.fileFolder.findMany({
        where: { companyId },
        include: {
          files: {
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          path: "asc",
        },
      });
    } else {
      // Staff sees Shared, their own folder, and project folders they are assigned to
      // Compute allowed project-based folder paths
      const company = await db.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });

      const assignedProjects = await db.project.findMany({
        where: {
          companyId,
          OR: [
            { projectManagerId: staffRecord?.id || "" },
            { teamLeadId: staffRecord?.id || "" },
            {
              team: {
                members: {
                  some: { staffId: staffRecord?.id || "" },
                },
              },
            },
          ],
        },
        select: { name: true },
      });

      const sanitizedCompanyName = company?.name
        ? company.name.replace(/[^a-zA-Z0-9-]/g, "-")
        : "company";
      const projectsBase = `/${sanitizedCompanyName}-store/Projects`;
      const allowedProjectPaths = assignedProjects.map(
        (p) =>
          `${projectsBase}/${p.name
            .replace(/[^a-zA-Z0-9-]/g, "-")
            .toLowerCase()}`
      );
      const projectPathPrefixes = allowedProjectPaths.map((p) => ({
        path: { startsWith: p },
      }));

      folders = await db.fileFolder.findMany({
        where: {
          companyId,
          OR: [
            { type: "SHARED" },
            { ownerId: staffRecord?.id || "" },
            { path: { in: allowedProjectPaths } },
            ...projectPathPrefixes,
            // Include the Projects root so users can expand it
            { path: projectsBase },
          ],
        },
        include: {
          files: {
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          path: "asc",
        },
      });
    }

    // Build folder tree structure
    const folderTree = buildFolderTree(folders);

    return NextResponse.json({
      folders: folderTree,
      isAdmin,
      totalFolders: folders.length,
      totalFiles: folders.reduce((sum, f) => sum + f.fileCount, 0),
    });
  } catch (error) {
    console.error("[Folder Tree Error]:", error);
    return NextResponse.json(
      { error: "Failed to load folder tree" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyId,
      name,
      parentId,
      type,
      ownerId,
      isPasswordProtected,
      password,
    } = body;

    if (!companyId || !name) {
      return NextResponse.json(
        { error: "Company ID and folder name are required" },
        { status: 400 }
      );
    }

    // Verify user is ADMIN or SUPER_ADMIN
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only Admins can create folders" },
        { status: 403 }
      );
    }

    // Verify company access
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: user.id },
          {
            subscriberSubscriptions: {
              some: {
                rootCompany: {
                  ownerId: user.id,
                },
                status: {
                  in: ["ACTIVE", "TRIAL"],
                },
              },
            },
          },
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Build folder path
    let folderPath = `/${company.name}-store`;
    if (parentId) {
      const parent = await db.fileFolder.findUnique({
        where: { id: parentId },
      });
      if (parent) {
        folderPath = `${parent.path}/${name}`;
      }
    } else {
      folderPath = `${folderPath}/${name}`;
    }

    // Create folder
    const folder = await db.fileFolder.create({
      data: {
        companyId,
        name,
        path: folderPath,
        parentId: parentId || null,
        type: type || "CUSTOM",
        ownerId: ownerId || null,
        isPasswordProtected: isPasswordProtected || false,
        passwordHash: password ? await hashPassword(password) : null,
      },
    });

    return NextResponse.json({
      success: true,
      folder,
    });
  } catch (error) {
    console.error("[Create Folder Error]:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

// Helper to build hierarchical folder tree
type FolderWithChildren = {
  id: string;
  name: string;
  path: string;
  type: string;
  isPasswordProtected: boolean;
  fileCount: number;
  children: FolderWithChildren[];
};

function buildFolderTree(
  folders: Array<{
    id: string;
    name: string;
    path: string;
    type: string;
    isPasswordProtected: boolean;
    parentId: string | null;
    _count?: { files: number };
    fileCount?: number;
  }>
): FolderWithChildren[] {
  const folderMap = new Map<string, FolderWithChildren>();
  const rootFolders: FolderWithChildren[] = [];

  // Create map of all folders
  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      path: folder.path,
      type: folder.type,
      isPasswordProtected: folder.isPasswordProtected,
      fileCount: folder._count?.files || folder.fileCount || 0,
      children: [],
    });
  });

  // Build tree structure
  folders.forEach((folder) => {
    const folderNode = folderMap.get(folder.id);
    if (folderNode) {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    }
  });

  return rootFolders;
}

// Helper to hash password (simple example, use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  // TODO: Use proper password hashing (bcrypt)
  return Buffer.from(password).toString("base64");
}
