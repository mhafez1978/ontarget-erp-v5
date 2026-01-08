import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    // Get companyId from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          where: { id: companyId },
          select: { id: true },
        },
        companyMemberships: {
          where: { companyId: companyId },
          select: { companyId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user has access to this company
    const hasAccess =
      user.role === "SUPER_ADMIN" ||
      user.ownedCompanies.length > 0 ||
      user.companyMemberships.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
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
        storeBlogEnabled: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
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
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    // Get companyId from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          where: { id: companyId },
          select: { id: true },
        },
        companyMemberships: {
          where: { companyId: companyId },
          select: { companyId: true, role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user has access to modify this company
    const isOwner = user.ownedCompanies.length > 0;
    const isAdminOrManager = user.companyMemberships.some(
      (m) => m.role === "ADMIN" || m.role === "MANAGER"
    );
    const hasAccess =
      user.role === "SUPER_ADMIN" || isOwner || isAdminOrManager;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to modify this company" },
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
      storeBlogEnabled,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      youtubeUrl,
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
        storeBlogEnabled,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
      },
      select: {
        slug: true,
        subdomain: true,
        customDomain: true,
        isStoreEnabled: true,
        storeTheme: true,
        storeBanner: true,
        storeMetadata: true,
        storeBlogEnabled: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
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
