import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const currentUser = validation.user;

    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can modify user account status" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const { isActive } = await request.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean value" },
        { status: 400 }
      );
    }

    // Prevent super admin from disabling their own account
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot disable your own account" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user active status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Log the audit action
    await createAuditLog({
      userId: currentUser.id,
      action: isActive ? "USER_ENABLED" : "USER_DISABLED",
      entityType: "USER",
      entityId: userId,
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
        targetUserRole: targetUser.role,
        previousStatus: targetUser.isActive,
        newStatus: isActive,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User account ${isActive ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    console.error("Error updating user active status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
