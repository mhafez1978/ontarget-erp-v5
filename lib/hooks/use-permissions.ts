"use client";

import useSWR from "swr";

// User role types from the database
export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN_OWNER"
  | "ADMIN_NONOWNER"
  | "COMPANY_ADMIN"
  | "COMPANY_MANAGER"
  | "COMPANY_STAFF"
  | "COMPANY_CONTRACTOR"
  | "ERP_CUSTOMER"
  | "COMPANY_CUSTOMER"
  | "COMPANY_SUPPLIER"
  | "TRIAL";

// Team member role types
export type TeamRole =
  | "COMPANY_ADMIN"
  | "COMPANY_MANAGER"
  | "COMPANY_STAFF"
  | "COMPANY_CONTRACTOR";

// Permission context for entities
export interface PermissionContext {
  companyId?: string;
  teamId?: string;
  projectId?: string;
  ownerId?: string;
  createdById?: string;
}

// User information with company/team associations
export interface UserInfo {
  id: string;
  role: UserRole;
  email: string;
  name: string | null;
  ownedCompanies?: Array<{ id: string }>;
  companyMemberships?: Array<{ companyId: string; role: string }>;
  staffMemberships?: Array<{ companyId: string; role: string }>;
  teamMemberships?: Array<{ teamId: string; role: TeamRole }>;
}

// Permission results
export interface Permissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

/**
 * Hook to fetch current user information
 */
export function useCurrentUser() {
  const { data, error, isLoading } = useSWR<{ user: UserInfo }>("/api/user/me");

  return {
    user: data?.user,
    isLoading,
    isError: error,
  };
}

/**
 * Hook to get permissions for a company
 */
export function useCompanyPermissions(companyId?: string) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user || !companyId) {
    return {
      permissions: getDefaultPermissions(),
      isLoading: isLoading || !companyId,
    };
  }

  const permissions = checkCompanyPermissions(user, companyId);
  return { permissions, isLoading: false };
}

/**
 * Hook to get permissions for a team
 */
export function useTeamPermissions(teamId?: string, companyId?: string) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user || !teamId) {
    return {
      permissions: getDefaultPermissions(),
      isLoading: isLoading || !teamId,
    };
  }

  const permissions = checkTeamPermissions(user, teamId, companyId);
  return { permissions, isLoading: false };
}

/**
 * Hook to get permissions for a project
 */
export function useProjectPermissions(
  projectId?: string,
  context?: PermissionContext
) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user || !projectId) {
    return {
      permissions: getDefaultPermissions(),
      isLoading: isLoading || !projectId,
    };
  }

  const permissions = checkProjectPermissions(user, projectId, context);
  return { permissions, isLoading: false };
}

/**
 * Hook to get permissions for a task
 */
export function useTaskPermissions(
  taskId?: string,
  context?: PermissionContext
) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading || !user || !taskId) {
    return {
      permissions: getDefaultPermissions(),
      isLoading: isLoading || !taskId,
    };
  }

  const permissions = checkTaskPermissions(user, taskId, context);
  return { permissions, isLoading: false };
}

/**
 * Check company-level permissions
 */
export function checkCompanyPermissions(
  user: UserInfo,
  companyId: string
): Permissions {
  const isOwner = user.ownedCompanies?.some((c) => c.id === companyId) || false;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isMember =
    user.companyMemberships?.some((m) => m.companyId === companyId) || false;
  const isStaff =
    user.staffMemberships?.some((m) => m.companyId === companyId) || false;
  const memberRole = user.companyMemberships?.find(
    (m) => m.companyId === companyId
  )?.role;
  const isCompanyAdmin = memberRole === "COMPANY_ADMIN";

  return {
    canView: isSuperAdmin || isOwner || isMember || isStaff,
    canCreate: isSuperAdmin || isOwner || isCompanyAdmin,
    canEdit: isSuperAdmin || isOwner || isCompanyAdmin,
    canDelete: isSuperAdmin || isOwner,
    canManageMembers: isSuperAdmin || isOwner || isCompanyAdmin,
    canManageSettings: isSuperAdmin || isOwner,
    isOwner,
    isAdmin: isSuperAdmin || isCompanyAdmin,
    isManager: memberRole === "COMPANY_MANAGER",
  };
}

/**
 * Check team-level permissions
 */
