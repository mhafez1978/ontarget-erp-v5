import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

interface StoreMetadata {
  contactEmail?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { name, email, phone, message } = body || {};

    if (!message || (!email && !phone && !name)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const company = await db.company.findUnique({ where: { slug } });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const lead = await db.lead.create({
      data: {
        companyId: company.id,
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        source: "contact-form",
        message,
      },
    });

    // Send notification email to company contact if configured
    try {
      const companyWithContact = await db.company.findUnique({
        where: { id: company.id },
        select: { email: true, name: true, storeMetadata: true, logo: true },
      });

      const toEmail =
        (companyWithContact?.storeMetadata as StoreMetadata)?.contactEmail ||
        companyWithContact?.email ||
        null;

      // Prepare template variables
      const vars: Record<string, string> = {
        name: name || "",
        email: email || "",
        phone: phone || "",
        message: message || "",
        companyName: companyWithContact?.name || "",
        companyLogo: companyWithContact?.logo || "",
        currentYear: new Date().getFullYear().toString(),
      };

      // Helper to apply simple {{var}} replacements
      const applyVars = (s: string | null | undefined) => {
        if (!s) return "";
        return s.replace(/{{\s*(\w+)\s*}}/g, (_, k) => {
          const val = vars[k] ?? "";
          if (k === "message") {
            // escape HTML in messages for safety
            return String(val).replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          return String(val);
        });
      };

      // Try to locate a company-scoped template first, then global
      let notificationTemplate = null;
      try {
        notificationTemplate =
          (await db.emailTemplate.findFirst({
            where: {
              name: "Contact Lead Notification",
              isActive: true,
              companyId: company.id,
            },
          })) ||
          (await db.emailTemplate.findFirst({
            where: {
              name: "Contact Lead Notification",
              isActive: true,
              scope: "GLOBAL",
            },
          }));
      } catch (e) {
        notificationTemplate = null;
      }

      let subject = `New contact from ${name} — ${
        companyWithContact?.name || "your website"
      }`;

      let html = `
        <p>You have a new contact message submitted through your storefront.</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || "—"}</p>
        <p><strong>Phone:</strong> ${phone || "—"}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space:pre-wrap;border:1px solid #eee;padding:12px;border-radius:6px;">${message
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</div>
      `;

      let text = `New contact message\n\nName: ${name}\nEmail: ${email}\nCompany: ${
        companyWithContact?.name || ""
      }\n\nMessage:\n${message}`;

      if (notificationTemplate) {
        subject = applyVars(notificationTemplate.subject);
        html = applyVars(notificationTemplate.bodyHtml);
        if (notificationTemplate.bodyText)
          text = applyVars(notificationTemplate.bodyText);
      }

      // Send using company-specific provider when possible by passing company.id
      const { sendEmail } = await import("@/lib/email-service");
      if (toEmail) {
        const ok = await sendEmail(
          { to: toEmail, subject, html, text },
          company.id
        );

        if (!ok) {
          return NextResponse.json(
            {
              message:
                "Failed to send email. Please check provider configuration.",
            },
            { status: 500 }
          );
        }
      }

      // Send auto-response to visitor if they provided an email (use template if present)
      try {
        const autoTemplate =
          (await db.emailTemplate.findFirst({
            where: {
              name: "Contact Auto Reply",
              isActive: true,
              companyId: company.id,
            },
          })) ||
          (await db.emailTemplate.findFirst({
            where: {
              name: "Contact Auto Reply",
              isActive: true,
              scope: "GLOBAL",
            },
          }));

        let replySubject = `Thanks for contacting ${
          companyWithContact?.name || "us"
        }`;
        let replyHtml = `
            <p>Hi ${name || "there"},</p>
            <p>Thanks for reaching out to ${
              companyWithContact?.name || "us"
            }. We received your message and will get back to you soon.</p>
            <p>— ${companyWithContact?.name || "The team"}</p>
          `;
        let replyText = `Thanks for contacting ${
          companyWithContact?.name || "us"
        }. We received your message.`;

        if (autoTemplate) {
          replySubject = applyVars(autoTemplate.subject);
          replyHtml = applyVars(autoTemplate.bodyHtml);
          if (autoTemplate.bodyText)
            replyText = applyVars(autoTemplate.bodyText);
        }

        if (email) {
          await sendEmail(
            {
              to: email,
              subject: replySubject,
              html: replyHtml,
              text: replyText,
            },
            company.id
          );
        }
      } catch (e) {
        console.error("Failed to send auto-response email:", e);
      }
    } catch (e) {
      console.error("Failed to send contact notification email:", e);
    }

    // Enqueue webhook deliveries for company webhooks
    try {
      const webhooks = await db.webhookConfig.findMany({
        where: { companyId: company.id, isActive: true },
      });
      if (Array.isArray(webhooks) && webhooks.length > 0) {
        for (const w of webhooks) {
          await db.webhookDelivery.create({
            data: {
              webhookId: w.id,
              status: "PENDING",
              payload: {
                event: "lead.created",
                lead: {
                  id: lead.id,
                  name: lead.name,
                  email: lead.email,
                  phone: lead.phone,
                  message: lead.message,
                  createdAt: lead.createdAt,
                },
              },
            },
          });
        }
      }
    } catch (e) {
      console.error(
        "Failed to enqueue webhook deliveries for contact lead:",
        e
      );
    }

    return NextResponse.json(
      { success: true, leadId: lead.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("/api/contact/submit error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
