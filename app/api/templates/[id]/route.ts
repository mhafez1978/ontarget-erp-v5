import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const user = validation.user;

    const { id } = await context.params;
    const body = await request.json();

    // Get the existing template
    const existingTemplate = await db.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Authorization checks
    if (user.role === "SUPER_ADMIN") {
      // Super admin can edit any template
    } else if (user.role === "ADMIN") {
      // Admin can only edit templates for their own companies
      if (existingTemplate.scope !== "GLOBAL") {
        const companyMember = await db.companyMember.findFirst({
          where: {
            userId: user.id,
            companyId: existingTemplate.companyId!,
            role: "ADMIN",
          },
        });

        if (!companyMember) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        return NextResponse.json(
          { error: "Cannot edit global templates" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prevent editing default templates (only super admin can)
    if (existingTemplate.isDefault && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot edit default templates" },
        { status: 403 }
      );
    }

    // Update the template
    const updatedTemplate = await db.emailTemplate.update({
      where: { id },
      data: {
        type: body.type,
        name: body.name,
        description: body.description || null,
        subject: body.subject,
        bodyHtml: body.bodyHtml,
        bodyText: body.bodyText || null,
        variables: body.variables || [],
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("[Templates API] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const sessionCookie = request.cookies.get("session");

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

    const { id } = await context.params;

    // Get the existing template
    const existingTemplate = await db.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Cannot delete default templates
    if (existingTemplate.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default templates" },
        { status: 403 }
      );
    }

    // Authorization checks
    if (user.role === "SUPER_ADMIN") {
      // Super admin can delete any non-default template
    } else if (user.role === "ADMIN") {
      // Admin can only delete templates for their own companies
      if (existingTemplate.scope !== "GLOBAL") {
        const companyMember = await db.companyMember.findFirst({
          where: {
            userId: user.id,
            companyId: existingTemplate.companyId!,
            role: "ADMIN",
          },
        });

        if (!companyMember) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        return NextResponse.json(
          { error: "Cannot delete global templates" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the template
    await db.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Templates API] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
