import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          select: { id: true },
        },
        companyMemberships: {
          select: { companyId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get first owned company or first membership company
    const companyId =
      user.ownedCompanies[0]?.id || user.companyMemberships[0]?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 404 }
      );
    }

    // Get company storefront settings
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        slug: true,
        subdomain: true,
        customDomain: true,
        isStoreEnabled: true,
        storeTheme: true,
        storeBanner: true,
        storeMetadata: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Get storefront settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storefront settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          select: { id: true },
        },
        companyMemberships: {
          select: { companyId: true, role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get first owned company or first admin/manager membership
    const companyId =
      user.ownedCompanies[0]?.id ||
      user.companyMemberships.find(
        (m) => m.role === "ADMIN" || m.role === "MANAGER"
      )?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 404 }
      );
    }

    // Only ADMIN, MANAGER and SUPER_ADMIN can update storefront settings
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "MANAGER"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      slug,
      subdomain,
      customDomain,
      isStoreEnabled,
      storeTheme,
      storeMetadata,
    } = body;

    // Validate slug format
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Slug can only contain lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    // Validate subdomain format
    if (subdomain && !/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        {
          error:
            "Subdomain can only contain lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    // Check if slug is already taken by another company
    if (slug) {
      const existingSlug = await db.company.findFirst({
        where: {
          slug,
          id: { not: companyId },
        },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: "This slug is already taken" },
          { status: 400 }
        );
      }
    }

    // Check if subdomain is already taken by another company
    if (subdomain) {
      const existingSubdomain = await db.company.findFirst({
        where: {
          subdomain,
          id: { not: companyId },
        },
      });

      if (existingSubdomain) {
        return NextResponse.json(
          { error: "This subdomain is already taken" },
          { status: 400 }
        );
      }
    }

    // Update company storefront settings
    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: {
        slug,
        subdomain,
        customDomain,
        isStoreEnabled,
        storeTheme,
        storeMetadata,
      },
      select: {
        slug: true,
        subdomain: true,
        customDomain: true,
        isStoreEnabled: true,
        storeTheme: true,
        storeBanner: true,
        storeMetadata: true,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Update storefront settings error:", error);
    return NextResponse.json(
      { error: "Failed to update storefront settings" },
      { status: 500 }
    );
  }
}
