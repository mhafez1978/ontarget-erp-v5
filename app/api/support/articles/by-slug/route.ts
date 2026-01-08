import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

function buildAccessibleCompanyIds(user: {
  ownedCompanies: { id: string }[];
  companyMemberships: { companyId: string }[];
}) {
  const owned = user.ownedCompanies?.map((c) => c.id) ?? [];
  const member = user.companyMemberships?.map((m) => m.companyId) ?? [];
  return Array.from(new Set([...owned, ...member]));
}

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const article = await db.supportArticle.findFirst({
      where: { slug },
      select: {
        id: true,
        companyId: true,
        authorId: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        tags: true,
        content: true,
        readTimeMinutes: true,
        status: true,
        isGlobal: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;

    const dbUser = await db.user.findUnique({
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

    const accessibleCompanyIds = dbUser
      ? buildAccessibleCompanyIds(dbUser)
      : [];

    const isAuthor = article.authorId === userId;
    const canManageByCompany =
      userRole === "SUPER_ADMIN" ||
      (article.companyId !== null &&
        accessibleCompanyIds.includes(article.companyId));
    const canEdit = isAuthor || canManageByCompany;
    const canDelete = canEdit;

    return NextResponse.json({
      article: {
        ...article,
        tags: article.tags ? article.tags.split(",").map((t) => t.trim()) : [],
        canEdit,
        canDelete,
      },
    });
  } catch (error) {
    console.error("[Support Article] GET by slug error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support article" },
      { status: 500 }
    );
  }
}
