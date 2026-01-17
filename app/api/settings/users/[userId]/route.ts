import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: currentUser } = validation;
    const { userId } = await params;

    // Only SUPER_ADMIN can delete users
    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can delete users" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Get the user to be deleted
    const userToDelete = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
      },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow deletion of ERP_CUSTOMER role with ERP_CUSTOMER or TRIAL plan
    if (userToDelete.role !== "ERP_CUSTOMER") {
      return NextResponse.json(
        { error: "Can only delete users with ERP_CUSTOMER role" },
        { status: 400 }
      );
    }

    if (userToDelete.plan !== "ERP_CUSTOMER" && userToDelete.plan !== "TRIAL") {
      return NextResponse.json(
        { error: "Can only delete users with ERP_CUSTOMER or TRIAL plan" },
        { status: 400 }
      );
    }

    // Delete the user (cascade will handle related records)
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: `User ${
        userToDelete.name || userToDelete.email
      } has been permanently deleted`,
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
