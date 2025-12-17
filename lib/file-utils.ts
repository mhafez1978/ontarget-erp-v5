/**
 * File utility functions for file type detection, validation, and icons
 */

import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  File,
  type LucideIcon,
} from "lucide-react";

// Blocked file extensions for security
export const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "scr",
  "vbs",
  "js",
  "jar",
  "app",
  "deb",
  "rpm",
  "sh",
  "bash",
  "ps1",
  "psm1",
];

// Allowed business file categories
export const ALLOWED_FILE_TYPES = {
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-word",
    "text/plain",
    "application/rtf",
  ],
  spreadsheets: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  presentations: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  archives: [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
  ],
  videos: ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
};

/**
 * Check if file extension is blocked
 */
export function isFileBlocked(fileName: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return BLOCKED_EXTENSIONS.includes(extension);
}

/**
 * Check if MIME type is allowed
 */
export function isFileTypeAllowed(mimeType: string): boolean {
  // Allow all categories defined above
  const allAllowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();
  return allAllowedTypes.includes(mimeType) || mimeType.startsWith("text/");
}

/**
 * Get appropriate icon for file based on MIME type
 */
export function getFileIcon(mimeType: string): LucideIcon {
  // Documents
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  ) {
    return FileText;
  }

  // Spreadsheets
  if (
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("csv")
  ) {
    return FileSpreadsheet;
  }

  // Images
  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  // Videos
  if (mimeType.startsWith("video/")) {
    return FileVideo;
  }

  // Audio
  if (mimeType.startsWith("audio/")) {
    return FileAudio;
  }

  // Archives
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("gzip") ||
    mimeType.includes("tar")
  ) {
    return FileArchive;
  }

  // Code files
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html")
  ) {
    return FileCode;
  }

  // Default
  return File;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if file is an image that can be previewed
 */
export function canPreviewImage(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") &&
    !mimeType.includes("svg") && // SVG might have security issues
    !mimeType.includes("tiff") // Not widely supported in browsers
  );
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

/**
 * Infer MIME type from file extension for common file types.
 * Prefer the `mime-types` package for broader coverage, with a
 * small local fallback mapping for edge cases.
 */
import { lookup as mimeLookup } from "mime-types";

export function getMimeTypeFromExtension(fileName: string): string {
  // Try mime-types lookup first (supports filenames or extensions)
  const fromLib = mimeLookup(fileName);
  if (typeof fromLib === "string") return fromLib;

  // Local fallback mapping for commonly used extensions
  const ext = getFileExtension(fileName);
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "doc":
    case "dot":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    case "ppt":
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "mp4":
      return "video/mp4";
    case "mov":
    case "qt":
      return "video/quicktime";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "zip":
      return "application/zip";
    case "7z":
      return "application/x-7z-compressed";
    case "tar":
    case "gz":
      return "application/gzip";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    case "txt":
      return "text/plain";
    case "rtf":
      return "application/rtf";

    // CAD and 3D model formats
    case "dwg":
      return "application/acad"; // common non-standard mime used for DWG
    case "dxf":
      return "application/dxf";
    case "stl":
      return "model/stl";
    case "stp":
    case "step":
      return "application/step";
    case "iges":
    case "igs":
      return "application/iges";
    case "obj":
      return "text/plain"; // OBJ is plain text geometry
    case "dwf":
      return "model/vnd.dwf";
    case "cad":
      return "application/cad";

    // Design and creative files
    case "psd":
      return "image/vnd.adobe.photoshop";
    case "ai":
      return "application/postscript";
    case "indd":
      return "application/x-indesign";
    case "svgz":
      return "image/svg+xml";

    // Microsoft/Apple business formats
    case "xlsb":
      return "application/vnd.ms-excel.sheet.binary.macroEnabled.12";
    case "xlsm":
      return "application/vnd.ms-excel.sheet.macroEnabled.12";
    case "pptm":
      return "application/vnd.ms-powerpoint.presentation.macroEnabled.12";
    case "vsd":
    case "vsdx":
      return "application/vnd.visio";
    case "qbw":
    case "qbb":
      return "application/x-quickbooks";
    case "numbers":
      return "application/vnd.apple.numbers";
    case "pub":
      return "application/x-mspublisher";

    // email archive
    case "eml":
      return "message/rfc822";

    default:
      return "application/octet-stream";
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  maxSizeBytes: number = 100 * 1024 * 1024
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatFileSize(
        maxSizeBytes
      )}`,
    };
  }

  // Check if file extension is blocked
  if (isFileBlocked(file.name)) {
    const ext = getFileExtension(file.name);
    return {
      valid: false,
      error: `File type .${ext} is not allowed for security reasons`,
    };
  }

  // Check if MIME type is allowed
  if (!isFileTypeAllowed(file.type) && file.type !== "") {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Only business documents, images, and archives are permitted.`,
    };
  }

  return { valid: true };
}

/**
 * Get allowed file types description for UI
 */
export function getAllowedFileTypesDescription(): string {
  return "PDF, Word, Excel, PowerPoint, images (JPG, PNG, GIF), archives (ZIP, RAR), and text files";
}

/**
 * Get blocked file types description for UI
 */
export function getBlockedFileTypesDescription(): string {
  return "Executables (.exe, .bat, .sh, .msi) and scripts are not allowed";
}
