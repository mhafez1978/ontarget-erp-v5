import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import type { User } from "@/generated/prisma/client";

type UserSelect = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "role"
  | "plan"
  | "authMethod"
  | "password"
  | "createdAt"
  | "updatedAt"
>;

// GET /api/admin/users
// Super Admin can fetch all users
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const adminUser = validation.user;

    // Only SUPER_ADMIN can access this endpoint
    if (adminUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admins can access this resource." },
        { status: 403 }
      );
    }

    // Fetch all users with relevant information
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        authMethod: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: "asc" }, // SUPER_ADMIN first, then ADMIN_OWNER, etc.
        { name: "asc" },
      ],
    });

    // Add hasPassword field and remove actual password hash
    const usersWithPasswordStatus = users.map((user: UserSelect) => ({
      ...user,
      hasPassword: !!user.password,
      password: undefined,
    }));

    return NextResponse.json({
      users: usersWithPasswordStatus,
      total: usersWithPasswordStatus.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
