import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import type { SessionUser } from "@/lib/frontstore/v5-types";
import type { Prisma } from "@/generated/prisma/client";

interface UpdatesTypeProps {
  title?: string;
  slug?: string;
  meta?: Prisma.InputJsonValue;
}

export async function PUT(
  req: NextRequest,
  context: { params?: { pageId?: string } | Promise<{ pageId?: string }> }
) {
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response;
  const user = validation.user as SessionUser;
  const params = (await (context?.params ?? {})) as { pageId?: string };
  const { pageId } = params || {};
  if (!pageId) {
    return new Response(JSON.stringify({ error: "Missing pageId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { title, slug, variants } = body;

    // fetch the page by id or slug; if not found, create it (saveDraft flow creates new page)
    let page = await db.page.findFirst({
      where: { OR: [{ id: pageId }, { slug: pageId }] },
    });

    const companyId = user.companyId || user.ownedCompanies?.[0]?.id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: "No company context" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!page) {
      // create page using provided slug or pageId
      try {
        const newSlug = (slug as string) || pageId;
        page = await db.page.create({
          data: {
            companyId: companyId,
            slug: newSlug || String(Math.random()).slice(2),
            title: (title as string) || "New Page",
            createdBy: user.id,
          },
        });
      } catch (err) {
        console.error("Failed to create page:", err);
        return new Response(
          JSON.stringify({
            error: "Failed to create page (maybe slug conflict)",
          }),
          { status: 500 }
        );
      }
    }

    // ensure company ownership
    if (page.companyId !== companyId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const updates: UpdatesTypeProps = {};
    if (typeof title === "string") updates.title = title;
    if (typeof slug === "string") updates.slug = slug;

    // If variants passed, persist them on the page's publishedDraftId or as metadata
    if (Array.isArray(variants)) {
      const baseMeta =
        page.meta && typeof page.meta === "object" && !Array.isArray(page.meta)
          ? (page.meta as Record<string, unknown>)
          : {};
      updates.meta = {
        ...baseMeta,
        variants,
      } as Prisma.InputJsonValue;
    }

    const updated = await db.page.update({
      where: { id: page.id },
      data: updates,
    });

    return new Response(JSON.stringify({ success: true, page: updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to update page:", err);
    return new Response(JSON.stringify({ error: "Failed to update page" }), {
      status: 500,
    });
  }
}

export async function GET(
  req: NextRequest,
  context: { params?: { pageId?: string } | Promise<{ pageId?: string }> }
) {
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response;
  const params = (await (context?.params ?? {})) as { pageId?: string };
  const { pageId } = params || {};
  if (!pageId) {
    return new Response(JSON.stringify({ error: "Missing pageId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const page = await db.page.findFirst({
      where: { OR: [{ id: pageId }, { slug: pageId }] },
    });
    if (!page)
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    return new Response(JSON.stringify({ page }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to fetch page:", err);
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}
