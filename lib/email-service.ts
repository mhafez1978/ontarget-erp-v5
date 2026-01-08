import nodemailer from "nodemailer";
import { decrypt } from "./encryption";
import { db } from "./db";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailProvider {
  provider: string;
  fromEmail: string | null;
  fromName: string | null;
  replyToEmail?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpSecure?: boolean | null;
  sendgridApiKey?: string | null;
  mailgunApiKey?: string | null;
  mailgunDomain?: string | null;
  resendApiKey?: string | null;
  awsRegion?: string | null;
  awsAccessKey?: string | null;
  awsSecretKey?: string | null;
  googleClientId?: string | null;
  googleClientSecret?: string | null;
  googleFromEmail?: string | null;
  googleRefreshToken?: string | null;
  office365TenantId?: string | null;
  office365ClientId?: string | null;
  office365ClientSecret?: string | null;
  office365FromEmail?: string | null;
  scope?: string;
  isActive?: boolean;
}

/**
 * Gets the active email provider configuration for a company
 * Falls back to global settings if company doesn't have provider configured
 */
async function getEmailProvider(
  companyId?: string
): Promise<EmailProvider | null> {
  try {
    // Try to get company-specific provider first
    if (companyId) {
      const companyProvider = await db.emailProvider.findFirst({
        where: {
          scope: companyId,
          isActive: true,
        },
      });

      if (companyProvider) {
        return companyProvider as EmailProvider;
      }
    }

    // Fall back to global provider
    const globalProvider = await db.emailProvider.findFirst({
      where: {
        scope: "GLOBAL",
        isActive: true,
      },
    });

    return globalProvider as EmailProvider | null;
  } catch (error) {
    console.error("Error getting email provider:", error);
    return null;
  }
}

/**
 * Creates a nodemailer transporter based on provider configuration
 */
