import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";

// GET /api/cron/check-onboarding-expiration
// This should be called hourly by a cron service (e.g., Vercel Cron, GitHub Actions, or external cron)
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find all onboarding tokens that are expired and not yet used
    const expiredTokens = await db.onboardingToken.findMany({
      where: {
        expiresAt: {
          lt: now, // Less than current time = expired
        },
        isUsed: false, // Not completed
      },
      include: {
        staff: {
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
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${expiredTokens.length} expired onboarding tokens`);

    const disabledAccounts: string[] = [];
    const emailResults: {
      staffEmail: string;
      adminEmail: string;
      staffEmailSent: boolean;
      adminEmailSent: boolean;
    }[] = [];

    for (const token of expiredTokens) {
      const { staff } = token;

      try {
        // Disable the staff account (when isActive field is available in schema)
        await db.companyStaff.update({
          where: { id: staff.id },
          data: {
            // Mark account inactive when onboarding was not completed in time
            isActive: false,
          },
        });

        // Create audit log
        await createAuditLog({
          action: AUDIT_ACTIONS.USER_UPDATED,
          userId: staff.userId,
          companyId: staff.companyId,
          entityType: ENTITY_TYPES.COMPANY_STAFF_MEMBER,
          entityId: staff.id,
          description: `Account disabled due to incomplete onboarding - Token expired ${Math.floor(
            (now.getTime() - token.expiresAt.getTime()) / (1000 * 60 * 60)
          )} hours ago`,
          metadata: {
            staffId: staff.id,
            staffName: staff.user.name,
            staffEmail: staff.user.email,
            tokenExpiresAt: token.expiresAt.toISOString(),
            disabledAt: now.toISOString(),
          },
        });

        // Additional onboarding-specific audit entry
        await createAuditLog({
          action: AUDIT_ACTIONS.ONBOARDING_EXPIRED,
          userId: staff.userId,
          companyId: staff.companyId,
          entityType: ENTITY_TYPES.COMPANY_STAFF_MEMBER,
          entityId: staff.id,
          description: `Onboarding token expired for ${staff.user.email}`,
          metadata: {
            token: token.token,
            expiresAt: token.expiresAt.toISOString(),
          },
        });

        disabledAccounts.push(staff.user.email || "");

        // Send email to employee
        let staffEmailSent = false;
        try {
          const staffHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b6b 0%, #dc3545 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .warning-box { background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
                .info-box { background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Account Disabled</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Onboarding Not Completed</p>
                </div>
                <div class="content">
                  <p>Hello ${staff.user.name},</p>
                  
                  <div class="warning-box">
                    <h3 style="margin-top: 0;">Your account at ${
                      staff.company.name
                    } has been temporarily disabled</h3>
                    <p>Your onboarding link expired on <strong>${token.expiresAt.toLocaleDateString()}</strong> at <strong>${token.expiresAt.toLocaleTimeString()}</strong>, and the required documents were not submitted within the 48-hour window.</p>
                  </div>

                  <div class="info-box">
                    <h3 style="margin-top: 0;">To Reactivate Your Account:</h3>
                    <p>Please contact your administrator at ${
                      staff.company.name
                    } to request a new onboarding link. They can reactivate your account and provide you with a new 48-hour window to complete the process.</p>
                    <p style="margin-top: 15px;"><strong>Administrator Contact:</strong><br>
                    ${staff.company.owner.name || "N/A"}<br>
                    ${staff.company.owner.email || "N/A"}</p>
                  </div>

                  <p>We apologize for any inconvenience. Please complete your onboarding as soon as your account is reactivated.</p>
                  
                  <p>Best regards,<br>
                  The ${staff.company.name} Team</p>
                </div>
              </div>
            </body>
            </html>
          `;

          staffEmailSent = await sendEmail(
            {
              to: staff.user.email || "",
              subject: `⚠️ Account Disabled - Onboarding Incomplete`,
              html: staffHtml,
            },
            staff.companyId
          );
        } catch (error) {
          console.error(
            `Failed to send disabled account email to staff ${staff.user.email}:`,
            error
          );
        }

        // Send email to admin
        let adminEmailSent = false;
        try {
          const adminHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert-box { background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
                .info-box { background-color: #ffffff; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📋 Onboarding Incomplete</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Staff Member Account Disabled</p>
                </div>
                <div class="content">
                  <p>Hello ${staff.company.owner.name || "Administrator"},</p>
                  
                  <div class="alert-box">
                    <h3 style="margin-top: 0;">⚠️ Action Required</h3>
                    <p>The following staff member did not complete their onboarding within the 48-hour window. Their account has been automatically disabled.</p>
                  </div>

                  <div class="info-box">
                    <h3 style="margin-top: 0;">Staff Member Details:</h3>
                    <p><strong>Name:</strong> ${staff.user.name}<br>
                    <strong>Email:</strong> ${staff.user.email}<br>
                    <strong>Role:</strong> ${staff.role}<br>
                    <strong>Job Title:</strong> ${staff.jobTitle || "N/A"}<br>
                    <strong>Hire Date:</strong> ${staff.hireDate.toLocaleDateString()}<br>
                    <strong>Token Expired:</strong> ${token.expiresAt.toLocaleDateString()} at ${token.expiresAt.toLocaleTimeString()}</p>
                  </div>

                  <div class="info-box">
                    <h3 style="margin-top: 0;">Next Steps:</h3>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                      <li>Contact ${
                        staff.user.name
                      } to understand the reason for non-completion</li>
                      <li>If they're still interested in the position, reactivate their onboarding</li>
                      <li>Go to Workforce Management → Find ${
                        staff.user.name
                      } → Click "Reactivate Onboarding"</li>
                      <li>A new 48-hour onboarding link will be generated and emailed to them</li>
                    </ol>
                  </div>

                  <p style="text-align: center;">
                    <a href="${
                      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                    }/dashboard/workforce" class="cta-button">
                      View Workforce Management
                    </a>
                  </p>
                  
                  <p>This is an automated notification from the ${
                    staff.company.name
                  } HR system.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          adminEmailSent = await sendEmail(
            {
              to: staff.company.owner.email || "",
              subject: `📋 Onboarding Incomplete - ${staff.user.name} Account Disabled`,
              html: adminHtml,
            },
            staff.companyId
          );
        } catch (error) {
          console.error(
            `Failed to send admin notification for staff ${staff.user.email}:`,
            error
          );
        }

        emailResults.push({
          staffEmail: staff.user.email || "",
          adminEmail: staff.company.owner.email || "",
          staffEmailSent,
          adminEmailSent,
        });
      } catch (error) {
        console.error(
          `Failed to disable account for staff ${staff.user.email}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredTokens.length} expired onboarding tokens`,
      disabledAccounts,
      emailResults,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error checking onboarding expiration:", error);
    return NextResponse.json(
      {
        error: "Failed to check onboarding expiration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
