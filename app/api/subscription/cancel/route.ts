import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { checkRateLimit } from "@/lib/rate-limit";
import paymentsService from "@/lib/payments/service";
import { z } from "zod";
import { SubscriptionStatus } from "@/generated/prisma/client";

const cancelSchema = z.object({
  companyId: z.string(),
  reason: z.string().optional(),
  feedback: z.string().optional(),
  deleteImmediately: z.boolean().default(false),
});

/**
 * POST /api/subscription/cancel
 *
 * Cancel a subscription and optionally delete the company account.
 *
 * Flow:
 * 1. Verify user is company owner or SUPER_ADMIN
 * 2. Cancel Stripe subscription (if exists)
 * 3. Mark subscription as CANCELLED in database
 * 4. Optionally schedule or perform immediate deletion
 * 5. Send cancellation confirmation email
 *
 * If deleteImmediately=false, gives 30-day grace period for reactivation
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const userId = user.id;

    // Rate limiting: 3 cancellation attempts per hour per user
    const rateLimit = checkRateLimit(userId, {
      endpoint: "subscription-cancel",
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many cancellation attempts. Please contact support.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = cancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { companyId, reason, feedback, deleteImmediately } = parsed.data;

    // Verify user has permission
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Only company owner or SUPER_ADMIN can cancel
    if (company.ownerId !== userId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only the company owner can cancel the subscription" },
        { status: 403 }
      );
    }

    // Prevent cancellation of root company
    if (company.isRoot) {
      return NextResponse.json(
        { error: "Cannot cancel root company subscription" },
        { status: 400 }
      );
    }

    // Find active subscription for this company
    const subscription = await db.subscription.findFirst({
      where: {
        subscriberCompanyId: companyId,
        status: { not: "CANCELLED" },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    let stripeCancelled = false;
    let stripeError = null;

    // Cancel Stripe subscription if it exists
    if (subscription.externalSubscriptionId) {
      try {
        const gateway = await paymentsService.getRootGateway();

        if (gateway) {
          const provider =
            paymentsService.instantiateStripeProviderFromGateway(gateway);

          // Type guard for Stripe provider
          if ("stripe" in provider) {
            const stripeProvider = provider as {
              stripe: {
                subscriptions: {
                  update: (id: string, params: unknown) => Promise<unknown>;
                  cancel: (id: string) => Promise<unknown>;
                };
              };
            };

            // Cancel at period end (not immediate) unless deleteImmediately is true
            await stripeProvider.stripe.subscriptions.update(
              subscription.externalSubscriptionId,
              {
                cancel_at_period_end: !deleteImmediately,
                cancellation_details: {
                  comment: reason || "Customer requested cancellation",
                  feedback: feedback,
                },
              }
            );

            // If immediate cancellation requested
            if (deleteImmediately) {
              await stripeProvider.stripe.subscriptions.cancel(
                subscription.externalSubscriptionId
              );
            }

            stripeCancelled = true;
          }
        }
      } catch (error) {
        console.error("Error cancelling Stripe subscription:", error);
        stripeError = error instanceof Error ? error.message : "Unknown error";
        // Continue with database update even if Stripe fails
      }
    }

    // Calculate deletion date (30 days from now if not immediate)
    const scheduledDeletionDate = deleteImmediately
      ? new Date()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update subscription status in database
    await db.subscription.update({
      where: {
        rootCompanyId_subscriberCompanyId: {
          rootCompanyId: subscription.rootCompanyId,
          subscriberCompanyId: subscription.subscriberCompanyId,
        },
      },
      data: {
        status: "CANCELLED" as SubscriptionStatus,
        updatedAt: new Date(),
      },
    });

    // Create cancellation record
    await db.auditLog.create({
      data: {
        userId,
        companyId,
        action: "SUBSCRIPTION_CANCELLED",
        entityType: "Subscription",
        entityId: `${subscription.rootCompanyId}-${subscription.subscriberCompanyId}`,
        description: `Subscription cancelled by ${user.name}. ${
          deleteImmediately
            ? "Immediate deletion requested"
            : `Scheduled for deletion on ${scheduledDeletionDate.toLocaleDateString()}`
        }`,
        metadata: JSON.stringify({
          reason,
          feedback,
          deleteImmediately,
          scheduledDeletionDate: scheduledDeletionDate.toISOString(),
          stripeCancelled,
          stripeError,
          externalSubscriptionId: subscription.externalSubscriptionId,
        }),
      },
    });

    // If immediate deletion, mark company for deletion
    if (deleteImmediately) {
      // Soft delete: mark company as deleted but keep data for 30 days
      await db.company.update({
        where: { id: companyId },
        data: {
          // Note: You may need to add these fields to your schema
          // deletedAt: new Date(),
          // isDeleted: true,
          updatedAt: new Date(),
        },
      });

      // Create a scheduled job/cron to permanently delete after 30 days
      // This would typically be handled by a background job system
    }

    // TODO: Send cancellation confirmation email
    // await sendEmail({
    //   to: user.email,
    //   subject: "Subscription Cancelled",
    //   template: "subscription-cancelled",
    //   data: {
    //     companyName: company.name,
    //     reactivationDeadline: scheduledDeletionDate,
    //     immediate: deleteImmediately,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: deleteImmediately
        ? "Subscription cancelled and account scheduled for deletion"
        : "Subscription cancelled. You have 30 days to reactivate before deletion",
      scheduledDeletionDate: scheduledDeletionDate.toISOString(),
      stripeCancelled,
      stripeError: stripeError || null,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
