import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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
        authMethod: true,
        password: true,
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
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    const origin = getRequestOrigin(request);

    const response = NextResponse.json({
      ...user,
      hasPassword: !!user.password,
      password: undefined, // Don't send the actual password hash
      image: user.image
        ? user.image.startsWith("http")
          ? user.image
          : new URL(user.image, origin).toString()
        : null,
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Profile fetch error:", error);
    const response = NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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
      email: newEmail,
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
      email?: string;
      emailVerified?: Date | null;
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

    // Allow email update only if current email is a placeholder (GitHub OAuth without email)
    if (
      newEmail !== undefined &&
      user.email &&
      user.email.endsWith("@github.placeholder.local")
    ) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        const response = NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
        response.headers.set("Cache-Control", "no-store, max-age=0");
        return response;
      }

      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser) {
        const response = NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
        response.headers.set("Cache-Control", "no-store, max-age=0");
        return response;
      }

      updateData.email = newEmail;
      updateData.emailVerified = null; // Reset verification when email changes
    }

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

    const origin = getRequestOrigin(request);

    const normalizedUser = {
      ...updatedUser,
      image: updatedUser.image
        ? updatedUser.image.startsWith("http")
          ? updatedUser.image
          : new URL(updatedUser.image, origin).toString()
        : null,
    };

    const response = NextResponse.json({
      success: true,
      user: normalizedUser,
      message: "Profile updated successfully",
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Profile update error:", error);
    const response = NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}
