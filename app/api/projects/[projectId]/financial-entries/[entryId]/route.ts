import { Prisma, ProjectEntryType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import {
  deriveFinancialTotalsForUpdate,
  loadProjectContext,
  parseDecimalInput,
} from "../helpers";
const entryTypes = new Set<string>(["EXPENSE", "PURCHASE"]);

function sanitizeCurrency(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  return normalized === "" ? undefined : normalized;
}

function buildOccurrenceDate(value: unknown) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("occurrenceDate must be a valid date");
  }

  return parsed;
}

async function loadEntry(entryId: string) {
  return db.projectFinancialEntry.findUnique({
    where: { id: entryId },
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
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; entryId: string }>;
  }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const { entryId } = await params;
    const entry = await loadEntry(entryId);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const contextResult = await loadProjectContext({
      projectId: entry.projectId,
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

    await createAuditLog({
      userId,
      companyId: contextResult.context.project.companyId,
      action: AUDIT_ACTIONS.PROJECT_FINANCIAL_ENTRIES_VIEWED,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: contextResult.context.project.id,
      description: `Viewed financial entry ${entryId}`,
      metadata: {
        projectId: entry.projectId,
        entryId,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Error fetching financial entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; entryId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const { entryId } = await params;
    const body = await request.json();

    const entry = await db.projectFinancialEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const contextResult = await loadProjectContext({
      projectId: entry.projectId,
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

    if (body.entryType && !entryTypes.has(body.entryType)) {
      return NextResponse.json(
        { error: "entryType must be EXPENSE or PURCHASE" },
        { status: 400 }
      );
    }

    const costInput = parseDecimalInput(body.cost, "cost");
    const markupAmountInput = parseDecimalInput(
      body.markupAmount,
      "markupAmount"
    );
    const markupPercentInput = parseDecimalInput(
      body.markupPercent,
      "markupPercent"
    );

    if (costInput && costInput.lt(0)) {
      return NextResponse.json(
        { error: "cost must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    if (markupAmountInput && markupAmountInput.lt(0)) {
      return NextResponse.json(
        { error: "markupAmount must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    if (markupPercentInput && markupPercentInput.lt(0)) {
      return NextResponse.json(
        { error: "markupPercent must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    const totals = deriveFinancialTotalsForUpdate({
      baseCost: new Prisma.Decimal(entry.cost),
      baseMarkupAmount: entry.markupAmount,
      baseMarkupPercent: entry.markupPercent,
      costInput,
      markupAmountInput,
      markupPercentInput,
    });

    let occurrenceDate: Date | undefined;
    try {
      occurrenceDate = buildOccurrenceDate(body.occurrenceDate);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      );
    }

    const currency = sanitizeCurrency(body.currency);

    const updateData: Prisma.ProjectFinancialEntryUpdateInput = {
      description:
        body.description !== undefined ? body.description : entry.description,
      vendor: body.vendor !== undefined ? body.vendor : entry.vendor,
      referenceId:
        body.referenceId !== undefined ? body.referenceId : entry.referenceId,
      amount: totals.amount,
      cost: totals.cost,
      markupAmount: totals.markupAmount,
      markupPercent: totals.markupPercent,
      currency: currency ?? entry.currency,
      occurrenceDate: occurrenceDate ?? entry.occurrenceDate,
      receiptUrl:
        body.receiptUrl !== undefined ? body.receiptUrl : entry.receiptUrl,
      notes: body.notes !== undefined ? body.notes : entry.notes,
    };

    if (body.entryType) {
      updateData.entryType = body.entryType as ProjectEntryType;
    }

    const updatedEntry = await db.projectFinancialEntry.update({
      where: { id: entryId },
      data: updateData,
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
      action: AUDIT_ACTIONS.PROJECT_FINANCIAL_ENTRY_UPDATED,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: updatedEntry.id,
      description: `Updated ${updatedEntry.entryType.toLowerCase()} entry`,
      metadata: {
        projectId: entry.projectId,
        entryId: updatedEntry.id,
      },
    });

    return NextResponse.json({ success: true, entry: updatedEntry });
  } catch (error) {
    console.error("Error updating financial entry:", error);
    return NextResponse.json(
      { error: "Failed to update financial entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; entryId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const { entryId } = await params;

    const entry = await db.projectFinancialEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const contextResult = await loadProjectContext({
      projectId: entry.projectId,
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

    await db.projectFinancialEntry.delete({ where: { id: entryId } });

    await createAuditLog({
      userId,
      companyId: contextResult.context.project.companyId,
      action: AUDIT_ACTIONS.PROJECT_FINANCIAL_ENTRY_DELETED,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: entryId,
      description: `Deleted financial entry ${entryId}`,
      metadata: {
        projectId: entry.projectId,
        entryId,
        entryType: entry.entryType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting financial entry:", error);
    return NextResponse.json(
      { error: "Failed to delete financial entry" },
      { status: 500 }
    );
  }
}
