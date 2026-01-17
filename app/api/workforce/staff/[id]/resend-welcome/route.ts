import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, getWelcomeStaffEmailHtml } from "@/lib/email-service";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

// POST /api/workforce/staff/[id]/resend-welcome
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // FIXED: Explicitly return Promise<Response>
  try {
    const validation = await validateSessionForAPI(request);

    // FIXED: Simplified the response handling.
    // 'as any' bridges the gap between standard Response and NextResponse
    if (!validation.valid) {
      return validation.response as Response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Await params as required in newer Next.js versions
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
                role: { in: ["ADMIN_OWNER", "COMPANY_MANAGER"] },
              },
            },
          },
        },
      },
    });

    if (!staff || !staff.user.email) {
      return NextResponse.json(
        { error: "Staff member or email not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this company (owner, admin, manager, or SUPER_ADMIN)
    const isOwner = staff.company.ownerId === userId;
    const isAdminOrManager = staff.company.members.length > 0;
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    if (!isOwner && !isAdminOrManager && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Generate a new temporary password
    const newPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Check if company has email provider configured
    const companyEmailProvider = await db.emailProvider.findFirst({
      where: {
        scope: staff.companyId,
        isActive: true,
      },
    });

    const usingFallback = !companyEmailProvider;

    // Update the user's password
    await db.user.update({
      where: { id: staff.userId },
      data: { password: hashedPassword },
    });

    // Send welcome email with new password
    try {
      const html = getWelcomeStaffEmailHtml(
        staff.user.name || staff.user.email,
        staff.user.email,
        newPassword,
        staff.company.name,
        staff.role
      );

      const emailSent = await sendEmail(
        {
          to: staff.user.email,
          subject: `Welcome to ${staff.company.name} - Your Account Details`,
          html,
        },
        staff.companyId,
        user.id
      );

      if (!emailSent) {
        return NextResponse.json(
          { error: "Failed to send welcome email" },
          { status: 500 }
        );
      }

      // Create audit log for password reset
      await createAuditLog({
        action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
        userId: user.id,
        entityType: "User",
        entityId: staff.userId,
        companyId: staff.companyId,
        description: `Password reset and welcome email resent for ${
          staff.user.name || staff.user.email
        }`,
        metadata: {
          staffId: staff.id,
          staffEmail: staff.user.email,
          staffName: staff.user.name,
          usingFallback,
        },
      });

      // If using fallback email provider, notify company admins
      if (usingFallback) {
        try {
          // Get company admins
          const adminMembers = await db.companyMember.findMany({
            where: {
              companyId: staff.companyId,
              role: { in: ["ADMIN_OWNER", "COMPANY_MANAGER"] },
            },
            include: {
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          });

          const adminEmails = adminMembers
            .filter((m) => m.user.email)
            .map((m) => m.user.email!);

          if (adminEmails.length > 0) {
            const notificationHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">⚠️ Using Fallback Email Provider</h2>
                <p>Hello,</p>
                <p>A welcome email was just sent to <strong>${
                  staff.user.email
                }</strong> from <strong>${staff.company.name}</strong>.</p>
                <p style="padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; margin: 16px 0;">
                  <strong>Note:</strong> This email was sent using the <strong>global fallback email provider</strong> because your company does not have a custom email provider configured.
                </p>
                
                <h3 style="color: #1f2937; margin-top: 24px;">Want Full White-Label Service?</h3>
                <p>Configure your own email provider to send emails from your company's domain. This gives you:</p>
                <ul style="color: #4b5563;">
                  <li>Professional branding with your company email address</li>
                  <li>Better email deliverability and trust</li>
                  <li>Full control over your email communications</li>
                  <li>Compliance with your organization's email policies</li>
                </ul>

                <h3 style="color: #1f2937; margin-top: 24px;">How to Configure Your Email Provider:</h3>
                <ol style="color: #4b5563; line-height: 1.8;">
                  <li>Go to <strong>Settings</strong> in your dashboard navigation</li>
                  <li>Scroll to the <strong>"Email Provider Configuration"</strong> section</li>
                  <li>Select your company from the dropdown (not "Global Root Company")</li>
                  <li>Choose your email provider type:
                    <ul style="margin-top: 8px;">
                      <li><strong>SMTP</strong> - Use your company's existing email server</li>
                      <li><strong>Office 365</strong> - Microsoft email (recommended for businesses)</li>
                      <li><strong>Google OAuth</strong> - Gmail with OAuth authentication</li>
                      <li><strong>SendGrid / Mailgun / AWS SES / Resend</strong> - Third-party services</li>
                    </ul>
                  </li>
                  <li>Enter your credentials and test the connection</li>
                  <li>Click <strong>"Save & Activate"</strong> to enable your custom provider</li>
                </ol>

                <div style="margin: 24px 0; padding: 16px; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 4px;">
                  <p style="margin: 0; color: #1e40af;">
                    <strong>💡 Quick Tip:</strong> Most companies use either SMTP (if you have existing email) or Office 365 OAuth for Microsoft accounts.
                  </p>
                </div>

                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                }/dashboard/settings" 
                   style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: 600;">
                  Configure Email Provider Now
                </a>

                <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                  Need help? Contact support or check our documentation.
                </p>

                <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
                <p style="color: #9ca3af; font-size: 12px;">
                  This is an automated notification from ${staff.company.name}.
                </p>
              </div>
            `;

            await sendEmail(
              {
                to: adminEmails,
                subject: `⚠️ ${staff.company.name} - Configure Email Provider for White-Label Service`,
                html: notificationHtml,
              },
              undefined, // Use global provider for this notification
              user.id
            );

            console.log(
              `[Resend Welcome] Sent fallback notification to ${adminEmails.length} admin(s)`
            );
          }
        } catch (notificationError) {
          console.error(
            "[Resend Welcome] Failed to send fallback notification:",
            notificationError
          );
          // Don't fail the request if notification fails
        }
      }

      return NextResponse.json({
        success: true,
        message: "Welcome email sent successfully",
        usingFallback,
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
