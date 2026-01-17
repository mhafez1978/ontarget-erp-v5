import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI, hasRole } from "@/lib/validate-session";
import type { Client as HederaClient } from "@hashgraph/sdk";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    if (!hasRole(validation.user, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { accountId, hexPrivateKey, derPrivateKey, keyType, network } = body;

    const key = hexPrivateKey || derPrivateKey;
    if (!accountId || !key) {
      return NextResponse.json(
        { error: "Account ID and a private key (HEX or DER) are required" },
        { status: 400 }
      );
    }

    // Dynamic import of Hedera SDK to avoid including it in test/runtime when not needed
    const { Client, AccountBalanceQuery, PrivateKey } = await import(
      "@hashgraph/sdk"
    );

    let operatorKey: string = key;

    // If a PEM/DER block was provided, try to parse it
    try {
      if (typeof key === "string" && key.trim().startsWith("-----BEGIN")) {
        // PrivateKey.fromString will handle PEM/DER formats
        const parsed = PrivateKey.fromString(key);
        operatorKey = parsed.toString();
      }
    } catch (err) {
      console.error("Failed Error:", err);
    }

    // Select correct client based on requested network
    const client = (() => {
      switch (network) {
        case "PREVIEWNET":
          return Client.forPreviewnet();
        case "MAINNET":
          return Client.forMainnet();
        default:
          return Client.forTestnet();
      }
    })() as HederaClient;

    // Try to set operator and read balance
    try {
      client.setOperator(accountId, operatorKey);
      const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
      const balance = await balanceQuery.execute(client);

      // Return HBAR balance as string
      const balanceHbar = balance.hbars.toString();

      // Persist the balance to the DB
      const { updateAccountBalance } = await import(
        "@/lib/hedera/cost-manager"
      );
      const Decimal = (await import("decimal.js")).default;
      await updateAccountBalance(new Decimal(balanceHbar));

      // Try to derive EVM address from hex or DER when keyType is ECDSA
      let evmAddress: string | null = null;
      try {
        if (keyType === "ECDSA") {
          const { Wallet } = await import("ethers");
          let candidate = operatorKey.trim();
          if (!candidate.startsWith("0x")) candidate = `0x${candidate}`;
          const wallet = new Wallet(candidate);
          evmAddress = wallet.address;
        }
      } catch {
        // Attempt DER parse -> derive by parsing DER to PrivateKey
        try {
          if (typeof derPrivateKey === "string" && keyType === "ECDSA") {
            const parsed = PrivateKey.fromString(derPrivateKey);
            let candidate = parsed.toString();
            if (!candidate.startsWith("0x")) candidate = `0x${candidate}`;
            const { Wallet } = await import("ethers");
            const wallet = new Wallet(candidate);
            evmAddress = wallet.address;
          }
        } catch {
          evmAddress = null;
        }
      }

      return NextResponse.json({
        success: true,
        balance: balanceHbar,
        evmAddress,
      });
    } catch (err) {
      console.error("Hedera test connection failed:", err);
      return NextResponse.json(
        {
          error: "Failed to connect to Hedera with provided credentials",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("/api/admin/hedera-settings/test error:", error);
    return NextResponse.json(
      { error: "Failed to test Hedera connection" },
      { status: 500 }
    );
  }
}
