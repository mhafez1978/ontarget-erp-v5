import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import bcrypt from "bcryptjs";

// POST - Set or verify folder password
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await context.params;

    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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

    // Get folder
    const folder = await db.fileFolder.findUnique({
      where: { id: folderId },
      include: {
        company: true,
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const body = await request.json();
    const { password, action } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Check if this is the root folder of the company
    const companyRootPath = `/${folder.company.name}-store`;
    if (folder.path === companyRootPath) {
      return NextResponse.json(
        { error: "Cannot password protect company root folder" },
        { status: 400 }
      );
    }

    if (action === "verify") {
      // Verify password
      if (!folder.isPasswordProtected || !folder.passwordHash) {
        return NextResponse.json(
          { error: "Folder is not password protected" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, folder.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Password verified",
      });
    }

    if (action === "set") {
      // Set password - check permissions
      const companyId = folder.companyId;
      const isSuperAdmin = user.role === "SUPER_ADMIN";
      const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
      const membership = user.companyMemberships.find(
        (m) => m.companyId === companyId
      );

      // Only SUPER_ADMIN, company owner, or ADMIN/MANAGER can set passwords
      if (
        !isSuperAdmin &&
        !ownsCompany &&
        membership?.role !== "ADMIN" &&
        membership?.role !== "MANAGER"
      ) {
        return NextResponse.json(
          {
            error: "Only administrators and managers can set folder passwords",
          },
          { status: 403 }
        );
      }

      // Validate password length
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update folder
      await db.fileFolder.update({
        where: { id: folderId },
        data: {
          isPasswordProtected: true,
          passwordHash,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Folder password set successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'set' or 'verify'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Folder password error:", error);
    return NextResponse.json(
      {
        error: "Failed to process folder password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove folder password
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await context.params;

    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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

    // Get folder
    const folder = await db.fileFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check permissions
    const companyId = folder.companyId;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    const membership = user.companyMemberships.find(
      (m) => m.companyId === companyId
    );

    if (
      !isSuperAdmin &&
      !ownsCompany &&
      membership?.role !== "ADMIN" &&
      membership?.role !== "MANAGER"
    ) {
      return NextResponse.json(
        {
          error: "Only administrators and managers can remove folder passwords",
        },
        { status: 403 }
      );
    }

    // Remove password
    await db.fileFolder.update({
      where: { id: folderId },
      data: {
        isPasswordProtected: false,
        passwordHash: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Folder password removed successfully",
    });
  } catch (error) {
    console.error("Remove folder password error:", error);
    return NextResponse.json(
      {
        error: "Failed to remove folder password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
