import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/public/verify/[hash]
 * Public endpoint to verify Hedera-anchored records
 * No authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const { hash } = params;

    if (!hash || hash.length !== 64) {
      return NextResponse.json(
        { error: "Invalid hash format" },
        { status: 400 }
      );
    }

    // Look up the transaction by hash
    const transaction = await db.hederaTransaction.findFirst({
      where: { hash },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({
        verified: false,
        message: "Record not found in blockchain",
        hash,
      });
    }

    // Check if company still exists (could be null due to onDelete: SetNull)
    if (!transaction.company) {
      return NextResponse.json({
        verified: true,
        hash,
        transactionId: transaction.transactionId,
        consensusTimestamp: transaction.consensusTimestamp?.toISOString(),
        costHbar: transaction.costHbar?.toString(),
        status: transaction.status,
        company: null,
        blockchainExplorer: `https://hashscan.io/testnet/transaction/${transaction.transactionId}`,
        anchoredAt: transaction.createdAt.toISOString(),
        network: "TESTNET",
        message: "Company record no longer available",
      });
    }

    // Get network info
    const setting = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
      select: { network: true },
    });

    const network = setting?.network?.toLowerCase() || "testnet";
    const explorerUrl = `https://hashscan.io/${network}/transaction/${transaction.transactionId}`;

    return NextResponse.json({
      verified: true,
      hash,
      transactionId: transaction.transactionId,
      consensusTimestamp: transaction.consensusTimestamp?.toISOString(),
      costHbar: transaction.costHbar?.toString(),
      status: transaction.status,
      company: transaction.company
        ? {
            id: transaction.company.id ?? null,
            name: transaction.company.name ?? null,
            logo: transaction.company.logo ?? null,
          }
        : null,
      blockchainExplorer: explorerUrl,
      anchoredAt: transaction.createdAt.toISOString(),
      network: network.toUpperCase(),
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification service temporarily unavailable" },
      { status: 500 }
    );
  }
}
