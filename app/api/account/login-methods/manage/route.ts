import { NextRequest, NextResponse } from "next/server";
import {
  setPrimaryLoginMethod,
  disableLoginMethod,
  enableLoginMethod,
} from "@/lib/account-tracking";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// Set primary login method
export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const userId = user.id;

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Verify this account belongs to the user
    const account = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return NextResponse.json(
        { error: "Account not found or unauthorized" },
        { status: 403 }
      );
    }

    await setPrimaryLoginMethod(userId, accountId);

    return NextResponse.json({
      success: true,
      message: "Primary login method updated",
    });
  } catch (error) {
    console.error("[Set Primary Error]:", error);
    return NextResponse.json(
      { error: "Failed to update primary login method" },
      { status: 500 }
    );
  }
}

// Disable/Enable login method
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const userId = user.id;

    const { accountId, action } = await request.json();

    if (!accountId || !action) {
      return NextResponse.json(
        { error: "Account ID and action are required" },
        { status: 400 }
      );
    }

    // Verify this account belongs to the user
    const account = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return NextResponse.json(
        { error: "Account not found or unauthorized" },
        { status: 403 }
      );
    }

    // Prevent disabling the only active account
    if (action === "disable") {
      const activeAccounts = await db.account.count({
        where: {
          userId,
          isActive: true,
        },
      });

      if (activeAccounts <= 1) {
        return NextResponse.json(
          { error: "Cannot disable your only active login method" },
          { status: 400 }
        );
      }

      await disableLoginMethod(accountId);
    } else if (action === "enable") {
      await enableLoginMethod(accountId);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'enable' or 'disable'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Login method ${action}d successfully`,
    });
  } catch (error) {
    console.error("[Toggle Login Method Error]:", error);
    return NextResponse.json(
      { error: "Failed to update login method" },
      { status: 500 }
    );
  }
}