function createTransporter(provider: EmailProvider) {
  console.log(
    "[Email Service] Creating transporter for provider:",
    provider.provider
  );

  // NODEMAILER and SMTP use the same configuration
  if (
    (provider.provider === "NODEMAILER" || provider.provider === "SMTP") &&
    provider.smtpHost
  ) {
    console.log("[Email Service] Using SMTP configuration:", {
      host: provider.smtpHost,
      port: provider.smtpPort || 587,
      secure: provider.smtpSecure || false,
      hasAuth: !!provider.smtpUsername,
    });

    return nodemailer.createTransport({
      host: provider.smtpHost,
      port: provider.smtpPort || 587,
      secure: provider.smtpSecure || false,
      auth: provider.smtpUsername
        ? {
            user: provider.smtpUsername,
            pass: provider.smtpPassword ? decrypt(provider.smtpPassword) : "",
          }
        : undefined,
      connectionTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true,
    });
  }

  // Gmail with App Password (SMTP)
  if (provider.provider === "GMAIL" && provider.smtpUsername) {
    console.log("[Email Service] Using Gmail SMTP configuration");

    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: provider.smtpUsername,
        pass: provider.smtpPassword ? decrypt(provider.smtpPassword) : "",
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true,
    });
  }

  // Google OAuth 2.0
  if (provider.provider === "GOOGLE_OAUTH") {
    console.log("[Email Service] Using Google OAuth 2.0 configuration");

    if (
      !provider.googleClientId ||
      !provider.googleClientSecret ||
      !provider.googleRefreshToken ||
      !provider.googleFromEmail
    ) {
      throw new Error(
        "Google OAuth requires clientId, clientSecret, refreshToken, and fromEmail"
      );
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: provider.googleFromEmail,
        clientId: provider.googleClientId,
        clientSecret: decrypt(provider.googleClientSecret),
        refreshToken: decrypt(provider.googleRefreshToken),
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true,
    });
  }

  // Office 365 OAuth 2.0
  // Office 365 is handled directly in sendEmail() using Microsoft Graph API
  // Not using nodemailer for Office 365

  if (provider.provider === "SENDGRID" && provider.sendgridApiKey) {
    console.log("[Email Service] Using SendGrid configuration");

    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: decrypt(provider.sendgridApiKey),
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true,
    });
  }

  if (provider.provider === "MAILGUN" && provider.mailgunApiKey) {
    console.log("[Email Service] Using Mailgun configuration");

    const domain = provider.mailgunDomain || "mg.example.com";
    return nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      auth: {
        user: `postmaster@${domain}`,
        pass: decrypt(provider.mailgunApiKey),
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true,
    });
  }

  if (provider.provider === "RESEND" && provider.resendApiKey) {
    console.log("[Email Service] Using Resend configuration");

    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: decrypt(provider.resendApiKey),
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true,
    });
  }

  if (provider.provider === "AWS_SES") {
    console.log("[Email Service] Using AWS SES configuration");

    if (
      !provider.awsRegion ||
      !provider.awsAccessKey ||
      !provider.awsSecretKey
    ) {
      throw new Error("AWS SES requires region, accessKey, and secretKey");
    }

    return nodemailer.createTransport({
      host: `email-smtp.${provider.awsRegion}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: decrypt(provider.awsAccessKey),
        pass: decrypt(provider.awsSecretKey),
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true,
    });
  }

  // Default fallback
  throw new Error(`Unsupported email provider: ${provider.provider}`);
}

/**
 * Sends an email using the configured email provider
 */
export async function sendEmail(
  options: EmailOptions,
  companyId?: string,
  actorUserId?: string
): Promise<boolean> {
  try {
    console.log("[Email Service] Attempting to send email to:", options.to);
    console.log(
      "[Email Service] Company ID:",
      companyId || "none (using global)"
    );

    const provider = await getEmailProvider(companyId);

    if (!provider) {
      console.error("[Email Service] No email provider configured");
      return false;
    }

    console.log(
      "[Email Service] Using provider:",
      provider.provider,
      "scope:",
      provider.scope
    );

    // Handle Office 365 with Microsoft Graph API
    if (provider.provider === "OFFICE365") {
      console.log("[Email Service] Using Microsoft Graph API for Office 365");

      if (
        !provider.office365TenantId ||
        !provider.office365ClientId ||
        !provider.office365ClientSecret ||
        !provider.office365FromEmail
      ) {
        console.error("[Email Service] Missing Office 365 configuration");
        return false;
      }

      try {
        const { Client } = await import("@microsoft/microsoft-graph-client");
        const { ClientSecretCredential } = await import("@azure/identity");

        const decryptedSecret = decrypt(provider.office365ClientSecret);

        const credential = new ClientSecretCredential(
          provider.office365TenantId,
          provider.office365ClientId,
          decryptedSecret
        );

        const graphClient = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: async () => {
              const token = await credential.getToken(
                "https://graph.microsoft.com/.default"
              );
              return token?.token || "";
            },
          },
        });

        const toRecipients = (
          Array.isArray(options.to) ? options.to : [options.to]
        ).map((email) => ({
          emailAddress: { address: email },
        }));

        const graphMessage = {
          message: {
            subject: options.subject,
            body: {
              contentType: "HTML",
              content: options.html,
            },
            toRecipients,
            from: {
              emailAddress: { address: provider.office365FromEmail },
            },
            replyTo: provider.replyToEmail
              ? [{ emailAddress: { address: provider.replyToEmail } }]
              : undefined,
          },
        };

        await graphClient
          .api(`/users/${provider.office365FromEmail}/sendMail`)
          .post(graphMessage);

        console.log(
          "[Email Service] Email sent successfully via Microsoft Graph"
        );
        try {
          await createAuditLog({
            action: AUDIT_ACTIONS.EMAIL_SENT,
            userId: actorUserId ?? null,
            companyId: companyId ?? null,
            entityType: ENTITY_TYPES.COMPANY,
            entityId: companyId ?? null,
            description: `Email sent via ${provider.provider} to ${
              Array.isArray(options.to) ? options.to.join(", ") : options.to
            }`,
            metadata: {
              subject: options.subject,
              provider: provider.provider,
              recipients: options.to,
            },
          });
        } catch (auditErr) {
          console.error(
            "[Email Service] Failed to create audit log for sent email:",
            auditErr
          );
        }
        return true;
      } catch (graphError) {
        console.error("[Email Service] Microsoft Graph API error:", graphError);
        try {
          await createAuditLog({
            action: AUDIT_ACTIONS.EMAIL_FAILED,
            userId: actorUserId ?? null,
            companyId: companyId ?? null,
            entityType: ENTITY_TYPES.COMPANY,
            entityId: companyId ?? null,
            description: `Email failed to send via ${provider.provider} to ${
              Array.isArray(options.to) ? options.to.join(", ") : options.to
            }`,
            metadata: {
              subject: options.subject,
              provider: provider.provider,
              error: String(graphError),
            },
          });
        } catch (auditErr) {
          console.error(
            "[Email Service] Failed to create audit log for failed email:",
            auditErr
          );
        }
        return false;
      }
    }

    // Handle all other providers with nodemailer
    const transporter = createTransporter(provider);

    const fromAddress =
      options.from ||
      (provider.fromName
        ? `"${provider.fromName}" <${provider.fromEmail}>`
        : provider.fromEmail || "noreply@example.com");

    console.log("[Email Service] Sending from:", fromAddress);

    await transporter.sendMail({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      replyTo: provider.replyToEmail || undefined,
    });

    console.log("[Email Service] Email sent successfully");
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.EMAIL_SENT,
        userId: actorUserId ?? null,
        companyId: companyId ?? null,
        entityType: ENTITY_TYPES.COMPANY,
        entityId: companyId ?? null,
        description: `Email sent via ${provider.provider} to ${
          Array.isArray(options.to) ? options.to.join(", ") : options.to
        }`,
        metadata: {
          subject: options.subject,
          provider: provider.provider,
          recipients: options.to,
        },
      });
    } catch (auditErr) {
      console.error(
        "[Email Service] Failed to create audit log for sent email:",
        auditErr
      );
    }

    return true;
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.EMAIL_FAILED,
        userId: actorUserId ?? null,
        companyId: companyId ?? null,
        entityType: ENTITY_TYPES.COMPANY,
        entityId: companyId ?? null,
        description: `Email failed to send to ${
          Array.isArray(options.to) ? options.to.join(", ") : options.to
        }`,
        metadata: { subject: options.subject, error: String(error) },
      });
    } catch (auditErr) {
      console.error(
        "[Email Service] Failed to create audit log for failed email:",
        auditErr
      );
    }
    return false;
  }
}

/**
 * Returns the primary SUPER_ADMIN recipient email.
 * Guards against missing Prisma models by returning null.
 */
export async function getSuperAdminRecipient(): Promise<{
  email: string;
} | null> {
  try {
    const userRepo = (
      db as unknown as {
        user?: {
          findFirst: (args: {
            where: { role: string; email: { not: null } };
          }) => Promise<{ email: string } | null>;
        };
      }
    ).user;
    if (!userRepo || typeof userRepo.findFirst !== "function") {
      return null;
    }
    const admin = await userRepo.findFirst({
      where: { role: "SUPER_ADMIN", email: { not: null } },
    });
    if (admin?.email) return { email: admin.email };
    return null;
  } catch (e) {
    console.error("[Email Service] getSuperAdminRecipient error:", e);
    return null;
  }
}

/**
 * Email Templates
 */

export function getPasswordResetEmailHtml(
  resetUrl: string,
  userName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Password Reset Request</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hello ${userName},</p>
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                      We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 20px 0 0;">
                      If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
                    </p>
                    <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 10px 0 0;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 12px; color: #999999; word-break: break-all; margin: 10px 0 0;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="font-size: 12px; color: #999999; margin: 0;">
                      © ${new Date().getFullYear()} OnTarget ERP. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Get welcome email HTML from database template with variable replacement
 */
export async function getWelcomeCustomerEmail(
  userName: string,
  email: string
): Promise<{ subject: string; html: string }> {
  try {
    const template = await db.emailTemplate.findFirst({
      where: { type: "WELCOME_CUSTOMER" },
    });

    if (!template) {
      console.error(
        "[Email Service] WELCOME_CUSTOMER template not found, using fallback"
      );
      const fallbackHtml = await getWelcomeCustomerEmailHtml(userName, email);
      return {
        subject: "Welcome! 🎉",
        html: fallbackHtml,
      };
    }

    // Replace variables
    const variables: Record<string, string> = {
      userName,
      email,
      companyName: "OnTarget ERP",
      loginUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
      }/login`,
      currentYear: new Date().getFullYear().toString(),
      companyLogo: "",
      staffName: userName, // For backward compatibility if template uses staffName
    };

    let subject = template.subject;
    let html = template.bodyHtml;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
    });

    return { subject, html };
  } catch (error) {
    console.error("[Email Service] Error loading template:", error);
    const fallbackHtml = await getWelcomeCustomerEmailHtml(userName, email);
    return {
      subject: "Welcome! 🎉",
      html: fallbackHtml,
    };
  }
}

