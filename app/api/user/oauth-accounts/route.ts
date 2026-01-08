import { NextRequest, NextResponse } from "next/server";
import {
  getUserOAuthAccounts,
  disconnectOAuthAccount,
} from "@/lib/oauth-tokens";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/user/oauth-accounts - Get user's connected OAuth accounts
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const accounts = await getUserOAuthAccounts(userId);

    return NextResponse.json({
      success: true,
      accounts: accounts.map((account) => ({
        id: account.id,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        type: account.type,
        scope: account.scope,
      })),
    });
  } catch (error) {
    console.error("Error fetching OAuth accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch OAuth accounts" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/oauth-accounts - Disconnect an OAuth account
export async function DELETE(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { provider } = await req.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const success = await disconnectOAuthAccount(userId, provider);

    if (!success) {
      return NextResponse.json(
        {
          error:
            "Failed to disconnect account. This may be your last authentication method.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${provider} account disconnected successfully`,
    });
  } catch (error: unknown) {
    console.error("Error disconnecting OAuth account:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to disconnect account";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
