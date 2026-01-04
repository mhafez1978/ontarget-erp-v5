import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import type { WebhookConfig, Company, CompanyMember } from "@prisma/client";
import { z } from "zod";

const CreateSchema = z.object({
  companyId: z.string(),
  url: z.string().url(),
  isActive: z.boolean().optional(),
  secret: z.string().optional(),
  events: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await validateSessionForAPI(req);
  if (!session.valid) return session.response;

  try {
    // Admins can query all webhooks; otherwise filter to companies where user is owner or member
    const user = session.user;
    if (user.role === "SUPER_ADMIN") {
      const webhooks: WebhookConfig[] = await db.webhookConfig.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ webhooks });
    }

    // find companies owned by user
    const owned = await db.company.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    const ownedIds = owned.map((c) => c.id);

    // find companies where user is a member
    const memberships = await db.companyMember.findMany({
      where: { userId: user.id },
      select: { companyId: true },
    });
    const memberIds = memberships.map((m) => m.companyId);

    const companyIds = Array.from(new Set([...ownedIds, ...memberIds]));

    // If no company IDs, return empty list early
    if (companyIds.length === 0) {
      return NextResponse.json({ webhooks: [], available: true });
    }

    const webhooks: WebhookConfig[] = await db.webhookConfig.findMany({
      where: { companyId: { in: companyIds } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ webhooks, available: true });
  } catch (err: any) {
    console.error("[Webhooks] GET error:", err);
    // If the webhook table is missing in dev/test, return an empty array instead of 500
    if (
      err &&
      (err.code === "P2021" ||
        err.meta?.modelName === "WebhookConfig" ||
        /Prisma/.test(err.name) ||
        (err.message && /Prisma/.test(err.message)))
    ) {
      console.warn(
        "[Webhooks] Prisma error while fetching webhooks; returning empty list."
      );
      // Return success with available=false so the frontend can show a non-fatal notice
      return NextResponse.json({ webhooks: [], available: false });
    }

    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await validateSessionForAPI(req);
  if (!session.valid) return session.response;

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const {
    companyId,
    url,
    isActive = true,
    secret = null,
    events = ["lead.created"],
  } = parsed.data;

  // Authorization: user must be owner or SUPER_ADMIN; simple check using user's companyIds
  const user = session.user;

  // Authorization: ensure user owns or is a member of the company (or SUPER_ADMIN)
  if (user.role !== "SUPER_ADMIN") {
    const company: Company | null = await db.company.findUnique({
      where: { id: companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    if (company.ownerId !== user.id) {
      // check membership
      const membership: CompanyMember | null = await db.companyMember.findFirst(
        {
          where: { companyId, userId: user.id },
        }
      );
      if (!membership)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  try {
    const wh: WebhookConfig = await db.webhookConfig.create({
      data: { companyId, url, isActive, secret, events },
    });

    return NextResponse.json({ webhook: wh });
  } catch (err: any) {
    console.error("[Webhooks] POST error creating webhook:", err);
    if (
      err &&
      (err.code === "P2021" || err.meta?.modelName === "WebhookConfig")
    ) {
      return NextResponse.json(
        { error: "Webhook storage not available" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
