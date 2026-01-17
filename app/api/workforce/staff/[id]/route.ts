import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type {
  CompanyMemberRole,
  EmploymentType,
  EmploymentStatus,
} from "@/generated/prisma/client";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

// PATCH /api/workforce/staff/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response | NextResponse> {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const { id } = await params;

    type StaffUpdateRequest = {
      name?: string | null;
      email?: string | null;
      role?: CompanyMemberRole | null;
      jobTitle?: string | null;
      employmentType?: EmploymentType | null;
      status?: EmploymentStatus | null;
      payRate?: string | number | null;
      isFeatured?: boolean;
      bio?: string | null;
      displayOrder?: number | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postalCode?: string | null;
      canSetupPersonalEmail?: boolean;
    };

    const {
      name,
      email,
      role,
      jobTitle,
      employmentType,
      status,
      payRate,
      isFeatured,
      bio,
      displayOrder,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      canSetupPersonalEmail,
    } = (await request.json()) as StaffUpdateRequest;

    // Get the staff member
    const staffMember = await db.companyStaff.findUnique({
      where: { id },
      include: {
        user: { select: { id: true } },
        company: {
          select: {
            id: true,
            ownerId: true,
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    const isOwner = staffMember.company.ownerId === userId;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isCompanyAdmin =
      staffMember.company.members.length > 0 &&
      (staffMember.company.members[0].role === "ADMIN_OWNER" ||
        staffMember.company.members[0].role === "ADMIN_NONOWNER");

    // Check edit permissions (same as add: owner, admin, manager, or super admin)
    if (!isOwner && !isCompanyAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to edit this staff member" },
        { status: 403 }
      );
    }

    // Update user information
    await db.user.update({
      where: { id: staffMember.userId },
      data: {
        name: name || undefined,
        email: email || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        postalCode: postalCode || undefined,
        canSetupPersonalEmail:
          canSetupPersonalEmail !== undefined
            ? canSetupPersonalEmail
            : undefined,
      },
    });

    // Update company staff information
    const updatedStaff = await db.companyStaff.update({
      where: { id },
      data: {
        role: role || undefined,
        jobTitle: jobTitle || undefined,
        employmentType: employmentType || undefined,
        payRate:
          payRate !== undefined
            ? payRate === "" || payRate === null
              ? null
              : typeof payRate === "number"
              ? payRate
              : parseFloat(String(payRate))
            : undefined,
        status: status || undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
        bio: bio !== undefined ? bio : undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create audit log entry
    await createAuditLog({
      action: AUDIT_ACTIONS.COMPANY_STAFF_MEMBER_UPDATED,
      userId,
      companyId: staffMember.companyId,
      entityType: ENTITY_TYPES.COMPANY_STAFF_MEMBER,
      entityId: id,
      description: `Updated staff member: ${updatedStaff.user.name} (${updatedStaff.user.email})`,
      metadata: {
        staffName: updatedStaff.user.name,
        staffEmail: updatedStaff.user.email,
        role,
        jobTitle,
        employmentType,
        status,
      },
    });

    return NextResponse.json({ success: true, staff: updatedStaff });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

// DELETE /api/workforce/staff/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response | NextResponse> {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const { id } = await params;

    // Get the staff member to check company ownership and their role
    const staffMember = await db.companyStaff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            ownerId: true,
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    const isOwner = staffMember.company.ownerId === userId;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isCompanyAdmin =
      staffMember.company.members.length > 0 &&
      (staffMember.company.members[0].role === "ADMIN_OWNER" ||
        staffMember.company.members[0].role === "ADMIN_NONOWNER");
    const isTargetOwner = staffMember.company.ownerId === staffMember.userId;
    const targetRole = staffMember.role;

    // Permission hierarchy:
    // 1. SUPER_ADMIN can delete anyone from any company
    if (isSuperAdmin) {
      // Super admin has full access
    }
    // 2. Company OWNER can delete anyone from their company (including admins)
    else if (isOwner) {
      // Owner has full access to their company
    }
    // 3. Non-owner company admins can delete COMPANY_MANAGER, COMPANY_STAFF, COMPANY_CONTRACTOR (but NOT owner or other admins)
    else if (isCompanyAdmin) {
      // Cannot delete the company owner
      if (isTargetOwner) {
        return NextResponse.json(
          {
            error:
              "You cannot delete the company owner. Only the owner or super admin can perform this action.",
          },
          { status: 403 }
        );
      }

      // Cannot delete other admins (owner and non-owner admins)
      if (targetRole === "ADMIN_OWNER" || targetRole === "ADMIN_NONOWNER") {
        return NextResponse.json(
          {
            error:
              "You cannot delete another admin. Only the company owner or super admin can perform this action.",
          },
          { status: 403 }
        );
      }

      // Can delete COMPANY_MANAGER, COMPANY_STAFF, COMPANY_CONTRACTOR
      if (
        !["COMPANY_MANAGER", "COMPANY_STAFF", "COMPANY_CONTRACTOR"].includes(
          targetRole
        )
      ) {
        return NextResponse.json(
          { error: "You don't have permission to delete this staff member" },
          { status: 403 }
        );
      }
    }
    // 4. No permission
    else {
      return NextResponse.json(
        {
          error:
            "You don't have permission to delete staff members. Only admins and company owners can perform this action.",
        },
        { status: 403 }
      );
    }

    // Delete the staff member and associated user
    await db.companyStaff.delete({
      where: { id },
    });

    // Also delete the associated user account
    await db.user.delete({
      where: { id: staffMember.userId },
    });

    // Create audit log entry
    await createAuditLog({
      action: AUDIT_ACTIONS.COMPANY_STAFF_MEMBER_DELETED,
      userId,
      companyId: staffMember.companyId,
      entityType: ENTITY_TYPES.COMPANY_STAFF_MEMBER,
      entityId: id,
      description: `Deleted staff member: ${staffMember.user.name} (${staffMember.user.email}) with role ${staffMember.role}`,
      metadata: {
        staffName: staffMember.user.name,
        staffEmail: staffMember.user.email,
        role: staffMember.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
