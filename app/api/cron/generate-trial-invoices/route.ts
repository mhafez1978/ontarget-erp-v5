import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays } from "date-fns";
import { sendEmail } from "@/lib/email-service";

/**
 * Cron Job: Generate invoices for trials expiring in 3 days
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

    // Find users whose trial expires in exactly 3 days
    const threeDaysFromNow = addDays(new Date(), 3);
    const startOfDay = new Date(threeDaysFromNow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(threeDaysFromNow.setHours(23, 59, 59, 999));

    const usersWithExpiringTrials = await db.user.findMany({
      where: {
        trialEndsAt: {
          gte: startOfDay,
          lte: endOfDay,
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
      },
    });

    const results = {
      processed: 0,
      invoicesCreated: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    for (const user of usersWithExpiringTrials) {
      try {
        results.processed++;

        // Check if user already has a trial invoice
        const existingInvoice = await db.invoice.findFirst({
          where: {
            userId: user.id,
            type: "TRIAL_SUBSCRIPTION",
            status: {
              in: ["DRAFT", "SENT", "OVERDUE"],
            },
          },
        });

        if (existingInvoice) {
          // Skip if invoice already exists
          continue;
        }

        // Get the company (user should own at least one)
        const company = user.ownedCompanies[0];
        if (!company) {
          results.errors.push(`User ${user.id} has no company`);
          continue;
        }

        // Check if this company is owned by super admin (skip if yes)
        const rootCompany = await db.company.findFirst({
          where: { isRoot: true },
        });

        if (rootCompany && company.ownerId === rootCompany.ownerId) {
          // Skip companies owned by super admin
          continue;
        }

        // Calculate invoice amount based on plan and billing cycle
        const planPricing: Record<string, { monthly: number; annual: number }> =
          {
            ESSENTIAL: { monthly: 49, annual: 490 },
            PROFESSIONAL: { monthly: 99, annual: 990 },
            ENTERPRISE: { monthly: 299, annual: 2990 },
          };

        const pricing = planPricing[user.plan];
        if (!pricing) {
          results.errors.push(`Unknown plan for user ${user.id}: ${user.plan}`);
          continue;
        }

        const amount =
          user.billingCycle === "ANNUAL" ? pricing.annual : pricing.monthly;
        const tax = 0; // Calculate tax based on company location if needed
        const total = amount + tax;

        // Generate invoice number
        const invoiceCount = await db.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
          invoiceCount + 1
        ).padStart(6, "0")}`;

        // Create invoice
        const invoice = await db.invoice.create({
          data: {
            invoiceNumber,
            companyId: company.id,
            userId: user.id,
            type: "TRIAL_SUBSCRIPTION",
            status: "SENT",
            amount,
            tax,
            discount: 0,
            total,
            items: [
              {
                description: `${user.plan} Plan - ${user.billingCycle} Subscription`,
                quantity: 1,
                unitPrice: amount,
                amount,
              },
            ],
            issueDate: new Date(),
            dueDate: user.trialEndsAt!, // Due on trial expiration date
            notes: `Your trial ends on ${user.trialEndsAt!.toLocaleDateString()}. Please pay this invoice to continue using OnTarget ERP.`,
            terms:
              "Payment is due on or before the trial expiration date to avoid service interruption.",
          },
        });

        results.invoicesCreated++;

        // Send invoice email using root company email provider
        if (user.email && rootCompany) {
          try {
            await sendEmail(
              {
                to: user.email,
                subject: `Your Trial is Expiring - Invoice ${invoiceNumber}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Your OnTarget ERP Trial is Expiring Soon</h2>
                  <p>Hi ${user.name || "there"},</p>
                  <p>Your 14-day free trial will expire in <strong>3 days</strong> on ${user.trialEndsAt!.toLocaleDateString()}.</p>
                  
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Invoice Details</h3>
                    <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                    <p><strong>Plan:</strong> ${user.plan}</p>
                    <p><strong>Billing Cycle:</strong> ${user.billingCycle}</p>
                    <p><strong>Amount Due:</strong> $${total.toFixed(2)}</p>
                    <p><strong>Due Date:</strong> ${user.trialEndsAt!.toLocaleDateString()}</p>
                  </div>
                  
                  <p>To continue using OnTarget ERP without interruption, please pay your invoice before the due date.</p>
                  
                  <div style="margin: 30px 0;">
                    <a href="${
                      process.env.NEXT_PUBLIC_APP_URL
                    }/dashboard?action=pay-invoice&invoiceId=${invoice.id}" 
                       style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Pay Invoice Now
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px;">
                    If your invoice is not paid by the due date, your company will be temporarily disabled until payment is received.
                  </p>
                  
                  <p>Thank you for using OnTarget ERP!</p>
                  <p>The OnTarget Team</p>
                </div>
              `,
              },
              rootCompany.id
            ); // Use root company's email provider

            results.emailsSent++;

            // Update invoice sentAt timestamp
            await db.invoice.update({
              where: { id: invoice.id },
              data: { sentAt: new Date() },
            });
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
            action: "INVOICE_GENERATED",
            entityId: invoice.id,
            description: `Trial expiration invoice generated for ${user.plan} plan`,
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
      message: "Trial invoice generation completed",
      results,
    });
  } catch (error) {
    console.error("Error in trial invoice generation cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate trial invoices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
