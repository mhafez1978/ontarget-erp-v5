import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, companyId } = body;

    // Validate required fields
    if (!name || !email || !password || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if company exists and has storefront enabled
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, isStoreEnabled: true },
    });

    if (!company || !company.isStoreEnabled) {
      return NextResponse.json(
        { error: "Company not found or storefront is not enabled" },
        { status: 404 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    // Create user with COMPANY_CUSTOMER role
    // Note: COMPANY_CUSTOMER users are linked to companies through their orders and carts
    // The companyId will be stored in their order records when they make purchases
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "COMPANY_CUSTOMER",
        plan: "COMPANY_CUSTOMER", // Set plan to COMPANY_CUSTOMER as well
        verificationToken,
        emailVerified: null, // Will be set when they verify
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      {
        message:
          "Registration successful. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
