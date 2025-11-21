import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    // Fetch company-specific OAuth settings
    const providers = await db.companyOAuthSetting.findMany({
      where: {
        companyId: companyId,
        enabled: true,
      },
      select: {
        provider: true,
        clientId: true,
      },
    });

    // Filter out providers with missing clientId (not fully configured)
    const enabledProviders = providers.filter((p) => p.clientId);

    return NextResponse.json({ providers: enabledProviders });
  } catch (error) {
    console.error("Error fetching company OAuth providers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
