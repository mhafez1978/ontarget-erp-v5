import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadDocument } from "@/lib/storage-service";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { checkSequentialUpload } from "@/lib/onboarding-config";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;
    const docType = formData.get("docType") as string;
    const file = formData.get("file") as File;

    if (!token || !docType || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify onboarding token (include staff's existing documents so we can
    // enforce sequential upload ordering on required documents)
    const onboardingToken = await db.onboardingToken.findUnique({
      where: { token },
      include: {
        staff: {
          include: {
            company: true,
            user: true,
            employmentDocuments: true,
          },
        },
      },
    });

    if (!onboardingToken) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_DOCUMENT_UPLOAD_FAILED,
        companyId: null,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: null,
        description: `Invalid onboarding token used for upload attempt`,
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
      return NextResponse.json(
        { error: "Onboarding token expired" },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocTypes = [
      "SSN_CARD",
      "DRIVERS_LICENSE",
      "PASSPORT",
      "BIRTH_CERTIFICATE",
      "WORK_AUTHORIZATION",
      "W4_TAX_FORM",
      "STATE_TAX_FORM",
      "I9_FORM",
      "DIRECT_DEPOSIT_FORM",
      "EMPLOYEE_HANDBOOK_SIGNED",
      "NDA_SIGNED",
      "CONTRACT_SIGNED",
      "INSURANCE_CARD",
      "OTHER",
    ];

    if (!validDocTypes.includes(docType)) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_DOCUMENT_UPLOAD_FAILED,
        userId: onboardingToken.staff.user.id,
        companyId: onboardingToken.staff.company?.id,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: onboardingToken.staffId,
        description: `Invalid document type attempted: ${docType}`,
        metadata: { token, docType },
      });

      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_DOCUMENT_UPLOAD_FAILED,
        userId: onboardingToken.staff.user.id,
        companyId: onboardingToken.staff.company?.id,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: onboardingToken.staffId,
        description: `File too large for ${docType}`,
        metadata: { token, fileSize: file.size },
      });

      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_DOCUMENT_UPLOAD_FAILED,
        userId: onboardingToken.staff.user.id,
        companyId: onboardingToken.staff.company?.id,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: onboardingToken.staffId,
        description: `Invalid mime-type for ${docType}`,
        metadata: { token, mimeType: file.type },
      });

      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Enforce sequential uploads for required document types (country-specific)
    const uploaded = onboardingToken.staff.employmentDocuments.map(
      (d) => d.docType
    );
    // Fallback chain: staff country → company country → DEFAULT (International)
    const countryCode =
      onboardingToken.staff.countryCode ||
      onboardingToken.staff.country ||
      onboardingToken.staff.company?.countryCode ||
      onboardingToken.staff.company?.country;
    const check = checkSequentialUpload(docType, uploaded, countryCode);

    if (!check.ok) {
      // Audit: rejected upload due to out-of-order
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_DOCUMENT_UPLOAD_FAILED,
        userId: onboardingToken.staff.user.id,
        companyId: onboardingToken.staff.company?.id,
        entityType: ENTITY_TYPES.STAFF_MEMBER,
        entityId: onboardingToken.staffId,
        description: `Rejected upload for ${docType}: missing prerequisites`,
        metadata: {
          token,
          docType,
          missingPrereqs: check.missingPrereqs,
          country: countryCode,
        },
      });

      return NextResponse.json(
        {
          error: "Upload out of order",
          message: `Please upload the following required documents first: ${check.missingPrereqs?.join(
            ", "
          )}`,
          missingPrereqs: check.missingPrereqs,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${docType}_${timestamp}_${sanitizedName}`;

    // Upload document (derive mime type when missing)
    const detectedMime =
      file.type ||
      (await import("@/lib/file-utils")).getMimeTypeFromExtension(fileName);
    const { primaryPath, backupPath, storageProvider } = await uploadDocument(
      onboardingToken.staff.companyId,
      "HR-Docs",
      fileName,
      buffer,
      detectedMime
    );

    // Create employment document record
    const employmentDoc = await db.employmentDocument.create({
      data: {
        staffId: onboardingToken.staffId,
        docType: docType as
          | "SSN_CARD"
          | "DRIVERS_LICENSE"
          | "PASSPORT"
          | "BIRTH_CERTIFICATE"
          | "WORK_AUTHORIZATION"
          | "W4_TAX_FORM"
          | "STATE_TAX_FORM"
          | "I9_FORM"
          | "DIRECT_DEPOSIT_FORM"
          | "EMPLOYEE_HANDBOOK_SIGNED"
          | "NDA_SIGNED"
          | "CONTRACT_SIGNED"
          | "INSURANCE_CARD"
          | "OTHER",
        fileName: fileName,
        fileSize: file.size,
        mimeType: detectedMime,
        primaryPath,
        backupPath,
        storageProvider,
        status: "PENDING",
      },
    });

    // Audit: document uploaded (architected as PENDING review)
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_DOCUMENT_UPLOADED,
      userId: onboardingToken.staff.user.id,
      companyId: onboardingToken.staff.company?.id,
      entityType: ENTITY_TYPES.STAFF_MEMBER,
      entityId: onboardingToken.staffId,
      description: `Uploaded onboarding document: ${docType}`,
      metadata: {
        docId: employmentDoc.id,
        docType: employmentDoc.docType,
        fileName: employmentDoc.fileName,
        status: employmentDoc.status,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: employmentDoc.id,
        docType: employmentDoc.docType,
        fileName: employmentDoc.fileName,
        status: employmentDoc.status,
        uploadedAt: employmentDoc.uploadedAt,
      },
    });
  } catch (error) {
    console.error("[Upload Document Error]:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
