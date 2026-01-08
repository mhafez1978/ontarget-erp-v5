import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export type SettingsUsersDb = {
  user: {
    findUnique: (args: unknown) => Promise<{ id: string; role: string } | null>;
    findMany: (args: unknown) => Promise<
      Array<{
        id: string;
        email?: string | null;
        name?: string | null;
        role?: string | null;
        isActive?: boolean;
        plan?: unknown;
        image?: string | null;
        emailVerified?: Date | null;
        createdAt?: Date;
        lastLoginAt?: Date | null;
        trialEndsAt?: Date | null;
        ownedCompanies?: Array<{ id: string; name: string }>;
      }>
    >;
  };
  company: {
    findMany: (
      args: unknown
    ) => Promise<Array<{ id: string; ownerId?: string }>>;
  };
  companyStaff: {
    findMany: (args: unknown) => Promise<Array<{ userId: string }>>;
  };
  companyMember: {
    findMany: (args: unknown) => Promise<Array<{ userId: string }>>;
  };
};

// Small testable helper: performs the core fetch using provided deps
export async function getUsersForSettings(
  userId: string | undefined,
  dbClient: SettingsUsersDb = db as unknown as SettingsUsersDb
): Promise<{ status: number; body: unknown }> {
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const currentUser = await dbClient.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!currentUser) {
    return { status: 404, body: { error: "User not found" } };
  }

  // Only SUPER_ADMIN and ADMIN can view users
  if (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "ADMIN") {
    return {
      status: 403,
      body: { error: "Only super admins and admins can view users" },
    };
  }

  let users;

  if (currentUser.role === "SUPER_ADMIN") {
    // SUPER_ADMIN: Get ALL users from all companies
    users = await dbClient.user.findMany({
      orderBy: [
        { isActive: "desc" }, // Active users first
        { createdAt: "desc" }, // Then by creation date
      ],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        plan: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        trialEndsAt: true,
        ownedCompanies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } else {
    // ADMIN: Get users only from companies they own or are members of
    // First, get all companies the admin has access to
    const adminCompanies = await dbClient.company.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });

    const companyIds = (adminCompanies as Array<{ id: string }>).map(
      (c) => c.id
    );

    // Get all users who are part of these companies (via staff, ownership, or membership)
    const staffUsers = await dbClient.companyStaff.findMany({
      where: {
        companyId: { in: companyIds },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    const memberUsers = await dbClient.companyMember.findMany({
      where: {
        companyId: { in: companyIds },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    const ownerUsers = await dbClient.company.findMany({
      where: {
        id: { in: companyIds },
      },
      select: {
        ownerId: true,
      },
    });

    // Combine all unique user IDs
    const userIds = new Set<string>();
    (staffUsers as Array<{ userId: string }>).forEach((s) =>
      userIds.add(s.userId)
    );
    (memberUsers as Array<{ userId: string }>).forEach((m) =>
      userIds.add(m.userId)
    );
    (ownerUsers as Array<{ ownerId: string }>).forEach((o) =>
      userIds.add(o.ownerId)
    );

    // Get full user data for these users
    users = await dbClient.user.findMany({
      where: {
        id: { in: Array.from(userIds) },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        plan: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        trialEndsAt: true,
        ownedCompanies: {
          where: {
            id: { in: companyIds },
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  return {
    status: 200,
    body: {
      success: true,
      users,
      count: users.length,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;

    const { status, body } = await getUsersForSettings(userId);
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
