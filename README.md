# OnTarget ERP v5

A comprehensive Enterprise Resource Planning system built with Next.js, featuring multi-tenant architecture, role-based access control, and extensive business management capabilities.

## Features

### 🏢 Multi-Tenant Company Management

- Root company configuration with white-label branding
- Theme-aware logo system (light/dark mode support)
- Company hierarchy and member management
- Multi-company support for administrators

### 👥 Workforce Management

- Complete staff tracking and management
- Employment types: Full-Time, Part-Time, Contractor (1099), Seasonal
- Employment status tracking: Active, On Leave, Terminated, Suspended
- Geographic tracking (city, state, country with flags)
- Role-based access for Super Admin, Admin, and Manager

### 📧 Email Service Configuration

A modern, card-based email provider system with OAuth 2.0 security and two-tier configuration architecture.

#### Quick Setup for Super Admins

1. **Navigate to Settings**: Go to Dashboard → Settings → Email Service Configuration
2. **Select Provider**: Click on any provider card (Google OAuth, Office 365, SendGrid, Mailgun, AWS SES)
3. **Configure OAuth Credentials**:
   - For **Google OAuth**: Follow [Google OAuth Setup Guide](#google-oauth-setup-instructions-gmail-api-with-oauth-20) below
   - For **Office 365**: Follow [Office 365 Setup Guide](#office-365-setup-instructions-oauth-20-with-microsoft-graph) below
4. **Test Connection**: Click "Test Connection" to verify credentials
5. **Save & Activate**: Automatically enables after successful test
6. **Active Indicator**: Card displays animated border beam when active

#### Quick Setup for Admins (Company Override)

1. **Navigate to Settings**: Go to Dashboard → Settings → Email Service Configuration
2. **Select Configuration Level**: Choose between:
   - **🌐 Global Default** - Use system-wide settings (set by Super Admin)
   - **🏢 [Your Company]** - Override with custom company settings
3. **Configure Provider**: Same as Super Admin steps above
4. **Company Branding**: Send emails from your company's domain

#### Supported Email Providers

- **Google OAuth** - Gmail API with OAuth 2.0 (recommended for security)
- **Office 365 / Outlook** - Microsoft Graph API with OAuth 2.0
- **SendGrid** - Cloud-based email delivery platform
- **Mailgun** - Transactional email API service
- **Amazon SES** - AWS Simple Email Service
- **Resend** - Modern email API (coming soon)

#### Two-Tier Configuration System

**Global Level (SUPER_ADMIN):**

- Configure system-wide default email provider
- All new companies and users inherit these settings
- Ensures emails always work even without company-specific config
- Access: Settings → Email Service Configuration → "Global Default"

**Company Level (ADMIN):**

- Override global settings with company-specific email provider
- Each owned company can have its own email configuration
- Branded emails from company's own domain
- Fallback to global settings if not configured
- Access: Settings → Email Service Configuration → Select Company

#### Using the Email System in Your Application

The email provider configuration is stored in the database and can be accessed by any service or domain that needs to send emails:

**Fetching Email Configuration:**

```typescript
import { db } from "@/lib/db";

// Get global email provider (fallback)
const globalProvider = await db.emailProvider.findFirst({
  where: { scope: "GLOBAL", isActive: true },
});

// Get company-specific email provider (preferred)
const companyProvider = await db.emailProvider.findFirst({
  where: { scope: companyId, isActive: true },
});

// Use company provider if exists, otherwise fallback to global
const emailConfig = companyProvider || globalProvider;
```

**Sending Emails with Different Providers:**

```typescript
// Example: Sending with SMTP (Generic)
import nodemailer from "nodemailer";

if (emailConfig.provider === "SMTP") {
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpSecure,
    auth: {
      user: emailConfig.smtpUsername,
      pass: emailConfig.smtpPassword, // Decrypt in production
    },
  });

  await transporter.sendMail({
    from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
    replyTo: emailConfig.replyToEmail,
    to: recipientEmail,
    subject: "Your Subject",
    html: emailContent,
  });
}

// Example: Sending with Gmail
import nodemailer from "nodemailer";

if (emailConfig.provider === "GMAIL") {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailConfig.smtpUsername, // Gmail address
      pass: emailConfig.smtpPassword, // App password (decrypt in production)
    },
  });

  await transporter.sendMail({
    from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
    replyTo: emailConfig.replyToEmail,
    to: recipientEmail,
    subject: "Your Subject",
    html: emailContent,
  });
}

// Example: Sending with Office 365 (Microsoft Graph API)
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";

if (emailConfig.provider === "OFFICE365") {
  // Create OAuth credential
  const credential = new ClientSecretCredential(
    emailConfig.office365TenantId,
    emailConfig.office365ClientId,
    emailConfig.office365ClientSecret // Decrypt in production
  );

  // Initialize Graph client
  const client = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(
          "https://graph.microsoft.com/.default"
        );
        return token.token;
      },
    },
  });

  // Send email via Graph API
  await client.api(`/users/${emailConfig.office365FromEmail}/sendMail`).post({
    message: {
      subject: "Your Subject",
      body: {
        contentType: "HTML",
        content: emailContent,
      },
      toRecipients: [
        {
          emailAddress: {
            address: recipientEmail,
          },
        },
      ],
      from: {
        emailAddress: {
          name: emailConfig.fromName,
          address: emailConfig.office365FromEmail,
        },
      },
      replyTo: [
        {
          emailAddress: {
            address: emailConfig.replyToEmail,
          },
        },
      ],
    },
  });
}

// Example: Sending with SendGrid
import sgMail from "@sendgrid/mail";

if (emailConfig.provider === "SENDGRID") {
  sgMail.setApiKey(emailConfig.sendgridApiKey); // Decrypt in production

  await sgMail.send({
    from: {
      name: emailConfig.fromName,
      email: emailConfig.fromEmail,
    },
    replyTo: emailConfig.replyToEmail,
    to: recipientEmail,
    subject: "Your Subject",
    html: emailContent,
  });
}

// Example: Sending with Mailgun
import formData from "form-data";
import Mailgun from "mailgun.js";

if (emailConfig.provider === "MAILGUN") {
  const mailgun = new Mailgun(formData);
  const client = mailgun.client({
    username: "api",
    key: emailConfig.mailgunApiKey, // Decrypt in production
  });

  await client.messages.create(emailConfig.mailgunDomain, {
    from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
    "h:Reply-To": emailConfig.replyToEmail,
    to: recipientEmail,
    subject: "Your Subject",
    html: emailContent,
  });
}

// Example: Sending with AWS SES
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

if (emailConfig.provider === "AWS_SES") {
  const client = new SESClient({
    region: emailConfig.awsRegion,
    credentials: {
      accessKeyId: emailConfig.awsAccessKey, // Decrypt in production
      secretAccessKey: emailConfig.awsSecretKey, // Decrypt in production
    },
  });

  await client.send(
    new SendEmailCommand({
      Source: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      ReplyToAddresses: [emailConfig.replyToEmail],
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: "Your Subject" },
        Body: { Html: { Data: emailContent } },
      },
    })
  );
}
```

**Creating a Centralized Email Service:**

```typescript
// lib/email-service.ts
export async function sendEmail({
  companyId,
  to,
  subject,
  html,
  text,
}: {
  companyId?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  // 1. Fetch email configuration (company-specific or global)
  const emailConfig = await getEmailConfig(companyId);

  if (!emailConfig) {
    throw new Error("No email provider configured");
  }

  // 2. Send email based on provider type
  switch (emailConfig.provider) {
    case "SMTP":
      return sendViaSMTP(emailConfig, { to, subject, html, text });
    case "GMAIL":
      return sendViaGmail(emailConfig, { to, subject, html, text });
    case "OFFICE365":
      return sendViaOffice365(emailConfig, { to, subject, html, text });
    case "SENDGRID":
      return sendViaSendGrid(emailConfig, { to, subject, html, text });
    case "MAILGUN":
      return sendViaMailgun(emailConfig, { to, subject, html, text });
    case "AWS_SES":
      return sendViaAWSSES(emailConfig, { to, subject, html, text });
    default:
      throw new Error(`Unsupported provider: ${emailConfig.provider}`);
  }
}

// Usage in your application:
await sendEmail({
  companyId: "company-123",
  to: "customer@example.com",
  subject: "Invoice #12345",
  html: "<h1>Your Invoice</h1><p>Thank you for your business!</p>",
});
```

**Use Cases Across Domains:**

1. **Authentication System**

   - Password reset emails
   - Email verification
   - Login notifications
   - 2FA codes

2. **Invoicing & Billing**

   - Invoice delivery
   - Payment receipts
   - Payment reminders
   - Subscription renewals

3. **Customer Management**

   - Welcome emails
   - Order confirmations
   - Shipping notifications
   - Support ticket updates

4. **Workforce Management**

   - Onboarding communications
   - Schedule notifications
   - Payroll notifications
   - Performance review reminders

5. **Marketing & Communications**
   - Newsletter campaigns
   - Promotional emails
   - Product announcements
   - Event invitations

**Security Considerations:**

⚠️ **IMPORTANT**: In production, sensitive fields should be encrypted:

- `smtpPassword`
- `sendgridApiKey`
- `mailgunApiKey`
- `awsAccessKey`
- `awsSecretKey`
- `office365ClientSecret`

Implement encryption before storing and decrypt only when sending emails. Never expose decrypted credentials in API responses.

#### Gmail Setup Instructions

1. **Enable 2-Step Verification**: Go to your Google Account → Security → 2-Step Verification
2. **Create App Password**:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
3. **Configure in ERP**:
   - Provider: Gmail (Google Workspace)
   - Gmail Address: your-email@gmail.com
   - App Password: [paste 16-char password]
   - From Email: your-email@gmail.com
   - From Name: Your Company Name

#### Google OAuth Setup Instructions (Gmail API with OAuth 2.0)

Google OAuth uses Gmail API with OAuth 2.0 for secure, authenticated email delivery. This is recommended over SMTP for better security and deliverability.

**Step 1: Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
   - Project name: "ERP Email Service"
   - Organization: (select your org if applicable)
3. Click "Create"
4. Wait for project creation to complete

**Step 2: Enable Gmail API**

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on "Gmail API"
4. Click "Enable"
5. Wait for the API to be enabled

**Step 3: Configure OAuth Consent Screen**

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "Internal" (if using Google Workspace) or "External" (for personal Gmail)
3. Fill in the required fields:
   - App name: "ERP Email Service"
   - User support email: (your email)
   - Developer contact: (your email)
4. Click "Save and Continue"
5. On Scopes page, click "Add or Remove Scopes"
6. Add: `https://www.googleapis.com/auth/gmail.send`
7. Click "Update" → "Save and Continue"
8. Complete the consent screen setup

**Step 4: Create OAuth 2.0 Credentials**

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select:
   - Application type: "Web application"
   - Name: "ERP Email OAuth Client"
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
4. Click "Create"
5. **Save the following values**:
   - Client ID (ends with `.apps.googleusercontent.com`)
   - Client Secret (starts with `GOCSPX-`)

**Step 5: Generate Refresh Token**

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click the ⚙️ (settings) icon in top-right
3. Check "Use your own OAuth credentials"
4. Enter:
   - OAuth Client ID: [your client ID from Step 4]
   - OAuth Client Secret: [your client secret from Step 4]
5. Close settings
6. In left panel "Step 1", scroll to find "Gmail API v1"
7. Check the box for: `https://www.googleapis.com/auth/gmail.send`
8. Click "Authorize APIs"
9. Sign in with the Gmail account you want to send emails from
10. Click "Allow" to grant permissions
11. In "Step 2", click "Exchange authorization code for tokens"
12. **Copy the "Refresh token"** (starts with `1//`)

**Step 6: Configure in ERP**

1. Go to Settings → Email Service Configuration
2. Select "Google OAuth" card
3. Enter:
   - **Client ID**: [your client ID from Step 4]
   - **Client Secret**: [your client secret from Step 4]
   - **From Email Address**: [the Gmail address you authorized in Step 5]
   - **Refresh Token**: [your refresh token from Step 5]
   - **From Name**: Your Company Name
   - **Reply-To Email**: support@yourdomain.com
4. Click "Test Connection" to verify
5. Click "Save & Activate" to enable

**Important Notes:**

- OAuth 2.0 is more secure than Gmail App Passwords
- Works with personal Gmail and Google Workspace accounts
- Refresh token never expires unless revoked
- Respects Gmail sending limits (500/day for personal, 2000/day for Workspace)
- Recommended for production use over SMTP
- No need to enable "Less secure app access"
- Works even with 2-factor authentication enabled

**Troubleshooting:**

- **"Access blocked"**: Make sure OAuth consent screen is properly configured
- **"Invalid grant"**: Refresh token may have been revoked - regenerate it
- **"Insufficient permissions"**: Verify `gmail.send` scope is added in consent screen
- **"Daily limit exceeded"**: Respect Gmail's sending quotas
- **For Google Workspace**: Admin must allow API access in Workspace admin console

#### Office 365 Setup Instructions (OAuth 2.0 with Microsoft Graph)

Office 365 uses service-to-service OAuth authentication with Microsoft Graph API for secure, reliable email delivery.

**Step 1: Register Application in Azure Portal**

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
   - Name: "ERP Email Service"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Leave blank (daemon app)
3. Click "Register"
4. **Save the following values**:
   - Application (client) ID
   - Directory (tenant) ID

**Step 2: Create Client Secret**

1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
   - Description: "ERP Email Secret"
   - Expires: 24 months (or as per your policy)
3. Click "Add"
4. **Copy the secret VALUE immediately** (you can't see it again)

**Step 3: Grant API Permissions**

1. Go to "API permissions" in your app
2. Click "Add a permission" → Microsoft Graph → Application permissions
3. Search and add:
   - `Mail.Send` - Send mail as any user
4. Click "Add permissions"
5. **Click "Grant admin consent"** (requires admin privileges)
6. Status should show green checkmarks

**Step 4: Configure Mailbox**

1. Ensure the "From Email" has an Exchange Online mailbox
2. The application will send emails on behalf of this mailbox
3. Test with a service account like `noreply@company.com`

**Step 5: Configure in ERP**

1. Go to Settings → Email Service Configuration
2. Select "Office 365 / Outlook"
3. Enter:
   - **Tenant ID**: [your tenant ID from Step 1]
   - **Client ID**: [your application ID from Step 1]
   - **Client Secret**: [your secret value from Step 2]
   - **From Email Address**: noreply@company.com (must have a mailbox)
   - **From Name**: Your Company Name
   - **Reply-To Email**: support@company.com
4. Click "Test Connection" to verify
5. Click "Save Configuration"

**Important Notes:**

- The application sends emails using daemon/service principal authentication
- No user interaction required - fully automated
- More secure than SMTP with username/password
- Recommended for enterprise deployments
- Respects Exchange Online sending limits and policies

### 🗄️ Cold Storage Configuration

- Multi-provider support (AWS S3, Google Cloud, Azure, etc.)
- Global and company-specific storage options
- Connection testing before activation

### 📊 Business Management

- Customer relationship management
- Service catalog system
- Subscription plan management
- Company-to-company relationships

### 🔐 Security & Access Control

- Role-based permissions (Super Admin, Admin, Manager, Staff, etc.)
- OAuth provider integration (Google, Microsoft)
- Geo-tracking capabilities
- Visitor tracking and analytics
- Audit logging system

### 🎨 Customization

- Theme system (light/dark mode)
- Company branding and logos
- White-label capabilities
- Responsive design

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL/MySQL with Prisma ORM
- **Authentication**: Custom auth with OAuth support
- **UI Components**: Radix UI + Tailwind CSS
- **Image Processing**: Sharp
- **Email**: Multi-provider support (SMTP, SendGrid, Mailgun, AWS SES, Resend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL or MySQL database
- (Optional) Email provider API keys for transactional emails

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up your database and run migrations:

```bash
npx prisma migrate dev
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Schema

### Key Models

- **User**: System users with role-based permissions
- **Company**: Multi-tenant company entities with branding
- **CompanyMember**: Company membership and roles
- **CompanyStaff**: Workforce management and employment tracking
- **EmailProvider**: Email service configuration (global and per-company)
- **StorageProvider**: Cold storage configuration
- **Customer**: Customer relationship management
- **Service**: Service catalog management
- **Subscription**: Subscription plan management

### Email Provider Implementation

The email provider system is implemented with:

**Database Table**: `EmailProvider`

- Location: `prisma/schema.prisma`
- Migration: `20251113220001_add_email_provider`

**UI Component**: `components/email-provider-settings.tsx`

- Provider selection dropdown
- Dynamic form fields per provider type
- Company selector for ADMIN users
- Test connection functionality
- Real-time validation

**API Endpoints**:

- `GET /api/settings/email-provider` - Fetch configuration
- `POST /api/settings/email-provider` - Save/update configuration
- `POST /api/settings/email-provider/test` - Test connection

**Settings Integration**: `app/dashboard/settings/page.tsx`

- Accordion section: "Email Service Configuration"
- Visible to SUPER_ADMIN and ADMIN roles
- Access-controlled based on role and company ownership

## Project Structure

```
ontarget-erp-v5/
├── app/
│   ├── api/                      # API routes
│   │   ├── settings/
│   │   │   └── email-provider/   # Email config endpoints
│   │   ├── workforce/            # Staff management
│   │   └── ...
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── settings/             # Settings page with email config
│   │   ├── workforce/            # Workforce management
│   │   └── ...
│   └── (auth)/                   # Authentication pages
├── components/
│   ├── dashboard-menus/          # Role-based menu components
│   ├── dashboard-views/          # Role-based view components
│   ├── workforce-views/          # Workforce management views
│   ├── email-provider-settings.tsx  # Email configuration UI
│   └── ...
├── lib/
│   ├── db.ts                     # Database client
│   ├── geo-tracking.ts           # Geo-tracking utilities
│   └── ...
└── prisma/
    ├── schema.prisma             # Database schema
    └── migrations/               # Database migrations
```

## API Documentation

### Email Provider API

#### Get Email Configuration

```
GET /api/settings/email-provider?scope=GLOBAL
GET /api/settings/email-provider?companyId={companyId}
```

**Authorization**: SUPER_ADMIN for global, ADMIN for company-specific

**Response**:

```json
{
  "provider": {
    "id": "string",
    "provider": "SMTP | SENDGRID | MAILGUN | AWS_SES | RESEND",
    "isActive": boolean,
    "scope": "string",
    "fromEmail": "string",
    "fromName": "string",
    "replyToEmail": "string",
    "smtpHost": "string",
    "smtpPort": number,
    // ... provider-specific fields
  }
}
```

#### Save Email Configuration

```
POST /api/settings/email-provider
```

**Body**:

```json
{
  "provider": "SMTP",
  "isActive": true,
  "scope": "GLOBAL",
  "companyId": null,
  "fromEmail": "noreply@company.com",
  "fromName": "Company Name",
  "replyToEmail": "support@company.com",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUsername": "user@gmail.com",
  "smtpPassword": "app-password",
  "smtpSecure": true
}
```

#### Test Email Connection

```
POST /api/settings/email-provider/test
```

**Body**: Same as save endpoint

**Response**:

```json
{
  "success": true,
  "message": "Connection successful!"
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production Deployment

### Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Email Providers (if using)
# These are stored in the database via the settings UI

# Storage Providers
# Configured via settings UI

# OAuth (if enabled)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Next.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
```

### Security Checklist

Before deploying to production:

- [ ] Implement encryption for sensitive email credentials
- [ ] Set up proper CORS policies
- [ ] Enable rate limiting on API endpoints
- [ ] Configure proper database connection pooling
- [ ] Set up audit logging for sensitive operations
- [ ] Implement proper error handling and logging
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Review and limit API access based on roles

### Encryption Implementation

For email provider credentials, implement encryption before storing:

```typescript
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const parts = encrypted.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = parts[2];
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Usage in email provider API:
// Before saving:
data.smtpPassword = data.smtpPassword ? encrypt(data.smtpPassword) : undefined;

// Before using:
const password = emailConfig.smtpPassword
  ? decrypt(emailConfig.smtpPassword)
  : "";
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Recent Updates

### November 2024

**Email Service Configuration System**

- ✅ Added multi-provider email support (SMTP, SendGrid, Mailgun, AWS SES, Resend)
- ✅ Implemented two-tier configuration (global default + company overrides)
- ✅ Created settings UI with test connection functionality
- ✅ Added API endpoints for email provider management
- ✅ Database migration: `20251113220001_add_email_provider`

**Workforce Management System**

- ✅ Complete staff tracking with employment types and statuses
- ✅ Role-based views for Super Admin, Admin, and Manager
- ✅ Geographic tracking with country flags
- ✅ Database migration: `20251113214045_add_company_staff`

**Branding System Enhancements**

- ✅ Theme-aware logo system (light/dark mode)
- ✅ Drag-and-drop logo upload with Sharp image optimization
- ✅ Fixed logo persistence and display issues
- ✅ Responsive logo sizing with aspect ratio preservation

## Contributing

When adding new features that require email notifications:

1. Use the centralized email service pattern shown above
2. Always check for company-specific email config first, fallback to global
3. Handle provider-specific errors gracefully
4. Log email sending attempts for audit purposes
5. Respect user email preferences and opt-outs

## License

[Your License Here]

## Support

For questions or support, please contact [your contact info]

---

Built with ❤️ using Next.js, Prisma, and TypeScript
