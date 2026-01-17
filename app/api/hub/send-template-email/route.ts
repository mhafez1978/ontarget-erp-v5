import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const body = await request.json();
    const { companyId, employeeIds, templateId, variables } = body;

    if (
      !companyId ||
      !employeeIds ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0 ||
      !templateId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use validated user directly
    const user = validation.user;

    // Check access rights to company
    let hasAccess = false;

    if (user.role === "SUPER_ADMIN") {
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          OR: [
            { ownerId: user.id },
            {
              subscriberSubscriptions: {
                some: {
                  rootCompany: {
                    ownerId: user.id,
                  },
                  status: {
                    in: ["ACTIVE", "TRIAL"],
                  },
                },
              },
            },
          ],
        },
      });
      hasAccess = !!company;
    } else if (user.role === "ADMIN_OWNER") {
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          ownerId: user.id,
        },
      });
      hasAccess = !!company;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Fetch the template
    const template = await db.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: "Template not found or inactive" },
        { status: 404 }
      );
    }

    // Fetch employees (CompanyStaff records)
    const staffMembers = await db.companyStaff.findMany({
      where: {
        id: {
          in: employeeIds,
        },
        companyId: companyId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (staffMembers.length === 0) {
      return NextResponse.json(
        { error: "No valid employees found" },
        { status: 404 }
      );
    }

    // Extract employee data
    const employees = staffMembers.map((staff) => staff.user);

    // Send emails
    let successCount = 0;
    let failureCount = 0;

    for (const employee of employees) {
      if (!employee.email) {
        failureCount++;
        continue;
      }

      // Replace variables in subject and body
      let subject = template.subject;
      let bodyHtml = template.bodyHtml;

      // Replace template variables
      Object.entries(variables as Record<string, string>).forEach(
        ([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, "g");
          subject = subject.replace(regex, value);
          bodyHtml = bodyHtml.replace(regex, value);
        }
      );

      // Replace common variables
      subject = subject
        .replace(/{{userName}}/g, employee.name || "User")
        .replace(/{{email}}/g, employee.email || "")
        .replace(/{{currentYear}}/g, new Date().getFullYear().toString());

      bodyHtml = bodyHtml
        .replace(/{{userName}}/g, employee.name || "User")
        .replace(/{{email}}/g, employee.email || "")
        .replace(/{{currentYear}}/g, new Date().getFullYear().toString());

      // Send email
      const sent = await sendEmail(
        {
          to: employee.email,
          subject,
          html: bodyHtml,
        },
        companyId
      );

      if (sent) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      total: employees.length,
    });
  } catch (error) {
    console.error("Error sending template email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
