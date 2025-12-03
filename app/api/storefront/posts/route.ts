import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

const createPostSchema = z.object({
  companyId: z.string(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  heroImage: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;

    const dbUser = await db.user.findUnique({
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

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = dbUser.ownedCompanies.length > 0;
    const isMember = dbUser.companyMemberships.length > 0;
    const isAdminOrManager = dbUser.companyMemberships.some(
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

    const where: any = { companyId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const posts = await db.storefrontPost.findMany({
      where,
      orderBy: [
        { status: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        heroImage: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[Storefront Posts] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const {
      companyId,
      title,
      slug,
      excerpt,
      content,
      heroImage,
      status,
      tags,
    } = parsed.data;

    const userId = validation.user.id;
    const userRole = validation.user.role;

    const dbUser = await db.user.findUnique({
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

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = dbUser.ownedCompanies.length > 0;
    const isMember = dbUser.companyMemberships.length > 0;
    const isAdminOrManager = dbUser.companyMemberships.some(
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

    // Generate slug if not provided
    let finalSlug =
      slug && slug.trim().length > 0
        ? slug.trim().toLowerCase().replace(/\s+/g, "-")
        : title.trim().toLowerCase().replace(/\s+/g, "-");

    // Ensure slug uniqueness per company
    let slugSuffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db.storefrontPost.findFirst({
        where: {
          companyId,
          slug: finalSlug,
        },
        select: { id: true },
      });
      if (!existing) break;
      slugSuffix += 1;
      finalSlug = `${finalSlug}-${slugSuffix}`;
    }

    const now = new Date();
    const publishedAt = status === "PUBLISHED" ? now : undefined;

    const post = await db.storefrontPost.create({
      data: {
        companyId,
        authorId: userId,
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        content,
        heroImage: heroImage || null,
        status,
        tags: tags && tags.length > 0 ? tags.join(",") : null,
        publishedAt,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        heroImage: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[Storefront Posts] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
