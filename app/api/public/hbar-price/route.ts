import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/public/hbar-price
 * Get current HBAR price in USD
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch HBAR price from CoinGecko API
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd",
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      // Fallback to a reasonable default if API fails
      return NextResponse.json({
        price: 0.08, // ~$0.08 per HBAR as of Jan 2026
        currency: "USD",
        lastUpdated: new Date().toISOString(),
        source: "fallback",
      });
    }

    const data = await response.json();
    const price = data["hedera-hashgraph"]?.usd || 0.08;

    return NextResponse.json({
      price,
      currency: "USD",
      lastUpdated: new Date().toISOString(),
      source: "coingecko",
    });
  } catch (error) {
    console.error("Failed to fetch HBAR price:", error);

    // Return fallback price
    return NextResponse.json({
      price: 0.08,
      currency: "USD",
      lastUpdated: new Date().toISOString(),
      source: "fallback",
    });
  }
}
