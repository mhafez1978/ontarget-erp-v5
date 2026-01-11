import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { decrypt, encrypt } from "@/lib/encryption";
import { CompanyLegalEntity, TaxIdType } from "@prisma/client";

// GET - Retrieve tax info for a company (with decryption for viewing)
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has ADMIN access to this company (tax info is sensitive PII)
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: { userId: user.id, role: "ADMIN" },
            },
          },
        ],
      },
    });

    if (!company && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admin access required to view tax information" },
        { status: 403 }
      );
    }

    // Get tax info
    const taxInfo = await db.companyTaxInfo.findUnique({
      where: { companyId },
      select: {
        id: true,
        legalEntity: true,
        taxIdType: true,
        taxId: true,
        taxCountry: true,
        vatNumber: true,
        verifiedAt: true,
        verifiedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!taxInfo) {
      return NextResponse.json(
        { error: "Tax information not found" },
        { status: 404 }
      );
    }

    // Decrypt sensitive fields
    const decryptedTaxInfo = {
      ...taxInfo,
      taxId: taxInfo.taxId ? decrypt(taxInfo.taxId) : null,
      vatNumber: taxInfo.vatNumber ? decrypt(taxInfo.vatNumber) : null,
    };

    return NextResponse.json(
      {
        success: true,
        taxInfo: decryptedTaxInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching tax info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax information" },
      { status: 500 }
    );
  }
}

// PATCH - Update tax info for a company
export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const body = await request.json();
    const { companyId, legalEntity, taxIdType, taxId, taxCountry, vatNumber } =
      body as {
        companyId: string;
        legalEntity: CompanyLegalEntity;
        taxIdType: TaxIdType;
        taxId: string;
        taxCountry?: string | null;
        vatNumber?: string | null;
      };

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has ADMIN access to this company
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: { userId: user.id, role: "ADMIN" },
            },
          },
        ],
      },
    });

    if (!company && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Prepare update data with encryption
    interface TaxInfoUpdateData {
      legalEntity?: CompanyLegalEntity;
      taxIdType?: TaxIdType;
      taxId?: string;
      taxCountry?: string | null;
      vatNumber?: string | null;
    }

    const updateData: TaxInfoUpdateData = {};
    // Upsert tax info
    const taxInfo = await db.companyTaxInfo.upsert({
      where: { companyId },
      create: {
        companyId,
        legalEntity,
        taxIdType,
        taxId: encrypt(taxId),
        taxCountry,
        vatNumber: vatNumber ? encrypt(vatNumber) : null,
      },
      update: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tax information updated successfully",
        taxInfo: {
          id: taxInfo.id,
          legalEntity: taxInfo.legalEntity,
          taxIdType: taxInfo.taxIdType,
          taxCountry: taxInfo.taxCountry,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating tax info:", error);
    return NextResponse.json(
      { error: "Failed to update tax information" },
      { status: 500 }
    );
  }
}
