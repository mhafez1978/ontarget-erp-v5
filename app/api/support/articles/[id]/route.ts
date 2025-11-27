// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { z } from "zod";
// import { db } from "@/lib/db";
// import { validateSession } from "@/lib/session-manager";

// const updateArticleSchema = z.object({
//   title: z.string().optional(),
//   summary: z.string().optional(),
//   category: z.string().optional(),
//   tags: z.array(z.string()).optional(),
//   content: z.string().optional(),
//   readTimeMinutes: z.number().int().min(1).max(60).optional(),
//   status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
//   isGlobal: z.boolean().optional(),
// });

// function buildAccessibleCompanyIds(user: {
//   ownedCompanies: { id: string }[];
//   companyMemberships: { companyId: string; role: string }[];
// }) {
//   const owned = user.ownedCompanies?.map((c) => c.id) ?? [];
//   const member = user.companyMemberships?.map((m) => m.companyId) ?? [];
//   return Array.from(new Set([...owned, ...member]));
// }

// async function getUserWithCompanies(userId: string) {
//   return db.user.findUnique({
//     where: { id: userId },
//     select: {
//       id: true,
//       role: true,
//       ownedCompanies: {
//         select: { id: true },
//       },
//       companyMemberships: {
//         select: { companyId: true, role: true },
//       },
//     },
//   });
// }

// function canManageArticle(
//   user: {
//     id: string;
//     role: string;
//     ownedCompanies: { id: string }[];
//     companyMemberships: { companyId: string; role: string }[];
//   },
//   article: { authorId: string; companyId: string | null; isGlobal: boolean }
// ) {
//   const isAuthor = user.id === article.authorId;
//   if (isAuthor) return true;

//   if (user.role === "SUPER_ADMIN") {
//     return true;
//   }

//   const accessibleCompanyIds = buildAccessibleCompanyIds(user);
//   if (article.companyId && accessibleCompanyIds.includes(article.companyId)) {
//     // Admins can manage any article within their company
//     const membership = user.companyMemberships.find(
//       (m) => m.companyId === article.companyId
//     );
//     if (membership && membership.role === "ADMIN") {
//       return true;
//     }
//   }

//   return false;
// }

// export async function GET(
//   _request: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const cookieStore = await cookies();
//     const sessionToken = cookieStore.get("sessionToken")?.value;

//     if (!sessionToken) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const validation = await validateSession(sessionToken);
//     if (!validation.valid || !validation.user) {
//       return NextResponse.json(
//         { error: "Invalid or expired session" },
//         { status: 401 }
//       );
//     }

//     const { id } = await params;

//     const article = await db.supportArticle.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         companyId: true,
//         authorId: true,
//         title: true,
//         slug: true,
//         summary: true,
//         category: true,
//         tags: true,
//         content: true,
//         readTimeMinutes: true,
//         status: true,
//         isGlobal: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     if (!article) {
//       return NextResponse.json(
//         { error: "Article not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       article: {
//         ...article,
//         tags: article.tags
//           ? article.tags.split(",").map((t) => t.trim())
//           : [],
//       },
//     });
//   } catch (error) {
//     console.error("[Support Article] GET error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch support article" },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const cookieStore = await cookies();
//     const sessionToken = cookieStore.get("sessionToken")?.value;

//     if (!sessionToken) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const validation = await validateSession(sessionToken);
//     if (!validation.valid || !validation.user) {
//       return NextResponse.json(
//         { error: "Invalid or expired session" },
//         { status: 401 }
//       );
//     }

//     const user = await getUserWithCompanies(validation.user.id);
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const { id } = await params;

//     const existing = await db.supportArticle.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         authorId: true,
//         companyId: true,
//         isGlobal: true,
//       },
//     });

//     if (!existing) {
//       return NextResponse.json(
//         { error: "Article not found" },
//         { status: 404 }
//       );
//     }

//     if (!canManageArticle(user, existing)) {
//       return NextResponse.json(
//         { error: "You do not have permission to edit this article" },
//         { status: 403 }
//       );
//     }

//     const body = await request.json();
//     const parsed = updateArticleSchema.safeParse(body);

//     if (!parsed.success) {
//       const errors = parsed.error.issues.map((issue) => ({
//         field: issue.path.join("."),
//         message: issue.message,
//       }));
//       return NextResponse.json(
//         { error: "Validation failed", errors },
//         { status: 400 }
//       );
//     }

//     const {
//       title,
//       summary,
//       category,
//       tags,
//       content,
//       readTimeMinutes,
//       status,
//       isGlobal,
//     } = parsed.data;

//     // Only SUPER_ADMIN can toggle global scope
//     if (typeof isGlobal === "boolean" && user.role !== "SUPER_ADMIN") {
//       return NextResponse.json(
//         { error: "Only super admins can change article scope" },
//         { status: 403 }
//       );
//     }

