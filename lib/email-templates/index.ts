/**
 * Professional Email Template System
 *
 * This module provides beautiful, responsive email templates with:
 * - Company logo support
 * - Editable content blocks
 * - Modern design with gradients
 * - Mobile-responsive layouts
 * - Locked structure (only content editable)
 */

import { EmailTemplateType, EmailTemplateCategory } from "@prisma/client";

// Export template libraries
export { TRANSACTIONAL_TEMPLATES } from "./transactional";
export { SEASONAL_TEMPLATES } from "./seasonal";

export interface ContentBlock {
  id: string;
  label: string;
  type: "text" | "heading" | "button" | "html";
  placeholder: string;
  defaultValue?: string;
  maxLength?: number;
  required?: boolean;
}

export interface TemplateDefinition {
  type: EmailTemplateType;
  category: EmailTemplateCategory;
  name: string;
  description: string;
  subject: string;
  variables: string[];
  contentBlocks: ContentBlock[];
  isSystem: boolean;
  shellHtml: (
    blocks: Record<string, string>,
    vars: Record<string, string>
  ) => string;
  textVersion: (
    blocks: Record<string, string>,
    vars: Record<string, string>
  ) => string;
}

/**
 * Base email template shell - provides consistent structure
 */
export function createEmailShell(options: {
  headerGradient: string;
  headerIcon?: string;
  headerTitle: string;
  bodyContent: string;
  companyLogo?: string;
  companyName: string;
  currentYear: string;
}): string {
  const {
    headerGradient,
    headerIcon,
    headerTitle,
    bodyContent,
    companyLogo,
    companyName,
    currentYear,
  } = options;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${headerTitle}</title>
    <!--[if mso]>
    <style type="text/css">
      body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f2f5; padding: 20px 0;">
      <tr>
        <td align="center">
          <!-- Main Container -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); max-width: 600px;">
            
            <!-- Header with Logo and Gradient -->
            <tr>
              <td style="background: ${headerGradient}; padding: 50px 30px; text-align: center; position: relative;">
                ${
                  companyLogo
                    ? `
                <div style="margin-bottom: 24px;">
                  <img src="${companyLogo}" alt="${companyName}" style="max-width: 220px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
                </div>
                `
                    : ""
                }
                <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.2); letter-spacing: -0.5px;">
                  ${headerIcon ? headerIcon + " " : ""}${headerTitle}
                </h1>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 50px 40px;">
                ${bodyContent}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px 40px; text-align: center; border-top: 1px solid #dee2e6;">
                <p style="font-size: 13px; color: #6c757d; margin: 0 0 8px; font-weight: 600;">
                  ${companyName}
                </p>
                <p style="font-size: 11px; color: #adb5bd; margin: 0;">
                  Powered by OnTarget ERP • © ${currentYear} All rights reserved
                </p>
              </td>
            </tr>

          </table>
          
          <!-- Footer Links (outside main container) -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; max-width: 600px;">
            <tr>
              <td style="text-align: center; padding: 20px;">
                <p style="font-size: 12px; color: #6c757d; margin: 0;">
                  This email was sent by ${companyName}
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
 * Create a styled content block
 */
export function createContentBlock(
  content: string,
  style: "default" | "info" | "warning" | "success" = "default"
): string {
  const styles = {
    default: {
      bg: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      border: "#dee2e6",
      text: "#495057",
    },
    info: {
      bg: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
      border: "#2196F3",
      text: "#1565C0",
    },
    warning: {
      bg: "linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)",
      border: "#FFA000",
      text: "#F57C00",
    },
    success: {
      bg: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
      border: "#4CAF50",
      text: "#2E7D32",
    },
  };

  const s = styles[style];

  return `
    <div style="background: ${s.bg}; border-left: 4px solid ${s.border}; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="font-size: 15px; color: ${s.text}; line-height: 1.7; margin: 0;">
        ${content}
      </p>
    </div>
  `;
}

/**
 * Create a call-to-action button
 */
export function createCTAButton(
  text: string,
  url: string,
  gradient: string = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 35px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 18px 50px; background: ${gradient}; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 17px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); letter-spacing: 0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a credentials box
 */
export function createCredentialsBox(
  items: { label: string; value: string; isPassword?: boolean }[]
): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="font-size: 14px; color: #6c757d; padding: 12px 0; vertical-align: top; width: 120px;">
        ${item.label}
      </td>
      <td style="font-size: 14px; color: #212529; font-weight: 600; padding: 12px 0; ${
        item.isPassword
          ? 'font-family: "Courier New", monospace; background-color: #fff; padding: 12px 16px; border-radius: 6px; border: 1px solid #dee2e6;'
          : ""
      }">
        ${item.value}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px; padding: 30px; margin: 30px 0; border: 2px solid #dee2e6;">
      <p style="font-size: 15px; color: #495057; margin: 0 0 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        🔐 YOUR CREDENTIALS
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
    </div>
  `;
}

/**
 * Create a feature highlight section
 */
export function createFeatureHighlight(features: string[]): string {
  const items = features
    .map(
      (feature) => `
    <tr>
      <td style="padding: 12px 0;">
        <span style="color: #28a745; font-size: 18px; margin-right: 10px;">✓</span>
        <span style="font-size: 15px; color: #495057; line-height: 1.6;">${feature}</span>
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
      ${items}
    </table>
  `;
}
