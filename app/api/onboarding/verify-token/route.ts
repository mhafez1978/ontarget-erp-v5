import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Verify onboarding token
    const onboardingToken = await db.onboardingToken.findUnique({
      where: { token },
      include: {
        staff: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
                logoLight: true,
                logoDark: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            employmentDocuments: {
              select: {
                id: true,
                docType: true,
                fileName: true,
                status: true,
                uploadedAt: true,
              },
            },
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

    if (new Date() > onboardingToken.expiresAt) {
      // Audit: expired token was accessed (useful for analytics / admin troubleshooting)
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_TOKEN_VIEWED,
        userId: onboardingToken.staff.user.id,
        companyId: onboardingToken.staff.company?.id,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: onboardingToken.staff.id,
        description: `Expired onboarding token accessed for ${onboardingToken.staff.user.email}`,
        metadata: { token: onboardingToken.token, expired: true },
      });

      return NextResponse.json(
        { error: "Onboarding token expired", expired: true },
        { status: 400 }
      );
    }

    // Check if already completed
    if (onboardingToken.isUsed && onboardingToken.staff.onboardingComplete) {
      return NextResponse.json(
        {
          error: "Onboarding already completed",
          alreadyCompleted: true,
        },
        { status: 400 }
      );
    }

    // Required documents list
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

    // Audit: token viewed / verified
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_TOKEN_VIEWED,
      userId: onboardingToken.staff.user.id,
      companyId: onboardingToken.staff.company?.id,
      entityType: ENTITY_TYPES.STAFF_MEMBER,
      entityId: onboardingToken.staff.id,
      description: `Onboarding token verified for ${onboardingToken.staff.user.email}`,
      metadata: { token: onboardingToken.token, missingDocs },
    });

    return NextResponse.json({
      valid: true,
      staff: {
        name: onboardingToken.staff.user.name,
        email: onboardingToken.staff.user.email,
        jobTitle: onboardingToken.staff.jobTitle,
      },
      company: onboardingToken.staff.company,
      progress: {
        step1Complete: onboardingToken.step1Complete,
        step2Complete: onboardingToken.step2Complete,
        step3Complete: onboardingToken.step3Complete,
        step4Complete: onboardingToken.step4Complete,
      },
      documents: onboardingToken.staff.employmentDocuments,
      requiredDocs,
      missingDocs,
      isComplete: missingDocs.length === 0,
    });
  } catch (error) {
    console.error("[Verify Token Error]:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
