import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const EventSchema = z.object({
  companyId: z.string().optional(),
  eventType: z.string(),
  payload: z.any(),
});

const BatchSchema = z.object({
  events: z.array(EventSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = BatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const events = parsed.data.events;

    // Use createMany for batching where possible
    const toCreate = events.map((e) => ({
      companyId: e.companyId || null,
      eventType: e.eventType,
      payload: e.payload,
    }));

    try {
      // db.telemetryEvent may not be present until prisma client is generated; use 'any' to be resilient in dev
      await (db as any).telemetryEvent.createMany({ data: toCreate });
    } catch (err: any) {
      // Fallback: individual inserts (some DBs may not support createMany well in some envs)
      // Be resilient to missing table errors (Prisma P2021) — telemetry is optional
      for (const e of toCreate) {
        try {
          await (db as any).telemetryEvent.create({ data: e as any });
        } catch (innerErr: any) {
          // If table missing (P2021) — bail out and log, but do not fail the request
          if (
            innerErr &&
            (innerErr.code === "P2021" ||
              innerErr.meta?.modelName === "TelemetryEvent")
          ) {
            console.warn(
              "[Telemetry] TelemetryEvent table missing or not available; skipping telemetry."
            );
            break;
          }
          // Otherwise rethrow to be handled by outer catch
          throw innerErr;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Telemetry] Error:", error);
    return NextResponse.json(
      { error: "Failed to track events" },
      { status: 500 }
    );
  }
}
