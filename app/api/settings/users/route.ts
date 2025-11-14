import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can view all users" },
        { status: 403 }
      );
    }

    // Get all users with their owned companies information
    const users = await db.user.findMany({
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

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
