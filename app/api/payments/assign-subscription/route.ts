import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import type { StripeProvider } from "@/lib/payment-providers/stripe";
import type { Prisma, SubscriptionPlan } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, subscriberCompanyId } = body;
    if (!subscriptionId || !subscriberCompanyId) {
      return NextResponse.json(
        { error: "subscriptionId and subscriberCompanyId are required" },
        { status: 400 }
      );
    }

    const gateway = await paymentsService.getRootGateway();
    if (!gateway)
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 400 }
      );

    const provider = paymentsService.instantiateStripeProviderFromGateway(
      gateway
    ) as StripeProvider;

    // Retrieve subscription from Stripe
    const stripeSub = await provider.retrieveSubscription(subscriptionId);
    if (!stripeSub)
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );

    // Determine priceId and plan
    const items = stripeSub.items?.data || [];
    const priceId = items[0]?.price?.id as string | undefined;
    const plan = priceId
      ? paymentsService.getPlanFromPriceId(gateway, priceId)
      : null;

    // Compose subscription record
    const statusMap: Record<string, string> = {
      trialing: "TRIAL",
      active: "ACTIVE",
      past_due: "PAST_DUE",
      canceled: "CANCELLED",
      unpaid: "PAST_DUE",
    };

    const status = statusMap[stripeSub.status] || "TRIAL";

    const trialEndsAt = (stripeSub as any).trial_end
      ? new Date((stripeSub as any).trial_end * 1000)
      : null;
    const billingCycleStart = (stripeSub as any).current_period_start
      ? new Date((stripeSub as any).current_period_start * 1000)
      : null;
    const billingCycleEnd = (stripeSub as any).current_period_end
      ? new Date((stripeSub as any).current_period_end * 1000)
      : null;

    // Validate subscriber company exists
    const company = await db.company.findUnique({
      where: { id: subscriberCompanyId },
    });
    if (!company)
      return NextResponse.json(
        { error: "Subscriber company not found" },
        { status: 404 }
      );

    // Ensure no existing subscription for this root/subscriber pair
    const existing = await db.subscription.findFirst({
      where: { rootCompanyId: gateway.companyId, subscriberCompanyId },
    });
    if (existing) {
      // If exists, update externalSubscriptionId if missing
      const updated = await db.subscription.update({
        where: {
          rootCompanyId_subscriberCompanyId: {
            rootCompanyId: existing.rootCompanyId,
            subscriberCompanyId: existing.subscriberCompanyId,
          },
        },
        data: { externalSubscriptionId: subscriptionId },
      });

      await createAuditLog({
        action: AUDIT_ACTIONS.SUBSCRIPTION_PLAN_CHANGED,
        companyId: gateway.companyId,
        entityType: "Subscription",
        entityId: `${existing.rootCompanyId}-${existing.subscriberCompanyId}`,
        description: `Linked Stripe subscription ${subscriptionId} to existing subscription`,
        metadata: { stripeSubscriptionId: subscriptionId, subscriberCompanyId },
      });

      return NextResponse.json({
        success: true,
        subscriptionId: `${existing.rootCompanyId}-${existing.subscriberCompanyId}`,
        updated: true,
      });
    }

    const created = await db.subscription.create({
      data: {
        rootCompanyId: gateway.companyId,
        subscriberCompanyId,
        plan: (plan || "ESSENTIAL") as SubscriptionPlan,
        status: status as "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIAL",
        trialEndsAt,
        billingCycleStart,
        billingCycleEnd,
        externalSubscriptionId: subscriptionId,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.SUBSCRIPTION_PLAN_CHANGED,
      companyId: gateway.companyId,
      entityType: "Subscription",
      entityId: `${created.rootCompanyId}-${created.subscriberCompanyId}`,
      description: `Created subscription for company ${subscriberCompanyId} from Stripe subscription ${subscriptionId}`,
      metadata: { stripeSubscriptionId: subscriptionId, subscriberCompanyId },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: `${created.rootCompanyId}-${created.subscriberCompanyId}`,
      plan: created.plan,
    });
  } catch (error) {
    console.error("/api/payments/assign-subscription error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
