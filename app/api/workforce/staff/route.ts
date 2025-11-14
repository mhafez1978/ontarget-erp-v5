import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// GET /api/workforce/staff
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this company
    const hasAccess = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: { in: ["ADMIN", "MANAGER"] },
              },
            },
          },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Fetch staff for the company
    const staff = await db.companyStaff.findMany({
      where: {
        companyId,
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
      orderBy: {
        hireDate: "desc",
      },
    });

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/workforce/staff
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const {
      companyId,
      name,
      email,
      password,
      role,
      jobTitle,
      employmentType,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
    } = await request.json();

    if (
      !companyId ||
      !email ||
      !name ||
      !password ||
      !role ||
      !jobTitle ||
      !employmentType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has access to add staff to this company (owner, admin, or manager)
    const hasAccess = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: { in: ["ADMIN", "MANAGER"] },
              },
            },
          },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "GUEST", // User role is GUEST by default, company role is set in staff
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        postalCode: postalCode || undefined,
      },
    });

    // Create staff member linked to the company
    const staff = await db.companyStaff.create({
      data: {
        companyId,
        userId: newUser.id,
        role, // Company role (ADMIN, MANAGER, STAFF, CONTRACTOR)
        jobTitle, // Job title (SALES_REP, CUSTOMER_SERVICE, etc.)
        employmentType,
        status: "ACTIVE",
        hireDate: new Date(),
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

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error("Error adding staff:", error);
    return NextResponse.json(
      { error: "Failed to add staff member" },
      { status: 500 }
    );
  }
}
