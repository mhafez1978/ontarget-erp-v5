import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: validation.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        plan: true,
        mfaEnabled: true,
        mfaSetupAt: true,
        image: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        countryCode: true,
        postalCode: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: validation.user.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      countryCode,
      postalCode,
      latitude,
      longitude,
    } = body;

    // Build update data object
    const updateData: {
      name?: string;
      addressLine1?: string;
      addressLine2?: string | null;
      city?: string;
      state?: string;
      country?: string;
      countryCode?: string;
      postalCode?: string;
      latitude?: number | null;
      longitude?: number | null;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined)
      updateData.addressLine2 = addressLine2 || null;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (latitude !== undefined) updateData.latitude = latitude || null;
    if (longitude !== undefined) updateData.longitude = longitude || null;

    // Update user in database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        plan: true,
        mfaEnabled: true,
        mfaSetupAt: true,
        image: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        countryCode: true,
        postalCode: true,
        latitude: true,
        longitude: true,
      },
    });

    // Log the audit action
    await createAuditLog({
      userId: user.id,
      action: "PROFILE_UPDATED",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        updatedFields: Object.keys(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
