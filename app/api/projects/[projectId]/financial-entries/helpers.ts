import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const { Decimal } = Prisma;

const restrictedRoles = new Set(["MANAGER", "STAFF", "CONTRACTOR"]);

type ProjectInfo = {
  id: string;
  companyId: string;
  teamId: string | null;
};

type StaffRecord = {
  id: string;
};

export type ProjectContextResult = {
  project: ProjectInfo;
  staffRecord: StaffRecord | null;
};

export type ProjectContextLoadResult =
  | { ok: true; context: ProjectContextResult }
  | { ok: false; status: number; error: string };

export async function loadProjectContext(options: {
  projectId: string;
  userId: string;
  userRole: string;
  requireStaff?: boolean;
  enforceTeamMembershipForRestrictedRoles?: boolean;
}): Promise<ProjectContextLoadResult> {
  const { projectId, userId, userRole } = options;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      companyId: true,
      teamId: true,
    },
  });

  if (!project) {
    return { ok: false, status: 404, error: "Project not found" };
  }

  const companyAccess = await db.company.findFirst({
    where: {
      id: project.companyId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
        { staff: { some: { userId } } },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!companyAccess) {
    return {
      ok: false,
      status: 403,
      error: "You don't have access to this company",
    };
  }

  const staffRecord = await db.companyStaff.findFirst({
    where: {
      userId,
      companyId: project.companyId,
    },
    select: {
      id: true,
    },
  });

  if (options.requireStaff && !staffRecord) {
    return {
      ok: false,
      status: 403,
      error: "Company staff membership is required",
    };
  }

  const shouldEnforceTeamMembers =
    options.enforceTeamMembershipForRestrictedRoles ?? false;

  if (shouldEnforceTeamMembers && restrictedRoles.has(userRole)) {
    if (!project.teamId) {
      return {
        ok: false,
        status: 403,
        error: "Project is not assigned to a team",
      };
    }

    if (!staffRecord) {
      return {
        ok: false,
        status: 403,
        error: "Team membership is required",
      };
    }

    const membership = await db.teamMember.findFirst({
      where: {
        teamId: project.teamId,
        staffId: staffRecord.id,
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      return {
        ok: false,
        status: 403,
        error: "You are not a member of this project's team",
      };
    }
  }

  return {
    ok: true,
    context: {
      project,
      staffRecord: staffRecord ?? null,
    },
  };
}

export function parseDecimalInput(
  value: unknown,
  fieldName: string
): Decimal | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  try {
    return new Decimal(value as Decimal.Value);
  } catch (error) {
    throw new Error(`${fieldName} must be a valid number`);
  }
}

export function deriveFinancialTotalsForCreate(options: {
  cost: Decimal;
  markupAmount?: Decimal;
  markupPercent?: Decimal;
}): {
  cost: Decimal;
  markupAmount: Decimal;
  markupPercent: Decimal;
  amount: Decimal;
} {
  const markupAmountProvided = options.markupAmount !== undefined;
  const markupPercentProvided = options.markupPercent !== undefined;

  let markupAmount = options.markupAmount ?? new Decimal(0);
  let markupPercent = options.markupPercent ?? new Decimal(0);

  if (markupPercentProvided && !markupAmountProvided) {
    markupAmount = options.cost.mul(markupPercent).div(100);
  }

  if (markupAmountProvided && !markupPercentProvided) {
    markupPercent = options.cost.gt(0)
      ? markupAmount.div(options.cost).mul(100)
      : new Decimal(0);
  }

  const total = options.cost.add(markupAmount);

  return {
    cost: options.cost,
    markupAmount,
    markupPercent,
    amount: total,
  };
}

export function deriveFinancialTotalsForUpdate(options: {
  baseCost: Decimal;
  baseMarkupAmount: Decimal | null;
  baseMarkupPercent: Decimal | null;
  costInput?: Decimal;
  markupAmountInput?: Decimal;
  markupPercentInput?: Decimal;
}): {
  cost: Decimal;
  markupAmount: Decimal;
  markupPercent: Decimal;
  amount: Decimal;
} {
  const hasCostUpdate = options.costInput !== undefined;
  const cost = options.costInput ?? options.baseCost;
  let markupAmount =
    options.markupAmountInput ?? options.baseMarkupAmount ?? new Decimal(0);
  let markupPercent =
    options.markupPercentInput ?? options.baseMarkupPercent ?? new Decimal(0);

  if (
    options.markupPercentInput !== undefined &&
    options.markupAmountInput === undefined
  ) {
    markupAmount = cost.mul(markupPercent).div(100);
  }

  if (
    options.markupAmountInput !== undefined &&
    options.markupPercentInput === undefined
  ) {
    markupPercent = cost.gt(0)
      ? markupAmount.div(cost).mul(100)
      : new Decimal(0);
  }

  if (
    options.markupAmountInput === undefined &&
    options.markupPercentInput === undefined &&
    hasCostUpdate
  ) {
    markupAmount = cost.mul(markupPercent).div(100);
  }

  const total = cost.add(markupAmount);

  return {
    cost,
    markupAmount,
    markupPercent,
    amount: total,
  };
}
