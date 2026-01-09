import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const currentUser = validation.user;

    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPER_ADMIN only" },
        { status: 403 }
      );
    }

    // Fetch all companies with subscriber plans (TRIAL, ESSENTIAL, GROWTH, ENTERPRISE)
    // These are companies that are paying or will pay for the ERP service
    const companies = await db.company.findMany({
      where: {
        owner: {
          plan: {
            in: ["TRIAL", "ESSENTIAL", "GROWTH", "ENTERPRISE"],
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            trialEndsAt: true,
            createdAt: true,
          },
        },
        members: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response to match existing structure
    const subscribers = companies.map((company) => ({
      id: company.id, // Use company ID as subscription ID
      companyId: company.id,
      companyName: company.name,
      companyDescription: company.description,
      ownerId: company.owner.id,
      ownerName: company.owner.name || "Unknown",
      ownerEmail: company.owner.email || "Unknown",
      memberCount: company.members.length,
      plan: company.owner.plan,
      status: "ACTIVE", // Simplified - can add logic to check if trial expired
      trialEndsAt: company.owner.trialEndsAt?.toISOString() || null,
      billingCycleStart: null, // Can be added if needed
      billingCycleEnd: null, // Can be added if needed
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
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
