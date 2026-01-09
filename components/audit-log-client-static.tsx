"use client";

import {
  Trash2,
  Pencil,
  PlusCircle,
  Settings,
  Download,
  Upload,
  Archive,
  Lock,
  ShieldCheck,
  UserPlus,
  Building2,
  Package,
  Wrench,
  ShoppingCart,
  CalendarCheck,
  Info,
  Zap,
  LogIn,
  LogOut,
  Key,
  FileText,
  Users,
  Mail,
  MailX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuditLog, User, Company } from "@prisma/client";

// JSON Tree Viewer Component
// const JsonTreeViewer = ({ data, level = 2 }: { data: any; level?: number }) => {
//   const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

//   const toggleCollapse = (key: string) => {
//     setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const renderValue = (
//     value: any,
//     key: string,
//     path: string
//   ): React.ReactNode => {
//     if (value === null) {
//       return <span className="text-purple-600 dark:text-purple-400">null</span>;
//     }

//     if (value === undefined) {
//       return (
//         <span className="text-purple-600 dark:text-purple-400">undefined</span>
//       );
//     }

//     if (typeof value === "boolean") {
//       return (
//         <span className="text-blue-600 dark:text-blue-400">
//           {String(value)}
//         </span>
//       );
//     }

//     if (typeof value === "number") {
//       return (
//         <span className="text-orange-600 dark:text-orange-400">{value}</span>
//       );
//     }

//     if (typeof value === "string") {
//       return (
//         <span className="text-green-700 dark:text-green-400">{value}</span>
//       );
//     }

//     if (Array.isArray(value)) {
//       if (value.length === 0) {
//         return <span className="text-muted-foreground">[]</span>;
//       }

//       const isCollapsed = collapsed[path];
//       return (
//         <div className="inline-block">
//           <button
//             onClick={() => toggleCollapse(path)}
//             className="text-muted-foreground hover:text-foreground"
//           >
//             {isCollapsed ? "▶" : "▼"} Array({value.length})
//           </button>
//           {!isCollapsed && (
//             <div className="ml-4 border-l-2 border-gray-300 dark:border-gray-700 pl-3 mt-1">
//               {value.map((item, index) => (
//                 <div key={index} className="py-0.5">
//                   <span className="text-muted-foreground">[{index}]: </span>
//                   {renderValue(item, String(index), `${path}.${index}`)}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       );
//     }

//     if (typeof value === "object") {
//       const keys = Object.keys(value);
//       if (keys.length === 0) {
//         return <span className="text-muted-foreground">{"{}"}</span>;
//       }

//       const isCollapsed = collapsed[path];
//       return (
//         <div className="inline-block">
//           <button
//             onClick={() => toggleCollapse(path)}
//             className="text-muted-foreground hover:text-foreground"
//           >
//             {isCollapsed ? "▶" : "▼"} Object({keys.length})
//           </button>
//           {!isCollapsed && (
//             <div className="ml-4 border-l-2 border-gray-300 dark:border-gray-700 pl-3 mt-1">
//               {keys.map((k) => (
//                 <div key={k} className="py-0.5">
//                   <span className="text-cyan-600 dark:text-cyan-400 font-medium">
//                     {k}:{" "}
//                   </span>
//                   {renderValue(value[k], k, `${path}.${k}`)}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       );
//     }

//     return <span>{String(value)}</span>;
//   };

//   if (typeof data === "object" && data !== null) {
//     const entries = Array.isArray(data)
//       ? data.map((item, index) => [String(index), item])
//       : Object.entries(data);

//     return (
//       <div className="space-y-1">
//         {entries.map(([key, value]) => (
//           <div key={key} className="py-0.5">
//             <span className="text-cyan-600 dark:text-cyan-400 font-medium">
//               {key}:{" "}
//             </span>
//             {renderValue(value, key, key)}
//           </div>
//         ))}
//       </div>
//     );
//   }

//   return <div>{renderValue(data, "root", "root")}</div>;
// };

// Type for audit log with relations
export type AuditEvent = AuditLog & {
  user: Pick<User, "id" | "name" | "email" | "role">;
  company?: Pick<Company, "id" | "name"> | null;
};

export interface AuditLogProps {
  maxHeight?: number;
  showRefreshButton?: boolean;
}

// UI mapping for actions
const actionMeta: Record<
  string,
  { label: string; color: string; icon: typeof Info }
