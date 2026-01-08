import { NextRequest, NextResponse } from "next/server";
import type {
  CreatePageRequest,
  SessionUser,
} from "../../../../../lib/frontstore/v5-types";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(req: NextRequest) {
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response as NextResponse;
  const user = validation.user as SessionUser;

  // Prefer explicit query param if present, otherwise use user's company context
  const url = new URL(req.url);
  const qCompanyId = url.searchParams.get("companyId");
  const firstCompany = user.ownedCompanies?.[0];
  const inferredCompanyId = user.companyId || firstCompany?.id;
  const companyId = qCompanyId || inferredCompanyId;

  if (!companyId)
    return NextResponse.json({ error: "No company context" }, { status: 400 });

  // If a query companyId was provided, ensure the user actually belongs to that company
  if (qCompanyId && qCompanyId !== inferredCompanyId) {
    const owns = (user.ownedCompanies || []).some((c) => c.id === qCompanyId);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const pages = await db.page.findMany({
      where: { companyId },
      select: { id: true, title: true, slug: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response as NextResponse;
  const user = validation.user as SessionUser;
  const firstCompany = user.ownedCompanies?.[0];
  const companyId = user.companyId || firstCompany?.id;
  if (!companyId)
    return NextResponse.json({ error: "No company context" }, { status: 400 });

  try {
    const body = (await req.json()) as CreatePageRequest;
    const { slug, title } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "slug and title required" },
        { status: 400 }
      );
    }

    const page = await db.page.create({
      data: {
        companyId: companyId,
        slug,
        title,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
