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
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";

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

export async function AuditLogServer() {
  // Get session token from cookies
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sessionToken")?.value;

  if (!sessionToken) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="text-center dark:text-gray-200 text-sm">
          Please log in to view activity logs
        </div>
      </div>
    );
  }

  const { user } = await validateSession(sessionToken);

  if (!user?.id) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="text-center dark:text-gray-200 text-sm">
          Please log in to view activity logs
        </div>
      </div>
    );
  }

  // Get user's company memberships for access control
  const userWithMemberships = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      companyMemberships: {
        select: {
          companyId: true,
          role: true,
        },
      },
    },
  });

  if (!userWithMemberships) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="text-center dark:text-gray-200 text-sm">
          User not found
        </div>
      </div>
    );
  }

  // Build query based on role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let whereClause: any = {};

  if (userWithMemberships.role === "SUPER_ADMIN") {
    // SUPER_ADMIN sees all audit logs
    whereClause = {};
  } else if (userWithMemberships.role === "ADMIN") {
    // ADMIN sees logs from their company only
    const companyIds = userWithMemberships.companyMemberships.map(
      (m) => m.companyId
    );
    if (companyIds.length > 0) {
      whereClause = {
        companyId: {
          in: companyIds,
        },
      };
    } else {
      // Admin not in any company yet
      whereClause = {
        userId: userWithMemberships.id,
      };
    }
  } else if (
    ["MANAGER", "STAFF", "CONTRACTOR", "SUPPLIER"].includes(
      userWithMemberships.role
    )
  ) {
    // Other roles see logs from their company
    const companyIds = userWithMemberships.companyMemberships.map(
      (m) => m.companyId
    );
    if (companyIds.length > 0) {
      whereClause = {
        companyId: {
          in: companyIds,
        },
      };
    } else {
      // Not in any company, only see own logs
      whereClause = {
        userId: userWithMemberships.id,
      };
    }
  } else {
    // ERP_CUSTOMER, COMPANY_CUSTOMER, GUEST see only their own logs
    whereClause = {
      userId: userWithMemberships.id,
    };
  }

  // Fetch ALL audit logs (no limit) - server-side rendering
  const auditLogs = await db.auditLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    // No take/skip - get all logs
  });

  if (auditLogs.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="text-center dark:text-gray-200 text-sm">
          No activities yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="max-h-[600px] divide-y overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
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
              className="flex items-start gap-2 p-3 text-sm transition hover:bg-muted/30"
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
                  <span className="text-xs dark:text-gray-200">
                    {formatDateTime(evt.createdAt)}
                  </span>
                </div>

                {evt.description && (
                  <p className="text-xs dark:text-gray-200 line-clamp-2">
                    {evt.description}
                  </p>
                )}

                {/* Compact metadata */}
                <div className="flex items-center gap-3 text-[11px] dark:text-gray-200/80">
                  <span className="truncate">
                    {evt.user?.name || evt.user?.email || "Unknown"}
                  </span>
                  {evt.company && (
                    <span className="truncate">{evt.company.name}</span>
                  )}
                  <span>{evt.ipv4 || evt.ipv6 || evt.ipAddress}</span>
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
  );
}
