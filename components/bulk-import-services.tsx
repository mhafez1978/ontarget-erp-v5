"use client";

import {
  Loader2,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import * as XLSX from "xlsx";

export function BulkImportServices({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [companyId, setCompanyId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchCompanies();
  }, [open]);

  const fetchCompanies = async () => {
    try {
      let res = await fetch("/api/companies/my-owned");
      let data = await res.json();
      if (
        !res.ok ||
        (Array.isArray(data.companies) && data.companies.length === 0)
      ) {
        res = await fetch("/api/companies/all");
        data = await res.json();
      }

      if (res.ok) {
        setCompanies(data.companies || []);
        if ((data.companies || []).length > 0) {
          setCompanyId(data.companies[0].id);
        }
      } else {
        toast.error(data.error || "Failed to load companies");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load companies");
    }
  };

  const handleFile = async (f: File | null) => {
    setFile(f);
    setPreviewRows([]);
    setMissingHeaders([]);
    if (!f) return;

    setParsing(true);
    try {
      const fileName = f.name.toLowerCase();
      const isXlsx = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      let headers: string[] = [];
      let rows: Record<string, string>[] = [];

      if (isXlsx) {
        const buffer = await f.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: "",
        }) as string[][];

        const nonEmptyRows = jsonData.filter((row) =>
          row.some(
            (cell) =>
              cell !== null && cell !== undefined && String(cell).trim() !== ""
          )
        );

        if (nonEmptyRows.length < 2) {
          toast.error(
            "File must contain a header row and at least one data row"
          );
          setParsing(false);
          return;
        }

        headers = (nonEmptyRows[0] || []).map((h) =>
          String(h || "")
            .trim()
            .replace(/\*/g, "")
            .toLowerCase()
        );

        rows = nonEmptyRows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = String(row[i] ?? "").trim();
          });
          return obj;
        });
      } else {
        const text = await f.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          toast.error(
            "CSV must contain a header row and at least one data row"
          );
          setParsing(false);
          return;
        }

        headers = lines[0].split(/,(?=(?:[\"]*\"[\"]*\")*[\"]*$)/).map((h) =>
          h
            .replace(/^\"|\"$/g, "")
            .trim()
            .replace(/\*/g, "")
            .toLowerCase()
        );

        rows = lines.slice(1).map((l) => {
          const cols = l
            .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
            .map((c) => c.replace(/^\"|\"$/g, "").trim());
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = cols[i] ?? "";
          });
          return obj;
        });
      }

      setPreviewRows(rows.slice(0, 5));

      // detect missing required headers (name, price)
      const required = ["name", "price"];
      const missing = required.filter((r) => !headers.includes(r));
      setMissingHeaders(missing);
    } catch (err) {
      console.error("Failed to parse file", err);
      toast.error("Failed to parse file");
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !companyId) {
      toast.error("Please select a company and a CSV file");
      return;
    }

    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("companyId", companyId);

      const res = await fetch("/api/catalog/services/bulk-upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.created}/${data.total} rows`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Import failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Bulk Import Services</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-6 mt-4">
          <div className="p-3 rounded-md border bg-emerald-100/50">
            <h3 className="text-sm font-semibold mb-1">Import Instructions</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Upload a CSV or XLSX file with a header row. Required columns are
              marked with <strong>*</strong>.
            </p>
            <div className="text-xs text-muted-foreground mb-2">
              <div>
                <strong>Required:</strong>{" "}
                <span className="font-medium">name*</span>,{" "}
                <span className="font-medium">price*</span>
              </div>
              <div className="mt-1">
                <strong>Optional:</strong> duration, category, description,
                isPublished, isFeatured, addressLine1, city, state, country
              </div>
              <div className="mt-2 text-xs">
                <strong>Tip:</strong> Download the <em>XLSX (modern .xlsx)</em>{" "}
                template and edit it in Excel or OpenOffice. You can upload it
                directly as .xlsx or save as CSV — both formats are supported.
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="mr-2">Download a sample template:</span>
              <a
                href="/samples/services-sample.csv"
                download
                className="underline mr-2 hover:text-primary"
              >
                CSV
              </a>
              <a
                href="/api/samples/services-xlsx"
                className="underline hover:text-primary"
              >
                XLSX (Excel)
              </a>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Company to upload to:
            </label>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem value={c.id} key={c.id}>
                    <span className="capitalize text-green-700">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                      setPreviewRows([]);
                      setMissingHeaders([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Upload className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports CSV, XLSX, and XLS files
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Need a template? Download a sample file:{" "}
              <a
                href="/samples/services-sample.csv"
                download
                className="underline hover:text-primary"
              >
                CSV
              </a>{" "}
              •{" "}
              <a
                href="/api/samples/services-xlsx"
                className="underline hover:text-primary"
              >
                XLSX (modern)
              </a>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Preview</label>
            {missingHeaders.length > 0 && (
              <div className="p-2 rounded bg-red-50 border border-red-200 text-sm text-red-800 mb-2">
                Missing required columns:{" "}
                <strong>{missingHeaders.join(", ")}</strong>. Import is disabled
                until these columns are provided.
              </div>
            )}
            {missingHeaders.length === 0 && previewRows.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-green-50 border border-green-200 text-sm text-green-800 mb-2">
                <span className="flex flex-row gap-2 items-center border-r">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">
                    File validated successfully ready to import
                  </span>
                </span>
                {previewRows.length} service
                {previewRows.length !== 1 ? "s can be added" : " can be added"}
              </div>
            )}
            {parsing ? (
              <div className="p-4 bg-muted/10 rounded">
                <Loader2 className="animate-spin" />
              </div>
            ) : previewRows.length === 0 ? (
              <div className="p-4 bg-muted/10 rounded">
                No preview available
              </div>
            ) : (
              <div className="p-2 rounded bg-muted/10 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pr-4">Name</th>
                      <th className="text-left pr-4">Price</th>
                      <th className="text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-1 pr-4">
                          {r.name || (
                            <span className="text-muted-foreground italic">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-1 pr-4">
                          {r.price || (
                            <span className="text-muted-foreground italic">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-1">
                          {r.duration || (
                            <span className="text-muted-foreground italic">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2">
                  Showing first 5 rows. Additional columns (description, images,
                  etc.) will be imported if provided.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                uploading ||
                parsing ||
                previewRows.length === 0 ||
                missingHeaders.length > 0
              }
            >
              {uploading ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
