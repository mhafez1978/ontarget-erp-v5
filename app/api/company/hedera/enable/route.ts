import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const body = await request.json();
    const { companyId, enable, historicalAnchoring } = body;

    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 });
    }

    // Check Company Admin or SUPER_ADMIN
    const hasAccess = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: { userId: user.id, role: { in: ["ADMIN", "MANAGER"] } },
            },
          },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const update = await db.companyHederaSetting.upsert({
      where: { companyId },
      create: {
        companyId,
        enabled: !!enable,
        historicalAnchored: !!historicalAnchoring,
        enabledById: user.id,
        enabledAt: new Date(),
      },
      update: {
        enabled: !!enable,
        historicalAnchored: !!historicalAnchoring,
        enabledById: user.id,
        enabledAt: new Date(),
      },
    });

    await db.hederaCompanyAudit.create({
      data: {
        companyId,
        actorId: user.id,
        action: enable ? "ENABLE" : "DISABLE",
        details: { historicalAnchoring: !!historicalAnchoring },
      },
    });

    // If historicalAnchoring requested, create a placeholder job entry (worker will pick it up later)
    if (historicalAnchoring) {
      // TODO: enqueue a historical anchoring job for this company (outbox/worker to be implemented).
      // For now we record the request in the audit log and the CompanyHederaSetting.historicalJobId will be set by worker when job starts.
      await db.hederaCompanyAudit.create({
        data: {
          companyId,
          actorId: user.id,
          action: "HISTORICAL_REQUEST",
          details: { requestedBy: user.id },
        },
      });
    }

    return NextResponse.json({ success: true, update });
  } catch (error) {
    console.error("POST /api/company/hedera/enable error:", error);
    return NextResponse.json({ error: "Failed to update company setting" }, { status: 500 });
  }
}
