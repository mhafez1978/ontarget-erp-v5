import { db } from "@/lib/db";

export interface CanEditProjectParams {
  userId: string;
  projectId: string;
  userRole: string;
}

export interface ProjectPermissionResult {
  canEdit: boolean;
  reason?: string;
  isProjectManager?: boolean;
  isProjectLead?: boolean;
  isTeamManager?: boolean;
  isCompanyOwner?: boolean;
  isSuperAdmin?: boolean;
}

/**
 * Check if a user can edit a project based on comprehensive permission rules:
 *
 * Can edit if user is:
 * 1. Project Manager (projectManagerId matches user's staffId)
 * 2. Project Lead (teamLeadId matches user's staffId)
 * 3. Team Manager/Admin of assigned team
 * 4. Company Owner
 * 5. SUPER_ADMIN who owns the company OR created the project
 *
 * Cannot edit if:
 * - User is from different company
 * - SUPER_ADMIN doesn't own the company and didn't create the project
 */
export async function canEditProject(
  params: CanEditProjectParams
): Promise<ProjectPermissionResult> {
  const { userId, projectId, userRole } = params;

  try {
    // Get project with full details
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        projectManager: {
          select: {
            id: true,
            userId: true,
          },
        },
        teamLead: {
          select: {
            id: true,
            userId: true,
          },
        },
        team: {
          include: {
            members: {
              include: {
                staff: {
                  select: {
                    id: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!project) {
      return {
        canEdit: false,
        reason: "Project not found",
      };
    }

    // Check if user is company owner
    const isCompanyOwner = project.company.ownerId === userId;
    if (isCompanyOwner) {
      return {
        canEdit: true,
        isCompanyOwner: true,
      };
    }

    // Get user's staff record in this company
    const userStaff = await db.companyStaff.findFirst({
      where: {
        userId,
        companyId: project.companyId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    // User must be part of the company
    if (!userStaff) {
      // Check if SUPER_ADMIN owns this company
      if (userRole === "SUPER_ADMIN") {
        const userOwnedCompanies = await db.company.findFirst({
          where: {
            id: project.companyId,
            ownerId: userId,
          },
        });

        if (userOwnedCompanies) {
          return {
            canEdit: true,
            isSuperAdmin: true,
            isCompanyOwner: true,
          };
        }

        // SUPER_ADMIN doesn't own company and isn't staff - deny
        return {
          canEdit: false,
          reason:
            "SUPER_ADMIN can only edit projects in companies they own or where they are team members",
        };
      }

      return {
        canEdit: false,
        reason: "You are not a member of this company",
      };
    }

    // Check if user is project manager
    if (project.projectManager && project.projectManager.userId === userId) {
      return {
        canEdit: true,
        isProjectManager: true,
      };
    }

    // Check if user is project lead
    if (project.teamLead && project.teamLead.userId === userId) {
      return {
        canEdit: true,
        isProjectLead: true,
      };
    }

    // Check if user is team manager/admin
    if (project.team) {
      const teamMember = project.team.members.find(
        (member) => member.staff.userId === userId
      );

      if (
        teamMember &&
        (teamMember.role === "ADMIN" || teamMember.role === "MANAGER")
      ) {
        return {
          canEdit: true,
          isTeamManager: true,
        };
      }

      // User is on team but not manager/admin
      if (teamMember) {
        return {
          canEdit: false,
          reason: "Only team managers/admins can edit projects",
        };
      }
    }

    // SUPER_ADMIN with staff record but no specific permissions
    if (userRole === "SUPER_ADMIN") {
      return {
        canEdit: true,
        isSuperAdmin: true,
      };
    }

    // Admin role in company can edit
    if (userRole === "ADMIN") {
      return {
        canEdit: true,
      };
    }

    // Regular staff without specific permissions
    return {
      canEdit: false,
      reason: "You don't have permission to edit this project",
    };
  } catch (error) {
    console.error("Error checking project edit permissions:", error);
    return {
      canEdit: false,
      reason: "Error checking permissions",
    };
  }
}

/**
 * Check if a user can view a project (less restrictive than edit)
 */
export async function canViewProject(
  params: CanEditProjectParams
): Promise<ProjectPermissionResult> {
  const { userId, projectId, userRole } = params;

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        companyId: true,
        teamId: true,
        customerId: true,
        company: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!project) {
      return {
        canEdit: false,
        reason: "Project not found",
      };
    }

    // Company owner can view
    if (project.company.ownerId === userId) {
      return { canEdit: true, isCompanyOwner: true };
    }

    // COMPANY_CUSTOMER or ERP_CUSTOMER: Can view if they're assigned as the customer
    if (userRole === "COMPANY_CUSTOMER" || userRole === "ERP_CUSTOMER") {
      if (project.customerId === userId) {
        return { canEdit: true };
      }
      return {
        canEdit: false,
        reason: "You are not assigned as the customer for this project",
      };
    }

    // SUPER_ADMIN can only view in companies they own or where they're staff
    if (userRole === "SUPER_ADMIN") {
      // Already checked company ownership above
      // Now check if they're company staff
      const userStaff = await db.companyStaff.findFirst({
        where: {
          userId,
          companyId: project.companyId,
        },
        select: { id: true },
      });

      if (!userStaff) {
        return {
          canEdit: false,
          reason:
            "SUPER_ADMIN can only view projects in companies they own or are members of",
        };
      }

      return { canEdit: true, isSuperAdmin: true };
    }

    // Check if user is company staff member
    const userStaff = await db.companyStaff.findFirst({
      where: {
        userId,
        companyId: project.companyId,
      },
      select: { id: true },
    });

    if (!userStaff) {
      return {
        canEdit: false,
        reason: "You are not a member of this company",
      };
    }

    // If project has a team, check team membership
    if (project.teamId) {
      const isTeamMember = await db.teamMember.findFirst({
        where: {
          teamId: project.teamId,
          staffId: userStaff.id,
        },
      });

      if (!isTeamMember) {
        return {
          canEdit: false,
          reason: "You are not a member of the project's team",
        };
      }
    }

    // User is company staff and either no team or is team member
    return { canEdit: true };
  } catch (error) {
    console.error("Error checking project view permissions:", error);
    return {
      canEdit: false,
      reason: "Error checking permissions",
    };
  }
}