export function checkTeamPermissions(
  user: UserInfo,
  teamId: string,
  companyId?: string
): Permissions {
  const teamMembership = user.teamMemberships?.find((m) => m.teamId === teamId);
  const teamRole = teamMembership?.role;

  const isOwner = companyId
    ? user.ownedCompanies?.some((c) => c.id === companyId) || false
    : false;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isTeamAdmin = teamRole === "COMPANY_ADMIN";
  const isTeamManager = teamRole === "COMPANY_MANAGER";
  const isTeamMember = !!teamMembership;

  return {
    canView: isSuperAdmin || isOwner || isTeamMember,
    canCreate: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canEdit: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canDelete: isSuperAdmin || isOwner || isTeamAdmin,
    canManageMembers: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canManageSettings: isSuperAdmin || isOwner || isTeamAdmin,
    isOwner,
    isAdmin: isSuperAdmin || isTeamAdmin,
    isManager: isTeamManager,
  };
}

/**
 * Check project-level permissions
 */
export function checkProjectPermissions(
  user: UserInfo,
  projectId: string,
  context?: PermissionContext
): Permissions {
  const isOwner = context?.companyId
    ? user.ownedCompanies?.some((c) => c.id === context.companyId) || false
    : false;
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // Check team membership if teamId is provided
  const teamMembership = context?.teamId
    ? user.teamMemberships?.find((m) => m.teamId === context.teamId)
    : undefined;
  const teamRole = teamMembership?.role;
  const isTeamAdmin = teamRole === "COMPANY_ADMIN";
  const isTeamManager = teamRole === "COMPANY_MANAGER";
  const isTeamMember = !!teamMembership;

  // For COMPANY_MANAGER, COMPANY_STAFF, COMPANY_CONTRACTOR - must be team member
  const requiresTeamMembership =
    user.role === "COMPANY_MANAGER" ||
    user.role === "COMPANY_STAFF" ||
    user.role === "COMPANY_CONTRACTOR";

  const hasAccess = requiresTeamMembership
    ? isSuperAdmin || isOwner || isTeamMember
    : isSuperAdmin || isOwner || isTeamMember;

  return {
    canView: hasAccess,
    canCreate: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canEdit: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canDelete: isSuperAdmin || isOwner || isTeamAdmin,
    canManageMembers: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canManageSettings: isSuperAdmin || isOwner || isTeamAdmin,
    isOwner,
    isAdmin: isSuperAdmin || isTeamAdmin,
    isManager: isTeamManager,
  };
}

/**
 * Check task-level permissions
 */
export function checkTaskPermissions(
  user: UserInfo,
  taskId: string,
  context?: PermissionContext
): Permissions {
  const isOwner = context?.companyId
    ? user.ownedCompanies?.some((c) => c.id === context.companyId) || false
    : false;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCreator = context?.createdById === user.id;

  // Check team membership if teamId is provided
  const teamMembership = context?.teamId
    ? user.teamMemberships?.find((m) => m.teamId === context.teamId)
    : undefined;
  const teamRole = teamMembership?.role;
  const isTeamAdmin = teamRole === "COMPANY_ADMIN";
  const isTeamManager = teamRole === "COMPANY_MANAGER";
  const isTeamMember = !!teamMembership;

  // For COMPANY_MANAGER, COMPANY_STAFF, COMPANY_CONTRACTOR - must be team member
  const requiresTeamMembership =
    user.role === "COMPANY_MANAGER" ||
    user.role === "COMPANY_STAFF" ||
    user.role === "COMPANY_CONTRACTOR";
  user.role === "COMPANY_CONTRACTOR";

  const hasAccess = requiresTeamMembership
    ? isSuperAdmin || isOwner || isTeamMember
    : isSuperAdmin || isOwner || isTeamMember;

  // Tasks can be edited by team admins, managers, or the creator
  const canEdit =
    isSuperAdmin ||
    isOwner ||
    isTeamAdmin ||
    isTeamManager ||
    isCreator ||
    (isTeamMember && user.role === "COMPANY_STAFF");

  return {
    canView: hasAccess,
    canCreate: isSuperAdmin || isOwner || isTeamMember,
    canEdit,
    canDelete: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canManageMembers: isSuperAdmin || isOwner || isTeamAdmin || isTeamManager,
    canManageSettings: isSuperAdmin || isOwner || isTeamAdmin,
    isOwner,
    isAdmin: isSuperAdmin || isTeamAdmin,
    isManager: isTeamManager,
  };
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: UserInfo | undefined, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  user: UserInfo | undefined,
  roles: UserRole[]
): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if user is company owner
 */
export function isCompanyOwner(
  user: UserInfo | undefined,
  companyId: string
): boolean {
  return user?.ownedCompanies?.some((c) => c.id === companyId) || false;
}

/**
 * Check if user is team member
 */
export function isTeamMember(
  user: UserInfo | undefined,
  teamId: string
): boolean {
  return user?.teamMemberships?.some((m) => m.teamId === teamId) || false;
}

/**
 * Get default permissions (all false)
 */
function getDefaultPermissions(): Permissions {
  return {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageMembers: false,
    canManageSettings: false,
    isOwner: false,
    isAdmin: false,
    isManager: false,
  };
}
