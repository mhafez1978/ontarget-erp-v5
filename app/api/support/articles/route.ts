// // import { NextRequest, NextResponse } from "next/server";
// // import { cookies } from "next/headers";
// // import { z } from "zod";
// // import { db } from "@/lib/db";
// // import { validateSession } from "@/lib/session-manager";

// // const createArticleSchema = z.object({
// //   title: z.string().min(1, "Title is required"),
// //   slug: z.string().optional(),
// //   summary: z.string().optional(),
// //   category: z.string().optional(),
// //   tags: z.array(z.string()).optional(),
// //   content: z.string().min(1, "Content is required"),
// //   companyId: z.string().optional(),
// //   isGlobal: z.boolean().optional(),
// //   readTimeMinutes: z.number().int().min(1).max(60).optional(),
// // });

// // function buildAccessibleCompanyIds(user: {
// //   ownedCompanies: { id: string }[];
// //   companyMemberships: { companyId: string }[];
// // }) {
// //   const owned = user.ownedCompanies?.map((c) => c.id) ?? [];
// //   const member = user.companyMemberships?.map((m) => m.companyId) ?? [];
// //   return Array.from(new Set([...owned, ...member]));
// // }

// // export async function GET(request: NextRequest) {
// //   try {
// //     const cookieStore = await cookies();
// //     const sessionToken = cookieStore.get("sessionToken")?.value;

// //     if (!sessionToken) {
// //       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //     }

// //     const validation = await validateSession(sessionToken);
// //     if (!validation.valid || !validation.user) {
// //       return NextResponse.json(
// //         { error: "Invalid or expired session" },
// //         { status: 401 }
// //       );
// //     }

// //     const { searchParams } = new URL(request.url);
// //     const companyIdParam = searchParams.get("companyId");
// //     const statusParam = searchParams.get("status");

// //     const userId = validation.user.id;
// //     const userRole = validation.user.role;

// //     const user = await db.user.findUnique({
// //       where: { id: userId },
// //       select: {
// //         id: true,
// //         role: true,
// //         name: true,
// //         ownedCompanies: {
// //           select: { id: true },
// //         },
// //         companyMemberships: {
// //           select: { companyId: true },
// //         },
// //       },
// //     });

// //     if (!user) {
// //       return NextResponse.json({ error: "User not found" }, { status: 404 });
// //     }

// //     const accessibleCompanyIds = buildAccessibleCompanyIds(user);

// //     const where: any = {};

// //     if (companyIdParam) {
// //       if (
// //         userRole !== "SUPER_ADMIN" &&
// //         !accessibleCompanyIds.includes(companyIdParam)
// //       ) {
// //         return NextResponse.json(
// //           { error: "Access denied to this company" },
// //           { status: 403 }
// //         );
// //       }
// //       where.companyId = companyIdParam;
// //     } else if (userRole !== "SUPER_ADMIN") {
// //       // Non-super admins see articles for companies they can access, plus global articles
// //       where.OR = [
// //         { companyId: { in: accessibleCompanyIds } },
// //         { isGlobal: true },
// //       ];
// //     }

// //     if (statusParam) {
// //       where.status = statusParam.toUpperCase();
// //     }

// //     const supportArticleClient: any = (db as any).supportArticle;
// //     if (
// //       !supportArticleClient ||
// //       typeof supportArticleClient.findMany !== "function"
// //     ) {
// //       console.error(
// //         "[Support Articles] Prisma client is missing SupportArticle model. Run `npx prisma generate` and restart the dev server."
// //       );
// //       return NextResponse.json({ articles: [] });
// //     }

// //     const articles = await supportArticleClient.findMany({
// //       where,
// //       orderBy: [{ createdAt: "desc" }],
// //       select: {
// //         id: true,
// //         title: true,
// //         slug: true,
// //         summary: true,
// //         category: true,
// //         tags: true,
// //         readTimeMinutes: true,
// //         status: true,
// //         isGlobal: true,
// //         companyId: true,
// //         authorId: true,
// //         createdAt: true,
// //         updatedAt: true,
// //         company: {
// //           select: {
// //             id: true,
// //             name: true,
// //           },
// //         },
// //         author: {
// //           select: {
// //             id: true,
// //             name: true,
// //             email: true,
// //           },
// //         },
// //       },
// //     });

