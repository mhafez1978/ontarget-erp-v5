import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPaymentProvider } from "@/lib/payment-providers";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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

    // Owner-only for testing: verify company owner
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });
    if (
      !company ||
      (company.ownerId !== userId && user.role !== "SUPER_ADMIN")
    ) {
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
