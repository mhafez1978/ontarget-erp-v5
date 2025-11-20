import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;

    // Fetch company-specific OAuth settings
    const providers = await prisma.companyOAuthSetting.findMany({
      where: {
        companyId: companyId,
        isEnabled: true,
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
