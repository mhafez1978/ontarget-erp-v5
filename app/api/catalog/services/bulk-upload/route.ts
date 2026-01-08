import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import * as XLSX from "xlsx";
import { z } from "zod";

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

const ServiceRowSchema = z.object({
  name: z.string().min(1),
  price: z.string().refine((s) => !Number.isNaN(parseFloat(s)), {
    message: "Invalid price",
  }),
  duration: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isPublished: z.string().optional(),
  isFeatured: z.string().optional(),
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

    if (!headers.includes("name") || !headers.includes("price")) {
      return NextResponse.json(
        { error: "CSV must include 'name' and 'price' columns" },
        { status: 400 }
      );
    }

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

    const results: Array<{
      row: number;
      name?: string;
      price?: string;
      status: string;
      message?: string;
      id?: string;
    }> = [];
    let created = 0;

    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const parsed = ServiceRowSchema.safeParse(r);
        if (!parsed.success) {
          results.push({
            row: i + 2,
            name: r.name || "",
            price: r.price || "",
            status: "skipped",
            message: parsed.error.issues.map((s) => s.message).join(", "),
          });
          continue;
        }

        const row = parsed.data;
        try {
          const service = await tx.service.create({
            data: {
              name: row.name,
              description: row.description || null,
              price: parseFloat(row.price),
              duration: row.duration || null,
              category: row.category || null,
              companyId,
              isPublished:
                row.isPublished !== undefined
                  ? row.isPublished === "true"
                  : true,
              isFeatured: row.isFeatured === "true" ? true : false,
            },
          });

          results.push({
            row: i + 2,
            name: row.name,
            price: row.price,
            status: "created",
            id: service.id,
          });
          created += 1;
        } catch (err) {
          console.error("Failed to create service row", err);
          results.push({
            row: i + 2,
            name: r.name || "",
            price: r.price || "",
            status: "skipped",
            message: "Internal error creating service",
          });
        }
      }
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "BULK_SERVICE_IMPORT",
        entityType: "Company",
        entityId: companyId,
        description: `Bulk import performed: created ${created} services from file ${file.name}`,
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
    console.error("/api/catalog/services/bulk-upload error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
