import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { encrypt, decrypt } from "@/lib/encryption";

// GET - Retrieve payment gateways for a company
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
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

    // Check if user owns the company or is a member with appropriate role
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

    // Fetch payment gateways for the company
    const gateways = await db.paymentGateway.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    // Don't send encrypted keys back, just indicate if they exist
    const safeGateways = gateways.map((gateway) => ({
      id: gateway.id,
      provider: gateway.provider,
      isEnabled: gateway.isEnabled,
      isTestMode: gateway.isTestMode,
      publicKey: gateway.publicKey ? decrypt(gateway.publicKey) : null, // Public key is safe to send
      hasSecretKey: !!gateway.secretKey,
      hasWebhookSecret: !!gateway.webhookSecret,
      lastTestedAt: gateway.lastTestedAt,
      lastTestResult: gateway.lastTestResult,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt,
    }));

    return NextResponse.json(safeGateways);
  } catch (error) {
    console.error("Error fetching payment gateways:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment gateways" },
      { status: 500 }
    );
  }
}

// POST - Create or update payment gateway
export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyId,
      provider,
      publicKey,
      secretKey,
      webhookSecret,
      isTestMode,
    } = body;

    if (!companyId || !provider) {
      return NextResponse.json(
        { error: "Company ID and provider are required" },
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

    // Check if gateway already exists for this company + provider
    const existingGateway = await db.paymentGateway.findFirst({
      where: {
        companyId,
        provider,
      },
    });

    const gatewayData = {
      publicKey: publicKey ? encrypt(publicKey) : null,
      secretKey: secretKey ? encrypt(secretKey) : undefined, // Only update if provided
      webhookSecret: webhookSecret ? encrypt(webhookSecret) : undefined,
      isTestMode: isTestMode ?? true,
      configuredBy: user.id,
    };

    let gateway;

    if (existingGateway) {
      // Update existing gateway (only update keys if provided)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = { ...gatewayData };
      if (!secretKey) delete updateData.secretKey;
      if (!webhookSecret) delete updateData.webhookSecret;

      gateway = await db.paymentGateway.update({
        where: { id: existingGateway.id },
        data: updateData,
      });
    } else {
      // Create new gateway
      gateway = await db.paymentGateway.create({
        data: {
          companyId,
          provider,
          ...gatewayData,
        },
      });
    }

    return NextResponse.json({
      message: "Payment gateway saved successfully",
      gateway: {
        id: gateway.id,
        provider: gateway.provider,
        isEnabled: gateway.isEnabled,
        isTestMode: gateway.isTestMode,
      },
    });
  } catch (error) {
    console.error("Error saving payment gateway:", error);
    return NextResponse.json(
      { error: "Failed to save payment gateway" },
      { status: 500 }
    );
  }
}

// PUT - Update gateway (toggle enable/disable, etc.)
export async function PUT(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gatewayId = searchParams.get("gatewayId");

    if (!gatewayId) {
      return NextResponse.json(
        { error: "Gateway ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isEnabled } = body;

    // Fetch the gateway
    const gateway = await db.paymentGateway.findUnique({
      where: { id: gatewayId },
      include: { company: true },
    });

    if (!gateway) {
      return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
    }

    // Verify user has access
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

    const hasAccess =
      user.role === "SUPER_ADMIN" ||
      user.ownedCompanies.some((c) => c.id === gateway.companyId) ||
      user.companyMemberships.some(
        (m) =>
          m.companyId === gateway.companyId &&
          ["ADMIN", "MANAGER"].includes(m.role as string)
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update gateway
    const updatedGateway = await db.paymentGateway.update({
      where: { id: gatewayId },
      data: { isEnabled },
    });

    return NextResponse.json({
      message: "Gateway updated successfully",
      gateway: updatedGateway,
    });
  } catch (error) {
    console.error("Error updating payment gateway:", error);
    return NextResponse.json(
      { error: "Failed to update payment gateway" },
      { status: 500 }
    );
  }
}
