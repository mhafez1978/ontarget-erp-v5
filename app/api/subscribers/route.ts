import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify SUPER_ADMIN role
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          where: { isRoot: true },
          select: { id: true },
        },
      },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPER_ADMIN only" },
        { status: 403 }
      );
    }

    // Get the root company
    const rootCompany = currentUser.ownedCompanies[0];
    if (!rootCompany) {
      return NextResponse.json(
        { error: "Root company not found. Please complete setup first." },
        { status: 400 }
      );
    }

    // Fetch all subscriptions for this root company
    const subscriptions = await db.subscription.findMany({
      where: {
        rootCompanyId: rootCompany.id,
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
