"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentUser,
  UserRole,
  hasAnyRole,
} from "@/lib/hooks/use-permissions";

interface RoleGuardProps {
  children: ReactNode;
  // Single role or array of allowed roles
  allowedRoles: UserRole | UserRole[];
  // Fallback content when role check fails
  fallback?: ReactNode;
  // Redirect URL if unauthorized (optional)
  redirectTo?: string;
}

/**
 * Role Guard Component
 * Renders children only if user has one of the allowed roles
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  redirectTo,
}: RoleGuardProps) {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  // Handle redirect in useEffect
  useEffect(() => {
    if (!isLoading && redirectTo) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const hasRequiredRole = hasAnyRole(user, roles);
      if (!hasRequiredRole) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, user, allowedRoles, redirectTo, router]);

  // While loading, show fallback
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Check if user has required role
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRequiredRole = hasAnyRole(user, roles);

  // If no required role, show fallback
  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Feature Toggle based on user role
 * Similar to RoleGuard but more semantic for feature flags
 */
interface FeatureToggleProps {
  children: ReactNode;
  requiredRoles: UserRole | UserRole[];
  fallback?: ReactNode;
}

export function FeatureToggle({
  children,
  requiredRoles,
  fallback = null,
}: FeatureToggleProps) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user) return <>{fallback}</>;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const hasAccess = hasAnyRole(user, roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Invert of RoleGuard - shows content only if user DOESN'T have the role
 */
interface HideForRolesProps {
  children: ReactNode;
  roles: UserRole | UserRole[];
}

export function HideForRoles({ children, roles }: HideForRolesProps) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user) return null;

  const rolesToHide = Array.isArray(roles) ? roles : [roles];
  const shouldHide = hasAnyRole(user, rolesToHide);

  return shouldHide ? null : <>{children}</>;
}

/**
 * Show different content based on user role
 */
interface RoleSwitchProps {
  superAdmin?: ReactNode;
  admin?: ReactNode;
  manager?: ReactNode;
  staff?: ReactNode;
  contractor?: ReactNode;
  erpCustomer?: ReactNode;
  companyCustomer?: ReactNode;
  supplier?: ReactNode;
  guest?: ReactNode;
  fallback?: ReactNode;
}

export function RoleSwitch({
  superAdmin,
  admin,
  manager,
  staff,
  contractor,
  erpCustomer,
  companyCustomer,
  supplier,
  guest,
  fallback = null,
}: RoleSwitchProps) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user) return <>{fallback}</>;

  if (hasAnyRole(user, ["SUPER_ADMIN"])) return <>{superAdmin || fallback}</>;
  if (hasAnyRole(user, ["ADMIN_OWNER", "ADMIN_NONOWNER"]))
    return <>{admin || fallback}</>;
  if (hasAnyRole(user, ["COMPANY_MANAGER"])) return <>{manager || fallback}</>;
  if (hasAnyRole(user, ["COMPANY_STAFF"])) return <>{staff || fallback}</>;
  if (hasAnyRole(user, ["COMPANY_CONTRACTOR"]))
    return <>{contractor || fallback}</>;
  if (hasAnyRole(user, ["ERP_CUSTOMER"])) return <>{erpCustomer || fallback}</>;
  if (hasAnyRole(user, ["COMPANY_CUSTOMER"]))
    return <>{companyCustomer || fallback}</>;
  if (hasAnyRole(user, ["COMPANY_SUPPLIER"]))
    return <>{supplier || fallback}</>;
  if (hasAnyRole(user, ["TRIAL"])) return <>{guest || fallback}</>;
  return <>{fallback}</>;
}

/**
 * Show content only to admins (SUPER_ADMIN or ADMIN_OWNER)
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN_OWNER", "ADMIN_NONOWNER"]}>
      {children}
    </RoleGuard>
  );
}

/**
 * Show content only to super admins
 */
export function SuperAdminOnly({ children }: { children: ReactNode }) {
  return <RoleGuard allowedRoles="SUPER_ADMIN">{children}</RoleGuard>;
}

/**
 * Show content to managers and above (SUPER_ADMIN, ADMIN_OWNER, COMPANY_MANAGER)
 */
export function ManagerAndAbove({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={[
        "SUPER_ADMIN",
        "ADMIN_OWNER",
        "ADMIN_NONOWNER",
        "COMPANY_MANAGER",
      ]}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Show content to staff and above (everyone except TRIAL)
 */
export function StaffAndAbove({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={[
        "SUPER_ADMIN",
        "ADMIN_OWNER",
        "ADMIN_NONOWNER",
        "COMPANY_MANAGER",
        "COMPANY_STAFF",
        "COMPANY_CONTRACTOR",
        "ERP_CUSTOMER",
        "COMPANY_CUSTOMER",
        "COMPANY_SUPPLIER",
      ]}
    >
      {children}
    </RoleGuard>
  );
}
