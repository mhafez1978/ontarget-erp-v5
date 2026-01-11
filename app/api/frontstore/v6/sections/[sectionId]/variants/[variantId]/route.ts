import type { NextRequest } from "next/server";
import type { GeneratedSection } from "@prisma/client";

async function handleRequest(
  req: NextRequest,
  params: { sectionId: string; variantId: string }
) {
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
  const variantIndex = variants.findIndex((v) => v.id === variantId);
  if (variantIndex === -1)
    return new Response(JSON.stringify({ error: "Variant not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  if (req.method === "PATCH") {
    const body = await req.json();
    const changes = body as Record<string, unknown>;
    const updatedVariant = { ...variants[variantIndex], ...changes };
    variants[variantIndex] = updatedVariant;
    await db.generatedSection.update({
      where: { id: sectionId },
      data: { variants },
    });
    return new Response(
      JSON.stringify({ success: true, variant: updatedVariant }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (req.method === "DELETE") {
    const removed = variants.splice(variantIndex, 1)[0];
    await db.generatedSection.update({
      where: { id: sectionId },
      data: { variants },
    });
    return new Response(JSON.stringify({ success: true, variant: removed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ sectionId: string; variantId: string }> }
) {
  const params = await context.params;
  try {
    return await handleRequest(
      req,
      params as { sectionId: string; variantId: string }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ sectionId: string; variantId: string }> }
) {
  const params = await context.params;
  try {
    return await handleRequest(
      req,
      params as { sectionId: string; variantId: string }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