// //     // Compute permissions for each article (edit/delete)
// //     const articlesWithPermissions = articles.map((article: any) => {
// //       const isAuthor = article.authorId === userId;
// //       const companyId = article.companyId;
// //       const canManageByCompany =
// //         userRole === "SUPER_ADMIN" ||
// //         (companyId !== null && accessibleCompanyIds.includes(companyId));

// //       return {
// //         id: article.id,
// //         title: article.title,
// //         slug: article.slug,
// //         summary: article.summary,
// //         category: article.category,
// //         tags: article.tags
// //           ? (article.tags as string).split(",").map((t: string) => t.trim())
// //           : [],
// //         readTimeMinutes: article.readTimeMinutes,
// //         status: article.status,
// //         isGlobal: article.isGlobal,
// //         companyId: article.companyId,
// //         companyName: article.company?.name ?? null,
// //         authorId: article.authorId,
// //         authorName: article.author?.name || article.author?.email || "Author",
// //         createdAt: article.createdAt,
// //         updatedAt: article.updatedAt,
// //         canEdit: isAuthor || canManageByCompany,
// //         canDelete: isAuthor || canManageByCompany,
// //       };
// //     });

// //     return NextResponse.json({ articles: articlesWithPermissions });
// //   } catch (error) {
// //     console.error("[Support Articles] GET error:", error);
// //     return NextResponse.json(
// //       { error: "Failed to fetch support articles" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // export async function POST(request: NextRequest) {
// //   try {
// //     const cookieStore = await cookies();
// //     const sessionToken = cookieStore.get("sessionToken")?.value;

// //     if (!sessionToken) {
// //       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //     }

// //     const validation = await validateSession(sessionToken);
// //     if (!validation.valid || !validation.user) {
// //       return NextResponse.json(
// //         { error: "Invalid or expired session" },
// //         { status: 401 }
// //       );
// //     }

// //     const body = await request.json();
// //     const parsed = createArticleSchema.safeParse(body);

// //     if (!parsed.success) {
// //       const errors = parsed.error.issues.map((issue) => ({
// //         field: issue.path.join("."),
// //         message: issue.message,
// //       }));
// //       return NextResponse.json(
// //         { error: "Validation failed", errors },
// //         { status: 400 }
// //       );
// //     }

// //     const {
// //       title,
// //       slug,
// //       summary,
// //       category,
// //       tags,
// //       content,
// //       companyId,
// //       isGlobal,
// //       readTimeMinutes,
// //     } = parsed.data;

// //     const userId = validation.user.id;
// //     const userRole = validation.user.role;

// //     const user = await db.user.findUnique({
// //       where: { id: userId },
// //       select: {
// //         id: true,
// //         role: true,
// //         ownedCompanies: {
// //           select: { id: true },
// //         },
// //         companyMemberships: {
// //           select: { companyId: true, role: true },
// //         },
// //       },
// //     });

// //     if (!user) {
// //       return NextResponse.json({ error: "User not found" }, { status: 404 });
// //     }

// //     const accessibleCompanyIds = buildAccessibleCompanyIds(user);

// //     // Determine target company and permissions
// //     let targetCompanyId: string | null = companyId ?? null;
// //     let targetIsGlobal = isGlobal ?? false;

// //     if (targetIsGlobal) {
// //       if (userRole !== "SUPER_ADMIN") {
// //         return NextResponse.json(
// //           { error: "Only super admins can create global articles" },
// //           { status: 403 }
// //         );
// //       }
// //       // Global article can have null companyId
// //       targetCompanyId = null;
// //     } else if (targetCompanyId) {
// //       if (
// //         userRole !== "SUPER_ADMIN" &&
// //         !accessibleCompanyIds.includes(targetCompanyId)
// //       ) {
// //         return NextResponse.json(
// //           { error: "Access denied to this company" },
// //           { status: 403 }
// //         );
// //       }
// //     }

// //     // Generate slug if not provided
// //     const baseSlug =
// //       slug && slug.trim().length > 0
// //         ? slug.trim().toLowerCase().replace(/\s+/g, "-")
// //         : title.trim().toLowerCase().replace(/\s+/g, "-");

