import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

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

    const provider =
      paymentsService.instantiateStripeProviderFromGateway(gateway);

    // Retrieve subscription from Stripe
    const stripeSub = await (provider as any).stripe.subscriptions.retrieve(
      subscriptionId
    );
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

    const trialEndsAt = stripeSub.trial_end
      ? new Date(stripeSub.trial_end * 1000)
      : null;
    const billingCycleStart = stripeSub.current_period_start
      ? new Date(stripeSub.current_period_start * 1000)
      : null;
    const billingCycleEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000)
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
        where: { id: existing.id },
        data: { externalSubscriptionId: subscriptionId },
      });

      await createAuditLog({
        action: AUDIT_ACTIONS.SUBSCRIPTION_PLAN_CHANGED,
        companyId: gateway.companyId,
        entityType: "Subscription",
        entityId: updated.id,
        description: `Linked Stripe subscription ${subscriptionId} to existing subscription ${updated.id}`,
        metadata: { stripeSubscriptionId: subscriptionId, subscriberCompanyId },
      });

      return NextResponse.json({
        success: true,
        subscriptionId: existing.id,
        updated: true,
      });
    }

    const created = await db.subscription.create({
      data: {
        rootCompanyId: gateway.companyId,
        subscriberCompanyId,
        plan: plan || "ESSENTIAL",
        status: status as "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING",
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
      entityId: created.id,
      description: `Created subscription for company ${subscriberCompanyId} from Stripe subscription ${subscriptionId}`,
      metadata: { stripeSubscriptionId: subscriptionId, subscriberCompanyId },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: created.id,
      plan: created.plan,
    });
  } catch (error) {
    console.error("/api/payments/assign-subscription error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
