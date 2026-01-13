import { db } from "@/lib/db";
import { countryCodeToFlag, lookupGeoByIp } from "@/lib/ip-lookup";
import { triggerStaffStatusUpdate } from "@/lib/staff-status-events";

export interface CreateAuditLogParams {
  action: string;
  userId?: string | null;
  companyId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  ipv4?: string | null;
  ipv6?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  countryFlag?: string | null;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    let ipAddress = params.ipAddress ?? null;
    let ipv4 = params.ipv4 ?? null;
    let ipv6 = params.ipv6 ?? null;
    let city = params.city ?? null;
    let state = params.state ?? null;
    let country = params.country ?? null;
    let countryFlag = params.countryFlag ?? null;

    // If geo information wasn't provided but we have a user, fall back to their most recent session
    if (params.userId && (!ipAddress || (!city && !country))) {
      try {
        const latestSession = await db.session.findFirst({
          where: { userId: params.userId },
          orderBy: { expires: "desc" },
        });

        if (latestSession) {
          ipAddress = ipAddress ?? latestSession.sessionIpAddress ?? null;
          ipv4 = ipv4 ?? latestSession.sessionIpv4 ?? null;
          ipv6 = ipv6 ?? latestSession.sessionIpv6 ?? null;
          city = city ?? latestSession.sessionCity ?? null;
          state = state ?? latestSession.sessionState ?? null;
          country = country ?? latestSession.sessionCountry ?? null;
          countryFlag = countryFlag ?? latestSession.sessionCountryFlag ?? null;
        }
      } catch (sessionError) {
        console.error(
          "Failed to load session geo for audit log:",
          sessionError
        );
      }
    }

    // Don't do geo lookup here - it's better to pass geo data when creating audit logs
    // or rely on session data. The old lookupGeoByIp uses ipapi.co which has limits.
    // Instead, callers should use /api/get-location or pass geo data directly.

    // Ensure the userId exists in DB to avoid FK violations; use null if missing
    let auditUserId = params.userId ?? null;
    if (auditUserId) {
      try {
        const u = await db.user.findUnique({ where: { id: auditUserId } });
        if (!u) auditUserId = null;
      } catch (e) {
        auditUserId = null;
      }
    }

    const auditLog = await db.auditLog.create({
      data: {
        action: params.action,
        userId: auditUserId,
        companyId: params.companyId,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress,
        ipv4,
        ipv6,
        city,
        state,
        country,
        countryFlag,
      },
    });

    // Trigger staff status update for relevant events
    if (params.companyId) {
      triggerStaffStatusUpdate(params.companyId, params.action);
    }

    return auditLog;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    throw error;
  }
}

/**
 * Common audit actions as constants
 */
