import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";
import { TRANSACTIONAL_TEMPLATES } from "@/lib/email-templates/transactional";
import { SEASONAL_TEMPLATES } from "@/lib/email-templates/seasonal";
import type { TemplateDefinition } from "@/lib/email-templates";

// Combine all professional templates
const ALL_TEMPLATES = [...TRANSACTIONAL_TEMPLATES, ...SEASONAL_TEMPLATES];

/**
 * Generate sample variables for template preview
 */
function generateSampleVariables(): Record<string, string> {
  const sampleVars: Record<string, string> = {
    companyName: "Your Company Name",
    currentYear: new Date().getFullYear().toString(),
    userName: "John Doe",
    staffName: "John Doe",
    email: "user@example.com",
    loginUrl: "https://app.example.com/login",
    resetUrl: "https://app.example.com/reset-password",
    verificationUrl: "https://app.example.com/verify-email",
    saleUrl: "https://app.example.com/sale",
    role: "Staff Member",
    temporaryPassword: "TempPass123!",
    supportEmail: "support@example.com",
    companyLogo: "",
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

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (validation.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can generate global templates" },
        { status: 403 }
      );
    }

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

      // Generate the HTML shell with default values
      const sampleVars = generateSampleVariables();
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
