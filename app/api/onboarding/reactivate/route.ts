import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email-service";
import { validateSessionForAPI } from "@/lib/validate-session";

// POST /api/onboarding/reactivate
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const { staffId } = await request.json();

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    // Get the staff member with company info
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
          },
        },
        onboardingToken: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to reactivate (Admin or Super Admin)
    const hasAccess = await db.company.findFirst({
      where: {
        id: staff.companyId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: { in: ["ADMIN"] },
              },
            },
          },
          ...(user.role === "SUPER_ADMIN" ? [{ id: staff.companyId }] : []),
        ],
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to reactivate this staff member" },
        { status: 403 }
      );
    }

    // Invalidate old token if exists
    if (staff.onboardingToken) {
      await db.onboardingToken.update({
        where: { id: staff.onboardingToken.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });
    }

    // Create new onboarding token (expires in 48 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const newToken = await db.onboardingToken.create({
      data: {
        staffId: staff.id,
        expiresAt,
      },
    });

    // Reactivate staff account
    await db.companyStaff.update({
      where: { id: staff.id },
      data: {
        // Ensure account is active again when onboarding is reactivated
        isActive: true,
      },
    });

    // Create audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.USER_UPDATED,
      userId,
      companyId: staff.companyId,
      entityType: ENTITY_TYPES.STAFF_MEMBER,
      entityId: staff.id,
      description: `Reactivated onboarding for ${staff.user.name} - New 48-hour token generated`,
      metadata: {
        staffId: staff.id,
        staffName: staff.user.name,
        staffEmail: staff.user.email,
        previousTokenExpired: staff.onboardingToken
          ? new Date(staff.onboardingToken.expiresAt) < new Date()
          : false,
        newTokenExpiresAt: expiresAt.toISOString(),
      },
    });

    // Send reactivation email
    let emailSent = false;
    let emailError = null;
    try {
      const onboardingUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/onboarding/${newToken.token}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .onboarding-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .cta-button { display: inline-block; background-color: #ffffff; color: #667eea; padding: 14px 32px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
            .warning-box { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
            .info-box { background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Onboarding Reactivated</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account has been reactivated</p>
            </div>
            <div class="content">
              <p>Hello ${staff.user.name},</p>
              
              <p>Your onboarding at <strong>${staff.company.name}</strong> has been reactivated by your administrator.</p>
              
              <div class="warning-box">
                <strong>⚠️ ACTION REQUIRED:</strong> You have a new 48-hour window to complete your onboarding. Please complete it as soon as possible to avoid your account being disabled again.
              </div>

              <div class="onboarding-box">
                <h3 style="margin-top: 0;">📋 Complete Your Onboarding Now</h3>
                <p style="margin: 15px 0;">Click the button below to resume your onboarding process.</p>
                <a href="${onboardingUrl}" class="cta-button">Resume Onboarding</a>
                <p style="font-size: 0.85em; margin-top: 15px; opacity: 0.9;">⏰ This link expires in 48 hours</p>
              </div>

              <div class="info-box">
                <strong>📝 Required Documents:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Social Security Card</li>
                  <li>Driver's License</li>
                  <li>W-4 Tax Form</li>
                  <li>I-9 Employment Eligibility Form</li>
                  <li>Direct Deposit Form</li>
                  <li>Employee Handbook (Signed)</li>
                </ol>
                <p style="margin-top: 10px;"><strong>⚠️ Remember:</strong> Your account will be disabled if you don't complete onboarding within 48 hours.</p>
              </div>

              <p><strong>Need Help?</strong><br>
              If you have any questions or need assistance, please contact your administrator immediately.</p>
              
              <p>Best regards,<br>
              The ${staff.company.name} Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      emailSent = await sendEmail(
        {
          to: staff.user.email || "",
          subject: `🔄 Onboarding Reactivated - Action Required (48 Hours)`,
          html,
        },
        staff.companyId
      );

      if (!emailSent) {
        emailError = "Email provider not configured or email sending failed";
      }
    } catch (error) {
      console.error("Failed to send reactivation email:", error);
      emailError =
        error instanceof Error ? error.message : "Unknown email error";
      // Don't fail reactivation if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding reactivated successfully",
      token: newToken.token,
      expiresAt: newToken.expiresAt,
      onboardingUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/onboarding/${newToken.token}`,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error("Error reactivating onboarding:", error);
    return NextResponse.json(
      { error: "Failed to reactivate onboarding" },
      { status: 500 }
    );
  }
}
