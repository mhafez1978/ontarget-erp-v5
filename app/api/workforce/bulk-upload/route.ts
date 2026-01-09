import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  EmploymentStatus,
  EmploymentType,
  CompanyMemberRole,
} from "@prisma/client";
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

const WorkforceRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  jobtitle: z.string().optional(),
  employmenttype: z.string().min(1),
  password: z.string().optional(),
  payrate: z.string().optional(),
  hiredate: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
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

    if (
      !headers.includes("name") ||
      !headers.includes("email") ||
      !headers.includes("role") ||
      !headers.includes("employmenttype")
    ) {
      return NextResponse.json(
        {
          error:
            "CSV must include 'name', 'email', 'role', 'employmenttype' columns (headers are normalized to lowercase). 'jobtitle' is optional.",
        },
        { status: 400 }
      );
    }

    // DEBUG LOGS
    console.log("[bulk-upload] headers:", headers);
    console.log("[bulk-upload] rows count:", rows.length);
    if (rows.length > 0)
      console.log("[bulk-upload] first row sample:", rows[0]);

    // Check company access
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { owner: true, members: { where: { userId: user.id } } },
    });

    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // PRECHECK: If any rows reference an email that already exists in the system, abort the import.
    // The policy is strict: imports must not include emails that already exist in the DB.
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
          `[bulk-upload] aborting import; existing emails: ${emails}`
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
      "[bulk-upload] companyId:",
      companyId,
      "company.ownerId:",
      company.ownerId,
      "user.id:",
      user.id,
      "members.length:",
      company.members.length
    );
    console.log(
      "[bulk-upload] isOwner:",
      isOwner,
      "isAdminOrManager:",
      isAdminOrManager,
      "user.role:",
      user.role
    );

    // User must be owner OR admin/manager member of the company
    if (!isOwner && !isAdminOrManager) {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
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
        const parsed = WorkforceRowSchema.safeParse(r);
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
              role: "STAFF",
              plan: "COMPANY_STAFF",
              emailVerified: new Date(),
              city: row.city || undefined,
              country: row.country || undefined,
            },
          });

          // Normalize and validate status and employmentType against Prisma enums
          const statusStr = (row.status || "ACTIVE").toUpperCase();
          const statusVal = (
            Object.values(EmploymentStatus) as string[]
          ).includes(statusStr)
            ? (statusStr as EmploymentStatus)
            : ("ACTIVE" as EmploymentStatus);

          const employmentStr = (row.employmenttype || "").toUpperCase();
          if (
            !(Object.values(EmploymentType) as string[]).includes(employmentStr)
          ) {
            results.push({
              row: i + 2,
              name: row.name,
              email: row.email,
              status: "skipped",
              message: `Invalid employmenttype: ${row.employmenttype}`,
            });
            continue;
          }
          const employmentTypeVal = employmentStr as EmploymentType;

          // Normalize jobTitle (trim and format)
          let jobTitleVal: string | undefined = undefined;
          if (row.jobtitle && row.jobtitle.trim() !== "") {
            // use helper to normalize common synonyms (Manager -> MANAGER, etc.)
            const { normalizeJobTitle } = await import(
              "@/lib/job-title-mapping"
            );
            const jt = normalizeJobTitle(row.jobtitle);
            if (!jt) {
              // cleanup created user to avoid orphan user record in this transaction
              try {
                await tx.user.delete({ where: { id: newUser.id } });
              } catch (e) {
                // ignore delete errors; we'll still report the invalid job title
                console.error(
                  "Failed to delete user after invalid jobtitle:",
                  e
                );
              }
              results.push({
                row: i + 2,
                name: row.name,
                email: row.email,
                status: "skipped",
                message: `Invalid jobtitle: ${row.jobtitle}`,
              });
              continue;
            }
            // log mapping when used
            if (
              (row.jobtitle || "").trim().toLowerCase() !== jt.toLowerCase()
            ) {
              console.log(
                `[bulk-upload] jobTitle mapped: ${row.jobtitle} -> ${jt}`
              );
            }
            jobTitleVal = jt;
          }

          // Validate role against CompanyMemberRole enum
          let roleVal: CompanyMemberRole | undefined = undefined;
          const roleStr = (row.role || "").toUpperCase();
          if (
            !(Object.values(CompanyMemberRole) as string[]).includes(roleStr)
          ) {
            // cleanup created user
            try {
              await tx.user.delete({ where: { id: newUser.id } });
            } catch (e) {
              console.error("Failed to delete user after invalid role:", e);
            }
            results.push({
              row: i + 2,
              name: row.name,
              email: row.email,
              status: "skipped",
              message: `Invalid role: ${
                row.role
              }. Valid values: ${Object.values(CompanyMemberRole).join(", ")}`,
            });
            continue;
          }
          roleVal = roleStr as CompanyMemberRole;

          // Ensure roleVal and jobTitleVal are defined before staff creation
          if (!roleVal) {
            results.push({
              row: i + 2,
              name: row.name,
              email: row.email,
              status: "skipped",
              message: "Role validation failed",
            });
            continue;
          }

          const staff = await tx.companyStaff.create({
            data: {
              companyId,
              userId: newUser.id,
              role: roleVal,
              jobTitle: jobTitleVal ?? undefined,
              employmentType: employmentTypeVal,
              payRate: row.payrate ? parseFloat(row.payrate) : undefined,
              status: statusVal,
              hireDate: row.hiredate ? new Date(row.hiredate) : new Date(),
              city: row.city || undefined,
              country: row.country || undefined,
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          });

          // Create CompanyMember record to link user to company
          await tx.companyMember.create({
            data: {
              userId: newUser.id,
              companyId,
              role: roleVal,
            },
          });

          // onboarding token
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48);
          const onboardingToken = await tx.onboardingToken.create({
            data: { staffId: staff.id, expiresAt },
          });

          // Prepare email to be sent after transaction commits
          const onboardingUrl = `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/onboarding/${onboardingToken.token}`;
          const emailHtml = `<p>Hello ${row.name}, please complete onboarding: <a href="${onboardingUrl}">Start Onboarding</a></p>`;

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
            id: staff.id,
            emailSent: null,
            emailError: null,
          });
          created += 1;
        } catch (err) {
          console.error("Failed to create staff row", err);
          results.push({
            row: i + 2,
            name: r.name || "",
            email: r.email || "",
            status: "skipped",
            message: "Internal error creating staff",
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
        console.error("Failed to send bulk onboarding email:", emailErr);
        results[pending.resultIndex].emailSent = false;
        results[pending.resultIndex].emailError =
          emailErr instanceof Error ? emailErr.message : String(emailErr);
      }
    }

    await createAuditLog({
      action: AUDIT_ACTIONS.BULK_STAFF_IMPORT || "BULK_STAFF_IMPORT",
      userId: user.id,
      companyId,
      entityType: ENTITY_TYPES.COMPANY,
      entityId: companyId,
      description: `Bulk import performed: created ${created} staff from file ${file.name}`,
      metadata: {
        file: file.name,
        created,
        totalRows: rows.length,
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