// //     let finalSlug = baseSlug;
// //     let suffix = 1;
// //     // eslint-disable-next-line no-constant-condition
// //     while (true) {
// //       const supportArticleClient: any = (db as any).supportArticle;
// //       if (
// //         !supportArticleClient ||
// //         typeof supportArticleClient.findFirst !== "function"
// //       ) {
// //         console.error(
// //           "[Support Articles] Prisma client is missing SupportArticle model. Run `npx prisma generate` and restart the dev server."
// //         );
// //         return NextResponse.json(
// //           { error: "SupportArticle model is not available in Prisma client" },
// //           { status: 500 }
// //         );
// //       }

// //       const existing = await supportArticleClient.findFirst({
// //         where: {
// //           companyId: targetCompanyId,
// //           slug: finalSlug,
// //         },
// //         select: { id: true },
// //       });
// //       if (!existing) break;
// //       suffix += 1;
// //       finalSlug = `${baseSlug}-${suffix}`;
// //     }

// //     const supportArticleClient: any = (db as any).supportArticle;
// //     if (
// //       !supportArticleClient ||
// //       typeof supportArticleClient.create !== "function"
// //     ) {
// //       console.error(
// //         "[Support Articles] Prisma client is missing SupportArticle model. Run `npx prisma generate` and restart the dev server."
// //       );
// //       return NextResponse.json(
// //         { error: "SupportArticle model is not available in Prisma client" },
// //         { status: 500 }
// //       );
// //     }

// //     const article = await supportArticleClient.create({
// //       data: {
// //         companyId: targetCompanyId,
// //         authorId: userId,
// //         title,
// //         slug: finalSlug,
// //         summary: summary || null,
// //         category: category || null,
// //         tags: tags && tags.length > 0 ? tags.join(",") : null,
// //         content,
// //         isGlobal: targetIsGlobal,
// //         readTimeMinutes: readTimeMinutes ?? 5,
// //         status: "PUBLISHED",
// //       },
// //       select: {
// //         id: true,
// //         title: true,
// //         slug: true,
// //         summary: true,
// //         category: true,
// //         tags: true,
// //         readTimeMinutes: true,
// //         status: true,
// //         isGlobal: true,
// //         companyId: true,
// //         authorId: true,
// //         createdAt: true,
// //         updatedAt: true,
// //       },
// //     });

// //     return NextResponse.json({ article });
// //   } catch (error) {
// //     console.error("[Support Articles] POST error:", error);
// //     return NextResponse.json(
// //       { error: "Failed to create support article" },
// //       { status: 500 }
// //     );
// //   }
// // }

// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { z } from "zod";
// import { db } from "@/lib/db";
// import { validateSession } from "@/lib/session-manager";

// // 1. Updated Schema: Added featuredImage and made content optional for drafts
// const createArticleSchema = z.object({
//   title: z.string().min(1, "Title is required"),
//   slug: z.string().optional(),
//   summary: z.string().optional(),
//   category: z.string().optional(),
//   tags: z.array(z.string()).optional(),
//   content: z.string().optional(), // Made optional to prevent 400 errors on initial draft creation
//   featuredImage: z.string().optional().nullable(), // <--- ADDED THIS
//   companyId: z.string().optional(),
//   isGlobal: z.boolean().optional(),
//   readTimeMinutes: z.number().int().min(1).max(60).optional(),
// });

// function buildAccessibleCompanyIds(user: {
//   ownedCompanies: { id: string }[];
//   companyMemberships: { companyId: string }[];
// }) {
//   const owned = user.ownedCompanies?.map((c) => c.id) ?? [];
//   const member = user.companyMemberships?.map((m) => m.companyId) ?? [];
//   return Array.from(new Set([...owned, ...member]));
// }

// export async function GET(request: NextRequest) {
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

//     const { searchParams } = new URL(request.url);
//     const companyIdParam = searchParams.get("companyId");
//     const statusParam = searchParams.get("status");

//     const userId = validation.user.id;
//     const userRole = validation.user.role;

//     const user = await db.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         role: true,
//         name: true,
//         ownedCompanies: {
//           select: { id: true },
//         },
//         companyMemberships: {
//           select: { companyId: true },
//         },
//       },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const accessibleCompanyIds = buildAccessibleCompanyIds(user);

//     const where: any = {};

