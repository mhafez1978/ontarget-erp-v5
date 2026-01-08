import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { validateSessionForAPI } from "@/lib/validate-session";

type EmailTemplate = Prisma.EmailTemplateGetPayload<{
  select: {
    id: true;
    type: true;
    name: true;
    description: true;
    subject: true;
    bodyHtml: true;
    bodyText: true;
    variables: true;
    scope: true;
    companyId: true;
    isActive: true;
    isDefault: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

/**
 * Normalize template to ensure variables is always an array
 */
function normalizeTemplate(template: EmailTemplate) {
  return {
    ...template,
    variables: Array.isArray(template.variables)
      ? template.variables
      : typeof template.variables === "string"
      ? JSON.parse(template.variables as string)
      : [],
  };
}

/**
 * GET /api/templates
 * Fetch email templates (global or company-specific)
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const userId = validation.user.id;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const role = user.role;

    // SUPER_ADMIN can see templates for their own companies
    if (role === "SUPER_ADMIN") {
      if (companyId && companyId !== "GLOBAL") {
        // Fetch templates for specific company (company-specific + system defaults)
        const [companyTemplates, systemTemplates] = await Promise.all([
          db.emailTemplate.findMany({
            where: {
              companyId: companyId,
              isActive: true,
            },
            orderBy: { type: "asc" },
          }),
          db.emailTemplate.findMany({
            where: {
              scope: "GLOBAL",
              companyId: null,
              isDefault: true, // Only system default templates
            },
            orderBy: { type: "asc" },
          }),
        ]);

        // Merge: show company templates first, fall back to system defaults
        const templateMap = new Map<string, EmailTemplate>();
        systemTemplates.forEach((t) => templateMap.set(t.type, t));
        companyTemplates.forEach((t) => templateMap.set(t.type, t));

        return NextResponse.json({
          templates: Array.from(templateMap.values()).map(normalizeTemplate),
        });
      } else {
        // Fetch system default templates only
        console.log(
          "[Templates API] Fetching system default templates for SUPER_ADMIN"
        );
        const templates = await db.emailTemplate.findMany({
          where: {
            scope: "GLOBAL",
            companyId: null,
            isDefault: true, // Only system default templates
          },
          orderBy: { type: "asc" },
        });
        console.log(
          `[Templates API] Found ${templates.length} system default templates`
        );

        return NextResponse.json({
          templates: templates.map(normalizeTemplate),
        });
      }
    }

    // ADMIN can see templates for their owned companies
    if (role === "ADMIN") {
      // Verify company ownership
      if (companyId && companyId !== "GLOBAL") {
        const company = await db.company.findFirst({
          where: {
            id: companyId,
            ownerId: userId,
          },
        });

        if (!company) {
          return NextResponse.json(
            { error: "Company not found or access denied" },
            { status: 403 }
          );
        }

        // Fetch templates for this company (company-specific + system defaults only)
        const [companyTemplates, systemTemplates] = await Promise.all([
          db.emailTemplate.findMany({
            where: {
              companyId: companyId,
              isActive: true,
            },
            orderBy: { type: "asc" },
          }),
          db.emailTemplate.findMany({
            where: {
              scope: "GLOBAL",
              companyId: null,
              isDefault: true, // Only system default templates (password reset, welcome, etc.)
            },
            orderBy: { type: "asc" },
          }),
        ]);

        // Merge: show company templates first, fall back to system defaults
        const templateMap = new Map<string, EmailTemplate>();
        systemTemplates.forEach((t) => templateMap.set(t.type, t));
        companyTemplates.forEach((t) => templateMap.set(t.type, t));

        return NextResponse.json({
          templates: Array.from(templateMap.values()).map(normalizeTemplate),
        });
      } else {
        // Fetch only system default templates (read-only for ADMIN)
        const templates = await db.emailTemplate.findMany({
          where: {
            scope: "GLOBAL",
            companyId: null,
            isDefault: true, // Only system default templates
          },
          orderBy: { type: "asc" },
        });

        return NextResponse.json({
          templates: templates.map(normalizeTemplate),
        });
      }
    }

    // MANAGER and below - read-only access to company templates
    if (["MANAGER", "STAFF"].includes(role)) {
      // Get user's company memberships
      const memberships = await db.companyMember.findMany({
        where: { userId: userId },
        select: { companyId: true },
      });

      const companyIds = memberships.map((m) => m.companyId);

      if (companyIds.length === 0) {
        return NextResponse.json({ templates: [] });
      }

      // Fetch templates for first company (or specific company if provided)
      const targetCompanyId = companyId || companyIds[0];

      const [companyTemplates, systemTemplates] = await Promise.all([
        db.emailTemplate.findMany({
          where: {
            companyId: targetCompanyId,
            isActive: true,
          },
          orderBy: { type: "asc" },
        }),
        db.emailTemplate.findMany({
          where: {
            scope: "GLOBAL",
            companyId: null,
            isDefault: true, // Only system default templates
          },
          orderBy: { type: "asc" },
        }),
      ]);

      // Merge templates
      const templateMap = new Map<string, EmailTemplate>();
      systemTemplates.forEach((t) => templateMap.set(t.type, t));
      companyTemplates.forEach((t) => templateMap.set(t.type, t));

      return NextResponse.json({
        templates: Array.from(templateMap.values()).map(normalizeTemplate),
      });
    }

    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Create a new email template (SUPER_ADMIN for global, ADMIN for company-specific)
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const userId = validation.user.id;

    const role = user.role;
    const body = await request.json();

    const {
      type,
      name,
      description,
      subject,
      bodyHtml,
      bodyText,
      variables,
      companyId,
    } = body;

    // Validation
    if (!type || !name || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // SUPER_ADMIN can create global templates
    if (role === "SUPER_ADMIN") {
      const template = await db.emailTemplate.create({
        data: {
          type,
          name,
          description,
          subject,
          bodyHtml,
          bodyText,
          variables: variables || [],
          scope: companyId ? companyId : "GLOBAL",
          companyId: companyId || null,
          isActive: true,
          isDefault: !companyId, // Global templates are defaults
          createdById: userId,
        },
      });

      return NextResponse.json({ template }, { status: 201 });
    }

    // ADMIN can create company-specific templates
    if (role === "ADMIN") {
      if (!companyId) {
        return NextResponse.json(
          { error: "Company ID required for admin users" },
          { status: 400 }
        );
      }

      // Verify ownership
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          ownerId: userId,
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found or access denied" },
          { status: 403 }
        );
      }

      const template = await db.emailTemplate.create({
        data: {
          type,
          name,
          description,
          subject,
          bodyHtml,
          bodyText,
          variables: variables || [],
          scope: companyId,
          companyId,
          isActive: true,
          isDefault: false,
          createdById: userId,
        },
      });

      return NextResponse.json({ template }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
