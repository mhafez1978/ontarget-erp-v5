import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;

    const body = await request.json();
    const { companyId } = body;

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

    // Get company details
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if Plaid is configured
    if (
      !process.env.PLAID_CLIENT_ID ||
      !process.env.PLAID_SECRET ||
      !process.env.PLAID_ENV
    ) {
      return NextResponse.json(
        { error: "Plaid is not configured. Please set environment variables." },
        { status: 500 }
      );
    }

    // Initialize Plaid client
    const {
      Configuration,
      PlaidApi,
      PlaidEnvironments,
      Products,
      CountryCode,
    } = await import("plaid");

    const configuration = new Configuration({
      basePath:
        PlaidEnvironments[
          process.env.PLAID_ENV as keyof typeof PlaidEnvironments
        ],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    });

    const plaidClient = new PlaidApi(configuration);

    // Create link token
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: companyId,
      },
      client_name: company.name,
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
    });

    return NextResponse.json({
      linkToken: linkTokenResponse.data.link_token,
    });
  } catch (error) {
    console.error("Error creating Plaid link token:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Plaid link token",
      },
      { status: 500 }
    );
  }
}
