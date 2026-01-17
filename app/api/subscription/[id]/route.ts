import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { SubscriptionStatus } from "@/generated/prisma/client";

// PATCH - Update a subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const userId = user.id;

    // Only SUPER_ADMIN can update subscriptions
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Fetch subscription to check if it exists
    const [rootCompanyId, subscriberCompanyId] = id.split("_");
    const subscription = await db.subscription.findUnique({
      where: {
        rootCompanyId_subscriberCompanyId: {
          rootCompanyId,
          subscriberCompanyId,
        },
      },
      select: {
        subscriberCompany: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Update subscription
    const updatedSubscription = await db.subscription.update({
      where: {
        rootCompanyId_subscriberCompanyId: {
          rootCompanyId,
          subscriberCompanyId,
        },
      },
      data: {
        plan: body.plan,
        status: body.status as SubscriptionStatus,
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : null,
        billingCycleStart: body.billingCycleStart
          ? new Date(body.billingCycleStart)
          : null,
        billingCycleEnd: body.billingCycleEnd
          ? new Date(body.billingCycleEnd)
          : null,
      },
    });

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: userId,
        action: "UPDATED",
        entityType: "Subscription",
        entityId: `${rootCompanyId}-${subscriberCompanyId}`,
        description: `Updated subscription for company: ${subscription.subscriberCompany.name}`,
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subscription (and potentially the subscriber company)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const userId = user.id;

    // Only SUPER_ADMIN can delete subscriptions
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const [rootCompanyId, subscriberCompanyId] = id.split("_");

    // Fetch subscription to check if it exists
    const subscription = await db.subscription.findUnique({
      where: {
        rootCompanyId_subscriberCompanyId: {
          rootCompanyId,
          subscriberCompanyId,
        },
      },
      select: {
        subscriberCompanyId: true,
        subscriberCompany: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Delete the subscription (cascade will handle related records)
    // This will also delete the subscriber company if configured with cascade
    await db.subscription.delete({
      where: {
        rootCompanyId_subscriberCompanyId: {
          rootCompanyId,
          subscriberCompanyId,
        },
      },
    });

    // Optionally, you may want to also delete the subscriber company explicitly
    // Uncomment this if you want to ensure the company is deleted
    /*
    await db.company.delete({
      where: { id: subscription.subscriberCompanyId },
    });
    */

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: userId,
        action: "DELETED",
        entityType: "Subscription",
        entityId: `${rootCompanyId}-${subscriberCompanyId}`,
        description: `Deleted subscription for company: ${subscription.subscriberCompany.name}`,
      },
    });

    return NextResponse.json({
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
