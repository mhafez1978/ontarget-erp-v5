"use client";

import { User2, Mail, UserPlus, UserMinus, Shield, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirm";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status:
    | "PLANNING"
    | "IN_PROGRESS"
    | "ON_HOLD"
    | "BLOCKED"
    | "COMPLETED"
    | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  companyId: string;
  teamId: string;
  managerId: string | null;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      role: string;
      staff: {
        id: string;
        userId: string;
        user: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
        };
      };
    }>;
  };
  projectManager: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
  teamLead: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    assigneeId: string | null;
  }>;
  _count: {
    tasks: number;
  };
}

interface ProjectTeamTabProps {
  project: Project;
  onAddMember?: () => void;
  onRemoveMember?: (memberId: string) => void;
}

export function ProjectTeamTab({
  project,
  onAddMember,
  onRemoveMember,
}: ProjectTeamTabProps) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!onRemoveMember) {
      toast.error("Remove member functionality not available");
      return;
    }

    const confirmed = await confirmToast(
      `Are you sure you want to remove ${memberName} from the team?`,
      { confirmLabel: "Remove" }
    );
    if (!confirmed) return;

    setRemovingMemberId(memberId);
    try {
      await onRemoveMember(memberId);
      toast.success(`${memberName} removed from team`);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN_OWNER":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "COMPANY_MANAGER":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User2 className="h-4 w-4 dark:text-gray-200" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN_OWNER":
        return "default";
      case "COMPANY_MANAGER":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{project.team.name}</CardTitle>
              <p className="text-sm dark:text-gray-200 mt-1">
                {project.team.members.length} team member
                {project.team.members.length !== 1 ? "s" : ""}
              </p>
            </div>
            {onAddMember && (
              <Button onClick={onAddMember} size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Team Members List (single column list) */}
      <div className="space-y-4">
        {project.team.members.map((member) => {
          const isTeamLead =
            project.teamLead && member.staff.id === project.teamLead.id;
          const isProjectManager =
            project.projectManager &&
            member.staff.id === project.projectManager.id;

          const displayRole = isTeamLead
            ? "Team Lead"
            : isProjectManager
            ? "Project Manager"
            : member.role;

          const roleIcon = isTeamLead ? (
            <Crown className="h-4 w-4 text-yellow-600" />
          ) : isProjectManager ? (
            <Shield className="h-4 w-4 text-blue-600" />
          ) : (
            getRoleIcon(member.role)
          );

          return (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={member.staff.user.image || ""}
                        alt={member.staff.user.name || "Team Member"}
                      />
                      <AvatarFallback>
                        <User2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {member.staff.user.name || "Unnamed User"}
                        </p>
                        <Badge
                          variant={getRoleBadgeVariant(member.role)}
                          className="text-xs"
                        >
                          <span className="mr-1">{roleIcon}</span>
                          {displayRole}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs dark:text-gray-200">
                        <Mail className="h-3 w-3" />
                        <span>{member.staff.user.email}</span>
                      </div>
                    </div>
                  </div>
                  {onRemoveMember && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoveMember(
                          member.id,
                          member.staff.user.name || "this member"
                        )
                      }
                      disabled={removingMemberId === member.id}
                      className="dark:text-gray-200 hover:text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {project.team.members.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User2 className="h-12 w-12 dark:text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
            <p className="text-sm dark:text-gray-200 mb-4">
              Add team members to collaborate on this project
            </p>
            {onAddMember && (
              <Button onClick={onAddMember} size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
