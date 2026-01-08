import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getPlatformFeeInfo } from "@/lib/platform-fees";

/**
 * Get platform fee information for a company
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    const feeInfo = await getPlatformFeeInfo(companyId);

    return NextResponse.json(feeInfo);
  } catch (error) {
    console.error("Error fetching platform fee info:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform fee info" },
      { status: 500 }
    );
  }
}
