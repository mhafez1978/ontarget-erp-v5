import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET() {
  try {
    const pricing = await db.planPricing.findMany({
      orderBy: { monthlyPrice: "asc" },
    });

    return NextResponse.json({ pricing });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate session and check for SUPER_ADMIN
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { plan, pricing } = body;

    if (!plan || !pricing) {
      return NextResponse.json(
        { error: "Plan and pricing data required" },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ["ESSENTIAL", "GROWTH", "ENTERPRISE"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Update or create pricing
    const updated = await db.planPricing.upsert({
      where: { plan },
      update: {
        ...pricing,
        createdBy: user.id,
        updatedAt: new Date(),
      },
      create: {
        plan,
        ...pricing,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, pricing: updated });
  } catch (error) {
    console.error("Error updating pricing:", error);
    return NextResponse.json(
      { error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
