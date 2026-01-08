import { ProjectEntryType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";
import {
  deriveFinancialTotalsForCreate,
  loadProjectContext,
  parseDecimalInput,
} from "./helpers";
const entryTypes = new Set<string>(["EXPENSE", "PURCHASE"]);

function sanitizeCurrency(value: unknown) {
  if (typeof value !== "string") {
    return "USD";
  }

  const normalized = value.trim().toUpperCase();
  return normalized === "" ? "USD" : normalized;
}

function buildOccurrenceDate(value: unknown) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("occurrenceDate must be a valid date");
  }

  return parsed;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const { projectId } = await params;
    const entryTypeFilter = request.nextUrl.searchParams.get("entryType");

    if (entryTypeFilter && !entryTypes.has(entryTypeFilter)) {
      return NextResponse.json(
        { error: "Invalid entryType filter" },
        { status: 400 }
      );
    }

    const contextResult = await loadProjectContext({
      projectId,
      userId,
      userRole,
      enforceTeamMembershipForRestrictedRoles: true,
    });

    if (!contextResult.ok) {
      return NextResponse.json(
        { error: contextResult.error },
        { status: contextResult.status }
      );
    }

    const entries = await db.projectFinancialEntry.findMany({
      where: {
        projectId,
        ...(entryTypeFilter
          ? { entryType: entryTypeFilter as ProjectEntryType }
          : {}),
      },
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [{ occurrenceDate: "desc" }, { createdAt: "desc" }],
    });

    await createAuditLog({
      userId,
      companyId: contextResult.context.project.companyId,
      action: AUDIT_ACTIONS.PROJECT_FINANCIAL_ENTRIES_VIEWED,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: contextResult.context.project.id,
      description: `Viewed ${entries.length} financial entries for project`,
      metadata: {
        projectId,
        entryTypeFilter,
        entryCount: entries.length,
      },
    });

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error("Error fetching financial entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial entries" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const { projectId } = await params;
    const body = await request.json();

    const entryType = body.entryType;
    if (!entryType || !entryTypes.has(entryType)) {
      return NextResponse.json(
        { error: "entryType is required and must be EXPENSE or PURCHASE" },
        { status: 400 }
      );
    }

    const parsedCost = parseDecimalInput(body.cost, "cost");
    if (!parsedCost) {
      return NextResponse.json({ error: "cost is required" }, { status: 400 });
    }
    const cost = parsedCost;

    if (cost.lt(0)) {
      return NextResponse.json(
        { error: "cost must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    const markupAmount = parseDecimalInput(body.markupAmount, "markupAmount");
    const markupPercent = parseDecimalInput(
      body.markupPercent,
      "markupPercent"
    );

    if (markupAmount && markupAmount.lt(0)) {
      return NextResponse.json(
        { error: "markupAmount must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    if (markupPercent && markupPercent.lt(0)) {
      return NextResponse.json(
        { error: "markupPercent must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    const totals = deriveFinancialTotalsForCreate({
      cost,
      markupAmount,
      markupPercent,
    });

    let occurrenceDate: Date;
    try {
      occurrenceDate = body.occurrenceDate
        ? buildOccurrenceDate(body.occurrenceDate)
        : new Date();
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      );
    }

    const currency = sanitizeCurrency(body.currency);

    const contextResult = await loadProjectContext({
      projectId,
      userId,
      userRole,
      requireStaff: true,
      enforceTeamMembershipForRestrictedRoles: true,
    });

    if (!contextResult.ok) {
      return NextResponse.json(
        { error: contextResult.error },
        { status: contextResult.status }
      );
    }

    const entry = await db.projectFinancialEntry.create({
      data: {
        projectId,
        entryType: entryType as ProjectEntryType,
        description: body.description ?? null,
        vendor: body.vendor ?? null,
        referenceId: body.referenceId ?? null,
        amount: totals.amount,
        cost: totals.cost,
        markupAmount: totals.markupAmount,
        markupPercent: totals.markupPercent,
        currency,
        occurrenceDate,
        receiptUrl: body.receiptUrl ?? null,
        notes: body.notes ?? null,
        createdById: contextResult.context.staffRecord?.id,
      },
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      userId,
      companyId: contextResult.context.project.companyId,
      action: AUDIT_ACTIONS.PROJECT_FINANCIAL_ENTRY_CREATED,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: entry.id,
      description: `Created ${entry.entryType.toLowerCase()} entry`,
      metadata: {
        projectId,
        entryType: entry.entryType,
        amount: entry.amount.toString(),
        cost: entry.cost.toString(),
        markupAmount: entry.markupAmount?.toString() ?? "0",
        markupPercent: entry.markupPercent?.toString(),
      },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating financial entry:", error);
    return NextResponse.json(
      { error: "Failed to create financial entry" },
      { status: 500 }
    );
  }
}