> = {
  // Authentication actions
  LOGIN_SUCCESS: {
    label: "Logged In",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: LogIn,
  },
  LOGIN_FAILED: {
    label: "Login Failed",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: LogIn,
  },
  LOGOUT: {
    label: "Logged Out",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: LogOut,
  },
  SIGNUP: {
    label: "User Signed Up",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: UserPlus,
  },
  PASSWORD_RESET_REQUESTED: {
    label: "Password Reset Requested",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: Key,
  },
  PASSWORD_RESET_COMPLETED: {
    label: "Password Reset Completed",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    icon: Key,
  },
  COMPANY_CREATED: {
    label: "Company Created",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    icon: Building2,
  },
  COMPANY_UPDATED: {
    label: "Company Updated",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Building2,
  },
  COMPANY_DELETED: {
    label: "Company Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Trash2,
  },
  COMPANY_MEMBER_ADDED: {
    label: "Member Added",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Users,
  },
  COMPANY_MEMBER_REMOVED: {
    label: "Member Removed",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Users,
  },
  COMPANY_MEMBER_ROLE_CHANGED: {
    label: "Member Role Changed",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Users,
  },
  PRODUCT_CREATED: {
    label: "Product Created",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: Package,
  },
  PRODUCT_UPDATED: {
    label: "Product Updated",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Package,
  },
  PRODUCT_DELETED: {
    label: "Product Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Trash2,
  },
  SERVICE_CREATED: {
    label: "Service Created",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    icon: Wrench,
  },
  SERVICE_UPDATED: {
    label: "Service Updated",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Wrench,
  },
  SERVICE_DELETED: {
    label: "Service Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Trash2,
  },
  ORDER_CREATED: {
    label: "Order Created",
    color: "bg-lime-100 text-lime-700 border-lime-200",
    icon: ShoppingCart,
  },
  ORDER_UPDATED: {
    label: "Order Updated",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: ShoppingCart,
  },
  ORDER_CANCELLED: {
    label: "Order Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: ShoppingCart,
  },
  ORDER_COMPLETED: {
    label: "Order Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CalendarCheck,
  },
  INVOICE_CREATED: {
    label: "Invoice Created",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: FileText,
  },
  INVOICE_UPDATED: {
    label: "Invoice Updated",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: FileText,
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: FileText,
  },
  INVOICE_PAID: {
    label: "Invoice Paid",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: FileText,
  },
  INVOICE_CANCELLED: {
    label: "Invoice Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: FileText,
  },
  SETTINGS_UPDATED: {
    label: "Settings Updated",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Settings,
  },
  GEO_TRACKING_ENABLED: {
    label: "Geo Tracking Enabled",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Settings,
  },
  GEO_TRACKING_DISABLED: {
    label: "Geo Tracking Disabled",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Settings,
  },
  OAUTH_PROVIDER_ENABLED: {
    label: "OAuth Provider Enabled",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: ShieldCheck,
  },
  OAUTH_PROVIDER_DISABLED: {
    label: "OAuth Provider Disabled",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: ShieldCheck,
  },
  FILE_UPLOADED: {
    label: "File Uploaded",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Upload,
  },
  FILE_DOWNLOADED: {
    label: "File Downloaded",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: Download,
  },
  FILE_DELETED: {
    label: "File Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Trash2,
  },
  WELCOME_EMAIL_SENT: {
    label: "Welcome Email Sent",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Mail,
  },
  EMAIL_SENT: {
    label: "Email Sent",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Mail,
  },
  EMAIL_FAILED: {
    label: "Email Failed",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: MailX,
  },
  SYSTEM_SETUP_COMPLETED: {
    label: "OnTarget ERP Instance Launched",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    icon: Zap,
  },
  CREATED: {
    label: "Created",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: PlusCircle,
  },
  EDITED: {
    label: "Edited",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Pencil,
  },
  DELETED: {
    label: "Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Trash2,
  },
  DOWNLOADED_ZIP: {
    label: "Downloaded ZIP",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: Archive,
  },
  PASSWORD_PROTECTED: {
    label: "Password Protected",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Lock,
  },
};

