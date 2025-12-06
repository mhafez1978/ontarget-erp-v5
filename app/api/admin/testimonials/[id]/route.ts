import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { Company } from "@prisma/client";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// PATCH - Approve, reject, or update testimonial
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Get user from cookie
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const sessionUser = validation.user;

    const { id } = await context.params;
    const body = await request.json();
    const { status, isFeatured, displayOrder } = body;

    // Get user with email check
    if (!sessionUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: sessionUser.email },
      include: {
        ownedCompanies: true,
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get testimonial
    const testimonial = await db.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess =
      user.ownedCompanies.some(
        (c: Company) => c.id === testimonial.companyId
      ) ||
      user.companyMemberships.some(
        (m) => m.companyId === testimonial.companyId
      );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this testimonial" },
        { status: 403 }
      );
    }

    // Update testimonial
    const updateData: {
      status?: string;
      approvedBy?: string;
      approvedAt?: Date;
      isFeatured?: boolean;
      displayOrder?: number;
    } = {};

    if (status) {
      updateData.status = status.toUpperCase();
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
    }

    if (typeof isFeatured === "boolean") {
      updateData.isFeatured = isFeatured;
    }

    if (typeof displayOrder === "number") {
      updateData.displayOrder = displayOrder;
    }

    const updatedTestimonial = await db.testimonial.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTestimonial);
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      { error: "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a testimonial
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Get user from cookie
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const sessionUser = validation.user;

    const { id } = await context.params;

    // Get user with email check
    if (!sessionUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: sessionUser.email },
      include: {
        ownedCompanies: true,
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get testimonial
    const testimonial = await db.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess =
      user.ownedCompanies.some(
        (c: Company) => c.id === testimonial.companyId
      ) ||
      user.companyMemberships.some(
        (m) => m.companyId === testimonial.companyId
      );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this testimonial" },
        { status: 403 }
      );
    }

    // Delete testimonial
    await db.testimonial.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
