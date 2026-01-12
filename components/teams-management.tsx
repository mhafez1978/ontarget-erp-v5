"use client";

import { Plus, Users, Briefcase, Edit, Trash2, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { toast } from "sonner";

interface TeamMember {
  id: string;
  role: string;
  staffId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  memberCount: number;
  projectCount: number;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

interface TeamsManagementProps {
  companyId: string | null;
  onCreateTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
  onManageMembers: (team: Team) => void;
}

export function TeamsManagement({
  companyId,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  onManageMembers,
}: TeamsManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      if (!companyId) {
        setTeams([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/teams?companyId=${companyId}`);
        const data = await response.json();

        if (data.success && data.teams) {
          type ApiTeamMember = {
            id: string;
            role: string;
            staffId: string;
            user?: {
              id: string;
              name: string | null;
              email: string;
              image: string | null;
            } | null;
            staff?: {
              user: {
                id: string;
                name: string | null;
                email: string;
                image: string | null;
              } | null;
            } | null;
          };

          type ApiTeam = {
            id: string;
            name: string;
            description: string | null;
            companyId: string;
            memberCount: number;
            projectCount: number;
            members?: ApiTeamMember[];
            createdAt: string;
            updatedAt: string;
          };

          const normalizedTeams: Team[] = (data.teams as ApiTeam[]).map(
            (team) => ({
              id: team.id,
              name: team.name,
              description: team.description,
              companyId: team.companyId,
              memberCount: team.memberCount,
              projectCount: team.projectCount,
              createdAt: team.createdAt,
              updatedAt: team.updatedAt,
              members: (team.members ?? []).map((member) => ({
                id: member.id,
                role: member.role,
                staffId: member.staffId,
                // Normalize nested staff.user into a direct user property
                user: member.user ?? member.staff?.user ?? null,
              })),
            })
          );

          setTeams(normalizedTeams);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast.error("Failed to load teams");
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [companyId]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "STAFF":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "CONTRACTOR":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  if (!companyId) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 dark:text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
        <span className="dark:text-gray-200 block">
          Please select a company to manage teams
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-24 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Users className="h-12 w-12 dark:text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
        <span className="dark:text-gray-200 mb-4 block">
          Get started by creating your first team
        </span>
        <Button onClick={onCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          <span>Create Team</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Teams ({teams.length})</h3>
          <span className="text-sm dark:text-gray-200 block">
            Manage your organization&apos;s teams and members
          </span>
        </div>
        <Button onClick={onCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          <span>Create Team</span>
        </Button>
      </div>

      {/* Teams Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Managers & Leads</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const managers =
                team.members?.filter((m) => m.role === "MANAGER") || [];
              const admins =
                team.members?.filter((m) => m.role === "ADMIN") || [];
              const leads = [...managers, ...admins];

              return (
                <TableRow key={team.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 dark:text-gray-200" />
                      {team.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-sm dark:text-gray-200 truncate block">
                      {team.description || "No description"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 dark:text-gray-200" />
                      <span className="text-sm">{team.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3 dark:text-gray-200" />
                      <span className="text-sm">{team.projectCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {leads.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {leads.slice(0, 2).map((member) => {
                          const user = member.user;
                          const displayName =
                            user?.name || user?.email || "User";
                          const initial =
                            user?.name?.[0] ||
                            user?.email?.[0]?.toUpperCase() ||
                            "?";

                          return (
                            <div
                              key={member.id}
                              className="flex items-center gap-1"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={user?.image || undefined}
                                  alt={displayName}
                                />
                                <AvatarFallback className="text-xs">
                                  {initial}
                                </AvatarFallback>
                              </Avatar>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRoleColor(
                                  member.role
                                )}`}
                              >
                                {member.role}
                              </Badge>
                            </div>
                          );
                        })}
                        {leads.length > 2 && (
                          <span className="text-xs dark:text-gray-200">
                            +{leads.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm dark:text-gray-200">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageMembers(team)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        <span>Manage</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditTeam(team)}
                        aria-label="Edit team"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteTeam(team)}
                        aria-label="Delete team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
