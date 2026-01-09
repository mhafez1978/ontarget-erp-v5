import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SubscriptionPlan } from "@prisma/client";
import { validateSessionForAPI } from "@/lib/validate-session";
import * as XLSX from "xlsx";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email-service";

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((h) =>
    h
      .replace(/^\"|\"$/g, "")
      .trim()
      .replace(/\*/g, "")
      .toLowerCase()
  );

  const rows = lines.slice(1).map((line) => {
    const cols = line
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
      .map((c) => c.replace(/^\"|\"$/g, "").trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    return obj;
  });

  return { headers, rows };
}

function parseXlsx(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
  }) as string[][];

  if (jsonData.length === 0) return { headers: [], rows: [] };

  const headers = (jsonData[0] || []).map((h) =>
    String(h || "")
      .trim()
      .replace(/\*/g, "")
      .toLowerCase()
  );

  const rows = jsonData.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = String(row[i] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows };
}

const CustomerRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  phone: z.string().optional(),
  addressline1: z.string().optional(),
  addressline2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  countrycode: z.string().optional(),
  postalcode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  image: z.string().optional(),
});

// Result row structure for response
type BulkImportResult = {
  row: number;
  name?: string;
  email?: string;
  status: "created" | "skipped";
  message?: string;
  id?: string;
  emailSent?: boolean | null;
  emailError?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }
    const user = validation.user;

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const companyId = (form.get("companyId") as string) || null;

    if (!file || !companyId) {
      return NextResponse.json(
        { error: "file and companyId are required" },
        { status: 400 }
      );
    }

    let headers: string[] = [];
    let rows: Record<string, string>[] = [];
    const fileName = file.name.toLowerCase();
    const isXlsx = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (isXlsx) {
      const buffer = await file.arrayBuffer();
      const parsed = parseXlsx(buffer);
      headers = parsed.headers;
      rows = parsed.rows;
    } else {
      const text = await file.text();
      const parsed = parseCsv(text);
      headers = parsed.headers;
      rows = parsed.rows;
    }

    if (!headers.includes("name") || !headers.includes("email")) {
      return NextResponse.json(
        {
          error:
            "CSV must include 'name' and 'email' columns (headers are normalized to lowercase).",
        },
        { status: 400 }
      );
    }

    // DEBUG LOGS
    console.log("[bulk-upload-customers] headers:", headers);
    console.log("[bulk-upload-customers] rows count:", rows.length);
    if (rows.length > 0)
      console.log("[bulk-upload-customers] first row sample:", rows[0]);

    // Check company access
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { owner: true, members: { where: { userId: user.id } } },
    });

    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // PRECHECK: If any rows reference an email that already exists in the system, abort the import.
    const rowEmails = Array.from(
      new Set(rows.map((r) => (r.email || "").trim()).filter(Boolean))
    );
    if (rowEmails.length > 0) {
      const existingUsers = await db.user.findMany({
        where: { email: { in: rowEmails } },
        select: { email: true },
      });
      if (existingUsers.length > 0) {
        const emails = existingUsers.map((u) => u.email).join(", ");
        console.log(
          `[bulk-upload-customers] aborting import; existing emails: ${emails}`
        );
        return NextResponse.json(
          {
            error: "Import aborted - some emails already exist in the system",
            existingEmails: existingUsers.map((u) => u.email),
          },
          { status: 400 }
        );
      }
    }

    const isOwner = company.ownerId === user.id;
    const isAdminOrManager = company.members.some(
      (m) => m.role === "ADMIN" || m.role === "MANAGER"
    );

    // DEBUG: log company access info
    console.log(
      "[bulk-upload-customers] companyId:",
      companyId,
      "company.ownerId:",
      company.ownerId,
      "user.id:",
      user.id,
      "members.length:",
      company.members.length
    );
    console.log(
      "[bulk-upload-customers] isOwner:",
      isOwner,
      "isAdminOrManager:",
      isAdminOrManager,
      "user.role:",
      user.role,
      "company.isRoot:",
      company.isRoot
    );

    // User must be owner OR admin/manager member of the company
    if (!isOwner && !isAdminOrManager) {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Determine customer role and plan based on user role and company type
    const isSuperAdminOnRoot =
      user.role === "SUPER_ADMIN" && company.isRoot === true;

    let customerRole: "ERP_CUSTOMER" | "COMPANY_CUSTOMER";
    let customerPlan: SubscriptionPlan;

    if (isSuperAdminOnRoot) {
      customerRole = "ERP_CUSTOMER";
      customerPlan = SubscriptionPlan.ERP_CUSTOMER;
      console.log(
        "[bulk-upload-customers] SUPER_ADMIN importing to ROOT company → ERP_CUSTOMER role/plan"
      );
    } else {
      customerRole = "COMPANY_CUSTOMER";
      customerPlan = SubscriptionPlan.COMPANY_CUSTOMER;
      console.log(
        "[bulk-upload-customers] importing to company → COMPANY_CUSTOMER role/plan"
      );
    }

    const results: BulkImportResult[] = [];
    let created = 0;

    // Accumulate emails to send after the successful transaction commit
    const pendingEmails: Array<{
      to: string;
      subject: string;
      html: string;
      companyId: string;
      actorUserId: string;
      resultIndex: number;
    }> = [];

    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const parsed = CustomerRowSchema.safeParse(r);
        if (!parsed.success) {
          results.push({
            row: i + 2,
            name: r.name || "",
            email: r.email || "",
            status: "skipped",
            message: parsed.error.issues.map((s) => s.message).join(", "),
          });
          continue;
        }
        const row = parsed.data;

        // Skip if email already exists
        const existing = await tx.user.findUnique({
          where: { email: row.email },
        });
        if (existing) {
          results.push({
            row: i + 2,
            name: row.name,
            email: row.email,
            status: "skipped",
            message: "User with this email already exists",
          });
          continue;
        }

        try {
          const pw = row.password || "Welcome2024!";
          const hashed = await bcrypt.hash(pw, 10);

          const newUser = await tx.user.create({
            data: {
              name: row.name,
              email: row.email,
              password: hashed,
              role: customerRole,
              plan: customerPlan,
              emailVerified: new Date(),
              addressLine1: row.addressline1 || undefined,
              addressLine2: row.addressline2 || undefined,
              city: row.city || undefined,
              state: row.state || undefined,
              country: row.country || undefined,
              countryCode: row.countrycode || undefined,
              postalCode: row.postalcode || undefined,
              latitude: row.latitude ? parseFloat(row.latitude) : undefined,
              longitude: row.longitude ? parseFloat(row.longitude) : undefined,
              image: row.image || undefined,
            },
          });

          // Create CompanyMember record to link user to company
          await tx.companyMember.create({
            data: {
              userId: newUser.id,
              companyId,
              role: customerRole,
            },
          });

          // Prepare email to be sent after transaction commits
          const resetUrl = `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/auth/setup-password?email=${encodeURIComponent(row.email)}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to ${company.name}!</h2>
              <p>Hello ${row.name},</p>
              <p>Your account has been created. Use the code below to set your password.</p>
              <p><strong>Access Code:</strong> <code>${pw}</code></p>
              <p><a href="${resetUrl}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Set Your Password</a></p>
              <p>Best regards,<br>${company.name} Team</p>
            </div>
          `;

          // Record pending email to send after transaction
          pendingEmails.push({
            to: row.email,
            subject: `Welcome to ${company.name}`,
            html: emailHtml,
            companyId,
            actorUserId: user.id,
            resultIndex: results.length,
          });

          // Record result immediately (email fields will be filled later)
          results.push({
            row: i + 2,
            name: row.name,
            email: row.email,
            status: "created",
            id: newUser.id,
            emailSent: null,
            emailError: null,
          });
          created += 1;
        } catch (err) {
          console.error("Failed to create customer row", err);
          results.push({
            row: i + 2,
            name: r.name || "",
            email: r.email || "",
            status: "skipped",
            message: "Internal error creating customer",
          });
        }
      }
    });

    // Send pending emails (best-effort) and update result rows with email status
    for (const pending of pendingEmails) {
      try {
        const ok = await sendEmail(
          { to: pending.to, subject: pending.subject, html: pending.html },
          pending.companyId,
          pending.actorUserId
        );
        results[pending.resultIndex].emailSent = ok;
        results[pending.resultIndex].emailError = ok ? null : "Failed to send";
      } catch (emailErr) {
        console.error("Failed to send bulk customer welcome email:", emailErr);
        results[pending.resultIndex].emailSent = false;
        results[pending.resultIndex].emailError =
          emailErr instanceof Error ? emailErr.message : String(emailErr);
      }
    }

    // Create audit log with special note for ERP_CUSTOMER imports
    const auditDescription = isSuperAdminOnRoot
      ? `Bulk import performed: created ${created} ERP_CUSTOMER from file ${file.name}`
      : `Bulk import performed: created ${created} COMPANY_CUSTOMER from file ${file.name}`;

    await createAuditLog({
      action: AUDIT_ACTIONS.BULK_CUSTOMER_IMPORT || "BULK_CUSTOMER_IMPORT",
      userId: user.id,
      companyId,
      entityType: ENTITY_TYPES.COMPANY,
      entityId: companyId,
      description: auditDescription,
      metadata: {
        file: file.name,
        created,
        totalRows: rows.length,
        customerRole,
        customerPlan,
        isRootCompanyImport: isSuperAdminOnRoot,
        results,
      },
    });

    return NextResponse.json({
      success: true,
      created,
      total: rows.length,
      results,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
