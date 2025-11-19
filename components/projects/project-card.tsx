"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  User2,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Project type (matches API response)
interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  targetStartDate?: string | null;
  targetEndDate: string | null;
  companyId: string;
  teamId: string;
  managerId: string | null;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  team?: {
    id: string;
    name: string;
  };
  projectManager?: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  teamLead?: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  _count?: {
    tasks: number;
  };
  tasks?: Array<{
    id: string;
    status: string;
  }>;
}

export interface ProjectCardProps {
  project: Project;
  variant?: "default" | "compact" | "detailed";
  isDragging?: boolean;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  showQuickActions?: boolean;
  disableNavigation?: boolean;
}

export function ProjectCard({
  project,
  variant = "default",
  isDragging = false,
  onClick,
  onEdit,
  onDelete,
  showQuickActions = true,
  disableNavigation = false,
}: ProjectCardProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the actions menu
    if ((e.target as HTMLElement).closest("[data-quick-actions]")) {
      return;
    }

    if (onClick) {
      onClick(project);
    } else if (!disableNavigation) {
      router.push(`/dashboard/projects/${project.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(project);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(project);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/projects/${project.id}`);
  };

  const cardClassName = `
    group relative
    transition-all duration-200
    ${isDragging ? "opacity-50 shadow-lg rotate-2 scale-105" : ""}
    ${
      !disableNavigation || onClick
        ? "cursor-pointer hover:shadow-md hover:border-primary/50"
        : ""
    }
    ${variant === "compact" ? "p-2" : ""}
  `;

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "ON_HOLD":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "COMPLETED":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "CANCELLED":
        return "bg-gray-500/10 text-gray-700 border-gray-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  // Calculate progress percentage (if tasks exist)
  const completedTasks =
    project.tasks?.filter((t) => t.status === "COMPLETED").length || 0;
  const totalTasks = project._count?.tasks || project.tasks?.length || 0;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (variant === "compact") {
    return (
      <Card className={cardClassName} onClick={handleClick}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium line-clamp-1">{project.name}</h4>
            <Badge
              variant="outline"
              className={`text-xs ${getStatusColor(project.status)}`}
            >
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {completedTasks}/{totalTasks}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.team?.name || "No Team"}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName} onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          {/* Title and Actions Row */}
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium line-clamp-2 flex-1 wrap-break-word">
              {project.name}
            </CardTitle>

            {/* Quick Actions Menu */}
            {showQuickActions && (onEdit || onDelete) && (
              <div data-quick-actions onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewDetails}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {onEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <Badge
            variant="outline"
            className={`text-xs w-fit ${getStatusColor(project.status)}`}
          >
            {project.status.replace("_", " ")}
          </Badge>

          {project.description && variant === "detailed" && (
            <p className="text-xs text-muted-foreground line-clamp-2 wrap-break-word">
              {project.description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Team Badge */}
        {project.team && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs truncate">
              <Users className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">{project.team.name}</span>
            </Badge>
          </div>
        )}

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {completedTasks} of {totalTasks}
                </span>
              </span>
              <span className="font-medium shrink-0">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Dates - Stack vertically on small cards */}
        {(project.targetStartDate || project.targetEndDate) && (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {project.targetStartDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Start:{" "}
                  {new Date(project.targetStartDate).toLocaleDateString()}
                </span>
              </span>
            )}
            {project.targetEndDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Due: {new Date(project.targetEndDate).toLocaleDateString()}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Manager & Lead Avatars - Stack vertically */}
        {(project.projectManager || project.teamLead) && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            {project.projectManager && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage
                    src={project.projectManager.user?.image || ""}
                    alt={project.projectManager.user?.name || "Manager"}
                  />
                  <AvatarFallback className="text-xs">
                    <User2 className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    Manager
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {project.projectManager.user?.name || "Manager"}
                  </span>
                </div>
              </div>
            )}
            {project.teamLead && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage
                    src={project.teamLead.user?.image || ""}
                    alt={project.teamLead.user?.name || "Lead"}
                  />
                  <AvatarFallback className="text-xs">
                    <User2 className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    Team Lead
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {project.teamLead.user?.name || "Lead"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
