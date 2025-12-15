import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, email, message, phone } = body as {
      companyId: string;
      name: string;
      email: string;
      message: string;
      phone?: string;
    };

    // Validate required fields
    if (!companyId || !name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get company info
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        salesEmail: true,
        supportEmail: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Determine recipient email (prefer salesEmail, then supportEmail, then general email)
    const recipientEmail =
      company.salesEmail || company.supportEmail || company.email;

    if (!recipientEmail) {
      console.error(
        `[Storefront Contact] No email configured for company ${companyId}`
      );
      return NextResponse.json(
        { error: "Company email not configured" },
        { status: 500 }
      );
    }

    // Create HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-top: none;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .field {
      margin-bottom: 20px;
    }
    .field-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 16px;
      color: #111827;
    }
    .message-box {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .reply-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📧 New Contact Form Submission</h1>
  </div>
  
  <div class="content">
    <p style="font-size: 16px; margin-bottom: 25px;">
      You have received a new message from your storefront contact form.
    </p>
    
    <div class="field">
      <div class="field-label">From</div>
      <div class="field-value">${name}</div>
    </div>
    
    <div class="field">
      <div class="field-label">Email</div>
      <div class="field-value">
        <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
      </div>
    </div>
    
    ${
      phone
        ? `
    <div class="field">
      <div class="field-label">Phone</div>
      <div class="field-value">
        <a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a>
      </div>
    </div>
    `
        : ""
    }
    
    <div class="field">
      <div class="field-label">Message</div>
      <div class="message-box">
        ${message.replace(/\n/g, "<br>")}
      </div>
    </div>
    
    <div style="text-align: center;">
      <a href="mailto:${email}?subject=Re: Your inquiry to ${
      company.name
    }" class="reply-button">
        Reply to ${name}
      </a>
    </div>
    
    <div class="footer">
      <p>
        This message was sent via your ${
          company.name
        } storefront contact form.<br>
        Submitted on ${new Date().toLocaleString("en-US", {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Plain text version
    const textContent = `
New Contact Form Submission

From: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ""}

Message:
${message}

Reply to: ${email}

---
Submitted on ${new Date().toLocaleString()}
This message was sent via your ${company.name} storefront contact form.
    `.trim();

    // Send email using the company's email provider
    const emailSent = await sendEmail(
      {
        to: recipientEmail,
        subject: `New Contact Form Message from ${name}`,
        html: htmlContent,
        text: textContent,
        from: `${company.name} Storefront <noreply@${
          recipientEmail.split("@")[1]
        }>`,
      },
      companyId
    );

    if (!emailSent) {
      console.error(
        `[Storefront Contact] Failed to send email for company ${companyId}`
      );
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    // Log the contact form submission
    console.log(
      `[Storefront Contact] Message sent successfully from ${email} to ${recipientEmail}`
    );

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("[Storefront Contact] Error:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while sending your message. Please try again.",
      },
      { status: 500 }
    );
  }
}