//     if (companyIdParam) {
//       if (
//         userRole !== "SUPER_ADMIN" &&
//         !accessibleCompanyIds.includes(companyIdParam)
//       ) {
//         return NextResponse.json(
//           { error: "Access denied to this company" },
//           { status: 403 }
//         );
//       }
//       where.companyId = companyIdParam;
//     } else if (userRole !== "SUPER_ADMIN") {
//       where.OR = [
//         { companyId: { in: accessibleCompanyIds } },
//         { isGlobal: true },
//       ];
//     }

//     if (statusParam) {
//       where.status = statusParam.toUpperCase();
//     }

//     const supportArticleClient: any = (db as any).supportArticle;
//     if (
//       !supportArticleClient ||
//       typeof supportArticleClient.findMany !== "function"
//     ) {
//       return NextResponse.json({ articles: [] });
//     }

//     const articles = await supportArticleClient.findMany({
//       where,
//       orderBy: [{ createdAt: "desc" }],
//       select: {
//         id: true,
//         title: true,
//         slug: true,
//         summary: true,
//         category: true,
//         tags: true,
//         featuredImage: true, // <--- ADDED THIS
//         readTimeMinutes: true,
//         status: true,
//         isGlobal: true,
//         companyId: true,
//         authorId: true,
//         createdAt: true,
//         updatedAt: true,
//         company: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//         author: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     const articlesWithPermissions = articles.map((article: any) => {
//       const isAuthor = article.authorId === userId;
//       const companyId = article.companyId;
//       const canManageByCompany =
//         userRole === "SUPER_ADMIN" ||
//         (companyId !== null && accessibleCompanyIds.includes(companyId));

//       return {
//         id: article.id,
//         title: article.title,
//         slug: article.slug,
//         summary: article.summary,
//         category: article.category,
//         tags: article.tags
//           ? (article.tags as string).split(",").map((t: string) => t.trim())
//           : [],
//         featuredImage: article.featuredImage, // <--- ADDED THIS
//         readTimeMinutes: article.readTimeMinutes,
//         status: article.status,
//         isGlobal: article.isGlobal,
//         companyId: article.companyId,
//         companyName: article.company?.name ?? null,
//         authorId: article.authorId,
//         authorName: article.author?.name || article.author?.email || "Author",
//         createdAt: article.createdAt,
//         updatedAt: article.updatedAt,
//         canEdit: isAuthor || canManageByCompany,
//         canDelete: isAuthor || canManageByCompany,
//       };
//     });

//     return NextResponse.json({ articles: articlesWithPermissions });
//   } catch (error) {
//     console.error("[Support Articles] GET error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch support articles" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
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

//     const body = await request.json();
//     const parsed = createArticleSchema.safeParse(body);

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
//       slug,
//       summary,
//       category,
//       tags,
//       content,
//       featuredImage, // <--- Destructure this
//       companyId,
//       isGlobal,
//       readTimeMinutes,
//     } = parsed.data;

//     const userId = validation.user.id;
//     const userRole = validation.user.role;

//     const user = await db.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         role: true,
//         ownedCompanies: {
//           select: { id: true },
//         },
//         companyMemberships: {
//           select: { companyId: true, role: true },
//         },
//       },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const accessibleCompanyIds = buildAccessibleCompanyIds(user);

//     let targetCompanyId: string | null = companyId ?? null;
//     let targetIsGlobal = isGlobal ?? false;

//     if (targetIsGlobal) {
//       if (userRole !== "SUPER_ADMIN") {
//         return NextResponse.json(
//           { error: "Only super admins can create global articles" },
//           { status: 403 }
//         );
//       }
//       targetCompanyId = null;
//     } else if (targetCompanyId) {
//       if (
//         userRole !== "SUPER_ADMIN" &&
//         !accessibleCompanyIds.includes(targetCompanyId)
//       ) {
//         return NextResponse.json(
//           { error: "Access denied to this company" },
//           { status: 403 }
//         );
//       }
//     }

//     const baseSlug =
//       slug && slug.trim().length > 0
//         ? slug.trim().toLowerCase().replace(/\s+/g, "-")
//         : title.trim().toLowerCase().replace(/\s+/g, "-");

