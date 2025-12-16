import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/company/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const userId = validation.user.id;

    const { id: companyId } = await params;

    // Check access rights
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: "ADMIN" } } },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PATCH /api/company/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const userId = user.id;

    const { id: companyId } = await params;

    // Check if user owns the company or is super admin
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or insufficient permissions" },
        { status: 403 }
      );
    }

    // SECURITY: Only SUPER_ADMIN can update root company
    if (company.isRoot && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can update system branding" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      slogan,
      description,
      email,
      salesEmail,
      supportEmail,
      phone,
      website,
      address,
      logo,
      logoLight,
      logoDark,
    } = body;

    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: {
        name,
        slogan,
        description,
        email,
        salesEmail,
        supportEmail,
        phone,
        website,
        ...(logo !== undefined && { logo }),
        ...(logoLight !== undefined && { logoLight }),
        ...(logoDark !== undefined && { logoDark }),
        addressLine1: address?.addressLine1,
        addressLine2: address?.addressLine2,
        city: address?.city,
        state: address?.state,
        country: address?.country,
        countryCode: address?.countryCode,
        postalCode: address?.postalCode,
        latitude: address?.latitude || null,
        longitude: address?.longitude || null,
      },
    });

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE /api/company/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const userId = user.id;

    const { id: companyId } = await params;

    // Check if user owns the company or is super admin
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or insufficient permissions" },
        { status: 403 }
      );
    }

    // If ADMIN user is deleting their own company, demote them to ERP_CUSTOMER
    if (user.role === "ADMIN" && company.ownerId === userId) {
      // Check if they own any other companies
      const otherCompanies = await db.company.findMany({
        where: {
          ownerId: userId,
          id: { not: companyId },
        },
      });

      // If this is their last company, demote to ERP_CUSTOMER
      if (otherCompanies.length === 0) {
        await db.user.update({
          where: { id: userId },
          data: { role: "ERP_CUSTOMER" },
        });
      }
    }

    // Delete the company (cascade will handle related records)
    await db.company.delete({
      where: { id: companyId },
    });

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
      roleDemoted: user.role === "ADMIN" && company.ownerId === userId,
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
