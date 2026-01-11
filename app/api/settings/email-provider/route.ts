import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/encryption";
import { validateSessionForAPI } from "@/lib/validate-session";

const emailProviderSchema = z.object({
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
  isActive: z.boolean(),
  scope: z.string(),
  companyId: z.string().nullable(),

  // SMTP fields
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().optional(),

  // Google OAuth fields
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  googleFromEmail: z.string().optional(),
  googleRefreshToken: z.string().optional(),

  // SendGrid fields
  sendgridApiKey: z.string().optional(),

  // Mailgun fields
  mailgunApiKey: z.string().optional(),
  mailgunDomain: z.string().optional(),

  // AWS SES fields
  awsRegion: z.string().optional(),
  awsAccessKey: z.string().optional(),
  awsSecretKey: z.string().optional(),

  // Resend fields
  resendApiKey: z.string().optional(),

  // Office 365 OAuth fields
  office365TenantId: z.string().optional(),
  office365ClientId: z.string().optional(),
  office365ClientSecret: z.string().optional(),
  office365FromEmail: z.string().optional(),

  // Common fields
  fromEmail: z.string(),
  fromName: z.string(),
  replyToEmail: z.string().optional(),
});

// GET - Fetch email provider settings
export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");
    const companyId = searchParams.get("companyId");

    // SUPER_ADMIN can fetch GLOBAL settings
    if (scope === "GLOBAL" && user.role === "SUPER_ADMIN") {
      const provider = await db.emailProvider.findFirst({
        where: { scope: "GLOBAL" },
      });
      return NextResponse.json({ provider });
    }

    // ADMIN can fetch company-specific settings (only their own companies)
    if (companyId && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
      // Verify user owns this company (or is SUPER_ADMIN)
      if (user.role === "ADMIN") {
        const membership = await db.companyMember.findFirst({
          where: {
            userId,
            companyId,
            role: "ADMIN",
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "Access denied to this company" },
            { status: 403 }
          );
        }
      }

      const provider = await db.emailProvider.findFirst({
        where: { scope: companyId },
      });
      return NextResponse.json({ provider });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching email provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update email provider
export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    const body = await req.json();
    console.log("[Email Provider POST] Received body:", {
      provider: body.provider,
      scope: body.scope,
      companyId: body.companyId,
      userRole: user.role,
    });
    const data = emailProviderSchema.parse(body);

    // Helper: validate Office365 app-only (client_credentials) token acquisition
    async function validateOffice365ClientCredentials(
      tenantId?: string | null,
      clientId?: string | null,
      clientSecret?: string | null
    ) {
      if (!tenantId || !clientId || !clientSecret) return null;

      try {
        const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
          tenantId
        )}/oauth2/v2.0/token`;

        const params = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        });

        const resp = await fetch(tokenUrl, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        const txt = await resp.text().catch(() => "");
        const json = (() => {
          try {
            return JSON.parse(txt);
          } catch (_) {
            return null;
          }
        })();

        if (!resp.ok) {
          // Prefer detailed error message from AAD if present
          const errMsg =
            (json && (json.error_description || json.error)) ||
            txt ||
            `status ${resp.status}`;
          return `Token acquisition failed: ${errMsg}`;
        }

        if (!json || !json.access_token) {
          return `Token response missing access_token: ${txt}`;
        }

        return null;
      } catch (err) {
        return `Token request failed: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // SUPER_ADMIN can create/update GLOBAL settings
    if (data.scope === "GLOBAL" && user.role === "SUPER_ADMIN") {
      // Check if global provider exists
      const existing = await db.emailProvider.findFirst({
        where: { scope: "GLOBAL" },
      });

      // When configuring Office365 (global), validate client credentials before saving
      if (data.provider === "OFFICE365") {
        const credsError = await validateOffice365ClientCredentials(
          data.office365TenantId,
          data.office365ClientId,
          data.office365ClientSecret as string | null
        );
        if (credsError) {
          return NextResponse.json({ error: credsError }, { status: 400 });
        }
      }

      if (existing) {
        // Update existing
        const updated = await db.emailProvider.update({
          where: { id: existing.id },
          data: {
            provider: data.provider,
            isActive: data.isActive,
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUsername: data.smtpUsername,
            smtpPassword: data.smtpPassword
              ? encrypt(data.smtpPassword)
              : undefined,
            smtpSecure: data.smtpSecure,
            googleClientId: data.googleClientId,
            googleClientSecret: data.googleClientSecret
              ? encrypt(data.googleClientSecret)
              : undefined,
            googleFromEmail: data.googleFromEmail,
            googleRefreshToken: data.googleRefreshToken
              ? encrypt(data.googleRefreshToken)
              : undefined,
            sendgridApiKey: data.sendgridApiKey
              ? encrypt(data.sendgridApiKey)
              : undefined,
            mailgunApiKey: data.mailgunApiKey
              ? encrypt(data.mailgunApiKey)
              : undefined,
            mailgunDomain: data.mailgunDomain,
            awsRegion: data.awsRegion,
            awsAccessKey: data.awsAccessKey
              ? encrypt(data.awsAccessKey)
              : undefined,
            awsSecretKey: data.awsSecretKey
              ? encrypt(data.awsSecretKey)
              : undefined,
            resendApiKey: data.resendApiKey
              ? encrypt(data.resendApiKey)
              : undefined,
            office365TenantId: data.office365TenantId,
            office365ClientId: data.office365ClientId,
            office365ClientSecret: data.office365ClientSecret
              ? encrypt(data.office365ClientSecret)
              : undefined,
            office365FromEmail: data.office365FromEmail,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            replyToEmail: data.replyToEmail,
          },
        });
        return NextResponse.json({ provider: updated });
      } else {
        // Create new
        const created = await db.emailProvider.create({
          data: {
            provider: data.provider,
            isActive: data.isActive,
            scope: "GLOBAL",
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUsername: data.smtpUsername,
            smtpPassword: data.smtpPassword
              ? encrypt(data.smtpPassword)
              : undefined,
            smtpSecure: data.smtpSecure,
            googleClientId: data.googleClientId,
            googleClientSecret: data.googleClientSecret
              ? encrypt(data.googleClientSecret)
              : undefined,
            googleFromEmail: data.googleFromEmail,
            googleRefreshToken: data.googleRefreshToken
              ? encrypt(data.googleRefreshToken)
              : undefined,
            sendgridApiKey: data.sendgridApiKey
              ? encrypt(data.sendgridApiKey)
              : undefined,
            mailgunApiKey: data.mailgunApiKey
              ? encrypt(data.mailgunApiKey)
              : undefined,
            mailgunDomain: data.mailgunDomain,
            awsRegion: data.awsRegion,
            awsAccessKey: data.awsAccessKey
              ? encrypt(data.awsAccessKey)
              : undefined,
            awsSecretKey: data.awsSecretKey
              ? encrypt(data.awsSecretKey)
              : undefined,
            resendApiKey: data.resendApiKey
              ? encrypt(data.resendApiKey)
              : undefined,
            office365TenantId: data.office365TenantId,
            office365ClientId: data.office365ClientId,
            office365ClientSecret: data.office365ClientSecret
              ? encrypt(data.office365ClientSecret)
              : undefined,
            office365FromEmail: data.office365FromEmail,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            replyToEmail: data.replyToEmail,
            createdById: userId,
          },
        });
        return NextResponse.json({ provider: created });
      }
    }

    // ADMIN can create/update company-specific settings (only their own companies)
    if (
      data.companyId &&
      (user.role === "ADMIN" || user.role === "SUPER_ADMIN")
    ) {
      // Verify user owns this company (or is SUPER_ADMIN)
      if (user.role === "ADMIN") {
        const membership = await db.companyMember.findFirst({
          where: {
            userId,
            companyId: data.companyId,
            role: "ADMIN",
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "Access denied to this company" },
            { status: 403 }
          );
        }
      }

      // Check if company provider exists
      const existing = await db.emailProvider.findFirst({
        where: { scope: data.companyId },
      });

      // For company-level settings, validate Office365 client_credentials before saving
      if (data.provider === "OFFICE365") {
        const credsError = await validateOffice365ClientCredentials(
          data.office365TenantId,
          data.office365ClientId,
          data.office365ClientSecret as string | null
        );
        if (credsError) {
          return NextResponse.json({ error: credsError }, { status: 400 });
        }
      }

      if (existing) {
        // Update existing
        const updated = await db.emailProvider.update({
          where: { id: existing.id },
          data: {
            provider: data.provider,
            isActive: data.isActive,
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUsername: data.smtpUsername,
            smtpPassword: data.smtpPassword
              ? encrypt(data.smtpPassword)
              : undefined,
            smtpSecure: data.smtpSecure,
            googleClientId: data.googleClientId,
            googleClientSecret: data.googleClientSecret
              ? encrypt(data.googleClientSecret)
              : undefined,
            googleFromEmail: data.googleFromEmail,
            googleRefreshToken: data.googleRefreshToken
              ? encrypt(data.googleRefreshToken)
              : undefined,
            sendgridApiKey: data.sendgridApiKey
              ? encrypt(data.sendgridApiKey)
              : undefined,
            mailgunApiKey: data.mailgunApiKey
              ? encrypt(data.mailgunApiKey)
              : undefined,
            mailgunDomain: data.mailgunDomain,
            awsRegion: data.awsRegion,
            awsAccessKey: data.awsAccessKey
              ? encrypt(data.awsAccessKey)
              : undefined,
            awsSecretKey: data.awsSecretKey
              ? encrypt(data.awsSecretKey)
              : undefined,
            resendApiKey: data.resendApiKey
              ? encrypt(data.resendApiKey)
              : undefined,
            office365TenantId: data.office365TenantId,
            office365ClientId: data.office365ClientId,
            office365ClientSecret: data.office365ClientSecret
              ? encrypt(data.office365ClientSecret)
              : undefined,
            office365FromEmail: data.office365FromEmail,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            replyToEmail: data.replyToEmail,
          },
        });
        return NextResponse.json({ provider: updated });
      } else {
        // Create new
        const created = await db.emailProvider.create({
          data: {
            provider: data.provider,
            isActive: data.isActive,
            scope: data.companyId,
            companyId: data.companyId,
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUsername: data.smtpUsername,
            smtpPassword: data.smtpPassword
              ? encrypt(data.smtpPassword)
              : undefined,
            smtpSecure: data.smtpSecure,
            googleClientId: data.googleClientId,
            googleClientSecret: data.googleClientSecret
              ? encrypt(data.googleClientSecret)
              : undefined,
            googleFromEmail: data.googleFromEmail,
            googleRefreshToken: data.googleRefreshToken
              ? encrypt(data.googleRefreshToken)
              : undefined,
            sendgridApiKey: data.sendgridApiKey
              ? encrypt(data.sendgridApiKey)
              : undefined,
            mailgunApiKey: data.mailgunApiKey
              ? encrypt(data.mailgunApiKey)
              : undefined,
            mailgunDomain: data.mailgunDomain,
            awsRegion: data.awsRegion,
            awsAccessKey: data.awsAccessKey
              ? encrypt(data.awsAccessKey)
              : undefined,
            awsSecretKey: data.awsSecretKey
              ? encrypt(data.awsSecretKey)
              : undefined,
            resendApiKey: data.resendApiKey
              ? encrypt(data.resendApiKey)
              : undefined,
            office365TenantId: data.office365TenantId,
            office365ClientId: data.office365ClientId,
            office365ClientSecret: data.office365ClientSecret
              ? encrypt(data.office365ClientSecret)
              : undefined,
            office365FromEmail: data.office365FromEmail,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            replyToEmail: data.replyToEmail,
            createdById: userId,
          },
        });
        return NextResponse.json({ provider: created });
      }
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error saving email provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
