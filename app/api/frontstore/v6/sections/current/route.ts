import type { NextRequest } from "next/server";
import type { GeneratedSection } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
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

    // Try to find an existing HERO section for this company to act as the working sandbox
    let section = (await db.generatedSection.findFirst({
      where: { companyId, kind: "HERO" },
    })) as GeneratedSection | null;

    if (!section) {
      // create a starter HERO section
      section = (await db.generatedSection.create({
        data: {
          companyId,
          kind: "HERO",
          schema: {},
          variants: [],
        },
      })) as GeneratedSection;
    }

    return new Response(JSON.stringify({ success: true, section }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
