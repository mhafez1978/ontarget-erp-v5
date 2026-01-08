import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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
  jobtitle: z.string().min(1),
  employmenttype: z.string().min(1),
  password: z.string().optional(),
  payrate: z.string().optional(),
  hiredate: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;
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
      !headers.includes("jobtitle") ||
      !headers.includes("employmenttype")
    ) {
      return NextResponse.json(
        {
          error:
            "CSV must include 'name','email','role','jobTitle','employmentType' columns",
        },
        { status: 400 }
      );
    }

    // Check company access
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { owner: true, members: { where: { userId: user.id } } },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    const isOwner = company.ownerId === user.id;
    const members = (company as any).members;
    const isMember = !!(members && members.length > 0);
    if (!isOwner && !isMember && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    const results: Array<{
      row: number;
      name?: string;
      email?: string;
      status: string;
      message?: string;
      id?: string;
    }> = [];
    let created = 0;

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
              plan: "GUEST",
              emailVerified: new Date(),
              city: row.city || undefined,
              country: row.country || undefined,
            },
          });

          const staff = await tx.companyStaff.create({
            data: {
              companyId,
              userId: newUser.id,
              role: row.role,
              jobTitle: row.jobtitle,
              employmentType: row.employmenttype,
              payRate: row.payrate ? parseFloat(row.payrate) : undefined,
              status: row.status || "ACTIVE",
              hireDate: row.hiredate ? new Date(row.hiredate) : new Date(),
              city: row.city || undefined,
              country: row.country || undefined,
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          });

          // onboarding token
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48);
          const onboardingToken = await tx.onboardingToken.create({
            data: { staffId: staff.id, expiresAt },
          });

          // send welcome email (best-effort)
          try {
            const onboardingUrl = `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/onboarding/${onboardingToken.token}`;
            await sendEmail(
              {
                to: row.email,
                subject: `Welcome to ${company.name}`,
                html: `<p>Hello ${row.name}, please complete onboarding: <a href="${onboardingUrl}">Start Onboarding</a></p>`,
              },
              companyId,
              user.id
            );
          } catch (e) {
            console.error("Failed to send welcome email for bulk staff", e);
          }

          results.push({
            row: i + 2,
            name: row.name,
            email: row.email,
            status: "created",
            id: staff.id,
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

    await createAuditLog({
      action: AUDIT_ACTIONS.BULK_STAFF_IMPORT || "BULK_STAFF_IMPORT",
      userId: user.id,
      companyId,
      entityType: ENTITY_TYPES.COMPANY,
      entityId: companyId,
      description: `Bulk import performed: created ${created} staff from file ${file.name}`,
      metadata: JSON.stringify({
        file: file.name,
        created,
        totalRows: rows.length,
        results,
      }),
    });

    return NextResponse.json({
      success: true,
      created,
      total: rows.length,
      results,
    });
  } catch (error) {
    console.error("/api/workforce/bulk-upload error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
