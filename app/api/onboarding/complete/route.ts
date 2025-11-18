import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Verify onboarding token
    const onboardingToken = await db.onboardingToken.findUnique({
      where: { token },
      include: {
        staff: {
          include: {
            employmentDocuments: true,
          },
        },
      },
    });

    if (!onboardingToken) {
      return NextResponse.json(
        { error: "Invalid onboarding token" },
        { status: 404 }
      );
    }

    if (onboardingToken.isUsed) {
      return NextResponse.json(
        { error: "Onboarding already completed" },
        { status: 400 }
      );
    }

    if (new Date() > onboardingToken.expiresAt) {
      return NextResponse.json(
        { error: "Onboarding token expired" },
        { status: 400 }
      );
    }

    // Check if all required documents are uploaded
    const requiredDocs: Array<string> = [
      "SSN_CARD",
      "DRIVERS_LICENSE",
      "W4_TAX_FORM",
      "I9_FORM",
      "DIRECT_DEPOSIT_FORM",
      "EMPLOYEE_HANDBOOK_SIGNED",
    ];

    const uploadedDocs = onboardingToken.staff.employmentDocuments.map(
      (doc) => doc.docType
    );

    const missingDocs = requiredDocs.filter(
      (doc) => !uploadedDocs.includes(doc as never)
    );

    if (missingDocs.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required documents",
          missingDocs,
        },
        { status: 400 }
      );
    }

    // Mark onboarding as complete
    await db.onboardingToken.update({
      where: { id: onboardingToken.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        step1Complete: true,
        step2Complete: true,
        step3Complete: true,
        step4Complete: true,
      },
    });

    // Update staff record
    await db.companyStaff.update({
      where: { id: onboardingToken.staffId },
      data: {
        onboardingComplete: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("[Complete Onboarding Error]:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
