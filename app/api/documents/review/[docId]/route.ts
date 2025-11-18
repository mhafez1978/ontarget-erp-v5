import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Verify user is ADMIN or SUPER_ADMIN
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only Admins can review documents" },
        { status: 403 }
      );
    }

    // Fetch document with staff and company info
    const document = await db.employmentDocument.findUnique({
      where: { id: docId },
      include: {
        staff: {
          include: {
            company: true,
            user: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this company
    let hasAccess = false;
    if (user.role === "SUPER_ADMIN") {
      const company = await db.company.findFirst({
        where: {
          id: document.staff.companyId,
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
    } else if (user.role === "ADMIN") {
      const company = await db.company.findFirst({
        where: {
          id: document.staff.companyId,
          ownerId: user.id,
        },
      });
      hasAccess = !!company;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this document" },
        { status: 403 }
      );
    }

    // Update document status
    const updatedDocument = await db.employmentDocument.update({
      where: { id: docId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: userId,
        rejectionReason: action === "reject" ? reason : null,
      },
    });

    // Send email notification to employee
    if (action === "reject") {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .document-info { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f44336; }
            .reason { background-color: #ffebee; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .cta-button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Requires Attention</h1>
            </div>
            <div class="content">
              <p>Hello ${document.staff.user.name},</p>
              
              <p>Your uploaded document has been reviewed by ${
                document.staff.company.name
              } administration and requires resubmission.</p>
              
              <div class="document-info">
                <strong>Document:</strong> ${document.docType.replace(
                  /_/g,
                  " "
                )}<br>
                <strong>File:</strong> ${document.fileName}<br>
                <strong>Uploaded:</strong> ${new Date(
                  document.uploadedAt
                ).toLocaleDateString()}
              </div>
              
              <div class="reason">
                <strong>Reason for rejection:</strong><br>
                ${reason}
              </div>
              
              <p>Please upload a corrected version of this document through your onboarding portal.</p>
              
              <p>If you have any questions, please contact your HR administrator.</p>
              
              <p>Best regards,<br>
              ${document.staff.company.name} Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(
        {
          to: document.staff.user.email || "",
          subject: `Document Resubmission Required - ${document.staff.company.name}`,
          html: emailHtml,
        },
        document.staff.companyId
      );
    } else {
      // Approved - check if all required docs are approved
      const allDocs = await db.employmentDocument.findMany({
        where: { staffId: document.staffId },
      });

      const requiredDocs = [
        "SSN_CARD",
        "DRIVERS_LICENSE",
        "W4_TAX_FORM",
        "I9_FORM",
        "DIRECT_DEPOSIT_FORM",
        "EMPLOYEE_HANDBOOK_SIGNED",
      ];

      const allRequiredApproved = requiredDocs.every((docType) =>
        allDocs.some(
          (doc) => doc.docType === docType && doc.status === "APPROVED"
        )
      );

      if (allRequiredApproved) {
        // Enable payroll for this staff member
        await db.companyStaff.update({
          where: { id: document.staffId },
          data: {
            canReceivePayroll: true,
          },
        });

        // Send congratulations email
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .success-box { background-color: #e8f5e9; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 All Documents Approved!</h1>
              </div>
              <div class="content">
                <p>Congratulations ${document.staff.user.name}!</p>
                
                <div class="success-box">
                  <strong>Your onboarding is complete!</strong><br>
                  All your employment documents have been approved by ${document.staff.company.name}.
                </div>
                
                <p>You are now eligible to receive payroll and have full access to company systems.</p>
                
                <p>Welcome to the team!</p>
                
                <p>Best regards,<br>
                ${document.staff.company.name} Team</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail(
          {
            to: document.staff.user.email || "",
            subject: `Welcome to ${document.staff.company.name} - Onboarding Complete! 🎉`,
            html: emailHtml,
          },
          document.staff.companyId
        );
      }
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message: action === "approve" ? "Document approved" : "Document rejected",
    });
  } catch (error) {
    console.error("[Review Document Error]:", error);
    return NextResponse.json(
      { error: "Failed to review document" },
      { status: 500 }
    );
  }
}
