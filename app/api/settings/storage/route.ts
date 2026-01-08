import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Fetch storage providers
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const user = validation.user;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get("scope") || "GLOBAL";
    const companyId = searchParams.get("companyId");

    // Super admin can view all, admins can only view their company storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true }; // Only get active provider

    if (user.role === "SUPER_ADMIN") {
      if (companyId) {
        where.companyId = companyId;
      } else {
        where.scope = scope;
        where.companyId = null;
      }
    } else if (user.role === "ADMIN") {
      // Admins can only see their company storage
      const companies = await db.company.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const companyIds = companies.map((c) => c.id);

      if (companyId && companyIds.includes(companyId)) {
        where.companyId = companyId;
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the active provider (single record)
    const provider = await db.storageProvider.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Parse config if provider exists
    if (provider && provider.config) {
      try {
        const parsedConfig = JSON.parse(provider.config);
        return NextResponse.json({
          provider: {
            ...provider,
            config: parsedConfig,
          },
        });
      } catch {
        // If parsing fails, return as-is
        return NextResponse.json({ provider });
      }
    }

    return NextResponse.json({ provider: null });
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
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const user = validation.user;
    const userId = validation.user.id;

    const body = await request.json();
    const { provider, config, scope, companyId, isActive, enableGlobalBackup } =
      body;

    if (!provider || !config) {
      return NextResponse.json(
        { error: "Provider and config are required" },
        { status: 400 }
      );
    }

    if (scope === "GLOBAL" && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
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

    // If activating, deactivate other providers in the same scope
    if (isActive) {
      const whereClause: { scope: string; companyId?: string | null } = {
        scope: scope || "GLOBAL",
      };

      if (companyId) {
        whereClause.companyId = companyId;
      } else if (scope === "GLOBAL") {
        whereClause.companyId = null;
      }

      await db.storageProvider.updateMany({
        where: whereClause,
        data: { isActive: false },
      });
    }

    // Create or update storage provider
    const storageProvider = await db.storageProvider.create({
      data: {
        provider,
        config: JSON.stringify(config),
        scope: scope || "GLOBAL",
        companyId,
        createdById: userId,
        isActive: isActive || false,
        isConnected: true, // User must test successfully before saving
        lastTestedAt: new Date(),
        enableGlobalBackup: enableGlobalBackup || false, // Professional plan backup feature
      },
    });

    // Log audit event
    const scopeText =
      scope === "GLOBAL" ? "globally" : `for company ${companyId}`;
    const configPath =
      config.path || config.bucket || config.space || "configured location";

    await db.auditLog.create({
      data: {
        userId: userId,
        action: isActive ? "ACTIVATED" : "CREATED",
        entityType: "StorageProvider",
        entityId: storageProvider.id,
        description: `${
          isActive ? "Created and activated" : "Created"
        } ${provider} storage provider ${scopeText}${
          provider === "LOCAL" ? ` at ${configPath}` : ""
        }`,
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

// PATCH - Activate/deactivate storage provider
export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const user = validation.user;
    const userId = validation.user.id;

    const body = await request.json();
    const { providerId, isActive } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Get the provider to check permissions
    const provider = await db.storageProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Storage provider not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (provider.scope === "GLOBAL" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can modify global storage" },
        { status: 403 }
      );
    }

    if (provider.companyId && user.role !== "SUPER_ADMIN") {
      // Verify admin owns this company
      const company = await db.company.findFirst({
        where: { id: provider.companyId, ownerId: userId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Forbidden - not your company" },
          { status: 403 }
        );
      }
    }

    // If activating this provider, deactivate all others in the same scope
    if (isActive) {
      await db.storageProvider.updateMany({
        where: {
          scope: provider.scope,
          companyId: provider.companyId,
          id: { not: providerId },
        },
        data: { isActive: false },
      });
    }

    // Update the provider
    const updatedProvider = await db.storageProvider.update({
      where: { id: providerId },
      data: { isActive },
    });

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: userId,
        action: isActive ? "ACTIVATED" : "DEACTIVATED",
        entityType: "StorageProvider",
        entityId: providerId,
        description: `${isActive ? "Activated" : "Deactivated"} ${
          provider.provider
        } storage provider`,
      },
    });

    return NextResponse.json({ provider: updatedProvider });
  } catch (error) {
    console.error("Error updating storage provider:", error);
    return NextResponse.json(
      { error: "Failed to update storage provider" },
      { status: 500 }
    );
  }
}
