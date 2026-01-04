import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";

const PatchSchema = z.object({
  url: z.string().url().optional(),
  isActive: z.boolean().optional(),
  secret: z.string().optional(),
  events: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await validateSessionForAPI(req);
  if (!session.valid) return session.response;

  const { id } = await params;
  const wh = await (db as PrismaClient).webhookConfig.findUnique({
    where: { id },
  });
  if (!wh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorization
  const user = session.user;
  if (user.role !== "SUPER_ADMIN") {
    const company = await (db as PrismaClient).company.findUnique({
      where: { id: wh.companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    if (company.ownerId !== user.id) {
      const membership = await (db as PrismaClient).companyMember.findFirst({
        where: { companyId: wh.companyId, userId: user.id },
      });
      if (!membership)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  return NextResponse.json({ webhook: wh });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await validateSessionForAPI(req);
  if (!session.valid) return session.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const wh = await (db as PrismaClient).webhookConfig.findUnique({ where: { id } });
  if (!wh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorization
  const user = session.user;
  if (user.role !== "SUPER_ADMIN") {
    const company = await (db as PrismaClient).company.findUnique({
      where: { id: wh.companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    if (company.ownerId !== user.id) {
      const membership = await (db as PrismaClient).companyMember.findFirst({
        where: { companyId: wh.companyId, userId: user.id },
      });
      if (!membership)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const updated = await (db as PrismaClient).webhookConfig.update({
    where: { id },
    data: { ...parsed.data },
  });
  return NextResponse.json({ webhook: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await validateSessionForAPI(req);
  if (!session.valid) return session.response;

  const { id } = await params;
  const wh = await (db as PrismaClient).webhookConfig.findUnique({ where: { id } });
  if (!wh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = session.user;
  if (user.role !== "SUPER_ADMIN") {
    const company = await (db as PrismaClient).company.findUnique({
      where: { id: wh.companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    if (company.ownerId !== user.id) {
      const membership = await (db as PrismaClient).companyMember.findFirst({
        where: { companyId: wh.companyId, userId: user.id },
      });
      if (!membership)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  await (db as PrismaClient).webhookConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // POST to /test to send a test payload
  const session = await validateSessionForAPI(req);
  if (!session.valid) return session.response;

  const { id } = await params;
  const wh = await (db as PrismaClient).webhookConfig.findUnique({ where: { id } });
  if (!wh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = session.user;
  if (user.role !== "SUPER_ADMIN") {
    const company = await (db as PrismaClient).company.findUnique({
      where: { id: wh.companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    if (company.ownerId !== user.id) {
      const membership = await (db as PrismaClient).companyMember.findFirst({
        where: { companyId: wh.companyId, userId: user.id },
      });
      if (!membership)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // send a test payload
  const payload = { type: "webhook.test", timestamp: new Date().toISOString() };
  try {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (wh.secret) {
      const crypto = await import("crypto");
      const sig = crypto
        .createHmac("sha256", wh.secret)
        .update(body)
        .digest("hex");
      headers["X-Signature"] = `sha256=${sig}`;
    }

    const res = await fetch(wh.url, { method: "POST", headers, body });
    const text = await res.text().catch(() => "");

    await (db as PrismaClient).webhookDelivery.create({
      data: {
        webhookId: wh.id,
        payload,
        status: res.ok ? "SUCCESS" : "FAILED",
        responseCode: res.status,
        responseBody: text,
        attempts: 1,
        lastAttemptAt: new Date(),
      },
    });

    return NextResponse.json({ success: res.ok, code: res.status, body: text });
  } catch (err) {
    console.error("Webhook test failed", err);
    await (db as PrismaClient).webhookDelivery.create({
      data: {
        webhookId: wh.id,
        payload,
        status: "FAILED",
        responseBody: String(err),
        attempts: 1,
        lastAttemptAt: new Date(),
      },
    });
    return NextResponse.json({ error: "Failed to send test" }, { status: 500 });
  }
}
