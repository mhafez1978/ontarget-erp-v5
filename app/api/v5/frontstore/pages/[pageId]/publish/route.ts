import { NextRequest, NextResponse } from "next/server";
import type {
  SessionUser,
  GeneratedPageDraft,
} from "../../../../../../../lib/frontstore/v5-types";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  const params = await context.params;
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response;
  const user = validation.user as SessionUser;
  const firstCompany = user.ownedCompanies?.[0];
  const companyId = user.companyId || firstCompany?.id;
  if (!companyId)
    return NextResponse.json({ error: "No company context" }, { status: 400 });

  try {
    const { pageId } = params;

    const page = await db.page.findUnique({ where: { id: pageId } });
    if (!page)
      return NextResponse.json({ error: "Page not found" }, { status: 404 });

    // Find latest DRAFT for this page
    const draft = (await db.generatedPageDraft.findFirst({
      where: { pageId, companyId: companyId, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
    })) as GeneratedPageDraft | null;
    if (!draft)
      return NextResponse.json(
        { error: "No draft found to publish" },
        { status: 404 }
      );

    // Mark draft as published
    await db.generatedPageDraft.update({
      where: { id: draft.id },
      data: { status: "PUBLISHED", version: { increment: 1 } },
    });

    // Associate page.publishedDraftId
    await db.page.update({
      where: { id: pageId },
      data: { publishedDraftId: draft.id },
    });

    return NextResponse.json({ success: true, pageId, draftId: draft.id });
  } catch (error) {
    console.error("Error publishing page:", error);
    return NextResponse.json(
      { error: "Failed to publish page" },
      { status: 500 }
    );
  }
}
