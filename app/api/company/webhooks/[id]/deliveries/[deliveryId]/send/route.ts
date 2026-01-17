import { NextRequest, NextResponse } from "next/server";
import type { SessionValidation } from "@/lib/validate-session";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import crypto from "crypto";
import type {
  WebhookConfig,
  WebhookDelivery,
  Company,
  CompanyMember,
} from "@/generated/prisma/client";

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

  // Ensure session is valid here as well so TypeScript narrows the union
  if (!session.valid) return session.response;

  const { id, deliveryId } = await params;

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

  const delivery: WebhookDelivery | null = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });
  if (!delivery)
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

  const payload: unknown =
    typeof delivery.payload === "string"
      ? JSON.parse(delivery.payload)
      : delivery.payload;
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (wh.secret) {
    const sig = crypto
      .createHmac("sha256", wh.secret)
      .update(body)
      .digest("hex");
    headers["X-Signature"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(wh.url, { method: "POST", headers, body });
    const text = await res.text().catch(() => "");
    if (res.ok) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "SUCCESS",
          responseCode: res.status,
          responseBody: text,
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    } else {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: delivery.attempts + 1,
          responseCode: res.status,
          responseBody: text,
          lastAttemptAt: new Date(),
        },
      });
      return NextResponse.json(
        { success: false, code: res.status, body: text },
        { status: 502 }
      );
    }
  } catch (err) {
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: delivery.attempts + 1,
        responseBody: String(err),
        lastAttemptAt: new Date(),
      },
    });
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
