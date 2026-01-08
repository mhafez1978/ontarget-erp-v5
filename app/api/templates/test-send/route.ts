import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { sendEmail } from "@/lib/email-service";

/**
 * Generate sample data with actual company information
 */
async function getSampleData(userId: string): Promise<Record<string, string>> {
  // Try to get user's company or fall back to root company
  let company = await db.company.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: { userId: userId },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      logo: true,
    },
  });

  // If no company found, use root company
  if (!company) {
    company = await db.company.findFirst({
      where: { isRoot: true },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });
  }

  const companyName = company?.name || "OnTarget ERP";
  const companyLogo = company?.logo || "";

  return {
    userName: "John Doe",
    email: "john.doe@example.com",
    staffName: "Jane Smith",
    companyName,
    companyLogo,
    role: "Manager",
    resetUrl: `${
      process.env.NEXT_PUBLIC_APP_URL || "https://ontargetbrands.com"
    }/reset-password?token=sample_token_abc123`,
    loginUrl: `${
      process.env.NEXT_PUBLIC_APP_URL || "https://ontargetbrands.com"
    }/login`,
    verificationUrl: `${
      process.env.NEXT_PUBLIC_APP_URL || "https://ontargetbrands.com"
    }/verify-email?token=sample_token_abc123`,
    temporaryPassword: "TempPass123!",
    currentYear: new Date().getFullYear().toString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;

    const body = await request.json();
    const { templateId, recipientEmail } = body;

    if (!templateId || !recipientEmail) {
      return NextResponse.json(
        { error: "Template ID and recipient email are required" },
        { status: 400 }
      );
    }

    // Get the template
    const template = await db.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Get sample data with real company information
    const sampleData = await getSampleData(user.id);

    // Replace variables with sample data
    let subject = template.subject;
    let htmlBody = template.bodyHtml;

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value);
      htmlBody = htmlBody.replace(regex, value);
    });

    // Build test email HTML with warning banner
    const testEmailHtml = `
        <div style="background-color: #f3f4f6; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #92400e; font-size: 14px;">
              ⚠️ TEST EMAIL - Template Preview
            </h3>
            <p style="margin: 8px 0 0 0; color: #78350f; font-size: 12px;">
              This is a test email for the template: <strong>${
                template.name
              }</strong><br>
              Sample data has been used for all variables.
            </p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px;">
            ${htmlBody}
          </div>
          <div style="margin-top: 20px; padding: 16px; background-color: #e5e7eb; border-radius: 8px; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;"><strong>Template Information:</strong></p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>Template ID: ${template.id}</li>
              <li>Template Type: ${template.type}</li>
              <li>Variables: ${
                Array.isArray(template.variables)
                  ? template.variables.join(", ")
                  : "none"
              }</li>
              <li>Sent by: ${user.email}</li>
            </ul>
          </div>
        </div>
      `;

    // Send email using configured email provider
    const sent = await sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      html: testEmailHtml,
    });

    if (!sent) {
      return NextResponse.json(
        {
          error:
            "Failed to send test email. Please check email provider configuration.",
        },
        { status: 500 }
      );
    }

    console.log("[Test Send] Email sent successfully to:", recipientEmail);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("[Test Send] Error:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
