import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type {
  AcceptRequest,
  AcceptResponseBody,
  SessionUser,
  GeneratedPageDraft,
  GeneratedSection,
} from "../../../../../../../lib/frontstore/v5-types";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  const params = await context.params;
  const { pathToFileURL } = await import("url");
  const vs = await import(
    pathToFileURL(`${process.cwd()}/lib/validate-session.ts`).href
  );
  const validation = await vs.validateSessionForAPI(req);
  if (!validation.valid) return validation.response as NextResponse;
  const user = validation.user as SessionUser; // typed user
  const firstCompany = user.ownedCompanies?.[0];
  const companyId = user.companyId || firstCompany?.id;
  if (!companyId)
    return new Response(JSON.stringify({ error: "No company context" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  try {
    const { sectionId } = params;
    const body = (await req.json()) as AcceptRequest;
    const { variantId, draftId, pageId } = body;

    // Import db dynamically to avoid importing next/ server paths at module-load time during tests
    const { pathToFileURL } = await import("url");
    const dbModule = await import(
      pathToFileURL(`${process.cwd()}/lib/db.ts`).href
    );
    const db = dbModule.db;

    const section = (await db.generatedSection.findUnique({
      where: { id: sectionId },
    })) as GeneratedSection | null;
    if (!section)
      return new Response(JSON.stringify({ error: "Section not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });

    // Determine draft: use provided draftId, else find/create draft for pageId
    let draft = null;
    if (draftId) {
      draft = await db.generatedPageDraft.findUnique({
        where: { id: draftId },
      });
    } else if (pageId) {
      // find existing draft for page
      draft = await db.generatedPageDraft.findFirst({
        where: { pageId, companyId: companyId, status: "DRAFT" },
      });
      if (!draft) {
        draft = await db.generatedPageDraft.create({
          data: {
            companyId: companyId,
            pageId,
            pageSlug: null,
            pageTitle: null,
            sections: [],
            createdBy: user.id,
          },
        });
      }
    } else {
      // create global draft
      draft = await db.generatedPageDraft.create({
        data: {
          companyId: companyId,
          name: "Untitled Draft",
          sections: [],
          createdBy: user.id,
        },
      });
    }

    // Ensure draft exists
    if (!draft) {
      return new Response(
        JSON.stringify({ error: "Draft not found or could not be created" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Append section + variant to draft.sections (array of objects)
    const currSections = Array.isArray(draft.sections)
      ? (draft.sections as { sectionId: string; variantId?: string | null }[])
      : [];
    currSections.push({ sectionId: section.id, variantId: variantId || null });

    await db.generatedPageDraft.update({
      where: { id: draft.id },
      data: { sections: currSections },
    });

    // Update section status to ACCEPTED
    await db.generatedSection.update({
      where: { id: section.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    return new Response(
      JSON.stringify({
        success: true,
        draftId: draft.id,
        sectionId: section.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error accepting section:", error);
    return new Response(JSON.stringify({ error: "Failed to accept section" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
