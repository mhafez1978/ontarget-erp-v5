import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadDocument } from "@/lib/storage-service";
import { validateSessionForAPI } from "@/lib/validate-session";
import archiver from "archiver";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user: sessionUser } = validation;

    // Get user with company memberships
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        companyMemberships: true,
        ownedCompanies: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fileIds } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: "File IDs array is required" },
        { status: 400 }
      );
    }

    if (fileIds.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 files can be downloaded at once" },
        { status: 400 }
      );
    }

    // Get all file records
    const files = await db.fileRecord.findMany({
      where: {
        id: {
          in: fileIds,
        },
      },
      include: {
        folder: {
          include: {
            company: true,
          },
        },
      },
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 404 });
    }

    // Verify user has access to all files
    for (const file of files) {
      const companyId = file.folder.companyId;
      const isSuperAdmin = user.role === "SUPER_ADMIN";
      const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
      const membership = user.companyMemberships.find(
        (m) => m.companyId === companyId
      );

      if (!isSuperAdmin && !ownsCompany && !membership) {
        return NextResponse.json(
          { error: `You do not have access to file: ${file.fileName}` },
          { status: 403 }
        );
      }

      // Check folder-level permissions
      if (
        (file.folder.type === "EMPLOYEE" ||
          file.folder.type === "CONTRACTOR") &&
        file.folder.ownerId
      ) {
        if (
          !isSuperAdmin &&
          !ownsCompany &&
          file.folder.ownerId !== user.id &&
          membership?.role !== "ADMIN" &&
          membership?.role !== "MANAGER"
        ) {
          return NextResponse.json(
            {
              error: `You do not have permission to access: ${file.fileName}`,
            },
            { status: 403 }
          );
        }
      }
    }

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 6 }, // Compression level
    });

    // Create a readable stream for the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Pipe archive to writer
    archive.on("data", (chunk) => {
      writer.write(chunk);
    });

    archive.on("end", () => {
      writer.close();
    });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      writer.abort(err);
    });

    // Add files to archive
    const downloadPromises = files.map(async (file) => {
      try {
        const fileBuffer = await downloadDocument(
          file.primaryPath,
          file.storageProvider
        );

        // Add file to archive with proper name
        // Handle duplicate filenames by adding folder path
        const fileName =
          files.filter((f) => f.fileName === file.fileName).length > 1
            ? `${file.folder.name}/${file.fileName}`
            : file.fileName;

        archive.append(fileBuffer as Buffer, { name: fileName });
      } catch (error) {
        console.error(`Failed to download file ${file.fileName}:`, error);
        // Continue with other files
      }
    });

    // Wait for all files to be added
    await Promise.all(downloadPromises);

    // Finalize the archive
    archive.finalize();

    // Generate filename for ZIP
    const companyName = files[0].folder.company.name.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    );
    const timestamp = new Date().toISOString().split("T")[0];
    const zipFileName = `${companyName}-files-${timestamp}.zip`;

    // Return the ZIP file
    return new Response(readable as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
      },
    });
  } catch (error) {
    console.error("Multi-file download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