//     let finalSlug = baseSlug;
//     let suffix = 1;
//     // eslint-disable-next-line no-constant-condition
//     while (true) {
//       const supportArticleClient: any = (db as any).supportArticle;
//       if (
//         !supportArticleClient ||
//         typeof supportArticleClient.findFirst !== "function"
//       ) {
//         return NextResponse.json(
//           { error: "SupportArticle model is not available in Prisma client" },
//           { status: 500 }
//         );
//       }

//       const existing = await supportArticleClient.findFirst({
//         where: {
//           companyId: targetCompanyId,
//           slug: finalSlug,
//         },
//         select: { id: true },
//       });
//       if (!existing) break;
//       suffix += 1;
//       finalSlug = `${baseSlug}-${suffix}`;
//     }

//     const supportArticleClient: any = (db as any).supportArticle;
//     if (
//       !supportArticleClient ||
//       typeof supportArticleClient.create !== "function"
//     ) {
//       return NextResponse.json(
//         { error: "SupportArticle model is not available in Prisma client" },
//         { status: 500 }
//       );
//     }

//     const article = await supportArticleClient.create({
//       data: {
//         companyId: targetCompanyId,
//         authorId: userId,
//         title,
//         slug: finalSlug,
//         summary: summary || null,
//         category: category || null,
//         tags: tags && tags.length > 0 ? tags.join(",") : null,
//         content: content || "",
//         featuredImage: featuredImage || null, // <--- SAVE THIS
//         isGlobal: targetIsGlobal,
//         readTimeMinutes: readTimeMinutes ?? 5,
//         status: "PUBLISHED",
//       },
//       select: {
//         id: true,
//         title: true,
//         slug: true,
//         summary: true,
//         category: true,
//         tags: true,
//         featuredImage: true, // <--- RETURN THIS
//         readTimeMinutes: true,
//         status: true,
//         isGlobal: true,
//         companyId: true,
//         authorId: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     return NextResponse.json({ article });
//   } catch (error) {
//     console.error("[Support Articles] POST error:", error);
//     return NextResponse.json(
//       { error: "Failed to create support article" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
  featuredImage: z.string().optional().nullable(),
  companyId: z.string().optional(),
  isGlobal: z.boolean().optional(),
  readTimeMinutes: z.number().int().min(1).max(60).optional(),
});