export const AUDIT_ACTIONS = {
  // User actions
  USER_REGISTERED: "USER_REGISTERED", // Generic fallback
  ERP_CUSTOMER_REGISTERED: "ERP_CUSTOMER_REGISTERED", // OnTarget ERP signup
  COMPANY_CUSTOMER_REGISTERED: "COMPANY_CUSTOMER_REGISTERED", // Company website signup (future)
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_CREATED: "USER_CREATED",
  SUPER_ADMIN_CREATED: "SUPER_ADMIN_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",

  // Company actions
  COMPANY_CREATED: "COMPANY_CREATED",
  COMPANY_UPDATED: "COMPANY_UPDATED",
  COMPANY_DELETED: "COMPANY_DELETED",
  COMPANY_MEMBER_ADDED: "COMPANY_MEMBER_ADDED",
  COMPANY_MEMBER_REMOVED: "COMPANY_MEMBER_REMOVED",
  COMPANY_MEMBER_ROLE_CHANGED: "COMPANY_MEMBER_ROLE_CHANGED",

  // Company location actions
  LOCATION_CREATED: "LOCATION_CREATED",
  LOCATION_UPDATED: "LOCATION_UPDATED",
  LOCATION_DELETED: "LOCATION_DELETED",

  // Staff actions
  STAFF_MEMBER_ADDED: "STAFF_MEMBER_ADDED",
  STAFF_MEMBER_UPDATED: "STAFF_MEMBER_UPDATED",
  STAFF_MEMBER_DELETED: "STAFF_MEMBER_DELETED",
  BULK_STAFF_IMPORT: "BULK_STAFF_IMPORT",

  // Customer actions
  BULK_CUSTOMER_IMPORT: "BULK_CUSTOMER_IMPORT",

  // Product bulk actions
  BULK_PRODUCT_IMPORT: "BULK_PRODUCT_IMPORT",

  // Service bulk actions
  BULK_SERVICE_IMPORT: "BULK_SERVICE_IMPORT",

  // Subscriber actions
  SUBSCRIBER_CUSTOMER_CREATED: "SUBSCRIBER_CUSTOMER_CREATED",

  // Subscription actions
  SUBSCRIPTION_PLAN_CHANGED: "SUBSCRIPTION_PLAN_CHANGED",

  // Product actions
  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_DELETED: "PRODUCT_DELETED",

  // Service actions
  SERVICE_CREATED: "SERVICE_CREATED",
  SERVICE_UPDATED: "SERVICE_UPDATED",
  SERVICE_DELETED: "SERVICE_DELETED",

  // Order actions
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_UPDATED: "ORDER_UPDATED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_COMPLETED: "ORDER_COMPLETED",

  // Invoice actions
  INVOICE_CREATED: "INVOICE_CREATED",
  INVOICE_UPDATED: "INVOICE_UPDATED",
  INVOICE_SENT: "INVOICE_SENT",
  INVOICE_PAID: "INVOICE_PAID",
  INVOICE_CANCELLED: "INVOICE_CANCELLED",

  // Settings actions
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
  GEO_TRACKING_ENABLED: "GEO_TRACKING_ENABLED",
  GEO_TRACKING_DISABLED: "GEO_TRACKING_DISABLED",
  OAUTH_PROVIDER_ENABLED: "OAUTH_PROVIDER_ENABLED",
  OAUTH_PROVIDER_DISABLED: "OAUTH_PROVIDER_DISABLED",
  PAYMENT_GATEWAY_PUBLISHABLE_KEY_FETCHED:
    "PAYMENT_GATEWAY_PUBLISHABLE_KEY_FETCHED",
  PAYMENT_GATEWAY_PUBLISHABLE_KEY_FAILED:
    "PAYMENT_GATEWAY_PUBLISHABLE_KEY_FAILED",
  PAYMENT_SETUP_INTENT_CREATED: "PAYMENT_SETUP_INTENT_CREATED",
  PAYMENT_SETUP_INTENT_FAILED: "PAYMENT_SETUP_INTENT_FAILED",
  PAYMENT_REVEAL_TOGGLED: "PAYMENT_REVEAL_TOGGLED",

  // File actions
  FILE_UPLOADED: "FILE_UPLOADED",
  FILE_DOWNLOADED: "FILE_DOWNLOADED",
  FILE_DELETED: "FILE_DELETED",

  // Email actions
  WELCOME_EMAIL_SENT: "WELCOME_EMAIL_SENT",
  EMAIL_SENT: "EMAIL_SENT",
  EMAIL_FAILED: "EMAIL_FAILED",

  // Onboarding actions
  ONBOARDING_TOKEN_CREATED: "ONBOARDING_TOKEN_CREATED",
  ONBOARDING_TOKEN_VIEWED: "ONBOARDING_TOKEN_VIEWED",
  ONBOARDING_REACTIVATED: "ONBOARDING_REACTIVATED",
  ONBOARDING_DOCUMENT_UPLOADED: "ONBOARDING_DOCUMENT_UPLOADED",
  ONBOARDING_DOCUMENT_UPLOAD_FAILED: "ONBOARDING_DOCUMENT_UPLOAD_FAILED",
  ONBOARDING_COMPLETED: "ONBOARDING_COMPLETED",
  ONBOARDING_COMPLETION_FAILED: "ONBOARDING_COMPLETION_FAILED",
  ONBOARDING_EXPIRED: "ONBOARDING_EXPIRED",

  // System actions
  SYSTEM_SETUP_COMPLETED: "SYSTEM_SETUP_COMPLETED",

  // Hedera actions
  HEDERA_ENABLED: "HEDERA_ENABLED",
  HEDERA_DISABLED: "HEDERA_DISABLED",
  HEDERA_HISTORICAL_REQUEST: "HEDERA_HISTORICAL_REQUEST",
  HEDERA_HISTORICAL_COMPLETE: "HEDERA_HISTORICAL_COMPLETE",

  // Project actions
  PROJECT_CREATED: "PROJECT_CREATED",
  PROJECT_UPDATED: "PROJECT_UPDATED",
  PROJECT_VIEWED: "PROJECT_VIEWED",
  PROJECT_DELETED: "PROJECT_DELETED",
  PROJECT_CLOSED: "PROJECT_CLOSED",
  PROJECT_CANCELLED: "PROJECT_CANCELLED",
  PROJECT_REOPENED: "PROJECT_REOPENED",
  PROJECT_TEAM_CHANGED: "PROJECT_TEAM_CHANGED",
  PROJECT_MANAGER_CHANGED: "PROJECT_MANAGER_CHANGED",
  PROJECT_LEAD_CHANGED: "PROJECT_LEAD_CHANGED",
  PROJECT_FINANCIAL_ENTRIES_VIEWED: "PROJECT_FINANCIAL_ENTRIES_VIEWED",
  PROJECT_FINANCIAL_ENTRY_CREATED: "PROJECT_FINANCIAL_ENTRY_CREATED",
  PROJECT_FINANCIAL_ENTRY_UPDATED: "PROJECT_FINANCIAL_ENTRY_UPDATED",
  PROJECT_FINANCIAL_ENTRY_DELETED: "PROJECT_FINANCIAL_ENTRY_DELETED",

  // Task actions
  TASK_CREATED: "TASK_CREATED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_DELETED: "TASK_DELETED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_STATUS_CHANGED: "TASK_STATUS_CHANGED",

  // Time tracking actions (Company admin only)
  TIME_ENTRY_CREATED: "TIME_ENTRY_CREATED",
  TIME_ENTRY_UPDATED: "TIME_ENTRY_UPDATED",
  TIME_ENTRY_DELETED: "TIME_ENTRY_DELETED",

  // Payroll actions
  PAYROLL_RUN: "PAYROLL_RUN",
  PAYROLL_ENTRY_CREATED: "PAYROLL_ENTRY_CREATED",
  PAYROLL_ENTRY_SKIPPED: "PAYROLL_ENTRY_SKIPPED",

  // Note actions
  NOTE_CREATED: "NOTE_CREATED",
  NOTE_UPDATED: "NOTE_UPDATED",
  NOTE_DELETED: "NOTE_DELETED",
} as const;

/**
 * Entity types as constants
 */
export const ENTITY_TYPES = {
  USER: "User",
  COMPANY: "Company",
  COMPANY_MEMBER: "CompanyMember",
  STAFF_MEMBER: "StaffMember",
  PRODUCT: "Product",
  SERVICE: "Service",
  ORDER: "Order",
  INVOICE: "Invoice",
  SETTINGS: "Settings",
  FILE: "File",
  PROJECT: "Project",
  TASK: "Task",
  NOTE: "Note",
} as const;