function formatDateTime(value: string | Date) {
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

export function AuditLogClientStatic({
  maxHeight = 600,
  showRefreshButton = false,
}: AuditLogProps) {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      // Fetch ALL logs with no limit
      const response = await fetch(`/api/audit-logs?limit=9999`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch audit logs");
      }

      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // NO auto-refresh interval - only loads once on mount
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground text-sm">
            Loading activity logs...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="text-center space-y-4">
          <div className="text-destructive text-sm">{error}</div>
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="text-center text-muted-foreground text-sm">
          No activities yet
        </div>
      </div>
    );
  }

  const selectedEvent =
    selectedEventIndex !== null ? auditLogs[selectedEventIndex] : null;

  const handleEventClick = (index: number) => {
    setSelectedEventIndex(index);
    setIsModalOpen(true);
  };

  const handleNextEvent = () => {
    if (
      selectedEventIndex !== null &&
      selectedEventIndex < auditLogs.length - 1
    ) {
      setSelectedEventIndex(selectedEventIndex + 1);
    }
  };

  const handlePreviousEvent = () => {
    if (selectedEventIndex !== null && selectedEventIndex > 0) {
      setSelectedEventIndex(selectedEventIndex - 1);
    }
  };

  const exportEventAsCSV = (event: AuditEvent) => {
    const csvData = [
      ["Field", "Value"],
      ["Action", event.action],
      ["Description", event.description || "N/A"],
      ["Time", formatDateTime(event.createdAt)],
      ["User", event.user?.name || event.user?.email || "Unknown"],
      ["User Role", event.user?.role || "N/A"],
      ["Company", event.company?.name || "N/A"],
      ["IP Address", event.ipv4 || event.ipv6 || event.ipAddress || "N/A"],
      ["City", event.city || "N/A"],
      ["State", event.state || "N/A"],
      ["Country", event.country || "N/A"],
      ["Entity Type", event.entityType || "N/A"],
      ["Entity ID", event.entityId || "N/A"],
      ["Metadata", JSON.stringify(event.metadata || {})],
    ];

    const csvContent = csvData
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `activity-log-${event.id}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportEventAsExcel = (event: AuditEvent) => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Create data array for the worksheet
    const wsData = [
      ["Activity Log Export"],
      [""],
      ["Basic Information"],
      ["Action", event.action],
      ["Description", event.description || "N/A"],
      ["Time", formatDateTime(event.createdAt)],
      [""],
      ["User Information"],
      ["Name", event.user?.name || "N/A"],
      ["Email", event.user?.email || "N/A"],
      ["Role", event.user?.role || "N/A"],
      [""],
      ["Company Information"],
      ["Company Name", event.company?.name || "N/A"],
      [""],
      ["Location Information"],
      ["IP Address", event.ipv4 || event.ipv6 || event.ipAddress || "N/A"],
      ["City", event.city || "N/A"],
      ["State", event.state || "N/A"],
      ["Country", event.country || "N/A"],
      ["Country Flag", event.countryFlag || "N/A"],
      [""],
      ["Entity Information"],
      ["Entity Type", event.entityType || "N/A"],
      ["Entity ID", event.entityId || "N/A"],
      [""],
      ["Additional Metadata"],
      ["Metadata", JSON.stringify(event.metadata || {}, null, 2)],
    ];

    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Column A width
      { wch: 60 }, // Column B width
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Activity Log");

    // Generate XLSX file and trigger download
    XLSX.writeFile(wb, `activity-log-${event.id}.xlsx`);
  };

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm">
        {showRefreshButton && (
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">Recent Activity</span>
            <Button
              onClick={fetchAuditLogs}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="h-8 gap-2"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        )}
        <div
          style={{ maxHeight }}
          className="divide-y overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        >
          {auditLogs.map((evt, index) => {
            const meta = actionMeta[evt.action] ?? {
              label: evt.action,
              color: "bg-gray-100 text-gray-700 border-gray-200",
              icon: Info,
            };
            const Icon = meta.icon;

            return (
              <div
                key={evt.id}
                onClick={() => handleEventClick(index)}
                className="flex items-start gap-2 p-3 text-sm transition hover:bg-muted/30 cursor-pointer"
              >
                {/* Compact icon */}
                <div
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${meta.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Compact content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(evt.createdAt)}
                    </span>
                  </div>

                  {evt.description && (
                    <p className="text-xs text-foreground/70 dark:text-foreground/90 line-clamp-2">
                      {evt.description}
                    </p>
                  )}

                  {/* Compact metadata */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground dark:text-foreground/70">
                    <span className="truncate">
                      {evt.user?.name || evt.user?.email || "Unknown"}
                    </span>
                    {evt.company && (
                      <span className="truncate">{evt.company.name}</span>
                    )}
                    <span>
                      {(evt.ipv4 || evt.ipv6 || evt.ipAddress) === "::1"
                        ? "127.0.0.1"
                        : evt.ipv4 || evt.ipv6 || evt.ipAddress}
                    </span>
                    {evt.city && <span>{evt.city}</span>}
                    {evt.countryFlag && (
                      <span className="text-sm">{evt.countryFlag}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="px-8 max-w-full md:max-w-6xl lg:max-w-7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>Activity Log Details</span>
              <div className="flex items-center gap-2">
                {/* Export Dropdown */}
                {selectedEvent && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-2">
                        <FileDown className="h-3.5 w-3.5" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => exportEventAsCSV(selectedEvent)}
                      >
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => exportEventAsExcel(selectedEvent)}
                      >
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  onClick={handlePreviousEvent}
                  disabled={selectedEventIndex === 0}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedEventIndex !== null &&
                    `${selectedEventIndex + 1} / ${auditLogs.length}`}
                </span>
                <Button
                  onClick={handleNextEvent}
                  disabled={selectedEventIndex === auditLogs.length - 1}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedEvent &&
            (() => {
              const meta = actionMeta[selectedEvent.action] ?? {
                label: selectedEvent.action,
                color: "bg-gray-100 text-gray-700 border-gray-200",
                icon: Info,
              };
              const Icon = meta.icon;

              return (
                <div className="max-w-[90%] md:w-5xl lg:max-w-6xl space-y-6 pt-4">
                  {/* Action Badge */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-lg border ${meta.color} shadow-sm`}
                    >
                      <Icon className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center rounded-md border px-3 py-1 text-sm md:text-base md:px-4 md:py-2 font-semibold ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="space-y-2">
                      <h3 className="text-sm md:text-lg font-semibold">
                        Description
                      </h3>
                      <p className="text-sm md:text-base text-foreground/80 dark:text-foreground/90">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                        Time
                      </h4>
                      <p className="text-sm md:text-base">
                        {formatDateTime(selectedEvent.createdAt)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                        User who performed action
                      </h4>
                      <p className="text-sm md:text-base">
                        {selectedEvent.user?.name ||
                          selectedEvent.user?.email ||
                          "Unknown"}
                        {selectedEvent.user?.role && (
                          <span className="ml-2 text-xs md:text-sm text-green-500 foreground">
                            ({selectedEvent.user.role})
                          </span>
                        )}
                      </p>
                    </div>

                    {selectedEvent.company && (
                      <div className="space-y-1">
                        <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                          Company
                        </h4>
                        <p className="text-sm md:text-base">
                          {selectedEvent.company.name}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                        IP Address
                      </h4>
                      <p className="text-sm md:text-base">
                        {(() => {
                          const ip =
                            selectedEvent.ipv4 ||
                            selectedEvent.ipv6 ||
                            selectedEvent.ipAddress ||
                            "N/A";
                          return ip === "::1" ? "127.0.0.1" : ip;
                        })()}
                      </p>
                    </div>

                    {(selectedEvent.city ||
                      selectedEvent.state ||
                      selectedEvent.country) && (
                      <div className="space-y-1">
                        <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                          Location
                        </h4>
                        <p className="text-sm md:text-base flex items-center gap-2">
                          {[
                            selectedEvent.city,
                            selectedEvent.state,
                            selectedEvent.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          {selectedEvent.countryFlag && (
                            <span className="text-lg">
                              {selectedEvent.countryFlag}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                        Entity Type
                      </h4>
                      <p className="text-sm md:text-base">
                        {selectedEvent.entityType || "N/A"}
                      </p>
                    </div>

                    {selectedEvent.entityId && (
                      <div className="space-y-1 col-span-2">
                        <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                          Entity ID
                        </h4>
                        <p className="font-mono text-xs md:text-sm break-all">
                          {selectedEvent.entityId}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadata JSON */}
                  {selectedEvent.metadata &&
                    Object.keys(selectedEvent.metadata).length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm md:text-lg font-semibold">
                          Additional Details
                        </h3>
                        <div className="w-full min-h-[100px] font-mono overflow-x-scroll wrap-break-word rounded-lg px-6 py-4 text-md md:text-xl bg-gray-100 text-slate-900 dark:bg-black dark:text-green-500 border border-gray-200 dark:border-gray-800">
                          {JSON.stringify(selectedEvent.metadata, null, 2)}
                        </div>
                      </div>
                    )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AuditLogClientStatic;
