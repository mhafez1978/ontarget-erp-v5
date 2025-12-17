import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Fetch a single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const { id } = await params;

    // Fetch customer
    const customer = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
                ownerId: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const userRole = user.role;

    if (userRole === "SUPER_ADMIN") {
      // Super admin can view any customer
      return NextResponse.json(customer);
    }

    if (userRole === "ADMIN") {
      // Admin can only view customers in their companies
      const adminCompanies = await db.company.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const adminCompanyIds = adminCompanies.map((c) => c.id);

      // Check if customer is a member of any admin-owned company
      const hasAccess = customer.companyMemberships.some((membership) =>
        adminCompanyIds.includes(membership.companyId)
      );

      if (hasAccess) {
        return NextResponse.json(customer);
      }
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH - Update a customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const { id } = await params;
    const body = await request.json();

    // Fetch customer to check authorization
    const customer = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const userRole = user.role;
    let isAuthorized = false;

    if (userRole === "SUPER_ADMIN") {
      isAuthorized = true;
    } else if (userRole === "ADMIN") {
      // Admin can only update customers in their companies
      const adminCompanies = await db.company.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const adminCompanyIds = adminCompanies.map((c) => c.id);

      // Check if customer is a member of any admin-owned company
      const hasAccess = customer.companyMemberships.some((membership) =>
        adminCompanyIds.includes(membership.companyId)
      );

      isAuthorized = hasAccess;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update customer
    const updatedCustomer = await db.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        ...(body.role && { role: body.role }),
      },
    });

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: userId,
        action: "UPDATED",
        entityType: "Customer",
        entityId: updatedCustomer.id,
        description: `Updated customer: ${updatedCustomer.name}`,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const { id } = await params;

    // Fetch customer to check authorization
    const customer = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const userRole = user.role;
    let isAuthorized = false;

    if (userRole === "SUPER_ADMIN") {
      isAuthorized = true;
    } else if (userRole === "ADMIN") {
      // Admin can only delete customers in their companies
      const adminCompanies = await db.company.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const adminCompanyIds = adminCompanies.map((c) => c.id);

      // Check if customer is a member of any admin-owned company
      const hasAccess = customer.companyMemberships.some((membership) =>
        adminCompanyIds.includes(membership.companyId)
      );

      isAuthorized = hasAccess;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete customer (cascades will handle related records)
    await db.user.delete({
      where: { id },
    });

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: userId,
        action: "DELETED",
        entityType: "Customer",
        entityId: customer.id,
        description: `Deleted customer: ${customer.name}`,
      },
    });

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
