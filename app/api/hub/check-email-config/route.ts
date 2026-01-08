import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * Check if email service is configured
 * - Checks global email provider (SUPER_ADMIN)
 * - Checks company-specific override (ADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const userId = validation.user.id;

    // Only ADMIN and SUPER_ADMIN can access hub
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Access denied", configured: false },
        { status: 403 }
      );
    }

    let isConfigured = false;
    let configLevel: "GLOBAL" | "COMPANY" | null = null;

    // Check SUPER_ADMIN global configuration
    if (user.role === "SUPER_ADMIN") {
      const globalProvider = await db.emailProvider.findFirst({
        where: { scope: "GLOBAL" },
      });

      if (globalProvider) {
        isConfigured = true;
        configLevel = "GLOBAL";
      }
    }

    // Check ADMIN company-specific configuration
    if (user.role === "ADMIN") {
      // Get all companies where user is ADMIN
      const adminCompanies = await db.companyMember.findMany({
        where: {
          userId,
          role: "ADMIN",
        },
        select: {
          companyId: true,
        },
      });

      const companyIds = adminCompanies.map((m) => m.companyId);

      // Check if any company has email provider configured
      const companyProvider = await db.emailProvider.findFirst({
        where: {
          scope: {
            in: companyIds,
          },
        },
      });

      if (companyProvider) {
        isConfigured = true;
        configLevel = "COMPANY";
      }

      // If no company-specific provider, check global fallback
      if (!isConfigured) {
        const globalProvider = await db.emailProvider.findFirst({
          where: { scope: "GLOBAL" },
        });

        if (globalProvider) {
          isConfigured = true;
          configLevel = "GLOBAL";
        }
      }
    }

    return NextResponse.json({
      configured: isConfigured,
      configLevel,
      message: isConfigured
        ? "Email service is configured"
        : "Email service is not configured. Please configure it in Settings.",
    });
  } catch (error) {
    console.error("Error checking email configuration:", error);
    return NextResponse.json(
      { error: "Internal server error", configured: false },
      { status: 500 }
    );
  }
}
