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

### 🎯 Teams & Projects Management (NEW - Nov 15, 2025)

**Production-grade project management system with role-based access control**

- ✅ **Team-Based Organization** - Create teams, assign members, manage projects
- ✅ **Complete Project Lifecycle** - Create, track, update, and complete projects
- ✅ **Task Management** - Full task tracking with status, priority, assignments, and due dates
- ✅ **Real-Time Progress** - Automated progress calculation with metrics and breakdowns
- ✅ **Drag & Drop** - Kanban-style task reordering with persistent order field
- ✅ **Activity Logging** - All operations logged (view, create, update, delete) with metadata
- ✅ **Company Isolation** - Strict company boundaries, no cross-company data leakage
- ✅ **Role-Based Permissions** - Granular access control based on role and team membership

#### Project Management Permissions

**Access Control Model:**

1. **SUPER_ADMIN** - Only sees projects from companies they **OWN** (not all companies)

   - Must be the company owner (ownerId field)
   - Can manage all projects within owned companies
   - Company selector pattern (select company → view projects)

2. **ADMIN** - Sees **ALL** projects in their company

   - Full company visibility (owner + member + workforce)
   - Can manage all projects and teams in their company
   - No team membership required

3. **MANAGER** - Only sees projects where they are **team members**

   - Must be assigned to project team (TeamMember table)
   - Role: Moderator (can be project manager, team lead, or staff member)
   - No blanket company access - explicit team assignment required

4. **STAFF** - Only sees projects where they are **team members**

   - Must be assigned to project team (TeamMember table)
   - Role: Operations (executes tasks, updates status)
   - Team membership is sufficient (task assignment not required)

5. **CONTRACTOR** - Only sees projects where they are **team members**
   - Must be assigned to project team (TeamMember table)
   - Same access as STAFF role
   - Can have tasks assigned even without owning companies

**Key Principles:**

- **Team Membership = Access** - Being on the team grants project visibility (even without tasks)
- **No Cross-Company Access** - Strict isolation between companies owned by same SUPER_ADMIN
- **Hierarchy Enforcement** - User → Company → Workforce → Team → Project → Tasks
- **Explicit Assignment** - MANAGER/STAFF/CONTRACTOR must be explicitly added to teams by ADMIN
- **Training Scenario** - Intern on Team A can observe Project X without assigned tasks

**Example Scenarios:**

- **SUPER_ADMIN** owns 3 companies → Sees projects only from those 3 companies (not all system companies)
- **ADMIN** of Company A → Sees all projects in Company A regardless of team
- **MANAGER** in Company A → Only sees Project X if added as team member on Team 1
- **STAFF** member → Can view Project Y (observe/train) even without assigned tasks
- **CONTRACTOR** → Can access projects via team membership without owning companies

#### API Endpoints

**Projects:**

- `GET /api/projects` - List projects (filtered by role and company)
- `POST /api/projects` - Create new project
- `GET /api/projects/[projectId]` - Get project details
- `PATCH /api/projects/[projectId]` - Update project
- `DELETE /api/projects/[projectId]` - Delete project
- `GET /api/projects/[projectId]/progress` - Get real-time progress metrics

**Tasks:**

- `GET /api/projects/[projectId]/tasks` - List tasks in project
- `POST /api/projects/[projectId]/tasks` - Create new task
- `GET /api/tasks/[taskId]` - Get task details
- `PATCH /api/tasks/[taskId]` - Update task (status, priority, order, assignment)
- `DELETE /api/tasks/[taskId]` - Delete task

**Activity Logging:**

- `PROJECTS_VIEWED` - User viewed projects list
- `PROJECT_VIEWED` - User viewed project details
- `PROJECT_CREATED` - User created project
- `PROJECT_UPDATED` - User updated project
- `PROJECT_DELETED` - User deleted project
- `TASKS_VIEWED` - User viewed tasks list
- `TASK_VIEWED` - User viewed task details
- `TASK_CREATED` - User created task
- `TASK_UPDATED` - User updated task
- `TASK_DELETED` - User deleted task
- `PROJECT_PROGRESS_VIEWED` - User viewed project progress

