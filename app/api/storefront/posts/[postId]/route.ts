import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  heroImage: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);

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

    // Load post with company for access checks
    const existingPost = await db.storefrontPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        companyId: true,
        status: true,
        slug: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const companyId = existingPost.companyId;

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
      (m) => m.role === "ADMIN_OWNER" || m.role === "COMPANY_MANAGER"
    );

    const hasAccess =
      userRole === "SUPER_ADMIN" || isOwner || (isMember && isAdminOrManager);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    const data = parsed.data;
    const updateData: {
      title?: string;
      excerpt?: string | null;
      content?: string;
      heroImage?: string | null;
      tags?: string | null;
      status?: string;
      publishedAt?: Date;
      slug?: string;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt || null;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.heroImage !== undefined)
      updateData.heroImage = data.heroImage || null;
    if (data.tags !== undefined)
      updateData.tags =
        data.tags && data.tags.length > 0 ? data.tags.join(",") : null;

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "PUBLISHED" && existingPost.status !== "PUBLISHED") {
        updateData.publishedAt = new Date();
      }
    }

    if (data.slug !== undefined && data.slug.trim().length > 0) {
      let finalSlug = data.slug.trim().toLowerCase().replace(/\s+/g, "-");
      let suffix = 1;
      while (true) {
        const conflict = await db.storefrontPost.findFirst({
          where: {
            companyId,
            slug: finalSlug,
            id: { not: postId },
          },
          select: { id: true },
        });
        if (!conflict) break;
        suffix += 1;
        finalSlug = `${finalSlug}-${suffix}`;
      }
      updateData.slug = finalSlug;
    }

    const updated = await db.storefrontPost.update({
      where: { id: postId },
      data: updateData,
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

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("[Storefront Posts] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const existingPost = await db.storefrontPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const companyId = existingPost.companyId;

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
      (m) => m.role === "ADMIN_OWNER" || m.role === "COMPANY_MANAGER"
    );

    const hasAccess =
      userRole === "SUPER_ADMIN" || isOwner || (isMember && isAdminOrManager);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    await db.storefrontPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Storefront Posts] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
