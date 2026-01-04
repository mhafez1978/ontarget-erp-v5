import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { WebhookDelivery, WebhookConfig } from "@prisma/client";

// Lightweight processing endpoint to be called by a cron (or invoked manually) to process pending deliveries
export async function POST(req: NextRequest) {
  try {
    // Protect with processor secret (only enforced when secret is configured)
    const headerSecret =
      req.headers && typeof req.headers.get === "function"
        ? req.headers.get("x-processor-secret")
        : null;
    const expected = process.env.WEBHOOK_PROCESSOR_SECRET || null;
    if (expected && headerSecret !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // find up to 50 pending deliveries with attempts < 5
    let pending: WebhookDelivery[] = [];
    try {
      pending = await db.webhookDelivery.findMany({
        where: { status: "PENDING", attempts: { lt: 5 } },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
    } catch (err: any) {
      if (
        err &&
        (err.code === "P2021" || err.meta?.modelName === "WebhookDelivery")
      ) {
        console.warn(
          "[Webhooks] WebhookDelivery table missing; nothing to process."
        );
        return NextResponse.json({ processed: 0 });
      }
      throw err;
    }

    for (const d of pending) {
      // fetch webhook
      const wh: WebhookConfig | null = await db.webhookConfig.findUnique({
        where: { id: d.webhookId },
      });
      if (!wh) {
        await db.webhookDelivery.update({
          where: { id: d.id },
          data: { status: "FAILED" },
        });
        continue;
      }

      // payload is stored as Prisma Json - treat as unknown and stringify safely
      const payload: unknown =
        typeof d.payload === "string" ? JSON.parse(d.payload) : d.payload;
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

      let success = false;
      try {
        const res = await fetch(wh.url, { method: "POST", headers, body });
        const text = await res.text().catch(() => "");
        if (res.ok) {
          success = true;
          await db.webhookDelivery.update({
            where: { id: d.id },
            data: {
              status: "SUCCESS",
              responseCode: res.status,
              responseBody: text,
              attempts: d.attempts + 1,
              lastAttemptAt: new Date(),
            },
          });
        } else {
          await db.webhookDelivery.update({
            where: { id: d.id },
            data: {
              attempts: d.attempts + 1,
              responseCode: res.status,
              responseBody: text,
              lastAttemptAt: new Date(),
            },
          });
        }
      } catch (err) {
        await db.webhookDelivery.update({
          where: { id: d.id },
          data: {
            attempts: d.attempts + 1,
            responseBody: String(err),
            lastAttemptAt: new Date(),
          },
        });
      }

      // mark final failure if attempts reached threshold
      if (!success && d.attempts + 1 >= 5) {
        await db.webhookDelivery.update({
          where: { id: d.id },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ processed: pending.length });
  } catch (err) {
    console.error("Webhook processor error", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
