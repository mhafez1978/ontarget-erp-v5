import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, getWelcomeStaffEmailHtml } from "@/lib/email-service";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validateSessionForAPI } from "@/lib/validate-session";

// POST /api/workforce/staff/[id]/resend-welcome
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: staffId } = await params;

    // Fetch the staff member with all required data
    const staff = await db.companyStaff.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            members: {
              where: {
                userId,
                role: { in: ["ADMIN", "MANAGER"] },
              },
            },
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this company (owner, admin, manager, or SUPER_ADMIN)
    const hasAccess =
      user.role === "SUPER_ADMIN" ||
      staff.company.ownerId === userId ||
      staff.company.members.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Generate a new temporary password
    const newPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await db.user.update({
      where: { id: staff.userId },
      data: { password: hashedPassword },
    });

    // Send welcome email with new password
    try {
      const html = getWelcomeStaffEmailHtml(
        staff.user.name || staff.user.email!,
        staff.user.email!,
        newPassword,
        staff.company.name,
        staff.role
      );

      const emailSent = await sendEmail(
        {
          to: staff.user.email!,
          subject: `Welcome to ${staff.company.name} - Your Account Details`,
          html,
        },
        staff.companyId, // Use company-specific email provider if configured
        user.id
      );

      if (!emailSent) {
        return NextResponse.json(
          { error: "Failed to send welcome email" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Welcome email sent successfully",
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      return NextResponse.json(
        { error: "Failed to send welcome email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error resending welcome email:", error);
    return NextResponse.json(
      { error: "Failed to resend welcome email" },
      { status: 500 }
    );
  }
}
