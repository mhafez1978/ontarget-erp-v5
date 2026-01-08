import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validateSessionForAPI } from "@/lib/validate-session";

// Zod schema for admin password reset
const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// POST /api/admin/reset-password
// Admin/Super Admin can reset user passwords without knowing current password
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const adminUser = validation.user;

    // Only ADMIN and SUPER_ADMIN can reset passwords
    if (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can reset passwords." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const { userId, newPassword } = validationResult.data;

    // Get target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authMethod: true,
        companyStaff: {
          select: {
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Authorization checks based on role
    if (adminUser.role === "ADMIN") {
      // ADMINs can only reset passwords for users in their company
      const adminCompanyStaff = await db.companyStaff.findFirst({
        where: { userId: adminUser.id },
        select: { companyId: true },
      });

      if (!adminCompanyStaff) {
        return NextResponse.json(
          { error: "Admin must be associated with a company" },
          { status: 403 }
        );
      }

      // Check if target user is in the same company
      const targetInSameCompany = targetUser.companyStaff.some(
        (staff) => staff.companyId === adminCompanyStaff.companyId
      );

      if (!targetInSameCompany) {
        return NextResponse.json(
          {
            error:
              "You can only reset passwords for members of your own company",
          },
          { status: 403 }
        );
      }

      // ADMINs cannot reset SUPER_ADMIN passwords
      if (targetUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Cannot reset Super Admin passwords" },
          { status: 403 }
        );
      }
    }

    // SUPER_ADMIN can reset anyone's password (no additional checks needed)

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Determine new authMethod
    let newAuthMethod = targetUser.authMethod;

    if (targetUser.authMethod === "oauth") {
      // User was OAuth only, now setting password → transition to 'both'
      newAuthMethod = "both";
    } else if (!targetUser.authMethod) {
      // No auth method set, default to credentials
      newAuthMethod = "credentials";
    }

    // Update password and authMethod
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        authMethod: newAuthMethod,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${
        targetUser.name || targetUser.email
      }`,
      authMethod: newAuthMethod,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
