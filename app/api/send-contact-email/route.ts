import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-service";
import { z } from "zod";
import {
  getCaptchaForScope,
  verifyGoogleCaptcha,
  verifyGoogleCaptchaDetailed,
} from "@/lib/captcha";

// Simple in-memory rate limiter (per IP)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // max 5 requests per window
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ip: string | null): boolean {
  const key = ip || "unknown";
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = rateLimitStore.get(key) || [];
  const recent = timestamps.filter((t) => t > windowStart);
  recent.push(now);
  rateLimitStore.set(key, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(req: NextRequest): string | null {
  // Prefer X-Forwarded-For first value if present
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  // Common alternative headers set by proxies/CDNs
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

// Captcha is now configured from DB (GLOBAL only for homepage)

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  company: z.string().max(200).optional().nullable(),
  message: z.string().min(10).max(5000),
  captchaToken: z.string().min(10).optional(),
});

/**
 * Public endpoint for homepage "Get in Touch" form.
 * - No auth required
 * - Always uses GLOBAL email provider (no companyId passed)
 * - Sends to the Root Company Super Admin's email
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = ContactSchema.safeParse(raw ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, company, message, captchaToken } = parsed.data;

    // Check GLOBAL captcha settings; require captcha only if active
    const captcha = await getCaptchaForScope(undefined);
    const isLocalhostRequest = (() => {
      const host = request.headers.get("host") || "";
      return host.includes("localhost") || host.includes("127.0.0.1");
    })();
    const BYPASS_CAPTCHA =
      (process.env.NODE_ENV !== "production" &&
        String(process.env.CAPTCHA_BYPASS || "").toLowerCase() === "true") ||
      (isLocalhostRequest &&
        String(process.env.CAPTCHA_ALLOW_LOCALHOST || "").toLowerCase() ===
          "true");

    if (captcha?.isActive && !BYPASS_CAPTCHA) {
      if (!captchaToken) {
        const DEBUG_CAPTCHA =
          process.env.NODE_ENV !== "production" &&
          String(process.env.DEBUG_CAPTCHA || "").toLowerCase() === "true";
        if (DEBUG_CAPTCHA) {
          return NextResponse.json(
            {
              message: "Captcha token is required",
              errorCode: "captcha_missing",
              debug: true,
              captchaActive: true,
              isLocalhostRequest,
              bypassEnv: {
                CAPTCHA_BYPASS: String(
                  process.env.CAPTCHA_BYPASS || ""
                ).toLowerCase(),
                CAPTCHA_ALLOW_LOCALHOST: String(
                  process.env.CAPTCHA_ALLOW_LOCALHOST || ""
                ).toLowerCase(),
              },
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          {
            message: "Captcha token is required",
            errorCode: "captcha_missing",
          },
          { status: 400 }
        );
      }
      const okCaptcha = await verifyGoogleCaptcha(
        captchaToken,
        captcha.secretKey
      );
      if (!okCaptcha) {
        try {
          const details = await verifyGoogleCaptchaDetailed(
            captchaToken,
            captcha.secretKey
          );
          console.warn("[send-contact-email] Captcha failed", {
            hostname: details?.hostname,
            score: details?.score,
            success: details?.success,
            errors: details?.["error-codes"],
          });
          const DEBUG_CAPTCHA =
            process.env.NODE_ENV !== "production" &&
            String(process.env.DEBUG_CAPTCHA || "").toLowerCase() === "true";
          if (DEBUG_CAPTCHA) {
            return NextResponse.json(
              {
                message: "Captcha verification failed",
                errorCode: "captcha_failed",
                captcha: {
                  hostname: details?.hostname,
                  score: details?.score,
                  success: details?.success,
                  errors: details?.["error-codes"],
                },
                debug: true,
              },
              { status: 400 }
            );
          }
        } catch (e) {
          console.warn("[send-contact-email] Captcha detailed log failed", e);
        }
        return NextResponse.json(
          {
            message: "Captcha verification failed",
            errorCode: "captcha_failed",
          },
          { status: 400 }
        );
      }
    }

    // Find SUPER_ADMIN recipient via dedicated helper in email-service
    const recipient = await (async () => {
      try {
        const { getSuperAdminRecipient } = await import("@/lib/email-service");
        return await getSuperAdminRecipient();
      } catch {
        return null;
      }
    })();

    if (!recipient?.email) {
      return NextResponse.json(
        {
          message:
            "Super admin contact not found. Please configure a super admin with a valid email.",
        },
        { status: 500 }
      );
    }

    const subject = `New contact message from ${name}`;
    const safeCompany = company?.trim() || "—";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>New Contact Message</title>
        </head>
        <body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#f7f7f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;padding:24px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%);padding:24px;color:#ffffff;">
                      <h2 style="margin:0;font-size:20px;">New Contact Message</h2>
                      <p style="margin:6px 0 0;font-size:12px;opacity:0.9;">Homepage • Get in Touch</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px;color:#111827;">
                      <p style="margin:0 0 12px;font-size:14px;">You received a new message from the public contact form.</p>
                      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#374151;">
                        <tr>
                          <td style="padding:6px 0;width:160px;color:#6b7280;">Name</td>
                          <td style="padding:6px 0;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;width:160px;color:#6b7280;">Email</td>
                          <td style="padding:6px 0;">${email}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;width:160px;color:#6b7280;">Company</td>
                          <td style="padding:6px 0;">${safeCompany}</td>
                        </tr>
                      </table>
                      <div style="margin:16px 0;padding:12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
                        <div style="font-weight:bold;color:#111827;margin-bottom:8px;">Message</div>
                        <div style="white-space:pre-wrap;line-height:1.6;color:#111827;">${(
                          message || ""
                        )
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")}</div>
                      </div>
                      <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">Sent automatically by OnTarget ERP.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const text = `New contact message\n\nName: ${name}\nEmail: ${email}\nCompany: ${safeCompany}\n\nMessage:\n${message}`;

    // Send using GLOBAL provider by not passing companyId
    const ok = await sendEmail({ to: recipient.email, subject, html, text });

    if (!ok) {
      return NextResponse.json(
        {
          message:
            "Failed to send email. Please check global provider configuration.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-contact-email] Error:", error);
    return NextResponse.json(
      { message: `Internal error: ${msg}` },
      { status: 500 }
    );
  }
}
