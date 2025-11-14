import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Fetch storage providers
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get("scope") || "GLOBAL";

    // Super admin can view all, admins can only view their company storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (user.role === "SUPER_ADMIN") {
      if (scope !== "GLOBAL") {
        where.companyId = scope;
      } else {
        where.scope = "GLOBAL";
      }
    } else if (user.role === "ADMIN") {
      // Admins can only see their company storage
      const companies = await db.company.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const companyIds = companies.map((c) => c.id);
      where.companyId = { in: companyIds };
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const providers = await db.storageProvider.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error fetching storage providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage providers" },
      { status: 500 }
    );
  }
}

// POST - Create or update storage provider
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { provider, config, scope, companyId } = body;

    // Validate permissions
    if (scope === "GLOBAL" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can configure global storage" },
        { status: 403 }
      );
    }

    if (companyId && user.role !== "SUPER_ADMIN") {
      // Verify admin owns this company
      const company = await db.company.findFirst({
        where: { id: companyId, ownerId: userId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Forbidden - not your company" },
          { status: 403 }
        );
      }
    }

    // Create or update storage provider
    const storageProvider = await db.storageProvider.create({
      data: {
        provider,
        config: JSON.stringify(config),
        scope: scope || "GLOBAL",
        companyId,
        createdById: userId,
        isActive: false, // Require testing before activation
      },
    });

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: userId,
        action: "CREATED",
        entityType: "StorageProvider",
        entityId: storageProvider.id,
        description: `Created ${provider} storage provider`,
      },
    });

    return NextResponse.json({ provider: storageProvider });
  } catch (error) {
    console.error("Error creating storage provider:", error);
    return NextResponse.json(
      { error: "Failed to create storage provider" },
      { status: 500 }
    );
  }
}
