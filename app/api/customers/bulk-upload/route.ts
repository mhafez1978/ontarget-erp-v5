import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { validateSessionForAPI } from "../../../../lib/validate-session";
import { PLAN_LIMITS, PlanType } from "../../../../lib/plan-limits";
import * as XLSX from "xlsx";
import { sendEmail } from "../../../../lib/email-service";
import { SubscriptionPlan } from "@prisma/client";

// --- Interfaces ---
interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

interface BulkImportResult {
  row: number;
  email: string;
  name?: string;
  status: "created" | "linked" | "skipped";
  message?: string;
  id?: string;
}

// Generic access code for all bulk-created customers
const GENERIC_ACCESS_CODE = "Welcome2024!";

/**
 * Minimal CSV parser - handles commas and quoted values
 */
function parseCsv(text: string): ParsedData {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0]
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((h) =>
      h.replace(/^"|"$/g, "").trim().replace(/\*/g, "").toLowerCase()
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

/**
 * Parse XLSX files
 */
function parseXlsx(buffer: ArrayBuffer): ParsedData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  // Using header: 1 returns a 2D array of unknown values
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
  }) as (string | number | null | undefined)[][];

  if (jsonData.length === 0) return { headers: [], rows: [] };

  const headers = (jsonData[0] || []).map((h) =>
    String(h ?? "")
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validate Session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;
    const user = validation.user;

    // 2. Check Permissions
    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse Form Data
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const companyId = (form.get("companyId") as string) || null;
    const sendEmails = form.get("sendEmails") === "true";

    if (!file || !companyId) {
      return NextResponse.json(
        { error: "file and companyId are required" },
        { status: 400 }
      );
    }

    // 4. Detect file type and parse
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

    // 5. Validate File Structure
    if (!headers.includes("email")) {
      return NextResponse.json(
        { error: "File must include an 'email' column" },
        { status: 400 }
      );
    }

    // 6. Load company and check access
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        members: { where: { userId: user.id } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const isOwner = company.ownerId === user.id;
    const isMember = company.members.length > 0;

    if (!isOwner && !isMember && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // 6b. Determine role and plan based on company type and user role
    const isRootCompany = company.isRoot === true;
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    let customerRole: "ERP_CUSTOMER" | "COMPANY_CUSTOMER";
    let customerPlan: SubscriptionPlan;

    if (isRootCompany && isSuperAdmin) {
      // SUPER_ADMIN importing to ROOT company → ERP customers with paid plans
      customerRole = "ERP_CUSTOMER";
      customerPlan = "ESSENTIAL"; // Default, can be overridden from CSV if you add a plan column
    } else {
      // All other cases → COMPANY_CUSTOMER with COMPANY_CUSTOMER plan
      customerRole = "COMPANY_CUSTOMER";
      customerPlan = "COMPANY_CUSTOMER";
    }

    // 7. Enforce plan limits
    const subscription = await db.subscription.findFirst({
      where: {
        subscriberCompanyId: companyId,
        status: { in: ["TRIAL", "ACTIVE"] },
      },
      orderBy: { createdAt: "desc" },
    });

    // Cast plan to PlanType to match PLAN_LIMITS keys
    const plan = (subscription?.plan || "ESSENTIAL") as PlanType;
    const planLimits = PLAN_LIMITS[plan];

    const existingCount = await db.companyMember.count({
      where: {
        companyId,
        user: { role: "COMPANY_CUSTOMER" },
      },
    });

    const available =
      planLimits.customers === Infinity
        ? Infinity
        : Math.max(0, planLimits.customers - existingCount);

    const results: BulkImportResult[] = [];
    let createdCount = 0;

    // 8. Process Rows in a Transaction
    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const email = (r.email || "").trim().toLowerCase();
        const name = (
          r.name ||
          r.fullname ||
          r.first_name ||
          r.firstname ||
          "Customer"
        ).trim();

        if (!email || !isValidEmail(email)) {
          results.push({
            row: i + 2,
            email: email || "N/A",
            name,
            status: "skipped",
            message: "Invalid or missing email",
          });
          continue;
        }

        if (name.length < 2) {
          results.push({
            row: i + 2,
            email,
            name,
            status: "skipped",
            message: "Name too short",
          });
          continue;
        }

        if (available !== Infinity && createdCount >= available) {
          results.push({
            row: i + 2,
            email,
            name,
            status: "skipped",
            message: "Company customer limit reached",
          });
          continue;
        }

        const existingUser = await tx.user.findUnique({ where: { email } });

        if (existingUser) {
          // Check if existing user is workforce - cannot import workforce as customers
          const workforceRoles = [
            "STAFF",
            "MANAGER",
            "ADMIN",
            "CONTRACTOR",
            "SUPPLIER",
          ];
          if (workforceRoles.includes(existingUser.role)) {
            results.push({
              row: i + 2,
              email,
              name,
              status: "skipped",
              message: `Cannot import workforce members as customers (user has role: ${existingUser.role})`,
            });
            continue;
          }

          // Existing user is a customer type - check if already a member
          const memberExists = await tx.companyMember.findFirst({
            where: { userId: existingUser.id, companyId },
          });

          if (!memberExists) {
            await tx.companyMember.create({
              data: {
                userId: existingUser.id,
                companyId,
                role: customerRole,
              },
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

        const tempPassword = (r.password || "").trim() || GENERIC_ACCESS_CODE;
        const hashed = await bcrypt.hash(tempPassword, 10);

        const customer = await tx.user.create({
          data: {
            name,
            email,
            password: hashed,
            role: customerRole,
            plan: customerPlan,
            emailVerified: new Date(),
          },
        });

        await tx.companyMember.create({
          data: { userId: customer.id, companyId, role: customerRole },
        });

        results.push({
          row: i + 2,
          email,
          name,
          status: "created",
          id: customer.id,
        });

        createdCount += 1;

        if (sendEmails) {
          try {
            const resetUrl = `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/auth/setup-password?email=${encodeURIComponent(email)}`;

            await sendEmail({
              to: email,
              subject: `Welcome to ${company.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Welcome to ${company.name}!</h2>
                  <p>Hello ${name},</p>
                  <p>Your account has been created. Use the code below to set your password.</p>
                  <p><strong>Access Code:</strong> <code>${tempPassword}</code></p>
                  <p><a href="${resetUrl}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Set Your Password</a></p>
                  <p>Best regards,<br>${company.name} Team</p>
                </div>
              `,
              text: `Welcome to ${company.name}!\n\nAccess Code: ${tempPassword}\n\nSet password: ${resetUrl}`,
            });
          } catch (emailError) {
            console.error(`Email failed for ${email}:`, emailError);
          }
        }
      }
    });

    // 9. Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "BULK_CUSTOMER_IMPORT",
        entityType: "Company",
        entityId: companyId,
        description: `Imported ${createdCount} customers from ${file.name}`,
        metadata: JSON.stringify({ created: createdCount, total: rows.length }),
        companyId: companyId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      created: createdCount,
      total: rows.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("/api/customers/bulk-upload error:", message);
    return NextResponse.json(
      { error: "Failed to process bulk upload", details: message },
      { status: 500 }
    );
  }
}
