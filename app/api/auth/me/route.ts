import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("[/api/auth/me] Checking auth - starting validation");

    // Validate session using the new helper
    const validation = await validateSessionForAPI(request);

    console.log(
      "[/api/auth/me] Session validation result:",
      validation.valid ? "VALID" : "INVALID"
    );

    if (!validation.valid) {
      console.log("[/api/auth/me] Session invalid or no user");
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    const { user } = validation;

    console.log(
      "[/api/auth/me] User authenticated:",
      user.email,
      "role:",
      user.role
    );

    // For staff/contractor/manager roles, get their company from CompanyStaff
    let companyId = null;
    if (
      user.role === "STAFF" ||
      user.role === "CONTRACTOR" ||
      user.role === "MANAGER"
    ) {
      const staffMembership = await db.companyStaff.findFirst({
        where: { userId: user.id },
        select: { companyId: true },
      });
      companyId = staffMembership?.companyId || null;
    }

    // For ADMIN role, get their owned company
    if (user.role === "ADMIN") {
      const ownedCompany = await db.company.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      companyId = ownedCompany?.id || null;
    }

    return NextResponse.json({
      user: {
        ...user,
        companyId,
      },
      authenticated: true,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Failed to get current user" },
      { status: 500 }
    );
  }
}
