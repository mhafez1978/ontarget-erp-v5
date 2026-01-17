import type { NextRequest } from "next/server";
import type { GeneratedSection } from "@/generated/prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sectionId: string; variantId: string }> }
) {
  const params = await context.params;


  try {
    const { sectionId, variantId } = params;

    const { pathToFileURL } = await import("url");
    const vs = await import(
      pathToFileURL(`${process.cwd()}/lib/validate-session.ts`).href
    );
    const validation = await vs.validateSessionForAPI(req);
    if (!validation.valid) return validation.response;
    const user = validation.user;
    const firstCompany = user.ownedCompanies?.[0];
    const companyId = user.companyId || firstCompany?.id;
    if (!companyId)
      return new Response(JSON.stringify({ error: "No company context" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

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

    if (section.companyId !== companyId)
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });

    const variants = Array.isArray(section.variants)
      ? (section.variants as unknown as Record<string, unknown>[])
      : [];
    const variant = variants.find((v) => v.id === variantId);
    if (!variant)
      return new Response(JSON.stringify({ error: "Variant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });

    // Create a shallow copy with a new id
    const newVariant = {
      ...variant,
      id: `${variant.id}-dup-${Date.now()}`,
      title: `${variant.title} (copy)`,
    };

    const newVariants = [newVariant, ...variants];

    await db.generatedSection.update({ where: { id: sectionId }, data: { variants: newVariants } });

    return new Response(
      JSON.stringify({ success: true, variant: newVariant }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error duplicating variant:", error);
    return new Response(
      JSON.stringify({ error: "Failed to duplicate variant" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
