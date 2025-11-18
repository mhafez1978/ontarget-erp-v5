"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Users,
  Briefcase,
  UserPlus,
  Activity,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { AddTeamMemberDialog } from "@/components/add-team-member-dialog";
import { RemoveTeamMemberDialog } from "@/components/remove-team-member-dialog";
import { ChangeTeamRoleDialog } from "@/components/change-team-role-dialog";

interface TeamMember {
  id: string;
  role: string;
  staff: {
    id: string;
    userId: string;
    jobTitle: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      role: string;
    };
  };
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: {
    tasks: number;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  company: {
    id: string;
    name: string;
    ownerId: string;
  };
  members: TeamMember[];
  projects: Project[];
  _count: {
    members: number;
    projects: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");

  // Dialog states
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team");
      }
      const data = await response.json();
      setTeam(data.team);
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const handleMemberActionSuccess = () => {
    fetchTeam();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "ACTIVE":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "ON_HOLD":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "COMPLETED":
        return "bg-gray-500/10 text-gray-700 border-gray-200";
      case "CANCELLED":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The team you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/settings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-muted-foreground">{team.company.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team._count.members}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team._count.projects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.projects.reduce((acc, p) => acc + p._count.tasks, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {team.description && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{team.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members ({team._count.members})
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Briefcase className="h-4 w-4 mr-2" />
            Projects ({team._count.projects})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button onClick={() => setAddMemberOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.members.map((member) => (
              <Card key={member.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={member.staff.user.image || ""}
                        alt={member.staff.user.name || "User"}
                      />
                      <AvatarFallback>
                        {member.staff.user.name?.[0] ||
                          member.staff.user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.staff.user.name || member.staff.user.email}
                      </p>
                      {member.staff.jobTitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {member.staff.jobTitle}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRoleColor(member.role)}`}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember(member);
                            setChangeRoleOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember(member);
                            setRemoveMemberOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {team.members.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add members to this team to get started
              </p>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Projects</h3>
          </div>

          <div className="space-y-3">
            {team.projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project._count.tasks} task
                        {project._count.tasks !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getStatusColor(project.status)}
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {team.projects.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground">
                This team doesn&apos;t have any projects assigned yet
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddTeamMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        teamId={teamId}
        companyId={team.companyId}
        existingMembers={team.members.map((m) => ({
          id: m.id,
          staffId: m.staff.id,
        }))}
        onSuccess={handleMemberActionSuccess}
      />

      {selectedMember && (
        <>
          <RemoveTeamMemberDialog
            open={removeMemberOpen}
            onOpenChange={setRemoveMemberOpen}
            teamId={teamId}
            memberId={selectedMember.id}
            memberName={
              selectedMember.staff.user.name || selectedMember.staff.user.email
            }
            onSuccess={handleMemberActionSuccess}
          />

          <ChangeTeamRoleDialog
            open={changeRoleOpen}
            onOpenChange={setChangeRoleOpen}
            teamId={teamId}
            memberId={selectedMember.id}
            memberName={
              selectedMember.staff.user.name || selectedMember.staff.user.email
            }
            currentRole={selectedMember.role}
            onSuccess={handleMemberActionSuccess}
          />
        </>
      )}
    </div>
  );
}
