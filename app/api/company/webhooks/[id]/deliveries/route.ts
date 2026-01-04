import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import type {
  WebhookConfig,
  WebhookDelivery,
  Company,
  CompanyMember,
} from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await validateSessionForAPI(req);
  if (!session.valid) return session.response;

  const { id } = await params;

  const wh: WebhookConfig | null = await db.webhookConfig.findUnique({
    where: { id },
  });
  if (!wh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = session.user;
  if (user.role !== "SUPER_ADMIN") {
    const company: Company | null = await db.company.findUnique({
      where: { id: wh.companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    if (company.ownerId !== user.id) {
      const membership: CompanyMember | null = await db.companyMember.findFirst(
        {
          where: { companyId: wh.companyId, userId: user.id },
        }
      );
      if (!membership)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const deliveries: WebhookDelivery[] = await db.webhookDelivery.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ deliveries });
}