/**
 * DEPRECATED: Use getWelcomeCustomerEmail() instead
 * Kept for backward compatibility and fallback
 */
export async function getWelcomeCustomerEmailHtml(
  userName: string,
  email: string
): Promise<string> {
  // Try to get root company data for fallback
  let companyName = "OnTarget ERP";
  let companyWebsite =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/login";

  try {
    const rootCompany = await db.company.findFirst({
      where: { isRoot: true },
      select: {
        name: true,
        website: true,
      },
    });

    if (rootCompany) {
      companyName = rootCompany.name;
      if (rootCompany.website) {
        companyWebsite = rootCompany.website;
      }
    }
  } catch (error) {
    console.error(
      "[Email Service] Failed to fetch root company for fallback:",
      error
    );
  }

  const currentYear = new Date().getFullYear();
  const loginUrl = `${companyWebsite}/login`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${companyName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Welcome to ${companyName}! 🎉</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hello ${userName},</p>
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                      Thank you for registering with ${companyName}! Your account has been successfully created.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                      <tr>
                        <td>
                          <p style="font-size: 14px; color: #666666; margin: 0 0 10px;"><strong>Your Account Details:</strong></p>
                          <p style="font-size: 14px; color: #666666; margin: 5px 0;">Email: <strong>${email}</strong></p>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 20px 0;">
                      You can now log in and start exploring all the features ${companyName} has to offer!
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 20px 0 0;">
                      If you have any questions or need assistance, our support team is here to help!
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="font-size: 12px; color: #999999; margin: 0;">
                      © ${currentYear} ${companyName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getWelcomeStaffEmailHtml(
  staffName: string,
  email: string,
  temporaryPassword: string,
  companyName: string,
  role: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to the Team</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Welcome to ${companyName}! 🎉</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hello ${staffName},</p>
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                      Welcome to the team! Your account has been created for ${companyName}'s OnTarget ERP system.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                      <tr>
                        <td>
                          <p style="font-size: 14px; color: #666666; margin: 0 0 10px;"><strong>Your Login Credentials:</strong></p>
                          <p style="font-size: 14px; color: #666666; margin: 5px 0;">Email: <strong>${email}</strong></p>
                          <p style="font-size: 14px; color: #666666; margin: 5px 0;">Password: <strong>${temporaryPassword}</strong></p>
                          <p style="font-size: 14px; color: #666666; margin: 5px 0;">Role: <strong>${role}</strong></p>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 14px; color: #e74c3c; line-height: 1.6; margin: 20px 0; padding: 15px; background-color: #fee; border-left: 4px solid #e74c3c; border-radius: 4px;">
                      <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${
                            process.env.NEXTAUTH_URL
                          }/login" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Login to Dashboard</a>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 20px 0 0;">
                      If you have any questions or need assistance, please reach out to your manager or IT support.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="font-size: 12px; color: #999999; margin: 0;">
                      © ${new Date().getFullYear()} OnTarget ERP. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
