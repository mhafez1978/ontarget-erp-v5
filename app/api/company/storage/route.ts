import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";

// GET - Fetch company storage configuration
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;
    const user = validation.user;

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Access Denied: Only admins can view storage settings" },
        { status: 403 }
      );
    }

    // Get user's company
    let company;
    if (user.role === "SUPER_ADMIN") {
      company = await db.company.findFirst({
        where: { ownerId: user.id },
        select: {
          id: true,
          name: true,
          storageProvider: true,
          storageConfig: true,
          storageConfiguredAt: true,
          storageConfiguredBy: true,
        },
      });
    } else {
      company = await db.company.findFirst({
        where: {
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                  role: "ADMIN",
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          storageProvider: true,
          storageConfig: true,
          storageConfiguredAt: true,
          storageConfiguredBy: true,
        },
      });
    }

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get super admin global storage for reference
    const rootCompany = await db.company.findFirst({
      where: { isRoot: true },
      select: {
        storageProvider: true,
      },
    });

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        storageProvider: company.storageProvider || "INHERIT",
        storageConfig: company.storageConfig,
        storageConfiguredAt: company.storageConfiguredAt,
      },
      globalStorage: {
        provider: rootCompany?.storageProvider || "LOCAL",
        isConfigured: !!rootCompany?.storageProvider,
      },
    });
  } catch (error) {
    console.error("Error fetching company storage:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage configuration" },
      { status: 500 }
    );
  }
}

// POST - Update company storage configuration
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;
    const user = validation.user;

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Access Denied: Only admins can update storage settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyId, storageProvider, storageConfig } = body;

    if (!companyId || !storageProvider) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
                role: "ADMIN",
              },
            },
          },
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 404 }
      );
    }

    // Update storage configuration
    await db.company.update({
      where: { id: companyId },
      data: {
        storageProvider,
        storageConfig: storageConfig || null,
        storageConfiguredAt: new Date(),
        storageConfiguredBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Storage configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating company storage:", error);
    return NextResponse.json(
      { error: "Failed to update storage configuration" },
      { status: 500 }
    );
  }
}
