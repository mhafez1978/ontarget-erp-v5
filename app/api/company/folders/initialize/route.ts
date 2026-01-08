import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * Initialize default folder structure for a company
 * Structure:
 * /{company-name}-store/
 *   ├── Shared/
 *   ├── Employees/
 *   │   ├── {employee-name}/
 *   └── Contractors/
 *       └── {contractor-name}/
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
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
        { error: "Only Admins can initialize folders" },
        { status: 403 }
      );
    }

    // Get company
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
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 403 }
      );
    }

    // Check if already initialized
    const existingFolders = await db.fileFolder.findMany({
      where: { companyId },
    });

    if (existingFolders.length > 0) {
      return NextResponse.json(
        { error: "Folder structure already initialized" },
        { status: 400 }
      );
    }

    const sanitizedCompanyName = company.name.replace(/[^a-zA-Z0-9-]/g, "-");
    const basePath = `/${sanitizedCompanyName}-store`;

    // Create Shared folder
    const sharedFolder = await db.fileFolder.create({
      data: {
        companyId,
        name: "Shared",
        path: `${basePath}/Shared`,
        type: "SHARED",
      },
    });

    // Create Employees parent folder
    const employeesFolder = await db.fileFolder.create({
      data: {
        companyId,
        name: "Employees",
        path: `${basePath}/Employees`,
        type: "CUSTOM",
      },
    });

    // Create Contractors parent folder
    const contractorsFolder = await db.fileFolder.create({
      data: {
        companyId,
        name: "Contractors",
        path: `${basePath}/Contractors`,
        type: "CUSTOM",
      },
    });

    // Create Projects parent folder
    const projectsFolder = await db.fileFolder.create({
      data: {
        companyId,
        name: "Projects",
        path: `${basePath}/Projects`,
        type: "CUSTOM",
      },
    });

    // Create individual folders for each employee
    const employeeFolders = [];
    const contractorFolders = [];

    for (const staff of company.staff) {
      const sanitizedName =
        staff.user.name?.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase() ||
        "unnamed";

      if (staff.role === "CONTRACTOR") {
        const folder = await db.fileFolder.create({
          data: {
            companyId,
            name: staff.user.name || "Unnamed",
            path: `${basePath}/Contractors/${sanitizedName}`,
            parentId: contractorsFolder.id,
            type: "CONTRACTOR",
            ownerId: staff.id,
          },
        });
        contractorFolders.push(folder);
      } else {
        const folder = await db.fileFolder.create({
          data: {
            companyId,
            name: staff.user.name || "Unnamed",
            path: `${basePath}/Employees/${sanitizedName}`,
            parentId: employeesFolder.id,
            type: "EMPLOYEE",
            ownerId: staff.id,
          },
        });
        employeeFolders.push(folder);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Folder structure initialized successfully",
      folders: {
        shared: sharedFolder,
        employees: employeesFolder,
        contractors: contractorsFolder,
        projects: projectsFolder,
        employeeFolders,
        contractorFolders,
      },
    });
  } catch (error) {
    console.error("[Initialize Folders Error]:", error);
    return NextResponse.json(
      { error: "Failed to initialize folder structure" },
      { status: 500 }
    );
  }
}
