"use client";

import { ReactNode } from "react";
import {
  useCompanyPermissions,
  useTeamPermissions,
  useProjectPermissions,
  useTaskPermissions,
  PermissionContext,
} from "@/lib/hooks/use-permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PermissionGuardProps {
  children: ReactNode;
  // Permission type to check
  permission:
    | "canView"
    | "canCreate"
    | "canEdit"
    | "canDelete"
    | "canManageMembers"
    | "canManageSettings";
  // Entity type
  entityType: "company" | "team" | "project" | "task";
  // Entity IDs
  companyId?: string;
  teamId?: string;
  projectId?: string;
  taskId?: string;
  // Additional context
  context?: PermissionContext;
  // Fallback content when permission denied
  fallback?: ReactNode;
  // Show tooltip explaining why action is disabled
  showTooltip?: boolean;
  tooltipMessage?: string;
  // Hide completely vs show disabled
  hideWhenDenied?: boolean;
}

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 * Can hide, disable, or show tooltip for unauthorized actions
 */
export function PermissionGuard({
  children,
  permission,
  entityType,
  companyId,
  teamId,
  projectId,
  taskId,
  context,
  fallback = null,
  showTooltip = true,
  tooltipMessage,
  hideWhenDenied = false,
}: PermissionGuardProps) {
  // Call all hooks unconditionally (React Hooks Rules)
  const companyPerms = useCompanyPermissions(companyId);
  const teamPerms = useTeamPermissions(teamId, companyId);
  const projectPerms = useProjectPermissions(projectId, context);
  const taskPerms = useTaskPermissions(taskId, context);

  // Select the appropriate permissions based on entity type
  let permissions;
  let isLoading = false;

  switch (entityType) {
    case "company":
      permissions = companyPerms.permissions;
      isLoading = companyPerms.isLoading;
      break;
    case "team":
      permissions = teamPerms.permissions;
      isLoading = teamPerms.isLoading;
      break;
    case "project":
      permissions = projectPerms.permissions;
      isLoading = projectPerms.isLoading;
      break;
    case "task":
      permissions = taskPerms.permissions;
      isLoading = taskPerms.isLoading;
      break;
    default:
      permissions = {
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

  // While loading, show disabled state
  if (isLoading) {
    if (hideWhenDenied) return null;
    return <>{children}</>;
  }

  // Check if user has the required permission
  const hasPermission = permissions[permission];

  // If denied and should hide, return fallback
  if (!hasPermission && hideWhenDenied) {
    return <>{fallback}</>;
  }

  // If denied and should show tooltip
  if (!hasPermission && showTooltip) {
    const message =
      tooltipMessage ||
      `You don't have permission to ${permission
        .replace("can", "")
        .toLowerCase()} this ${entityType}`;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">{children}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // If has permission or no special handling, render children
  return <>{children}</>;
}

/**
 * Simple permission check for conditional rendering
 */
interface CanProps {
  children: ReactNode;
  permission:
    | "canView"
    | "canCreate"
    | "canEdit"
    | "canDelete"
    | "canManageMembers"
    | "canManageSettings";
  entityType: "company" | "team" | "project" | "task";
  companyId?: string;
  teamId?: string;
  projectId?: string;
  taskId?: string;
  context?: PermissionContext;
  fallback?: ReactNode;
}

export function Can({
  children,
  permission,
  entityType,
  companyId,
  teamId,
  projectId,
  taskId,
  context,
  fallback = null,
}: CanProps) {
  // Call all hooks unconditionally (React Hooks Rules)
  const companyPerms = useCompanyPermissions(companyId);
  const teamPerms = useTeamPermissions(teamId, companyId);
  const projectPerms = useProjectPermissions(projectId, context);
  const taskPerms = useTaskPermissions(taskId, context);

  // Select the appropriate permissions based on entity type
  let permissions;
  let isLoading = false;

  switch (entityType) {
    case "company":
      permissions = companyPerms.permissions;
      isLoading = companyPerms.isLoading;
      break;
    case "team":
      permissions = teamPerms.permissions;
      isLoading = teamPerms.isLoading;
      break;
    case "project":
      permissions = projectPerms.permissions;
      isLoading = projectPerms.isLoading;
      break;
    case "task":
      permissions = taskPerms.permissions;
      isLoading = taskPerms.isLoading;
      break;
  }

  if (isLoading || !permissions) return <>{fallback}</>;

  const hasPermission = permissions[permission];

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
