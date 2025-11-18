import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/encryption";
import { validateSession } from "@/lib/session-manager";

export async function POST(request: NextRequest) {
  try {
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

    const { companyId, publicToken } = await request.json();

    if (!companyId || !publicToken) {
      return NextResponse.json(
        { error: "Company ID and public token are required" },
        { status: 400 }
      );
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
      user.ownedCompanies.some((c) => c.id === companyId) ||
      user.companyMemberships.some(
        (m) =>
          m.companyId === companyId &&
          ["ADMIN", "MANAGER"].includes(m.role as string)
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if Plaid is configured
    if (
      !process.env.PLAID_CLIENT_ID ||
      !process.env.PLAID_SECRET ||
      !process.env.PLAID_ENV
    ) {
      return NextResponse.json(
        {
          error:
            "Plaid is not configured. Please contact your system administrator.",
        },
        { status: 500 }
      );
    }

    // Import Plaid dynamically
    let plaidClient;
    try {
      const { Configuration, PlaidApi, PlaidEnvironments } = await import(
        "plaid"
      );

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

      plaidClient = new PlaidApi(configuration);
    } catch (importError) {
      console.error("Plaid SDK not installed:", importError);
      return NextResponse.json(
        {
          error:
            "Plaid integration is not available. Please run: npm install plaid",
        },
        { status: 500 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get accounts information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;
    const institution = accountsResponse.data.item.institution_id;

    // Get institution details
    let institutionName = "Unknown Institution";
    try {
      const { CountryCode } = await import("plaid");
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institution || "",
        country_codes: [CountryCode.Us],
      });
      institutionName = institutionResponse.data.institution.name;
    } catch (instError) {
      console.error("Error fetching institution details:", instError);
    }

    // Store each account in the database
    const createdAccounts = [];
    for (const account of accounts) {
      const plaidAccount = await db.plaidAccount.create({
        data: {
          companyId,
          accessToken: encrypt(accessToken), // Encrypt access token
          itemId,
          accountId: account.account_id,
          accountName: account.name,
          accountMask: account.mask || undefined,
          accountType: account.subtype || account.type,
          institutionId: institution || undefined,
          institutionName,
          isActive: true,
          linkedBy: userId,
          lastSyncAt: new Date(),
        },
      });

      createdAccounts.push({
        id: plaidAccount.id,
        accountName: plaidAccount.accountName,
        accountMask: plaidAccount.accountMask,
        accountType: plaidAccount.accountType,
        institutionName: plaidAccount.institutionName,
        isActive: plaidAccount.isActive,
      });
    }

    return NextResponse.json({
      success: true,
      accounts: createdAccounts,
      message: `Successfully linked ${createdAccounts.length} account(s)`,
    });
  } catch (error: unknown) {
    console.error("Error exchanging Plaid public token:", error);

    // Handle Plaid-specific errors
    if (error && typeof error === "object" && "response" in error) {
      const plaidError = error as {
        response?: { data?: { error_message?: string }; status?: number };
      };
      if (plaidError.response?.data) {
        return NextResponse.json(
          {
            error: plaidError.response.data.error_message || "Plaid API error",
            details: plaidError.response.data,
          },
          { status: plaidError.response.status || 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to link bank account",
      },
      { status: 500 }
    );
  }
}
