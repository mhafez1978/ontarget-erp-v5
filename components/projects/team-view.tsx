"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FolderKanban, ListTodo, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

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
  teamId: string | null;
  managerId: string | null;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
  } | null;
  projectManager: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  teamLead: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  _count: {
    tasks: number;
  };
  progress?: number;
}

interface TeamViewProps {
  projects: Project[];
}

const STATUS_CONFIG = {
  PLANNING: {
    label: "Planning",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  ON_HOLD: {
    label: "On Hold",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  BLOCKED: {
    label: "Blocked",
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
};

export function TeamView({ projects }: TeamViewProps) {
  // Group projects by team
  const projectsByTeam = projects.reduce((acc, project) => {
    const teamId = project.teamId || "unassigned";
    const teamName = project.team?.name || "Unassigned";

    if (!acc[teamId]) {
      acc[teamId] = {
        id: teamId,
        name: teamName,
        projects: [],
      };
    }

    acc[teamId].projects.push(project);
    return acc;
  }, {} as Record<string, { id: string; name: string; projects: Project[] }>);

  const teams = Object.values(projectsByTeam);

  return (
    <div className="space-y-6">
      {teams.map((team) => {
        const totalProjects = team.projects.length;
        const completedProjects = team.projects.filter(
          (p) => p.status === "COMPLETED"
        ).length;
        const inProgressProjects = team.projects.filter(
          (p) => p.status === "IN_PROGRESS"
        ).length;
        const totalTasks = team.projects.reduce(
          (sum, p) => sum + p._count.tasks,
          0
        );
        const avgProgress =
          team.projects.reduce((sum, p) => sum + (p.progress || 0), 0) /
          totalProjects;

        return (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalProjects} project{totalProjects !== 1 ? "s" : ""} •{" "}
                      {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {inProgressProjects}
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {completedProjects}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Completed
                    </div>
                  </div>
                  <div className="text-center min-w-20">
                    <div className="text-2xl font-bold">
                      {Math.round(avgProgress)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg Progress
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.projects.map((project) => (
                  <Card
                    key={project.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {project.name}
                          </h4>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={`${
                            STATUS_CONFIG[project.status].color
                          } shrink-0 text-xs`}
                        >
                          {STATUS_CONFIG[project.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Progress Bar */}
                      {project.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {project.progress}%
                            </span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      )}

                      {/* Tasks Count */}
                      <div className="flex items-center gap-2 text-sm">
                        <ListTodo className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {project._count.tasks} task
                          {project._count.tasks !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Dates */}
                      {(project.startDate || project.endDate) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">
                            {project.startDate &&
                              new Date(project.startDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            {project.startDate && project.endDate && " - "}
                            {project.endDate &&
                              new Date(project.endDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                          </span>
                        </div>
                      )}

                      {/* Team Members */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className="flex -space-x-2">
                          {project.projectManager && (
                            <Avatar className="w-6 h-6 border-2 border-background">
                              <AvatarImage
                                src={project.projectManager.user.image || ""}
                                alt={
                                  project.projectManager.user.name ||
                                  "Project Manager"
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {project.projectManager.user.name
                                  ?.charAt(0)
                                  .toUpperCase() || "PM"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {project.teamLead && (
                            <Avatar className="w-6 h-6 border-2 border-background">
                              <AvatarImage
                                src={project.teamLead.user.image || ""}
                                alt={project.teamLead.user.name || "Team Lead"}
                              />
                              <AvatarFallback className="text-xs">
                                {project.teamLead.user.name
                                  ?.charAt(0)
                                  .toUpperCase() || "TL"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex-1 min-w-0">
                          {project.projectManager && (
                            <div className="truncate">
                              PM: {project.projectManager.user.name || "N/A"}
                            </div>
                          )}
                          {project.teamLead && (
                            <div className="truncate">
                              TL: {project.teamLead.user.name || "N/A"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        asChild
                      >
                        <a href={`/dashboard/projects/${project.id}`}>
                          <FolderKanban className="w-4 h-4 mr-2" />
                          View Project
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {teams.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm mt-2">
                Create projects and assign them to teams to see them here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
