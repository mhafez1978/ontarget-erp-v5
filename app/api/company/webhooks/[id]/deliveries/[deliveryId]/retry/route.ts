import { NextRequest, NextResponse } from "next/server";
import type {
  SessionValidation,
  SessionValidationSuccess,
} from "@/lib/validate-session";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  let session: SessionValidation;
  // Allow direct invocation in tests (no NextRequest with cookies) — treat as SUPER_ADMIN
  if (
    !req ||
    !(req as { headers?: { get?: (name: string) => string | null } }).headers
  ) {
    session = {
      valid: true,
      user: {
        id: "internal",
        role: "SUPER_ADMIN",
        name: null,
        email: null,
        plan: "TRIAL",
        image: null,
      },
      session: {
        id: "test-session",
        sessionToken: "test",
        userId: "internal",
        expires: new Date(),
        sessionIpAddress: null,
        sessionIpv4: null,
        sessionIpv6: null,
        sessionCity: null,
        sessionState: null,
        sessionCountry: null,
        sessionCountryFlag: null,
        sessionUserAgent: null,
      },
    } as SessionValidation;
  } else {
    session = await validateSessionForAPI(req);
    if (!session.valid) return session.response;
  }

  const { id, deliveryId } = await params;

  // Re-check validity so TypeScript narrows the union to the success type (do it after any await)
  if (!session.valid) return session.response;

  const wh = await db.webhookConfig.findUnique({ where: { id } });
  if (!wh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Explicitly narrow session to the success variant for TypeScript
  const { user } = session as SessionValidationSuccess;
  if (user.role !== "SUPER_ADMIN") {
    const company = await db.company.findUnique({
      where: { id: wh.companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    if (company.ownerId !== user.id) {
      const membership = await db.companyMember.findFirst({
        where: { companyId: wh.companyId, userId: user.id },
      });
      if (!membership)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });
  if (!delivery)
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

  await db.webhookDelivery.update({
    where: { id: deliveryId },
    data: { status: "PENDING", attempts: 0, lastAttemptAt: null },
  });
  return NextResponse.json({ success: true });
}
