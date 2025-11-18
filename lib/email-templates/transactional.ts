import { EmailTemplateType, EmailTemplateCategory } from "@prisma/client";
import {
  TemplateDefinition,
  createEmailShell,
  createContentBlock,
  createCTAButton,
  createCredentialsBox,
} from "./index";

/**
 * TRANSACTIONAL EMAIL TEMPLATES
 * System emails for user actions (password reset, verification, etc.)
 */

export const TRANSACTIONAL_TEMPLATES: TemplateDefinition[] = [
  // WELCOME_STAFF Template
  {
    type: "WELCOME_STAFF" as EmailTemplateType,
    category: "TRANSACTIONAL" as EmailTemplateCategory,
    name: "Welcome New Staff Member",
    description: "Sent when a new staff member is added to the system",
    subject: "Welcome to {{companyName}} - Your Account is Ready! 🎉",
    variables: [
      "staffName",
      "email",
      "temporaryPassword",
      "companyName",
      "role",
      "loginUrl",
      "currentYear",
      "companyLogo",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "greeting",
        label: "Welcome Message",
        type: "text",
        placeholder: "Write a welcoming message for your new team member...",
        defaultValue: "Welcome to the team! We're excited to have you join us.",
        maxLength: 500,
        required: true,
      },
      {
        id: "instructions",
        label: "Getting Started Instructions",
        type: "text",
        placeholder:
          "Add any specific instructions for the new staff member...",
        defaultValue:
          "Your account has been created and you're ready to get started. Use the credentials below to log in.",
        maxLength: 500,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🚀 Login to Dashboard",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <p style="font-size: 20px; color: #212529; margin: 0 0 25px; font-weight: 600;">
          Hello ${vars.staffName},
        </p>
        <p style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0 0 25px;">
          ${
            blocks.greeting ||
            "Welcome to the team! We're excited to have you join us."
          }
        </p>
        <p style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0 0 25px;">
          ${
            blocks.instructions ||
            "Your account has been created and you're ready to get started."
          }
        </p>

        ${createCredentialsBox([
          { label: "📧 Email", value: vars.email },
          {
            label: "🔑 Password",
            value: vars.temporaryPassword,
            isPassword: true,
          },
          { label: "👤 Role", value: vars.role },
        ])}

        ${createContentBlock(
          "<strong>⚠️ Security Notice:</strong><br/>Please change your password after your first login. Choose a strong password with uppercase, lowercase, numbers, and special characters.",
          "warning"
        )}

        ${createCTAButton(
          blocks.ctaText || "🚀 Login to Dashboard",
          vars.loginUrl
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Need help? Contact your manager or IT support team.
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        headerIcon: "🎉",
        headerTitle: `Welcome to ${vars.companyName}`,
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Welcome to ${vars.companyName}!

Hello ${vars.staffName},

${blocks.greeting || "Welcome to the team! We're excited to have you join us."}

${
  blocks.instructions ||
  "Your account has been created and you're ready to get started."
}

YOUR LOGIN CREDENTIALS:
📧 Email: ${vars.email}
🔑 Password: ${vars.temporaryPassword}
👤 Role: ${vars.role}

⚠️ SECURITY NOTICE:
Please change your password after your first login. Choose a strong password with uppercase, lowercase, numbers, and special characters.

Login here: ${vars.loginUrl}

Need help? Contact your manager or IT support team.

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // PASSWORD_RESET Template
  {
    type: "PASSWORD_RESET" as EmailTemplateType,
    category: "TRANSACTIONAL" as EmailTemplateCategory,
    name: "Password Reset Request",
    description: "Sent when a user requests to reset their password",
    subject: "Reset Your Password - {{companyName}} 🔒",
    variables: [
      "userName",
      "resetUrl",
      "companyName",
      "currentYear",
      "companyLogo",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "message",
        label: "Reset Message",
        type: "text",
        placeholder: "Customize the password reset message...",
        defaultValue:
          "We received a request to reset your password. Click the button below to create a new password.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🔒 Reset My Password",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <p style="font-size: 20px; color: #212529; margin: 0 0 25px; font-weight: 600;">
          Hello ${vars.userName},
        </p>
        <p style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0 0 25px;">
          ${blocks.message || "We received a request to reset your password."}
        </p>

        ${createCTAButton(
          blocks.ctaText || "🔒 Reset My Password",
          vars.resetUrl,
          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
        )}

        ${createContentBlock(
          "<strong>🕐 Time Sensitive:</strong><br/>This link will expire in 1 hour for security reasons.",
          "info"
        )}

        ${createContentBlock(
          "<strong>🛡️ Didn't request this?</strong><br/>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.",
          "default"
        )}

        <p style="font-size: 13px; color: #adb5bd; line-height: 1.6; margin: 35px 0 0; text-align: center; border-top: 1px solid #e9ecef; padding-top: 20px;">
          For security reasons, this link can only be used once.
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        headerIcon: "🔒",
        headerTitle: "Password Reset",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Password Reset - ${vars.companyName}

Hello ${vars.userName},

${blocks.message || "We received a request to reset your password."}

Reset your password here: ${vars.resetUrl}

🕐 TIME SENSITIVE:
This link will expire in 1 hour for security reasons.

🛡️ DIDN'T REQUEST THIS?
If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, this link can only be used once.

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // ACCOUNT_VERIFICATION Template
  {
    type: "ACCOUNT_VERIFICATION" as EmailTemplateType,
    category: "TRANSACTIONAL" as EmailTemplateCategory,
    name: "Email Verification",
    description: "Sent to verify a user's email address",
    subject: "Verify Your Email Address - {{companyName}} ✉️",
    variables: [
      "userName",
      "verificationUrl",
      "companyName",
      "currentYear",
      "companyLogo",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "message",
        label: "Verification Message",
        type: "text",
        placeholder: "Customize the verification message...",
        defaultValue:
          "Thanks for signing up! Please verify your email address to activate your account and get started.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "✉️ Verify My Email",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <p style="font-size: 20px; color: #212529; margin: 0 0 25px; font-weight: 600;">
          Hello ${vars.userName},
        </p>
        <p style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0 0 25px;">
          ${
            blocks.message ||
            "Thanks for signing up! Please verify your email address to activate your account."
          }
        </p>

        ${createCTAButton(
          blocks.ctaText || "✉️ Verify My Email",
          vars.verificationUrl,
          "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        )}

        ${createContentBlock(
          "<strong>🔐 Why verify?</strong><br/>Email verification helps us ensure the security of your account and allows us to send you important updates.",
          "success"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        headerIcon: "✉️",
        headerTitle: "Verify Your Email",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Verify Your Email - ${vars.companyName}

Hello ${vars.userName},

${
  blocks.message ||
  "Thanks for signing up! Please verify your email address to activate your account."
}

Verify your email here: ${vars.verificationUrl}

🔐 WHY VERIFY?
Email verification helps us ensure the security of your account and allows us to send you important updates.

If you didn't create this account, you can safely ignore this email.

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // PASSWORD_CHANGED Template
  {
    type: "PASSWORD_CHANGED" as EmailTemplateType,
    category: "TRANSACTIONAL" as EmailTemplateCategory,
    name: "Password Changed Confirmation",
    description: "Sent after a password is successfully changed",
    subject: "Your Password Has Been Changed - {{companyName}} ✅",
    variables: [
      "userName",
      "companyName",
      "currentYear",
      "companyLogo",
      "supportEmail",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "message",
        label: "Confirmation Message",
        type: "text",
        placeholder: "Customize the confirmation message...",
        defaultValue:
          "This is a confirmation that your password was successfully changed.",
        maxLength: 500,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <p style="font-size: 20px; color: #212529; margin: 0 0 25px; font-weight: 600;">
          Hello ${vars.userName},
        </p>
        <p style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0 0 25px;">
          ${
            blocks.message ||
            "This is a confirmation that your password was successfully changed."
          }
        </p>

        ${createContentBlock(
          "<strong>✅ Password Updated</strong><br/>Your password was changed on " +
            new Date().toLocaleString() +
            ".",
          "success"
        )}

        ${createContentBlock(
          "<strong>⚠️ Didn't make this change?</strong><br/>If you didn't change your password, please contact our support team immediately at " +
            (vars.supportEmail || "support@example.com") +
            ".",
          "warning"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          This is an automated security notification. Please do not reply to this email.
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        headerIcon: "✅",
        headerTitle: "Password Changed",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Password Changed - ${vars.companyName}

Hello ${vars.userName},

${
  blocks.message ||
  "This is a confirmation that your password was successfully changed."
}

✅ PASSWORD UPDATED
Your password was changed on ${new Date().toLocaleString()}.

⚠️ DIDN'T MAKE THIS CHANGE?
If you didn't change your password, please contact our support team immediately at ${
      vars.supportEmail || "support@example.com"
    }.

This is an automated security notification. Please do not reply to this email.

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // WELCOME_CUSTOMER Template
  {
    type: "WELCOME_CUSTOMER" as EmailTemplateType,
    category: "TRANSACTIONAL" as EmailTemplateCategory,
    name: "Welcome New Customer",
    description: "Sent when a new customer signs up",
    subject: "Welcome to {{companyName}}! 🎊",
    variables: [
      "userName",
      "email",
      "companyName",
      "loginUrl",
      "currentYear",
      "companyLogo",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "greeting",
        label: "Welcome Message",
        type: "text",
        placeholder: "Write a welcoming message for your new customer...",
        defaultValue:
          "Thank you for joining us! We're thrilled to have you as part of our community.",
        maxLength: 500,
        required: true,
      },
      {
        id: "nextSteps",
        label: "Next Steps",
        type: "text",
        placeholder: "What should they do next?",
        defaultValue:
          "Your account is ready. Log in to explore all the features and get started.",
        maxLength: 500,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🚀 Get Started",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <p style="font-size: 20px; color: #212529; margin: 0 0 25px; font-weight: 600;">
          Hello ${vars.userName},
        </p>
        <p style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0 0 25px;">
          ${
            blocks.greeting ||
            "Thank you for joining us! We're thrilled to have you as part of our community."
          }
        </p>
        <p style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0 0 25px;">
          ${
            blocks.nextSteps ||
            "Your account is ready. Log in to explore all the features and get started."
          }
        </p>

        ${createCTAButton(
          blocks.ctaText || "🚀 Get Started",
          vars.loginUrl,
          "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Questions? We're here to help! Contact our support team anytime.
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        headerIcon: "🎊",
        headerTitle: `Welcome to ${vars.companyName}`,
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Welcome to ${vars.companyName}!

Hello ${vars.userName},

${
  blocks.greeting ||
  "Thank you for joining us! We're thrilled to have you as part of our community."
}

${
  blocks.nextSteps ||
  "Your account is ready. Log in to explore all the features and get started."
}

Get started here: ${vars.loginUrl}

Questions? We're here to help! Contact our support team anytime.

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },
];