**Database Schema:**

```
Team (id, companyId, name, description)
  ↓
TeamMember (id, teamId, staffId, role: TEAM_LEAD | MEMBER)
  ↓
Project (id, companyId, teamId, name, status, dates, managerId, leadId)
  ↓
Task (id, projectId, title, status, priority, assignedToId, order, dueDate)
```

### � OAuth Authentication System (NEW - Nov 15, 2025)

**Seamless social login with intelligent account management**

- ✅ **Google & Microsoft OAuth** - One-click login with social accounts
- ✅ **Smart Auth Method Detection** - Tracks login method per user ('credentials', 'oauth', 'both')
- ✅ **Automatic Account Creation** - New OAuth users created as ERP_CUSTOMER role
- ✅ **Flexible Authentication** - OAuth users can set password to enable credential login
- ✅ **Security Enforcement** - Credentials-only accounts cannot use OAuth (prevents account confusion)
- ✅ **Duplicate Prevention** - Email uniqueness enforced, no orphan accounts
- ✅ **Error Handling** - User-friendly messages for all OAuth scenarios

**How it Works:**

```
User clicks "Google/Microsoft" → OAuth authorization →
Account check → New user (ERP_CUSTOMER) OR existing login →
Session creation → Dashboard redirect
```

**Auth Method Transitions:**

- OAuth-only user sets password → Can login with either OAuth or credentials
- Prevents account confusion and maintains security boundaries

📚 **See [OAUTH-IMPLEMENTATION-GUIDE.md](./OAUTH-IMPLEMENTATION-GUIDE.md) for setup & testing**

### �📧 Email Service Configuration

A modern, card-based email provider system with OAuth 2.0 security, three-tier configuration architecture, and automated transactional emails.

**🎯 Email Features:**

- ✅ **Multi-Provider Support** - Nodemailer, Gmail, Office 365, SendGrid, Mailgun, AWS SES, Resend
- ✅ **Secure Credential Storage** - AES-256-CBC encryption for all API keys and passwords
- ✅ **Three-Tier Architecture** - User → Company → Global email provider priority
- ✅ **Personal Email Providers** - Staff can connect Office365/Gmail with admin permission
- ✅ **Automated Emails:**
  - 🔐 Password reset emails with secure tokens
  - 👋 Welcome emails for new ERP customers
  - 🎉 Welcome emails for new staff members (with temporary password)
  - 📧 Resend welcome email functionality
- ✅ **Professional Templates** - Branded HTML email templates with gradient designs
- ✅ **Company Branding** - Send from company domains with custom "From Name"
- ✅ **Fallback System** - Companies inherit global settings if not configured
- ✅ **Test Connection** - Built-in connection testing before activation
- ✅ **Active Indicator** - Animated border beam on active provider cards

#### 🔐 Personal Email Provider Permissions (NEW - Nov 15, 2025)

**Admin Control:**

- ✅ SUPER_ADMIN and ADMIN can enable personal email setup for individual staff members
- ✅ Toggle added to Edit Staff Member form: "Allow Personal Email Setup"
- ✅ Granular permission control per staff member
- ✅ Database field: `User.canSetupPersonalEmail` (Boolean, default: false)

**Email Priority System:**

1. **User Email Provider** (Tier 1) - Staff member's personal Office365/Gmail (if enabled & connected)
2. **Company Email Provider** (Tier 2) - Company SMTP/OAuth (for notifications, templates)
3. **Global Email Provider** (Tier 3) - ERP system default (fallback)

**Use Cases:**

- Sales team using personal Office365 for customer outreach
- Marketing team with Gmail accounts for campaigns
- Restrict finance/HR to company email only
- Compliance and audit trail per provider

#### Quick Setup for Super Admins

