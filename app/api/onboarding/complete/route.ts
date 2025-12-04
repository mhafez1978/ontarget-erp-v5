import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";

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
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_COMPLETION_FAILED,
        companyId: null,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: null,
        description: `Attempted onboarding completion with invalid token: ${token}`,
        metadata: { token },
      });
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
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_COMPLETION_FAILED,
        userId: onboardingToken.staff.userId,
        companyId: onboardingToken.staff.companyId,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: onboardingToken.staffId,
        description: `Attempt to complete onboarding with expired token`,
        metadata: { token, expired: true },
      });
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
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_COMPLETION_FAILED,
        userId: onboardingToken.staff.userId,
        companyId: onboardingToken.staff.companyId,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: onboardingToken.staffId,
        description: `Attempted onboarding completion but missing documents: ${missingDocs.join(", ")}`,
        metadata: { token, missingDocs },
      });
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

    // Audit: onboarding completed
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_COMPLETED,
      userId: onboardingToken.staff.userId,
      companyId: onboardingToken.staff.companyId,
      entityType: ENTITY_TYPES.STAFF_MEMBER,
      entityId: onboardingToken.staffId,
      description: `Onboarding completed for ${onboardingToken.staffId}`,
      metadata: { token: onboardingToken.token },
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
