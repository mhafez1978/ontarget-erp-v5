import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { TRANSACTIONAL_TEMPLATES } from "@/lib/email-templates/transactional";
import { SEASONAL_TEMPLATES } from "@/lib/email-templates/seasonal";
import type { TemplateDefinition } from "@/lib/email-templates";

// Combine all professional templates
const ALL_TEMPLATES = [...TRANSACTIONAL_TEMPLATES, ...SEASONAL_TEMPLATES];

/**
 * Generate sample variables for template preview with actual company data
 */
async function generateSampleVariables(): Promise<Record<string, string>> {
  // Get root company for global templates
  const rootCompany = await db.company.findFirst({
    where: { isRoot: true },
    select: {
      id: true,
      name: true,
      logo: true,
      email: true,
    },
  });

  const companyName = rootCompany?.name || "OnTarget ERP";
  const companyLogo = rootCompany?.logo || "";
  const companyEmail = rootCompany?.email || "support@ontargetbrands.com";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://ontargetbrands.com";

  const sampleVars: Record<string, string> = {
    companyName,
    companyLogo,
    currentYear: new Date().getFullYear().toString(),
    userName: "John Doe",
    staffName: "John Doe",
    email: "user@example.com",
    loginUrl: `${baseUrl}/login`,
    resetUrl: `${baseUrl}/reset-password`,
    verificationUrl: `${baseUrl}/verify-email`,
    saleUrl: `${baseUrl}/sale`,
    role: "Staff Member",
    temporaryPassword: "TempPass123!",
    supportEmail: companyEmail,
    discountPercentage: "25",
    promoCode: "SAVE25",
    expiryDate: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(),
  };

  return sampleVars;
}

/**
 * Generate default content blocks from template definition
 */
function generateDefaultBlocks(
  template: TemplateDefinition
): Record<string, string> {
  const blocks: Record<string, string> = {};

  if (template.contentBlocks) {
    template.contentBlocks.forEach((block) => {
      blocks[block.id] = block.defaultValue || "";
    });
  }

  return blocks;
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can generate global templates" },
        { status: 403 }
      );
    }

    const userId = validation.user.id;

    const { templateTypes } = await request.json();

    if (!Array.isArray(templateTypes) || templateTypes.length === 0) {
      return NextResponse.json(
        { error: "Please provide template types to generate" },
        { status: 400 }
      );
    }

    const createdTemplates = [];

    // Find the professional templates from our library
    const templatesToCreate = ALL_TEMPLATES.filter((template) =>
      templateTypes.includes(template.type)
    );

    // Generate sample variables once with real company data
    const sampleVars = await generateSampleVariables();

    for (const template of templatesToCreate) {
      // Check if template already exists
      const existing = await db.emailTemplate.findFirst({
        where: {
          type: template.type,
          companyId: null, // Global templates have no companyId
        },
      });

      if (existing) {
        console.log(`Template ${template.type} already exists, skipping`);
        continue;
      }

      // Generate the HTML shell with default values and real company data
      const defaultBlocks = generateDefaultBlocks(template);
      const bodyHtml = template.shellHtml(defaultBlocks, sampleVars);
      const bodyText = template.textVersion(defaultBlocks, sampleVars);

      // Create the template with professional design
      const created = await db.emailTemplate.create({
        data: {
          type: template.type,
          category: template.category,
          name: template.name,
          description: template.description,
          subject: template.subject,
          bodyHtml,
          bodyText,
          variables: template.variables,
          // @ts-expect-error - Prisma Json type handling for contentBlocks
          contentBlocks: template.contentBlocks || [],
          isDefault: true,
          isActive: true,
          isSystem: template.isSystem,
          isCustomHtml: false,
          scope: "GLOBAL",
          companyId: null, // Global template
          createdById: userId,
        },
      });

      createdTemplates.push(created);
    }

    return NextResponse.json({
      success: true,
      count: createdTemplates.length,
      templates: createdTemplates,
      message: `Successfully created ${createdTemplates.length} professional global template(s)`,
    });
  } catch (error) {
    console.error("Error generating templates:", error);
    return NextResponse.json(
      { error: "Failed to generate templates" },
      { status: 500 }
    );
  }
}
