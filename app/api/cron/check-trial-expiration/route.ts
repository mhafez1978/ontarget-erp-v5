import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";

/**
 * Cron Job: Check expired trials and disable companies with unpaid invoices
 * This should be triggered daily (e.g., via Vercel Cron or external service)
 *
 * Authorization: Requires cron secret token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find users whose trial has expired
    const now = new Date();

    const usersWithExpiredTrials = await db.user.findMany({
      where: {
        trialEndsAt: {
          lte: now,
        },
        isActive: true,
        role: "ERP_CUSTOMER", // Only ERP customers have trials
      },
      include: {
        ownedCompanies: {
          where: {
            isActive: true,
          },
        },
        invoices: {
          where: {
            type: "TRIAL_SUBSCRIPTION",
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const results = {
      processed: 0,
      companiesDisabled: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    // Get root company for email sending
    const rootCompany = await db.company.findFirst({
      where: { isRoot: true },
    });

    if (!rootCompany) {
      return NextResponse.json(
        { error: "Root company not found" },
        { status: 500 }
      );
    }

    for (const user of usersWithExpiredTrials) {
      try {
        results.processed++;

        // Get the company (user should own at least one)
        const company = user.ownedCompanies[0];
        if (!company) {
          results.errors.push(`User ${user.id} has no company`);
          continue;
        }

        // Check if this company is owned by super admin (skip if yes)
        if (company.ownerId === rootCompany.ownerId) {
          // Skip companies owned by super admin
          continue;
        }

        // Check if user has a trial invoice
        const trialInvoice = user.invoices.find(
          (inv) => inv.type === "TRIAL_SUBSCRIPTION"
        );

        if (!trialInvoice) {
          results.errors.push(`No trial invoice found for user ${user.id}`);
          continue;
        }

        // Check invoice status
        if (trialInvoice.status === "PAID") {
          // Invoice is paid, no action needed
          continue;
        }

        // Invoice is unpaid and trial expired - disable company
        await db.company.update({
          where: { id: company.id },
          data: { isActive: false },
        });

        results.companiesDisabled++;

        // Update invoice status to OVERDUE if not already
        if (trialInvoice.status !== "OVERDUE") {
          await db.invoice.update({
            where: { id: trialInvoice.id },
            data: { status: "OVERDUE" },
          });
        }

        // Send email notification
        if (user.email) {
          try {
            await sendEmail(
              {
                to: user.email,
                subject: `Action Required: Your OnTarget ERP Account Has Been Suspended`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #d32f2f;">Your Account Has Been Suspended</h2>
                  <p>Hi ${user.name || "there"},</p>
                  <p>Your 14-day free trial has expired and your invoice remains unpaid. As a result, your company account has been temporarily suspended.</p>
                  
                  <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #e65100;">What This Means</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Your company members cannot log in</li>
                      <li>Your company data is safe and preserved</li>
                      <li>As the company admin, you can still log in to make payment</li>
                    </ul>
                  </div>
                  
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Invoice Details</h3>
                    <p><strong>Invoice Number:</strong> ${
                      trialInvoice.invoiceNumber
                    }</p>
                    <p><strong>Plan:</strong> ${user.plan}</p>
                    <p><strong>Amount Due:</strong> $${trialInvoice.total.toString()}</p>
                    <p><strong>Status:</strong> <span style="color: #d32f2f;">OVERDUE</span></p>
                  </div>
                  
                  <p><strong>To restore access immediately:</strong></p>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Log in to your account (admin access still available)</li>
                    <li>Pay the outstanding invoice</li>
                    <li>Your company will be reactivated automatically</li>
                  </ol>
                  
                  <div style="margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                       style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Log In & Pay Now
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px;">
                    If you have any questions or need assistance, please contact our support team.
                  </p>
                  
                  <p>The OnTarget Team</p>
                </div>
              `,
              },
              rootCompany.id
            ); // Use root company's email provider

            results.emailsSent++;
          } catch (emailError) {
            results.errors.push(
              `Failed to send email to ${user.email}: ${emailError}`
            );
          }
        }

        // Create audit log
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: "COMPANY_DISABLED",
            entityId: company.id,
            description: `Company disabled due to unpaid trial invoice ${trialInvoice.invoiceNumber}`,
            ipAddress: "system",
            companyId: company.id,
          },
        });
      } catch (error) {
        results.errors.push(`Error processing user ${user.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Trial expiration check completed",
      results,
    });
  } catch (error) {
    console.error("Error in trial expiration cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check trial expirations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
