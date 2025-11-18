import { db } from "@/lib/db";

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
    const auditLog = await db.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId,
        companyId: params.companyId,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        ipv4: params.ipv4,
        ipv6: params.ipv6,
        city: params.city,
        state: params.state,
        country: params.country,
        countryFlag: params.countryFlag,
      },
    });

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

  // Staff actions
  STAFF_MEMBER_ADDED: "STAFF_MEMBER_ADDED",
  STAFF_MEMBER_UPDATED: "STAFF_MEMBER_UPDATED",
  STAFF_MEMBER_DELETED: "STAFF_MEMBER_DELETED",

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

  // File actions
  FILE_UPLOADED: "FILE_UPLOADED",
  FILE_DOWNLOADED: "FILE_DOWNLOADED",
  FILE_DELETED: "FILE_DELETED",

  // System actions
  SYSTEM_SETUP_COMPLETED: "SYSTEM_SETUP_COMPLETED",
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
} as const;
