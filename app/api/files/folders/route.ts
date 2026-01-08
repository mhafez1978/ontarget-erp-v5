import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user: sessionUser } = validation;

    // Get user with company memberships
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        companyMemberships: {
          include: {
            company: true,
          },
        },
        ownedCompanies: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { name, parentId, companyId, type, ownerId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check user permissions
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    const membership = user.companyMemberships.find(
      (m) => m.companyId === companyId
    );

    if (!isSuperAdmin && !ownsCompany && !membership) {
      return NextResponse.json(
        { error: "You do not have access to this company" },
        { status: 403 }
      );
    }

    // Only SUPER_ADMIN, company owner, or ADMIN can create folders
    if (!isSuperAdmin && !ownsCompany && membership?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to create folders" },
        { status: 403 }
      );
    }

    // Validate parent folder if provided
    let parentFolder = null;
    let folderPath = `/${name}`;

    if (parentId) {
      parentFolder = await db.fileFolder.findUnique({
        where: { id: parentId },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }

      if (parentFolder.companyId !== companyId) {
        return NextResponse.json(
          { error: "Parent folder does not belong to specified company" },
          { status: 400 }
        );
      }

      // Build full path based on parent
      folderPath = `${parentFolder.path}/${name}`;
    }

    // Check if folder already exists at this path
    const existingFolder = await db.fileFolder.findUnique({
      where: {
        companyId_path: {
          companyId,
          path: folderPath,
        },
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists in this location" },
        { status: 409 }
      );
    }

    // Create the folder
    const folder = await db.fileFolder.create({
      data: {
        companyId,
        name,
        path: folderPath,
        parentId: parentId || null,
        type: type || "CUSTOM",
        ownerId: ownerId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      folder,
      message: "Folder created successfully",
    });
  } catch (error) {
    console.error("Folder creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create folder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET folders for a company
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user: sessionUser } = validation;

    // Get user with company memberships
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        companyMemberships: true,
        ownedCompanies: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get companyId from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check user permissions
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    const isMember = user.companyMemberships.some(
      (m) => m.companyId === companyId
    );

    if (!isSuperAdmin && !ownsCompany && !isMember) {
      return NextResponse.json(
        { error: "You do not have access to this company" },
        { status: 403 }
      );
    }

    // Get all folders for the company
    const folders = await db.fileFolder.findMany({
      where: { companyId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
      orderBy: {
        path: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error("Folder fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch folders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
