import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import { encrypt, decrypt } from "@/lib/crypto";
import { validateSession } from "@/lib/session-manager";

const testSchema = z.object({
  provider: z.enum([
    "SMTP",
    "GMAIL",
    "GOOGLE_OAUTH",
    "NODEMAILER",
    "OFFICE365",
    "SENDGRID",
    "MAILGUN",
    "AWS_SES",
    "RESEND",
  ]),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  googleFromEmail: z.string().optional(),
  googleRefreshToken: z.string().optional(),
  sendgridApiKey: z.string().optional(),
  mailgunApiKey: z.string().optional(),
  mailgunDomain: z.string().optional(),
  awsRegion: z.string().optional(),
  awsAccessKey: z.string().optional(),
  awsSecretKey: z.string().optional(),
  office365TenantId: z.string().optional(),
  office365ClientId: z.string().optional(),
  office365ClientSecret: z.string().optional(),
  office365FromEmail: z.string().optional(),
  fromEmail: z.string(),
});

// POST - Test email provider connection
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = testSchema.parse(body);

    // Create test transporter based on provider type
    let transporter;
    let testEmail = validation.user.email || "test@example.com";

    try {
      switch (data.provider) {
        case "NODEMAILER":
        case "SMTP":
          if (!data.smtpHost || !data.smtpPort || !data.smtpUsername) {
            return NextResponse.json(
              { error: "Missing required SMTP fields (host, port, username)" },
              { status: 400 }
            );
          }

          // Check if this is Gmail SMTP (by host)
          const isGmailSMTP = (data.smtpHost as string).includes(
            "smtp.gmail.com"
          );

          transporter = nodemailer.createTransport({
            host: data.smtpHost,
            port: data.smtpPort,
            secure: data.smtpSecure || false,
            auth: {
              user: data.smtpUsername,
              // Remove spaces from Gmail app passwords
              pass: isGmailSMTP
                ? (data.smtpPassword || "").replace(/\s/g, "")
                : data.smtpPassword || "",
            },
            connectionTimeout: 10000,
            socketTimeout: 10000,
          });
          break;

        case "GMAIL":
          if (!data.smtpUsername || !data.smtpPassword) {
            return NextResponse.json(
              { error: "Gmail address and app password are required" },
              { status: 400 }
            );
          }
          transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: data.smtpUsername,
              pass: data.smtpPassword.replace(/\s/g, ""), // Remove spaces from app password
            },
            connectionTimeout: 10000,
            socketTimeout: 10000,
          });
          break;

        case "GOOGLE_OAUTH":
          if (
            !data.googleClientId ||
            !data.googleClientSecret ||
            !data.googleFromEmail ||
            !data.googleRefreshToken
          ) {
            return NextResponse.json(
              {
                error:
                  "Google Client ID, Client Secret, From Email, and Refresh Token are required",
              },
              { status: 400 }
            );
          }
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              type: "OAuth2",
              user: data.googleFromEmail,
              clientId: data.googleClientId,
              clientSecret: data.googleClientSecret,
              refreshToken: data.googleRefreshToken,
            },
            connectionTimeout: 10000,
            socketTimeout: 10000,
          });
          break;

        case "OFFICE365":
          // Use Microsoft Graph client_credentials (app-only) to send mail instead of SMTP XOAUTH2
          if (
            !data.office365TenantId ||
            !data.office365ClientId ||
            !data.office365ClientSecret ||
            !data.office365FromEmail
          ) {
            return NextResponse.json(
              {
                error:
                  "Office 365 Tenant ID, Client ID, Client Secret, and From Email are required",
              },
              { status: 400 }
            );
          }

          // Acquire a token using client_credentials scope (app-only)
          const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
            data.office365TenantId as string
          )}/oauth2/v2.0/token`;

          const tokenBody = new URLSearchParams({
            client_id: data.office365ClientId as string,
            client_secret: data.office365ClientSecret as string,
            scope: "https://graph.microsoft.com/.default",
            grant_type: "client_credentials",
          });

          const tokenResp = await fetch(tokenUrl, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: tokenBody.toString(),
            // keep a shorter timeout handled by runtimes; explicit timeouts handled upstream
          });

          if (!tokenResp.ok) {
            const txt = await tokenResp.text().catch(() => "");
            console.error(
              "Office365 token endpoint failed:",
              tokenResp.status,
              txt
            );
            return NextResponse.json(
              {
                error: `Failed to acquire Microsoft Graph token (status: ${tokenResp.status}). Make sure your app has application permissions (Mail.Send) and admin consent.`,
              },
              { status: 500 }
            );
          }

          const tokenData = await tokenResp.json().catch(() => null);
          if (!tokenData || !tokenData.access_token) {
            console.error(
              "Office365 token response missing access_token:",
              tokenData
            );
            return NextResponse.json(
              { error: "Failed to acquire access token from Microsoft Graph" },
              { status: 500 }
            );
          }

          // Call Graph sendMail as app (send as userPrincipalName)
          const accessToken = tokenData.access_token as string;
          const graphUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
            data.office365FromEmail as string
          )}/sendMail`;

          const html = `<!DOCTYPE html><html><body><div style=\"font-family:Arial,sans-serif\">Test Email from OnTarget ERP (Microsoft Graph)</div></body></html>`;

          const sendResp = await fetch(graphUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                subject: "Test Email - OnTarget ERP",
                body: { contentType: "HTML", content: html },
                toRecipients: [{ emailAddress: { address: testEmail } }],
              },
              saveToSentItems: false,
            }),
          });

          if (!sendResp.ok) {
            const respText = await sendResp.text().catch(() => "");
            console.error("Graph sendMail failed:", sendResp.status, respText);
            return NextResponse.json(
              {
                error: `Failed to send test mail with Microsoft Graph (status: ${sendResp.status}). Ensure Mail.Send (Application) permission is granted and admin consent is completed.`,
              },
              { status: 500 }
            );
          }

          // If Graph returns success (202 or 200), fall through to return success message below
          break;
          break;

        case "SENDGRID":
          if (!data.sendgridApiKey) {
            return NextResponse.json(
              { error: "SendGrid API key is required" },
              { status: 400 }
            );
          }
          transporter = nodemailer.createTransport({
            host: "smtp.sendgrid.net",
            port: 587,
            auth: {
              user: "apikey",
              pass: data.sendgridApiKey,
            },
            connectionTimeout: 10000,
            socketTimeout: 10000,
          });
          break;

        case "MAILGUN":
          if (!data.mailgunApiKey || !data.mailgunDomain) {
            return NextResponse.json(
              { error: "Mailgun API key and domain are required" },
              { status: 400 }
            );
          }
          transporter = nodemailer.createTransport({
            host: "smtp.mailgun.org",
            port: 587,
            auth: {
              user: `postmaster@${data.mailgunDomain}`,
              pass: data.mailgunApiKey,
            },
            connectionTimeout: 10000,
            socketTimeout: 10000,
          });
          break;

        case "AWS_SES":
          if (!data.awsRegion || !data.awsAccessKey || !data.awsSecretKey) {
            return NextResponse.json(
              { error: "AWS credentials are required" },
              { status: 400 }
            );
          }
          transporter = nodemailer.createTransport({
            host: `email-smtp.${data.awsRegion}.amazonaws.com`,
            port: 587,
            secure: false,
            auth: {
              user: data.awsAccessKey,
              pass: data.awsSecretKey,
            },
            connectionTimeout: 10000,
            socketTimeout: 10000,
          });
          break;

        case "RESEND":
          return NextResponse.json(
            { error: "Resend provider not yet implemented" },
            { status: 501 }
          );

        default:
          return NextResponse.json(
            { error: "Unknown provider" },
            { status: 400 }
          );
      }

      // Verify connection
      await transporter.verify();

      // Send test email
      const fromAddress = data.fromEmail
        ? `"OnTarget ERP Test" <${data.fromEmail}>`
        : "noreply@example.com";

      await transporter.sendMail({
        from: fromAddress,
        to: testEmail,
        subject: "Test Email - OnTarget ERP",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 32px;">✅ Test Successful!</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Your email provider is configured correctly and working!</p>
                          <p style="font-size: 14px; color: #666666; margin: 0;">
                            <strong>Provider:</strong> ${data.provider}<br>
                            <strong>Time:</strong> ${new Date().toLocaleString()}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="margin: 0; font-size: 12px; color: #6c757d;">
                            OnTarget ERP - Email Service Test
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      return NextResponse.json({
        success: true,
        message: `Connection successful! Test email sent to ${testEmail}`,
      });
    } catch (error) {
      console.error("Email provider test failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: `Connection test failed: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error testing email provider:", error);
    return NextResponse.json(
      { error: "Connection test failed" },
      { status: 500 }
    );
  }
}
