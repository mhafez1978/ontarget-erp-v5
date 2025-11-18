import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString()
    );
    const userId = sessionData.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only ADMIN can create overrides
    if (user.role !== "ADMIN") {
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

    // Verify user owns or is admin of the company
    const companyMember = await db.companyMember.findFirst({
      where: {
        userId: user.id,
        companyId: companyId,
        role: "ADMIN",
      },
    });

    if (!companyMember) {
      return NextResponse.json(
        { error: "You don't have permission for this company" },
        { status: 403 }
      );
    }

    // Get company name
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

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
