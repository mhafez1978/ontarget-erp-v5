import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;

    // Check that user can access this company (SUPER_ADMIN, owner, or ADMIN/MANAGER member)
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
          where: { companyId },
          select: { companyId: true, role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = user.ownedCompanies.length > 0;
    const isMember = user.companyMemberships.length > 0;
    const isAdminOrManager = user.companyMemberships.some(
      (m) => m.role === "ADMIN" || m.role === "MANAGER"
    );

    const hasAccess =
      userRole === "SUPER_ADMIN" || isOwner || (isMember && isAdminOrManager);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        slug: true,
        storeMetadata: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Featured products/services like the live storefront, with a fallback to any active/published
    const featuredProductsPrimary = await db.product.findMany({
      where: {
        companyId,
        isPublished: true,
        isActive: true,
        isFeatured: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const featuredProductsRaw =
      featuredProductsPrimary.length > 0
        ? featuredProductsPrimary
        : await db.product.findMany({
            where: {
              companyId,
              isPublished: true,
              isActive: true,
            },
            include: {
              images: {
                orderBy: { order: "asc" },
                take: 1,
              },
            },
            take: 3,
            orderBy: { createdAt: "desc" },
          });

    const featuredServicesPrimary = await db.service.findMany({
      where: {
        companyId,
        isPublished: true,
        isActive: true,
        isFeatured: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const featuredServicesRaw =
      featuredServicesPrimary.length > 0
        ? featuredServicesPrimary
        : await db.service.findMany({
            where: {
              companyId,
              isPublished: true,
              isActive: true,
            },
            include: {
              images: {
                orderBy: { order: "asc" },
                take: 1,
              },
            },
            take: 3,
            orderBy: { createdAt: "desc" },
          });

    const featuredTeamMembers = await db.companyStaff.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        isFeatured: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { hireDate: "asc" }],
    });

    const testimonials = await db.testimonial.findMany({
      where: {
        companyId,
        status: "APPROVED",
      },
      orderBy: [
        { isFeatured: "desc" },
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      take: 6,
    });

    const metadata = company.storeMetadata as {
      contactEmail?: string;
      contactPhone?: string;
    } | null;

    const featuredProducts = featuredProductsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      images: p.images || [],
    }));

    const featuredServices = featuredServicesRaw.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price),
      images: s.images || [],
    }));

    return NextResponse.json({
      featuredProducts,
      featuredServices,
      testimonials,
      featuredTeamMembers: featuredTeamMembers.map((member) => ({
        id: member.id,
        name: member.user.name || "Team Member",
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        jobTitle: member.jobTitle,
        bio: member.bio,
        displayOrder: member.displayOrder || 0,
      })),
      contactEmail: metadata?.contactEmail || null,
      contactPhone: metadata?.contactPhone || null,
    });
  } catch (error) {
    console.error("[Storefront Home Preview] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load storefront preview data" },
      { status: 500 }
    );
  }
}
