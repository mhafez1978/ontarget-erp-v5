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
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { AuditLog, User, Company } from "../generated/prisma/client";

// Type for audit log with relations
export type AuditEvent = AuditLog & {
  user: Pick<User, "id" | "name" | "email" | "role">;
  company?: Pick<Company, "id" | "name"> | null;
};

export interface AuditLogProps {
  title?: string;
  className?: string;
  maxHeight?: number; // px
  limit?: number;
}

// UI mapping for actions
const actionMeta: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  // User actions
  USER_REGISTERED: {
    label: "User Registered",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: UserPlus,
  },
  ERP_CUSTOMER_REGISTERED: {
    label: "New OnTarget ERP Customer Registered",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: UserPlus,
  },
  COMPANY_CUSTOMER_REGISTERED: {
    label: "New Company Customer Registered",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    icon: UserPlus,
  },
  USER_LOGIN: {
    label: "User Login",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: LogIn,
  },
  USER_LOGOUT: {
    label: "User Logout",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: LogOut,
  },
  USER_CREATED: {
    label: "User Created",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: UserPlus,
  },
  SUPER_ADMIN_CREATED: {
    label: "OnTarget ERP SUPER ADMIN_OWNER Account Created",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: UserPlus,
  },
  USER_UPDATED: {
    label: "User Updated",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Pencil,
  },
  USER_DELETED: {
    label: "User Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Trash2,
  },
  PASSWORD_CHANGED: {
    label: "Password Changed",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Key,
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

  // Company actions
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

  // Product & Service actions
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

  // Order actions
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

  // Invoice actions
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

  // Settings actions
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

  // File actions
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

  // Email actions
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

  // System actions
  SYSTEM_SETUP_COMPLETED: {
    label: "OnTarget ERP Instance Launched",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    icon: Zap,
  },

  // Generic/Legacy actions
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

export function AuditLog({ maxHeight = 600, limit = 50 }: AuditLogProps) {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/audit-logs?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Audit logs API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
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
    // Refresh every 30 seconds
    const interval = setInterval(fetchAuditLogs, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex items-center justify-center">
          <div className="dark:text-gray-200">Loading audit logs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="text-center space-y-4">
          <div className="text-destructive">{error}</div>
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="text-center dark:text-gray-200">No activities yet</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm transition-colors">
      <div
        style={{ maxHeight }}
        className="divide-y overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {auditLogs.map((evt) => {
          const meta = actionMeta[evt.action] ?? {
            label: evt.action,
            color: "bg-gray-100 text-gray-700 border-gray-200",
            icon: Info,
          };
          const Icon = meta.icon;

          return (
            <div
              key={evt.id}
              className="flex flex-col gap-3 p-5 transition hover:bg-muted/30"
            >
              {/* Top section */}
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${meta.color} shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col flex-1">
                  <span
                    className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  {evt.description && (
                    <span className="text-sm dark:text-gray-200 mt-1">
                      {evt.description}
                    </span>
                  )}
                  {evt.company && (
                    <span className="text-xs dark:text-gray-200 mt-1">
                      Company: {evt.company.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata section */}
              <div className="flex flex-col gap-1 text-xs dark:text-gray-200 pl-[52px]">
                <span>
                  <strong>Time:</strong>{" "}
                  {formatDateTime(evt.createdAt) || "Unknown time"}
                </span>
                <span>
                  <strong>User:</strong>{" "}
                  {evt.user?.name || evt.user?.email || "Unknown user"}{" "}
                  {evt.user?.role && (
                    <span className="text-xs opacity-70">
                      ({evt.user.role})
                    </span>
                  )}
                </span>
                <span>
                  <strong>IP:</strong>{" "}
                  {evt.ipv4 || evt.ipv6 || evt.ipAddress || "Unknown IP"}
                </span>
                <span className="flex flex-row items-center gap-2">
                  <strong>Location:</strong>{" "}
                  <span>
                    {evt.city || evt.state || evt.country
                      ? [evt.city, evt.state, evt.country]
                          .filter(Boolean)
                          .join(", ")
                      : // If we have no descriptive location, show the IP if available
                        evt.ipv4 ||
                        evt.ipv6 ||
                        evt.ipAddress ||
                        "Unknown location"}
                  </span>
                  {evt.countryFlag && (
                    <span className="text-lg leading-none">
                      {evt.countryFlag}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AuditLog;