//     const updated = await db.supportArticle.update({
//       where: { id },
//       data: {
//         title: title ?? undefined,
//         summary: summary ?? undefined,
//         category: category ?? undefined,
//         tags: tags ? tags.join(",") : undefined,
//         content: content ?? undefined,
//         readTimeMinutes: readTimeMinutes ?? undefined,
//         status: status ?? undefined,
//         isGlobal: typeof isGlobal === "boolean" ? isGlobal : undefined,
//       },
//       select: {
//         id: true,
//         title: true,
//         slug: true,
//         summary: true,
//         category: true,
//         tags: true,
//         content: true,
//         readTimeMinutes: true,
//         status: true,
//         isGlobal: true,
//         companyId: true,
//         authorId: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     return NextResponse.json({
//       article: {
//         ...updated,
//         tags: updated.tags
//           ? updated.tags.split(",").map((t) => t.trim())
//           : [],
//       },
//     });
//   } catch (error) {
//     console.error("[Support Article] PATCH error:", error);
//     return NextResponse.json(
//       { error: "Failed to update support article" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   _request: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const cookieStore = await cookies();
//     const sessionToken = cookieStore.get("sessionToken")?.value;

//     if (!sessionToken) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const validation = await validateSession(sessionToken);
//     if (!validation.valid || !validation.user) {
//       return NextResponse.json(
//         { error: "Invalid or expired session" },
//         { status: 401 }
//       );
//     }

//     const user = await getUserWithCompanies(validation.user.id);
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const { id } = await params;

//     const existing = await db.supportArticle.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         authorId: true,
//         companyId: true,
//         isGlobal: true,
//       },
//     });

//     if (!existing) {
//       return NextResponse.json(
//         { error: "Article not found" },
//         { status: 404 }
//       );
//     }

//     if (!canManageArticle(user, existing)) {
//       return NextResponse.json(
//         { error: "You do not have permission to delete this article" },
//         { status: 403 }
//       );
//     }

//     await db.supportArticle.delete({
//       where: { id },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("[Support Article] DELETE error:", error);
//     return NextResponse.json(
//       { error: "Failed to delete support article" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";

// 1. Updated Schema to include featuredImage
const updateArticleSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
  featuredImage: z.string().optional().nullable(), // <--- ADDED THIS
  readTimeMinutes: z.number().int().min(1).max(60).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isGlobal: z.boolean().optional(),
});

function buildAccessibleCompanyIds(user: {
  ownedCompanies: { id: string }[];
  companyMemberships: { companyId: string; role: string }[];
}) {
  const owned = user.ownedCompanies?.map((c) => c.id) ?? [];
  const member = user.companyMemberships?.map((m) => m.companyId) ?? [];
  return Array.from(new Set([...owned, ...member]));
}

async function getUserWithCompanies(userId: string) {
  return db.user.findUnique({
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
}

function canManageArticle(
  user: {
    id: string;
    role: string;
    ownedCompanies: { id: string }[];
    companyMemberships: { companyId: string; role: string }[];
  },
  article: { authorId: string; companyId: string | null; isGlobal: boolean }
) {
  const isAuthor = user.id === article.authorId;
  if (isAuthor) return true;

  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  const accessibleCompanyIds = buildAccessibleCompanyIds(user);
  if (article.companyId && accessibleCompanyIds.includes(article.companyId)) {
    // Admins can manage any article within their company
    const membership = user.companyMemberships.find(
      (m) => m.companyId === article.companyId
    );
    if (membership && membership.role === "ADMIN") {
      return true;
    }
  }

  return false;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    const article = await db.supportArticle.findUnique({
      where: { id },
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
        featuredImage: true, // <--- ADDED THIS to select
        readTimeMinutes: true,
        status: true,
        isGlobal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({
      article: {
        ...article,
        tags: article.tags ? article.tags.split(",").map((t) => t.trim()) : [],
      },
    });
  } catch (error) {
    console.error("[Support Article] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support article" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const user = await getUserWithCompanies(validation.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const existing = await db.supportArticle.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        companyId: true,
        isGlobal: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!canManageArticle(user, existing)) {
      return NextResponse.json(
        { error: "You do not have permission to edit this article" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateArticleSchema.safeParse(body);

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
      title,
      summary,
      category,
      tags,
      content,
      featuredImage, // <--- Destructure this
      readTimeMinutes,
      status,
      isGlobal,
    } = parsed.data;

    // Only SUPER_ADMIN can toggle global scope
    if (typeof isGlobal === "boolean" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can change article scope" },
        { status: 403 }
      );
    }

    const updated = await db.supportArticle.update({
      where: { id },
      data: {
        title: title ?? undefined,
        summary: summary ?? undefined,
        category: category ?? undefined,
        tags: tags ? tags.join(",") : undefined,
        content: content ?? undefined,
        featuredImage: featuredImage, // <--- Update this (undefined ignores it, null removes it)
        readTimeMinutes: readTimeMinutes ?? undefined,
        status: status ?? undefined,
        isGlobal: typeof isGlobal === "boolean" ? isGlobal : undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        tags: true,
        content: true,
        featuredImage: true, // <--- Return the updated image
        readTimeMinutes: true,
        status: true,
        isGlobal: true,
        companyId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      article: {
        ...updated,
        tags: updated.tags ? updated.tags.split(",").map((t) => t.trim()) : [],
      },
    });
  } catch (error) {
    console.error("[Support Article] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update support article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const user = await getUserWithCompanies(validation.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const existing = await db.supportArticle.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        companyId: true,
        isGlobal: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!canManageArticle(user, existing)) {
      return NextResponse.json(
        { error: "You do not have permission to delete this article" },
        { status: 403 }
      );
    }

    await db.supportArticle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Support Article] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete support article" },
      { status: 500 }
    );
  }
}
