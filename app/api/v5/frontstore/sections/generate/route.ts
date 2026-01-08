import { NextRequest, NextResponse } from "next/server";
import type {
  GenerateRequest,
  SessionUser,
  Variant,
  GeneratedSection,
  GenerationJob,
} from "../../../../../../lib/frontstore/v5-types";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response as NextResponse;
  const user = validation.user as SessionUser;
  const firstCompany = user.ownedCompanies?.[0];
  const companyId = user.companyId || firstCompany?.id;
  if (!companyId)
    return NextResponse.json({ error: "No company context" }, { status: 400 });

  try {
    const body = (await req.json()) as GenerateRequest;
    const { pageId, kind, personaId, prompt, layoutHints } = body; // typed request
    const layoutHint = (layoutHints && layoutHints[0]) || undefined;

    // Map legacy/short kinds to normalized SectionKind values
    function normalizeKind(k?: string) {
      const kk = String(k || "").toLowerCase();
      if (
        kk === "menu" ||
        kk === "menu-food" ||
        kk === "menu_food" ||
        kk === "food-menu"
      )
        return "FOOD_MENU";
      if (
        kk === "menu-nav" ||
        kk === "navbar" ||
        kk === "top-nav" ||
        kk === "topnav"
      )
        return "LOGGED_OUT_TOP_NAVBAR"; // default to logged-out unless prompt specifies
      // pass-through for other known kinds
      return String(k || "CUSTOM").toUpperCase();
    }

    const normalizedKind = normalizeKind(kind);

    // Create a GenerationJob for tracking
    const job = (await db.generationJob.create({
      data: {
        companyId: companyId,
        sectionKind: normalizedKind as any,
        personaId: personaId || undefined,
        inputPrompt: prompt || `Generate a ${normalizedKind} section`,
      },
    })) as GenerationJob; // typed job

    // Stub generation: create a GeneratedSection with one variant
    const variantId = randomUUID();
    const generated = (await db.generatedSection.create({
      data: {
        companyId: companyId,
        pageId: pageId || undefined,
        personaId: personaId || undefined,
        kind: kind as any,
        layout: (layoutHint as any) || undefined,
        schema: {
          title: `Sample ${kind} headline`,
          description: `This is a generated ${kind} for company ${companyId}`,
        },
        variants: [
          {
            variantId,
            layout: (layoutHint as any) || "TEXT_ONLY",
            schema: {
              title: `Sample ${kind} headline`,
              description: `This is a generated ${kind} (variant)`,
            },
            meta: { generatedBy: "stub", score: 0.8 },
          },
        ],
        status: "GENERATED",
      },
    })) as unknown as GeneratedSection;

    if (!kind) {
      return NextResponse.json(
        { error: "section kind is required" },
        { status: 400 }
      );
    }

    // Mark job completed (stub)
    await db.generationJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      section: generated,
    });
  } catch (error) {
    console.error("Error generating section:", error);
    return NextResponse.json(
      { error: "Failed to generate section" },
      { status: 500 }
    );
  }
}
