import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { validateSessionForAPI } from "@/lib/validate-session";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import * as XLSX from "xlsx";
import { sendEmail } from "@/lib/email-service";

// Generic access code for all bulk-created customers
const GENERIC_ACCESS_CODE = "Welcome2024!";

// Minimal CSV parser - handles commas and quoted values
function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((h) =>
    h
      .replace(/^"|"$/g, "")
      .trim()
      .replace(/\*/g, "") // allow headers like 'email*' to indicate required
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

// Parse XLSX files
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response as NextResponse;
    const user = validation.user;

    // Only allow SUPER_ADMIN, ADMIN, MANAGER
    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const companyId = (form.get("companyId") as string) || null;
    const sendEmailsStr = form.get("sendEmails") as string;
    const sendEmails = sendEmailsStr === "true";

    if (!file || !companyId) {
      return NextResponse.json(
        { error: "file and companyId are required" },
        { status: 400 }
      );
    }

    // Detect file type and parse accordingly
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

    // Expect at least email and name in headers
    if (!headers.includes("email")) {
      return NextResponse.json(
        { error: "CSV must include 'email' column" },
        { status: 400 }
      );
    }

    // Load company and check access
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { owner: true, members: { where: { userId: user.id } } },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const isOwner = company.ownerId === user.id;
    const members = (company as unknown as { members?: Array<unknown> })
      .members;
    const isMember = !!(members && members.length > 0);
    if (!isOwner && !isMember && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Enforce plan limits
    const subscription = await db.subscription.findFirst({
      where: {
        subscriberCompanyId: companyId,
        status: { in: ["TRIAL", "ACTIVE"] },
      },
      orderBy: { createdAt: "desc" },
    });
    const plan = subscription?.plan || "ESSENTIAL";
    const planLimits = PLAN_LIMITS[plan];

    const existingCount = await db.companyMember.count({
      where: { companyId, user: { role: "COMPANY_CUSTOMER" } },
    });
    const available =
      planLimits.customers === Infinity
        ? Infinity
        : Math.max(0, planLimits.customers - existingCount);

    const results: Array<{
      row: number;
      email: string;
      name?: string;
      status: string;
      message?: string;
      id?: string;
    }> = [];
    let created = 0;

    // Use a transaction to create users safely
    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const email = (r.email || "").trim().toLowerCase();
        const name = (r.name || r.fullname || r.first_name || "").trim();

        if (!email || !isValidEmail(email)) {
          results.push({
            row: i + 2,
            email: email || "",
            name,
            status: "skipped",
            message: "Invalid or missing email",
          });
          continue;
        }

        if (!name || name.length < 2) {
          results.push({
            row: i + 2,
            email,
            name,
            status: "skipped",
            message: "Invalid or missing name",
          });
          continue;
        }

        if (available !== Infinity && created >= available) {
          results.push({
            row: i + 2,
            email,
            name,
            status: "skipped",
            message: "Company customer limit reached",
          });
          continue;
        }

        // Check existing user
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          // if user exists but not member, create companyMember linking
          const memberExists = await tx.companyMember.findFirst({
            where: { userId: existingUser.id, companyId },
          });
          if (!memberExists) {
            await tx.companyMember.create({
              data: { userId: existingUser.id, companyId, role: "STAFF" },
            });
            results.push({
              row: i + 2,
              email,
              name,
              status: "linked",
              id: existingUser.id,
            });
          } else {
            results.push({
              row: i + 2,
              email,
              name,
              status: "skipped",
              message: "Already a company member",
            });
          }
          continue;
        }

        // Create new user with password from file or generic fallback
        const tempPassword = (r.password || "").trim() || GENERIC_ACCESS_CODE;
        const hashed = await bcrypt.hash(tempPassword, 10);

        const customer = await tx.user.create({
          data: {
            name,
            email,
            password: hashed,
            role: "COMPANY_CUSTOMER",
            plan: "COMPANY_CUSTOMER",
            emailVerified: new Date(),
          },
        });
        await tx.companyMember.create({
          data: { userId: customer.id, companyId, role: "STAFF" },
        });

        results.push({
          row: i + 2,
          email,
          name,
          status: "created",
          id: customer.id,
        });
        created += 1;

        // Send welcome email if requested
        if (sendEmails) {
          try {
            const resetUrl = `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/auth/setup-password?email=${encodeURIComponent(email)}`;
            await sendEmail({
              to: email,
              subject: "Set Your Password",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Welcome to ${company.name}!</h2>
                  <p>Hello ${name},</p>
                  <p>Your customer account has been created. To access your dashboard and view your purchase history, invoices, and project updates, you'll need to set your password.</p>
                  <p><strong>Your Access Code:</strong> <code style="background: #f4f4f4; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
                  <p>Click the link below to set your password:</p>
                  <p><a href="${resetUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Set Your Password</a></p>
                  <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
                  <p>If you did not expect this email, please contact us immediately.</p>
                  <p>Best regards,<br>${company.name} Team</p>
                </div>
              `,
              text: `Welcome to ${company.name}!\n\nHello ${name},\n\nYour customer account has been created. Your Access Code is: ${tempPassword}\n\nSet your password here: ${resetUrl}\n\nBest regards,\n${company.name} Team`,
            });
          } catch (emailError) {
            console.error("Failed to send welcome email to", email, emailError);
          }
        }
      }
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "BULK_CUSTOMER_IMPORT",
        entityType: "Company",
        entityId: companyId,
        description: `Bulk import performed: created ${created} customers from file ${file.name}`,
        metadata: JSON.stringify({
          file: file.name,
          created,
          totalRows: rows.length,
          results,
        }),
        companyId: companyId,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      created,
      total: rows.length,
      results,
    });
  } catch (error) {
    console.error("/api/customers/bulk-upload error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
