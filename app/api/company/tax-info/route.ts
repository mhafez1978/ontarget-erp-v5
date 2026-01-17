import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { decrypt, encrypt } from "@/lib/encryption";
import {
  CompanyLegalEntity,
  TaxIdType,
} from "@/generated/prisma/client";

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

    // Owner-only: verify the user is the company owner
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });
    if (company?.ownerId !== user.id && user.role !== "SUPER_ADMIN") {
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

    // Owner-only: verify the user is the company owner
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });
    if (company?.ownerId !== user.id && user.role !== "SUPER_ADMIN") {
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

    if (legalEntity !== undefined) updateData.legalEntity = legalEntity;
    if (taxIdType !== undefined) updateData.taxIdType = taxIdType;
    if (taxId !== undefined) updateData.taxId = taxId ? encrypt(taxId) : "";
    if (taxCountry !== undefined) updateData.taxCountry = taxCountry;
    if (vatNumber !== undefined)
      updateData.vatNumber = vatNumber ? encrypt(vatNumber) : null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update" },
        { status: 400 }
      );
    }

    // Upsert tax info
    const taxInfo = await db.companyTaxInfo.upsert({
      where: { companyId },
      create: {
        companyId,
        legalEntity: updateData.legalEntity ?? legalEntity,
        taxIdType: updateData.taxIdType ?? taxIdType,
        taxId: updateData.taxId ?? (taxId ? encrypt(taxId) : ""),
        taxCountry: updateData.taxCountry ?? taxCountry,
        vatNumber:
          updateData.vatNumber ?? (vatNumber ? encrypt(vatNumber) : null),
      },
      update: {
        ...(updateData.legalEntity !== undefined && {
          legalEntity: updateData.legalEntity,
        }),
        ...(updateData.taxIdType !== undefined && {
          taxIdType: updateData.taxIdType,
        }),
        ...(updateData.taxId !== undefined &&
          updateData.taxId !== null && { taxId: updateData.taxId }),
        ...(updateData.taxCountry !== undefined && {
          taxCountry: { set: updateData.taxCountry },
        }),
        ...(updateData.vatNumber !== undefined && {
          vatNumber: { set: updateData.vatNumber },
        }),
      },
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
