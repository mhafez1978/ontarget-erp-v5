import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email-service";
import { validateSessionForAPI } from "@/lib/validate-session";
import { PLAN_LIMITS, getTotalUserLimit } from "@/lib/plan-limits";

// GET /api/workforce/staff
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

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
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            canSetupPersonalEmail: true,
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
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const {
      companyId,
      name,
      email,
      password,
      role,
      jobTitle,
      employmentType,
      isFeatured,
      bio,
      displayOrder,
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
    const company = await db.company.findFirst({
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
      include: {
        owner: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Check user limit (skip for SUPER_USER)
    if (company.owner.plan !== "SUPER_USER") {
      // Get company's subscription plan
      const subscription = await db.subscription.findFirst({
        where: {
          subscriberCompanyId: companyId,
          status: { in: ["TRIAL", "ACTIVE"] },
        },
        orderBy: { createdAt: "desc" },
      });

      const plan = subscription?.plan || "ESSENTIAL";
      const totalUserLimit = getTotalUserLimit(plan);

      // Count all existing company members (across all roles)
      const userCount = await db.companyMember.count({
        where: { companyId },
      });

      if (totalUserLimit !== Infinity && userCount >= totalUserLimit) {
        return NextResponse.json(
          {
            error: `User limit reached. Your ${plan} plan allows ${totalUserLimit} total users across all roles. Upgrade to add more.`,
            limit: totalUserLimit,
            current: userCount,
          },
          { status: 403 }
        );
      }
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
        role: "STAFF", // Staff members get STAFF role (not ERP_CUSTOMER)
        plan: "GUEST", // Staff don't need paid subscription plans
        emailVerified: new Date(), // Auto-verify staff members created by admins
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
        isFeatured: isFeatured || false,
        bio: bio || null,
        displayOrder: displayOrder || 0,
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
      action: AUDIT_ACTIONS.STAFF_MEMBER_ADDED,
      userId,
      companyId,
      entityType: ENTITY_TYPES.STAFF_MEMBER,
      entityId: staff.id,
      description: `Added staff member: ${name} (${email}) with role ${role}`,
      metadata: {
        staffName: name,
        staffEmail: email,
        role,
        jobTitle,
        employmentType,
      },
    });

    // Create onboarding token (expires in 48 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours from now

    const onboardingToken = await db.onboardingToken.create({
      data: {
        staffId: staff.id,
        expiresAt,
      },
    });

    // Audit: onboarding token created for new staff
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_TOKEN_CREATED,
      userId,
      companyId,
      entityType: ENTITY_TYPES.STAFF_MEMBER,
      entityId: staff.id,
      description: `Created onboarding token for ${name} (${email})`,
      metadata: { token: onboardingToken.token, expiresAt: onboardingToken.expiresAt.toISOString() },
    });

    // Send welcome email with onboarding link
    let emailSent = false;
    let emailError = null;
    try {
      const onboardingUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/onboarding/${onboardingToken.token}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .onboarding-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .cta-button { display: inline-block; background-color: #ffffff; color: #667eea; padding: 14px 32px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
            .info-box { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ${company.name}!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">We're excited to have you on our team</p>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              
              <p>Welcome to ${
                company.name
              }! We're thrilled to have you join us as a <strong>${role.replace(
        /_/g,
        " "
      )}</strong>.</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0;">Your Login Email</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p style="font-size: 0.9em; color: #666;">Your administrator has set an initial password for you. Please use it to access the onboarding page, then you'll be required to change it after completing your onboarding.</p>
              </div>

              <div class="onboarding-box">
                <h3 style="margin-top: 0;">📋 Complete Your Onboarding</h3>
                <p style="margin: 15px 0;">Before you can start, please complete your onboarding by uploading required employment documents.</p>
                <a href="${onboardingUrl}" class="cta-button">Start Onboarding</a>
                <p style="font-size: 0.85em; margin-top: 15px; opacity: 0.9;">⚠️ This link expires in 48 hours</p>
              </div>

              <div class="info-box">
                <strong>⏰ What to expect:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>Upload 6 required documents sequentially:</strong>
                    <ol style="margin-top: 5px;">
                      <li>Social Security Card</li>
                      <li>Driver's License</li>
                      <li>W-4 Tax Form</li>
                      <li>I-9 Employment Eligibility Form</li>
                      <li>Direct Deposit Form</li>
                      <li>Employee Handbook (Signed)</li>
                    </ol>
                  </li>
                  <li>Your documents will be reviewed by our admin team</li>
                  <li>Once all documents are approved, you'll set a new password</li>
                  <li>After password change, you'll have full access to the dashboard</li>
                  <li><strong>⚠️ IMPORTANT:</strong> Your account will be disabled if onboarding is not completed within 48 hours</li>
                </ul>
              </div>

              <p><strong>Need Help?</strong><br>
              If you have any questions or need assistance, please don't hesitate to reach out to your administrator.</p>
              
              <p>Best regards,<br>
              The ${company.name} Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      emailSent = await sendEmail(
        {
          to: email,
          subject: `Welcome to ${company.name} - Complete Your Onboarding 🎉`,
          html,
        },
        companyId
      );

      if (!emailSent) {
        emailError = "Email provider not configured or email sending failed";
      }
    } catch (error) {
      console.error("Failed to send welcome email to staff:", error);
      emailError =
        error instanceof Error ? error.message : "Unknown email error";
      // Don't fail staff creation if email fails
    }

    return NextResponse.json({
      success: true,
      staff,
      user: newUser,
      onboardingToken: onboardingToken.token,
      onboardingUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/onboarding/${onboardingToken.token}`,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error("Error adding staff:", error);
    return NextResponse.json(
      { error: "Failed to add staff member" },
      { status: 500 }
    );
  }
}
