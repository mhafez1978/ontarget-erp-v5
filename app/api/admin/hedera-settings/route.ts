import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI, hasRole } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET /api/admin/hedera-settings
 * Retrieve current Hedera settings (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    // Only admins can access
    if (!hasRole(validation.user, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const setting = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL" },
    });

    if (!setting) {
      return NextResponse.json({
        configured: false,
        isActive: false,
        network: "TESTNET",
      });
    }

    // Don't return encrypted credentials
    return NextResponse.json({
      configured: !!(
        setting?.hederaAccount &&
        (setting?.hederaHexKey || setting?.hederaDerKey)
      ),
      isActive: setting.isActive,
      network: setting.network || "TESTNET",
      topicId: setting.topicId,
      currentBalance: setting.currentBalance?.toString(),
      lowBalanceThreshold: setting.lowBalanceThreshold.toString(),
      lastBalanceCheck: setting.lastBalanceCheck,
      estimatedCostPerTx: setting.estimatedCostPerTx.toString(),
      totalTransactions: setting.totalTransactions,
      totalCostHbar: setting.totalCostHbar.toString(),
    });
  } catch (error) {
    console.error("Failed to get Hedera settings:", error);
    return NextResponse.json(
      { error: "Failed to retrieve settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/hedera-settings
 * Save Hedera configuration (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    // Only admins can configure
    if (!hasRole(validation.user, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      accountId,
      hexPrivateKey,
      derPrivateKey,
      derPublicKey,
      evmAddress,
      keyType,
      topicId,
      network,
      isActive,
      lowBalanceThreshold,
    } = body;

    // Validate required fields if activating
    const hasAnyKey = !!(hexPrivateKey || derPrivateKey);
    if (isActive && (!accountId || !hasAnyKey || !topicId)) {
      return NextResponse.json(
        {
          error:
            "Account ID, a Private Key (HEX or DER), and Topic ID are required when enabling Hedera",
        },
        { status: 400 }
      );
    }

    // Find existing setting or create new
    let setting = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL" },
    });

    const updateData: {
      network?: "TESTNET" | "PREVIEWNET" | "MAINNET";
      isActive?: boolean;
      hederaAccount?: string;
      hederaHexKey?: string;
      hederaDerKey?: string;
      hederaDerPub?: string;
      evmAddress?: string | null;
      keyType?: string | null;
      topicId?: string;
      lowBalanceThreshold?: Decimal;
    } = {
      network:
        (network as "TESTNET" | "PREVIEWNET" | "MAINNET") ||
        setting?.network ||
        "TESTNET",
      isActive: isActive ?? false,
    };

    // Encrypt and save credentials if provided
    if (accountId) {
      updateData.hederaAccount = encrypt(accountId);
    }

    if (hexPrivateKey) {
      updateData.hederaHexKey = encrypt(hexPrivateKey);
    }
    if (derPrivateKey) {
      updateData.hederaDerKey = encrypt(derPrivateKey);
    }
    if (derPublicKey) {
      updateData.hederaDerPub = encrypt(derPublicKey);
    }

    // Derive EVM address server-side if ECDSA key provided and evmAddress not supplied
    if (!evmAddress && keyType === "ECDSA") {
      try {
        const ethers = await import("ethers");
        let candidate: string | null = null;
        if (hexPrivateKey) {
          const c = hexPrivateKey.trim();
          candidate = c.startsWith("0x") ? c : `0x${c}`;
        } else if (derPrivateKey) {
          try {
            const { PrivateKey } = await import("@hashgraph/sdk");
            const parsed = PrivateKey.fromString(derPrivateKey);
            candidate = parsed.toString();
            if (candidate && !candidate.startsWith("0x"))
              candidate = `0x${candidate}`;
          } catch (err) {
            console.log("DER to EVM derivation failed:", err);
            candidate = null;
          }
        }
        if (candidate) {
          const wallet = new ethers.Wallet(candidate);
          updateData.evmAddress = wallet.address;
        }
      } catch (err) {
        // Ignore derivation errors
        console.warn("Failed to derive EVM address on server:", err);
      }
    }

    if (evmAddress) updateData.evmAddress = evmAddress;
    if (keyType) updateData.keyType = keyType;

    if (topicId) {
      updateData.topicId = topicId;
    }

    if (lowBalanceThreshold !== undefined) {
      updateData.lowBalanceThreshold = new Decimal(lowBalanceThreshold);
    }
    if (setting) {
      // Update existing
      setting = await db.hederaSetting.update({
        where: { id: setting.id },
        data: updateData,
      });
    } else {
      // Create new
      setting = await db.hederaSetting.create({
        data: {
          scope: "GLOBAL",
          ...updateData,
        },
      });
    }

    // Do not return sensitive keys
    return NextResponse.json({
      success: true,
      configured: !!(
        setting?.hederaAccount ||
        setting?.hederaHexKey ||
        setting?.hederaDerKey
      ),
      isActive: setting?.isActive ?? false,
      evmAddress: setting?.evmAddress || null,
      keyType: setting?.keyType || null,
    });
  } catch (error) {
    console.error("Failed to save Hedera settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/hedera-settings/balance
 * Manually refresh Hedera account balance
 */
export async function PUT(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    if (!hasRole(validation.user, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    // Import Hedera SDK dynamically
    const { AccountBalanceQuery } = await import("@hashgraph/sdk");
    const { decrypt } = await import("@/lib/encryption");
    const { updateAccountBalance } = await import("@/lib/hedera/cost-manager");

    // Get credentials from database
    const setting = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (
      !setting?.hederaAccount ||
      !(setting?.hederaHexKey || setting?.hederaDerKey)
    ) {
      return NextResponse.json(
        { error: "Hedera credentials not configured" },
        { status: 400 }
      );
    }

    const accountId = decrypt(setting.hederaAccount);
    const privateKey = setting.hederaHexKey
      ? decrypt(setting.hederaHexKey)
      : decrypt(setting.hederaDerKey!);

    const client = await (async () => {
      const { Client } = await import("@hashgraph/sdk");
      switch (setting.network) {
        case "PREVIEWNET":
          return Client.forPreviewnet();
        case "MAINNET":
          return Client.forMainnet();
        default:
          return Client.forTestnet();
      }
    })();

    client.setOperator(accountId, privateKey);

    const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
    const balance = await balanceQuery.execute(client);
    const balanceHbar = new Decimal(balance.hbars.toString());

    await updateAccountBalance(balanceHbar);
    return NextResponse.json({
      success: true,
      balance: balanceHbar.toString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to refresh balance:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
