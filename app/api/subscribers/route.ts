import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const currentUser = validation.user;

    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPER_ADMIN only" },
        { status: 403 }
      );
    }

    // Get the root company
    const ownedCompanies = await db.company.findMany({
      where: {
        ownerId: currentUser.id,
        isRoot: true,
      },
      select: { id: true },
    });

    const rootCompany = ownedCompanies[0];
    if (!rootCompany) {
      return NextResponse.json(
        { error: "Root company not found. Please complete setup first." },
        { status: 400 }
      );
    }

    // Fetch only ERP subscriber subscriptions (ESSENTIAL, GROWTH, ENTERPRISE)
    // Exclude SUPER_USER, GUEST, and COMPANY_CUSTOMER plans
    const subscriptions = await db.subscription.findMany({
      where: {
        rootCompanyId: rootCompany.id,
        plan: {
          in: ["ESSENTIAL", "GROWTH", "ENTERPRISE"],
        },
      },
      include: {
        subscriberCompany: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            members: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const subscribers = subscriptions.map((subscription) => ({
      id: subscription.id,
      companyId: subscription.subscriberCompany.id,
      companyName: subscription.subscriberCompany.name,
      companyDescription: subscription.subscriberCompany.description,
      ownerId: subscription.subscriberCompany.owner.id,
      ownerName: subscription.subscriberCompany.owner.name || "Unknown",
      ownerEmail: subscription.subscriberCompany.owner.email || "Unknown",
      memberCount: subscription.subscriberCompany.members.length,
      plan: subscription.plan,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
      billingCycleStart: subscription.billingCycleStart?.toISOString() || null,
      billingCycleEnd: subscription.billingCycleEnd?.toISOString() || null,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      subscribers,
      count: subscribers.length,
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}
