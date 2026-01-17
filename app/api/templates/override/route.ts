import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    // Only SUPER_ADMIN or company owner can create overrides
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { templateId, companyId } = body;

    if (!templateId || !companyId) {
      return NextResponse.json(
        { error: "Template ID and Company ID are required" },
        { status: 400 }
      );
    }

    // Verify user is the company owner and fetch its name
    let company = await db.company.findFirst({
      where: { id: companyId, ownerId: user.id },
      select: { id: true, name: true },
    });

    if (!company) {
      if (user.role === "SUPER_ADMIN") {
        company = await db.company.findUnique({
          where: { id: companyId },
          select: { id: true, name: true },
        });
        if (!company) {
          return NextResponse.json(
            { error: "Company not found" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "You don't have permission for this company" },
          { status: 403 }
        );
      }
    }

    // Company is fetched with name for further processing.

    // Get the source template (should be a global template)
    const sourceTemplate = await db.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!sourceTemplate) {
      return NextResponse.json(
        { error: "Source template not found" },
        { status: 404 }
      );
    }

    if (sourceTemplate.scope !== "GLOBAL") {
      return NextResponse.json(
        { error: "Can only override global templates" },
        { status: 400 }
      );
    }

    // Check if override already exists
    const existingOverride = await db.emailTemplate.findFirst({
      where: {
        type: sourceTemplate.type,
        companyId: companyId,
      },
    });

    if (existingOverride) {
      return NextResponse.json(
        {
          error:
            "Override for this template type already exists for this company",
        },
        { status: 400 }
      );
    }

    // Create the override template
    const overrideTemplate = await db.emailTemplate.create({
      data: {
        type: sourceTemplate.type,
        name: `${sourceTemplate.name} (${company.name})`,
        description: sourceTemplate.description,
        subject: sourceTemplate.subject,
        bodyHtml: sourceTemplate.bodyHtml,
        bodyText: sourceTemplate.bodyText,
        variables: sourceTemplate.variables as string[],
        scope: companyId,
        companyId: companyId,
        isActive: true,
        isDefault: false,
        createdById: user.id,
      },
    });

    return NextResponse.json(overrideTemplate);
  } catch (error) {
    console.error("[Override Template] Error:", error);
    return NextResponse.json(
      { error: "Failed to create override template" },
      { status: 500 }
    );
  }
}
