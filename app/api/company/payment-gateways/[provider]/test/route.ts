import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { createPaymentProvider } from "@/lib/payment-providers";
import { validateSession } from "@/lib/session-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    // Get user from session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const body = await request.json();
    const { companyId, publicKey, secretKey, webhookSecret, isTestMode } = body;

    if (!companyId || !secretKey) {
      return NextResponse.json(
        { error: "Company ID and secret key are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompanies: true,
        companyMemberships: {
          include: { company: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user owns the company or is an admin/manager
    const hasAccess =
      user.role === "SUPER_ADMIN" ||
      user.ownedCompanies.some((c) => c.id === companyId) ||
      user.companyMemberships.some(
        (m) =>
          m.companyId === companyId &&
          ["ADMIN", "MANAGER"].includes(m.role as string)
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create payment provider instance
    const paymentProvider = createPaymentProvider(provider, {
      publicKey,
      secretKey,
      webhookSecret,
      isTestMode: isTestMode ?? true,
    });

    // Test connection
    const result = await paymentProvider.testConnection();

    // Update gateway with test result
    const gateway = await db.paymentGateway.findFirst({
      where: {
        companyId,
        provider: provider,
      },
    });

    if (gateway) {
      await db.paymentGateway.update({
        where: { id: gateway.id },
        data: {
          lastTestedAt: new Date(),
          lastTestResult: result.success ? "success" : "failed",
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Error testing payment gateway:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to test payment gateway",
      },
      { status: 500 }
    );
  }
}
