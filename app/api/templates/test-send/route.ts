import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

const sampleData: Record<string, string> = {
  userName: "John Doe",
  email: "john.doe@example.com",
  staffName: "Jane Smith",
  companyName: "Acme Corporation",
  role: "Manager",
  resetUrl: "https://example.com/reset-password?token=sample_token_abc123",
  loginUrl: "https://example.com/login",
  temporaryPassword: "TempPass123!",
  currentYear: new Date().getFullYear().toString(),
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString()
    );
    const userId = sessionData.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    // Replace variables with sample data
    let subject = template.subject;
    let htmlBody = template.bodyHtml;
    let textBody = template.bodyText || "";

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value);
      htmlBody = htmlBody.replace(regex, value);
      textBody = textBody.replace(regex, value);
    });

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "movewebdesign@gmail.com",
        pass: process.env.EMAIL_PASSWORD || "rdketjlbkppvcgso",
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"OnTarget ERP" <${
        process.env.EMAIL_USER || "movewebdesign@gmail.com"
      }>`,
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      text: textBody || `This is a test email for template: ${template.name}`,
      html: `
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
      `,
    });

    console.log("[Test Send] Email sent:", info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("[Test Send] Error:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