1. **Navigate to Settings**: Go to Dashboard → Settings → Email Service Configuration
2. **Select Provider**: Click on any provider card:
   - **Nodemailer (SMTP)** - Default, works with any email (recommended for getting started)
   - **Google OAuth** - Gmail API with OAuth 2.0
   - **Office 365** - Microsoft Graph API with OAuth 2.0
   - **SendGrid, Mailgun, AWS SES** - Third-party services
3. **Configure Credentials**:
   - For **Nodemailer**: Follow [Nodemailer Setup Guide](#nodemailer-setup-instructions-default-smtp-provider) below
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

- **Nodemailer (SMTP)** - Universal SMTP provider, works with any email service (recommended default)
- **Google OAuth** - Gmail API with OAuth 2.0 (recommended for security)
- **Office 365 / Outlook** - Microsoft Graph API with OAuth 2.0
- **SendGrid** - Cloud-based email delivery platform
- **Mailgun** - Transactional email API service
- **Amazon SES** - AWS Simple Email Service
- **Resend** - Modern email API for developers

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

#### Nodemailer Setup Instructions (Default SMTP Provider)

Nodemailer is the default email provider for OnTarget ERP. It uses standard SMTP protocol and works with any email service that supports SMTP, including Gmail, Outlook, Yahoo, and custom mail servers.

**Why Nodemailer?**

- ✅ Universal - works with any SMTP server
- ✅ Simple configuration - just host, port, username, and password
- ✅ No API keys needed - uses standard email credentials
- ✅ Built-in TLS/SSL support
- ✅ Perfect for development and production
- ✅ Cost-effective - use existing email accounts

**Quick Setup Guide:**

1. **Navigate to Settings** → Email Service Configuration
2. **Click the Nodemailer card** (Node.js icon with green gradient)
3. **Enter SMTP credentials:**

   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: Usually 587 (TLS) or 465 (SSL)
   - **Username**: Your full email address
   - **Password**: Your email password or app password
   - **Secure Connection**: Check for port 465, uncheck for 587
   - **From Email**: Email address for sending
   - **From Name**: Your company or application name

4. **Test Connection** to verify settings
5. **Save & Activate** to enable

**Common SMTP Providers:**

| Provider               | SMTP Host           | Port | Secure   | Notes                             |
| ---------------------- | ------------------- | ---- | -------- | --------------------------------- |
| **Gmail**              | smtp.gmail.com      | 587  | No (TLS) | Requires App Password (see below) |
| **Outlook/Office 365** | smtp.office365.com  | 587  | No (TLS) | Use email password                |
| **Yahoo Mail**         | smtp.mail.yahoo.com | 587  | No (TLS) | Requires App Password             |
| **Custom Domain**      | mail.yourdomain.com | 587  | No (TLS) | Check with your host              |
| **SendGrid SMTP**      | smtp.sendgrid.net   | 587  | No (TLS) | Use API key as password           |

**Gmail with Nodemailer:**

Gmail requires an "App Password" for security when using SMTP:

1. **Enable 2-Step Verification**:

   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Generate App Password**:

   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device type
   - Click "Generate"
   - Copy the 16-character password (e.g., `rdke tjlb kppv cgso`)

3. **Configure in OnTarget ERP**:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   Secure Connection: ☐ Unchecked (TLS)
   Username: your-email@gmail.com
   Password: [paste 16-char app password - remove spaces]
   From Email: your-email@gmail.com
   From Name: Your Company Name
   ```

**Outlook/Office 365 with Nodemailer:**

1. **Use Regular Password**: Office 365 works with your normal email password
2. **Enable SMTP AUTH** (if disabled):

   - Admin center → Users → Active users → Mail settings
   - Enable "Authenticated SMTP"

3. **Configure in OnTarget ERP**:
   ```
   SMTP Host: smtp.office365.com
   SMTP Port: 587
   Secure Connection: ☐ Unchecked (TLS)
   Username: your-email@company.com
   Password: [your email password]
   From Email: your-email@company.com
   From Name: Your Company Name
   ```

**Testing Nodemailer (Development):**

A test script is included in the repository:

```bash
# Basic test
node test-nodemailer.mjs

# Comprehensive test suite (all email types)
node test-email-suite.mjs
```

The test suite validates:

- ✅ SMTP connection
- ✅ Password reset emails
- ✅ Welcome customer emails
- ✅ Welcome staff emails

**Troubleshooting:**

| Issue                        | Solution                                             |
| ---------------------------- | ---------------------------------------------------- |
| **Authentication failed**    | Verify username/password, use app password for Gmail |
| **Connection timeout**       | Check firewall allows port 587/465 outbound          |
| **TLS/SSL errors**           | Try toggling "Secure Connection" checkbox            |
| **Gmail "Less secure apps"** | Use App Password instead (more secure)               |
| **Rate limiting**            | Gmail: 500/day, consider SendGrid for higher volume  |

**Production Best Practices:**

- 🔐 **Encrypt credentials** - Use the built-in encryption (already implemented)
- 🏢 **Company-specific configs** - Override global settings per company
- 📊 **Monitor delivery** - Check email logs and bounce rates
- 🔄 **Backup provider** - Configure fallback email provider
- ⚡ **Rate limits** - Be aware of provider sending limits
- 📧 **SPF/DKIM** - Configure DNS records for better deliverability

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

**Personal Email Provider Permissions (Nov 15, 2025)**

- ✅ Added `canSetupPersonalEmail` boolean to User model
- ✅ Database migration: `20251115061252_add_can_setup_personal_email_flag`
- ✅ Admin toggle in Edit Staff Member form
- ✅ API endpoints updated to support permission flag
- ✅ Three-tier email priority system designed

**OAuth Authentication System (Nov 15, 2025)**

- ✅ Added `authMethod` field to User model ('credentials', 'oauth', 'both')
- ✅ Database migration: `20251115071514_add_auth_method_to_user`
- ✅ Created OAuth route handlers:
  - `GET /api/auth/google/login` - Initiates Google OAuth flow
  - `GET /api/auth/google/callback` - Handles Google OAuth callback
  - `GET /api/auth/microsoft/login` - Initiates Microsoft OAuth flow
  - `GET /api/auth/microsoft/callback` - Handles Microsoft OAuth callback
  - `PATCH /api/user/password` - Handles password updates with authMethod transitions
- ✅ Enhanced credentials login to check authMethod and reject OAuth-only users
- ✅ Updated login page with OAuth button click handlers
- ✅ Implemented OAuth error handling with user-friendly messages
- ✅ Automatic user creation as ERP_CUSTOMER for new OAuth users
- ✅ Email verification automatic for OAuth logins
- ✅ AuthMethod transition: OAuth user sets password → becomes 'both'
- ✅ Session management for OAuth logins
- ✅ Duplicate account prevention

**OAuth Login Flow:**

```
User clicks "Google/Microsoft" button → OAuth provider authorization →
Callback checks authMethod → Existing user login OR New ERP_CUSTOMER creation →
Session creation → Dashboard redirect
```

**AuthMethod Transitions:**

- OAuth-only user sets password → authMethod: 'oauth' → 'both'
- User can then login with either OAuth or credentials
- Credentials-only users cannot use OAuth (shows error message)
- OAuth-only users cannot use credentials (shows error message)

## 📋 TODO: OAuth Configuration & Email Provider Implementation

### Phase 1: OAuth Configuration (IN PROGRESS)

**Status:** Core OAuth functionality implemented, needs configuration

#### 1.1 OAuth Provider Setup

- [ ] Configure Google OAuth 2.0 credentials in Google Cloud Console
  - [ ] Create OAuth 2.0 Client ID
  - [ ] Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
  - [ ] Copy Client ID and Client Secret
- [ ] Configure Microsoft OAuth credentials in Azure Portal
  - [ ] Register application in Azure AD
  - [ ] Add redirect URI: `http://localhost:3000/api/auth/microsoft/callback`
  - [ ] Copy Client ID and Client Secret
- [ ] Add OAuth credentials to database via Settings → OAuth Providers
- [ ] Set environment variable: `NEXT_PUBLIC_APP_URL=http://localhost:3000`

#### 1.2 Testing OAuth Flow

- [ ] Test Google OAuth login (new user creation)
- [ ] Test Microsoft OAuth login (new user creation)
- [ ] Test existing OAuth user login
- [ ] Test credentials user trying OAuth (should reject)
- [ ] Test OAuth user setting password (authMethod transition)
- [ ] Test OAuth user with password using credentials login
- [ ] Verify error handling for cancelled/failed OAuth

#### 1.3 OAuth Routes & Logic (COMPLETED ✅)

**Implementation Complete:**

- ✅ `GET /api/auth/google/login` - Initiates Google OAuth flow
- ✅ `GET /api/auth/google/callback` - Handles Google OAuth callback
- ✅ `GET /api/auth/microsoft/login` - Initiates Microsoft OAuth flow
- ✅ `GET /api/auth/microsoft/callback` - Handles Microsoft OAuth callback
- ✅ User email existence check in database
- ✅ AuthMethod validation ('credentials' users rejected from OAuth)
- ✅ New user creation with role = 'ERP_CUSTOMER' and authMethod = 'oauth'
- ✅ Session creation and cookie management
- ✅ Dashboard redirect on successful authentication
- ✅ Error handling for all OAuth failure scenarios

#### 1.4 Auth Method Field & Transitions (COMPLETED ✅)

- ✅ **Add `authMethod` Field to User Model** - Migration: `20251115071514_add_auth_method_to_user`
- ✅ **`PATCH /api/user/password`** - OAuth user sets password, transitions to 'both'
- ✅ **Enhanced `/api/auth/login-secure`** - Checks authMethod, rejects OAuth-only users from credentials login
- ✅ **Credentials user tries OAuth** - Shows error: "Please login with your email and password"

#### 1.5 Login Page Integration (COMPLETED ✅)

- ✅ Google OAuth button → `/api/auth/google/login`
- ✅ Microsoft OAuth button → `/api/auth/microsoft/login`
- ✅ Loading state during OAuth redirect
- ✅ OAuth error handling with user-friendly messages
- ✅ URL parameter error detection and display

#### 1.6 Session Management (COMPLETED ✅)

- ✅ Session creation for OAuth users (7-day HttpOnly cookie)
- ✅ Secure cookie configuration for production
- ✅ Same session management as credentials login

---

**📚 See [OAUTH-IMPLEMENTATION-GUIDE.md](./OAUTH-IMPLEMENTATION-GUIDE.md) for detailed testing instructions**

---

### Phase 2: Personal Email Provider Connection (Staff)

#### 2.1 User Settings - Email Provider Connection

- [ ] **Create Email Provider Settings UI**

  - [ ] Add "Email Provider" section to `/app/dashboard/settings/page.tsx`
  - [ ] Show section only if `user.canSetupPersonalEmail = true`
  - [ ] Display current connection status:
    - Not Connected
    - Connected to Office365 (show email address)
    - Connected to Gmail (show email address)
  - [ ] Add "Connect Office365" button
  - [ ] Add "Connect Gmail" button
  - [ ] Add "Disconnect" button with confirmation dialog

- [ ] **Create OAuth Routes for Email Provider Connection**
  - [ ] `GET /api/user/email-provider/google/authorize` - Initiate Gmail OAuth
  - [ ] `GET /api/user/email-provider/google/callback` - Handle Gmail callback
  - [ ] `GET /api/user/email-provider/office365/authorize` - Initiate O365 OAuth
  - [ ] `GET /api/user/email-provider/office365/callback` - Handle O365 callback
  - [ ] `POST /api/user/email-provider/disconnect` - Remove email provider connection

#### 2.2 UserEmailProvider Management

- [ ] **OAuth Flow Handler**

  ```typescript
  // On successful OAuth:
  // 1. Get access token, refresh token, expiry
  // 2. Get user's email address from provider
  // 3. Create or update UserEmailProvider record:
  //    - userId: current user
  //    - provider: 'GOOGLE' or 'OFFICE365'
  //    - office365/googleAccessToken (encrypted)
  //    - office365/googleRefreshToken (encrypted)
  //    - office365/googleTokenExpiry
  //    - office365/googleFromEmail
  //    - isActive: true
  //    - canSendAdHoc: true
  ```

- [ ] **Token Encryption**

  - [ ] Encrypt access tokens before storing
  - [ ] Encrypt refresh tokens before storing
  - [ ] Decrypt tokens when fetching for email send

- [ ] **Token Refresh Logic**
  - [ ] Check token expiry before each email send
  - [ ] Auto-refresh expired tokens
  - [ ] Handle refresh failures gracefully

### Phase 3: Email Sending Service Updates

#### 3.1 Implement Three-Tier Priority System

- [ ] **Update Email Service (`/lib/email-service.ts`)**

  ```typescript
  async function getEmailProvider(userId: string, companyId: string) {
    // Priority 1: Check UserEmailProvider (if canSetupPersonalEmail = true)
    const userProvider = await db.userEmailProvider.findFirst({
      where: { userId, isActive: true },
    });
    if (userProvider && userProvider.canSendAdHoc) {
      return { type: "USER", config: userProvider };
    }

    // Priority 2: Check CompanyEmailProvider
    const companyProvider = await db.companyEmailProvider.findFirst({
      where: { companyId, isActive: true },
    });
    if (companyProvider) {
      return { type: "COMPANY", config: companyProvider };
    }

    // Priority 3: Check GlobalEmailProvider
    const globalProvider = await db.globalEmailProvider.findFirst({
      where: { isActive: true },
    });
    if (globalProvider) {
      return { type: "GLOBAL", config: globalProvider };
    }

    throw new Error("No email provider configured");
  }
  ```

- [ ] **Add Provider-Specific Send Logic**
  - [ ] Handle Gmail API send (use access token)
  - [ ] Handle Office 365 Graph API send (use access token)
  - [ ] Handle SMTP send (existing Nodemailer logic)

#### 3.2 Email Audit Trail

- [ ] Create `EmailLog` model in Prisma
  ```prisma
  model EmailLog {
    id          String   @id @default(cuid())
    userId      String
    companyId   String?
    to          String
    subject     String
    provider    String   // 'USER', 'COMPANY', 'GLOBAL'
    providerType String  // 'GOOGLE', 'OFFICE365', 'NODEMAILER', etc.
    sentAt      DateTime @default(now())
    success     Boolean
    error       String?
  }
  ```
- [ ] Log every email sent with provider information
- [ ] Create migration for EmailLog model

### Phase 4: Company Customer Role & Front-Facing Store

#### 4.1 Company Customer Registration Flow

- [ ] **Create Public Company Catalog Pages**

  - [ ] Route: `/store/[companySlug]` - Company's public product/service catalog
  - [ ] Display company products and services
  - [ ] Add "Register" button for new customers

- [ ] **Company Customer Registration**

  - [ ] When registering from company store:
    - Create User with role = 'COMPANY_CUSTOMER'
    - Link to specific company (CompanyMember relation)
    - Set authMethod based on registration method
    - Check Prisma schema for COMPANY_CUSTOMER subscription plan (FREE tier)
    - Auto-assign FREE subscription plan

- [ ] **Company Customer Dashboard**
  - [ ] Create `/app/dashboard/company-customer/` views
  - [ ] Show company products/services they can order
  - [ ] Order history and tracking
  - [ ] Limited access (no workforce, no settings)

#### 4.2 Role Promotion Flow

- [ ] **Create Company for ERP_CUSTOMER/COMPANY_CUSTOMER**
  - [ ] When user creates their first company:
    - Promote role from ERP_CUSTOMER → ADMIN
    - Assign as company owner
    - Upgrade subscription plan (if needed)
  - [ ] COMPANY_CUSTOMER cannot create companies (stays in customer view)

### Phase 5: Security & Edge Cases

#### 5.1 Prevent Duplicate Accounts

- [ ] **Email Uniqueness Enforcement**
  - [ ] Check User.email uniqueness constraint in schema
  - [ ] Handle OAuth signup with existing email:
    - If email exists, show "Account already exists, please login"
    - Suggest linking accounts (future feature)

#### 5.2 Auth Method Validation

- [ ] **Login Method Enforcement**
  - [ ] On credentials login: Check if authMethod allows credentials
  - [ ] On OAuth login: Check if authMethod allows OAuth
  - [ ] Display clear error messages for auth method mismatch

#### 5.3 Orphan Prevention

- [ ] Ensure every OAuth user has a valid session
- [ ] Clean up abandoned OAuth sessions (cron job)
- [ ] Handle OAuth provider errors gracefully

### Phase 6: UI/UX Enhancements

#### 6.1 Workforce Management

- [ ] Add email provider status badge in staff table
  - "Personal Email" badge if UserEmailProvider connected
- [ ] Show email provider in staff profile
- [ ] Add filter/sort by email provider status

#### 6.2 Email Provider Status Indicators

- [ ] Settings page: Show connected email provider
- [ ] Dashboard: Show which provider sent last email
- [ ] Email logs: Display provider type and health status

#### 6.3 Admin Notifications

- [ ] Notify admin when staff connects personal email
- [ ] Alert when OAuth tokens expire
- [ ] Dashboard widget for email provider health

### Phase 7: Testing & Documentation

- [ ] Test OAuth login with Google
- [ ] Test OAuth login with Office 365
- [ ] Test email priority system (User → Company → Global)
- [ ] Test auth method transitions (OAuth → credentials → both)
- [ ] Test company customer registration flow
- [ ] Test role promotion (ERP_CUSTOMER → ADMIN)
- [ ] Document OAuth setup process
- [ ] Document email provider connection process
- [ ] Create video tutorial for admins

---

## Planned Next Steps

### Implementation Roadmap

This section outlines the planned features and their implementation order based on dependencies, complexity, and logical build order.

#### Phase 1: Data Foundation & Core Infrastructure

**Priority: CRITICAL - Must come first**

1. **Remove unused Orders/Invoices pages** (15 min)
   - Quick cleanup, clears the way for new structure
2. **Create Ledger schema & basic structure** (2-3 hours)
   - Prisma schema for Ledger, Orders, Invoices, Payroll entries
   - Database foundation everything else builds on

#### Phase 2: Basic Ledger Features

**Priority: HIGH - Core business functionality**

3. **Build Company Ledger UI skeleton** (1-2 hours)

   - Multi-tabbed page structure
   - Orders, Invoices, Payroll, Business Accounting, Expense Tracker tabs
   - Empty states for each tab

4. **Implement Orders tab** (3-4 hours)

   - CRUD for orders
   - Order status workflow
   - Basic order listing and details

5. **Implement Invoices tab** (3-4 hours)
   - Invoice generation from orders
   - Payment status tracking
   - Invoice PDF generation

#### Phase 3: Financial Integration

**Priority: HIGH - Required for payments**

6. **Integrate Plaid for bank linking** (4-6 hours)

   - Company bank account connection
   - Account verification
   - Balance checking

7. **Integrate Stripe payments** (4-6 hours)
   - Payment collection from invoices
   - Deposit to linked bank accounts
   - Payment history tracking

#### Phase 4: Payroll System

**Priority: MEDIUM - Can work alongside ledger**

8. **Build Payroll tab** (6-8 hours)

   - Employee payment schedules
   - Payroll run interface
   - Payment distribution via Stripe

9. **Integrate Tax API** (8-10 hours)
   - Multi-region tax calculation
   - US/Europe/Asia tax rules
   - Withholding and deductions
   - Tax reporting

#### Phase 5: Accounting & Expenses

**Priority: MEDIUM - Completes ledger**

10. **Business Accounting tab** (4-6 hours)

    - Chart of accounts
    - Double-entry bookkeeping
    - Financial reports (P&L, Balance Sheet)

11. **Expense Tracker tab** (3-4 hours)

    - Expense entry and categorization
    - Receipt uploads
    - Expense reports

12. **Auto-credit from paid invoices** (2-3 hours)
    - Webhook from Stripe on payment
    - Auto-post to ledger
    - Balance updates

#### Phase 6: Gamification System

**Priority: LOW - Nice to have, independent feature**

13. **Create Rank Score schema** (1-2 hours)

    - Score tracking per user
    - Monthly/quarterly scoring periods
    - Achievement types

14. **Build scoring logic** (4-6 hours)

    - Point allocation rules
    - Performance metrics tracking
    - Leaderboard calculations

15. **Split Workforce page** (2-3 hours)
    - Add tabs: "Workforce Management" + "Company Scoreboard"
    - Scoreboard UI with rankings
    - Best Employee/Manager of Month display

### Implementation Timeline

**Total Estimated Time: 10-12 working days**

```
Step 1:  Remove Orders/Invoices (Day 0 - 15 min)
Step 2:  Create Ledger Schema (Day 1 - 2-3 hrs)
Step 3:  Build Ledger UI skeleton (Day 1 - 1-2 hrs)
Step 4:  Orders tab (Day 2 - 3-4 hrs)
Step 5:  Invoices tab (Day 2-3 - 3-4 hrs)
Step 6:  Plaid integration (Day 3-4 - 4-6 hrs)
Step 7:  Stripe integration (Day 4-5 - 4-6 hrs)
Step 8:  Payroll tab (Day 5-6 - 6-8 hrs)
Step 9:  Tax API (Day 6-8 - 8-10 hrs)
Step 10: Business Accounting (Day 8-9 - 4-6 hrs)
Step 11: Expense Tracker (Day 9-10 - 3-4 hrs)
Step 12: Auto-credit logic (Day 10 - 2-3 hrs)
Step 13-15: Rank Score System (Day 11-12 - 7-11 hrs)
```

### Why This Order?

1. **Foundation first**: Schema must exist before UI
2. **Core before nice-to-have**: Ledger is business-critical, scoring is enhancement
3. **Dependencies**: Orders → Invoices → Payments → Accounting (logical flow)
4. **Testing**: Each phase can be tested independently
5. **Value delivery**: Company gets working ledger system early

### Key Features Being Added

#### Company Ledger System

- Multi-tabbed financial management interface
- **Orders**: Track customer orders and order lifecycle
- **Invoices**: Generate and manage invoices, track payments
- **Payroll**: Employee payment processing with tax calculations
- **Business Accounting**: Full double-entry bookkeeping system
- **Expense Tracker**: Track business expenses with categorization
- **Auto-credit**: Automatic ledger updates when invoices are paid

#### Financial Integrations

- **Plaid**: Bank account linking for business owners
- **Stripe**: Payment collection and payroll distribution
- **Tax API**: Multi-region tax calculation (US, Europe, Asia)
  - Regional tax rules and rates
  - Automatic withholding calculations
  - Tax deduction management
  - Compliance reporting

#### Workforce Gamification

- **Rank Score System**: Track employee/team performance
- **Leaderboards**: Monthly/quarterly rankings
- **Recognition**: Best Employee/Manager of the Month
- **Scoreboard Dashboard**: Visual performance tracking
- **Role-based scoring**: Admin, Managers, Staff, Contractors

---

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
