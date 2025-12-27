import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(req);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = validation.user;

    const { subject, message, companyId } = await req.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Determine which email to send to
    let supportEmail = process.env.SUPPORT_EMAIL || "support@example.com";
    let companyName = "Support Team";

    if (companyId) {
      const company = await db.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          supportEmail: true,
          salesEmail: true,
          email: true,
        },
      });

      if (company) {
        companyName = company.name;
        // Use company support email if available, fallback to sales or general email
        supportEmail =
          company.supportEmail ||
          company.salesEmail ||
          company.email ||
          supportEmail;
      }
    }

    // Send email to support
    const emailSent = await sendEmail(
      {
        to: supportEmail,
        subject: `[Support Ticket] ${subject}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Support Ticket</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${user.name || "Unknown"} (${
          user.email
        })</p>
            <p><strong>Role:</strong> ${user.role}</p>
            ${
              companyId ? `<p><strong>Company:</strong> ${companyName}</p>` : ""
            }
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1976d2;">
              <strong>Reply to:</strong> ${user.email}
            </p>
          </div>
        </div>
      `,
        text: `
New Support Ticket

From: ${user.name || "Unknown"} (${user.email})
Role: ${user.role}
${companyId ? `Company: ${companyName}` : ""}
Subject: ${subject}

Message:
${message}

Reply to: ${user.email}
      `.trim(),
      },
      companyId
    );

    if (!emailSent) {
      console.error("Failed to send support ticket email");
      return NextResponse.json(
        {
          error: "Failed to send support ticket",
          details: "Email service unavailable",
        },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    if (user.email) {
      await sendEmail(
        {
          to: user.email,
          subject: "Support Ticket Received",
          html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Support Ticket Received</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>We've received your support ticket and will get back to you as soon as possible.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>If you have any additional information, please reply to this email.</p>
          <p>Best regards,<br>${companyName}</p>
        </div>
      `,
          text: `
Hi ${user.name || "there"},

We've received your support ticket and will get back to you as soon as possible.

Subject: ${subject}

Message:
${message}

If you have any additional information, please reply to this email.

Best regards,
${companyName}
      `.trim(),
        },
        companyId
      );
    }

    return NextResponse.json({
      success: true,
      message: "Support ticket submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting support ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