function buildAccessibleCompanyIds(user: {
  ownedCompanies: { id: string }[];
  companyMemberships: { companyId: string }[];
  companyStaff: { companyId: string }[];
}) {
  const owned = user.ownedCompanies?.map((c) => c.id) ?? [];
  const member = user.companyMemberships?.map((m) => m.companyId) ?? [];
  const staff = user.companyStaff?.map((s) => s.companyId) ?? [];
  return Array.from(new Set([...owned, ...member, ...staff]));
}

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get("companyId");
    const statusParam = searchParams.get("status");

    const userId = validation.user.id;
    const userRole = validation.user.role;

    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        ownedCompanies: {
          select: { id: true },
        },
        companyMemberships: {
          select: { companyId: true },
        },
        companyStaff: {
          select: { companyId: true },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const accessibleCompanyIds = buildAccessibleCompanyIds(dbUser);

    const where: Record<string, unknown> = {};

    if (companyIdParam) {
      if (
        userRole !== "SUPER_ADMIN" &&
        !accessibleCompanyIds.includes(companyIdParam)
      ) {
        return NextResponse.json(
          { error: "Access denied to this company" },
          { status: 403 }
        );
      }
      where.companyId = companyIdParam;
    } else if (userRole !== "SUPER_ADMIN") {
      where.OR = [
        { companyId: { in: accessibleCompanyIds } },
        { isGlobal: true },
      ];
    }

    if (statusParam) {
      where.status = statusParam.toUpperCase();
    }

    const supportArticleClient: typeof db.supportArticle = db.supportArticle;
    if (
      !supportArticleClient ||
      typeof supportArticleClient.findMany !== "function"
    ) {
      return NextResponse.json({ articles: [] });
    }

    const articles = await supportArticleClient.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        tags: true,
        featuredImage: true,
        readTimeMinutes: true,
        status: true,
        isGlobal: true,
        companyId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    type ArticleDbResult = {
      id: string;
      title: string;
      slug: string;
      summary: string | null;
      category: string | null;
      tags: string | null;
      featuredImage: string | null;
      readTimeMinutes: number | null;
      status: string;
      isGlobal: boolean;
      companyId: string | null;
      authorId: string;
      createdAt: Date;
      updatedAt: Date;
      company?: { id: string; name: string } | null;
      author?: { id: string; name: string | null; email: string | null } | null;
    };

    const articlesWithPermissions = articles.map((article: ArticleDbResult) => {
      const isAuthor = article.authorId === userId;
      const companyId = article.companyId;
      const canManageByCompany =
        userRole === "SUPER_ADMIN" ||
        (companyId !== null && accessibleCompanyIds.includes(companyId));

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        category: article.category,
        tags: article.tags
          ? article.tags.split(",").map((t: string) => t.trim())
          : [],
        featuredImage: article.featuredImage,
        readTimeMinutes: article.readTimeMinutes,
        status: article.status,
        isGlobal: article.isGlobal,
        companyId: article.companyId,
        companyName: article.company?.name ?? null,
        authorId: article.authorId,
        authorName: article.author?.name || article.author?.email || "Author",
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        canEdit: isAuthor || canManageByCompany,
        canDelete: isAuthor || canManageByCompany,
      };
    });

    return NextResponse.json({ articles: articlesWithPermissions });
  } catch (error) {
    console.error("[Support Articles] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const body = await request.json();
    const parsed = createArticleSchema.safeParse(body);

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
      slug,
      summary,
      category,
      tags,
      content,
      featuredImage,
      companyId,
      isGlobal,
      readTimeMinutes,
    } = parsed.data;

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
        companyStaff: {
          select: { companyId: true },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const accessibleCompanyIds = buildAccessibleCompanyIds(dbUser);

    let targetCompanyId: string | null = companyId ?? null;
    const targetIsGlobal = isGlobal ?? false;

    if (targetIsGlobal) {
      if (userRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only super admins can create global articles" },
          { status: 403 }
        );
      }
      targetCompanyId = null;
    } else if (targetCompanyId) {
      if (
        userRole !== "SUPER_ADMIN" &&
        !accessibleCompanyIds.includes(targetCompanyId)
      ) {
        return NextResponse.json(
          { error: "Access denied to this company" },
          { status: 403 }
        );
      }
    }

    // --- FIXED SLUG GENERATION ---
    // 1. Determine source string
    const rawSlug = slug && slug.trim().length > 0 ? slug : title;

    // 2. Clean it: Lowercase -> Remove non-alphanumeric chars -> Remove leading/trailing dashes
    const baseSlug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // Replace colons, spaces, symbols with dash
      .replace(/^-+|-+$/g, ""); // Remove dashes from start or end

    let finalSlug = baseSlug;
    let suffix = 1;

    while (true) {
      const supportArticleClient: typeof db.supportArticle = db.supportArticle;
      if (
        !supportArticleClient ||
        typeof supportArticleClient.findFirst !== "function"
      ) {
        return NextResponse.json(
          { error: "SupportArticle model is not available in Prisma client" },
          { status: 500 }
        );
      }

      const existing = await supportArticleClient.findFirst({
        where: {
          companyId: targetCompanyId,
          slug: finalSlug,
        },
        select: { id: true },
      });
      if (!existing) break;
      suffix += 1;
      finalSlug = `${baseSlug}-${suffix}`;
    }

    const supportArticleClient: typeof db.supportArticle = db.supportArticle;
    if (
      !supportArticleClient ||
      typeof supportArticleClient.create !== "function"
    ) {
      return NextResponse.json(
        { error: "SupportArticle model is not available in Prisma client" },
        { status: 500 }
      );
    }

    const article = await supportArticleClient.create({
      data: {
        companyId: targetCompanyId,
        authorId: userId,
        title,
        slug: finalSlug,
        summary: summary || null,
        category: category || null,
        tags: tags && tags.length > 0 ? tags.join(",") : null,
        content: content || "",
        featuredImage: featuredImage || null,
        isGlobal: targetIsGlobal,
        readTimeMinutes: readTimeMinutes ?? 5,
        status: "Draft",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        tags: true,
        featuredImage: true,
        readTimeMinutes: true,
        status: true,
        isGlobal: true,
        companyId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error("[Support Articles] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create support article" },
      { status: 500 }
    );
  }
}
