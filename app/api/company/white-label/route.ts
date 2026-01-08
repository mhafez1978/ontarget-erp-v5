import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Must be an ADMIN with a company membership
    const adminMembership = user.companyMemberships.find(
      (m) => m.role === "ADMIN"
    );

    if (user.role !== "ADMIN" || !adminMembership) {
      return NextResponse.json(
        { error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const companyId = adminMembership.companyId;

    // Fetch the company
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slogan: true,
        description: true,
        logo: true,
        logoLight: true,
        logoDark: true,
        email: true,
        phone: true,
        website: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check subscription for white-label access
    // Find subscription where this company is the subscriber
    const subscription = await db.subscription.findFirst({
      where: {
        subscriberCompanyId: companyId,
      },
      select: {
        plan: true,
        status: true,
      },
    });

    // Determine if user can white-label
    // Requires GROWTH or ENTERPRISE plan with ACTIVE or TRIAL status
    const canWhiteLabel =
      subscription &&
      (subscription.plan === "GROWTH" || subscription.plan === "ENTERPRISE") &&
      (subscription.status === "ACTIVE" || subscription.status === "TRIAL");

    return NextResponse.json({
      company,
      subscription: {
        plan: subscription?.plan || "ESSENTIAL",
        status: subscription?.status || "NONE",
        canWhiteLabel: !!canWhiteLabel,
      },
    });
  } catch (error) {
    console.error("Error fetching company white-label data:", error);
    return NextResponse.json(
      { error: "Failed to fetch white-label data" },
      { status: 500 }
    );
  }
}
