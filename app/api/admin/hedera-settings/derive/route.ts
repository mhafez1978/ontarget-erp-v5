import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI, hasRole } from "@/lib/validate-session";

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
    const { hexPrivateKey, derPrivateKey, keyType } = body;

    if (!hexPrivateKey && !derPrivateKey) {
      return NextResponse.json(
        { error: "HEX or DER private key required" },
        { status: 400 }
      );
    }

    if (keyType !== "ECDSA") {
      return NextResponse.json(
        { error: "EVM derivation only supported for ECDSA keys" },
        { status: 400 }
      );
    }

    // Try to derive via ethers (HEX) or DER parse + ethers
    try {
      const ethers = await import("ethers");
      let candidate: string | null = null;
      if (hexPrivateKey) {
        let pk = (hexPrivateKey as string).trim();
        if (!pk.startsWith("0x")) pk = `0x${pk}`;
        candidate = pk;
      } else if (derPrivateKey) {
        const { PrivateKey } = await import("@hashgraph/sdk");
        const parsed = PrivateKey.fromString(derPrivateKey as string);
        let pk = parsed.toString();
        if (!pk.startsWith("0x")) pk = `0x${pk}`;
        candidate = pk;
      }

      if (!candidate) throw new Error("Failed to obtain candidate private key");

      const wallet = new ethers.Wallet(candidate);
      return NextResponse.json({ success: true, evmAddress: wallet.address });
    } catch (err) {
      console.error("Derive EVM error:", err);
      return NextResponse.json(
        {
          error: "Failed to derive EVM address",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("/api/admin/hedera-settings/derive error:", error);
    return NextResponse.json(
      { error: "Failed to derive EVM address" },
      { status: 500 }
    );
  }
}
