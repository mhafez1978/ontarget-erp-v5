"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  User2,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Flag,
  Clock,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "BLOCKED"
    | "COMPLETED"
    | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  createdById: string;
  assignedToId: string | null;
  projectId: string;
  timeEntry: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  assignedTo: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
}

export interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  showStatus?: boolean;
  compact?: boolean;
  showQuickActions?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onChangePriority?: (task: Task) => void;
  onSetDueDate?: (task: Task) => void;
}

export function TaskCard({
  task,
  onClick,
  showStatus = false,
  compact = false,
  showQuickActions = true,
  onEdit,
  onDelete,
  onAssign,
  onChangePriority,
  onSetDueDate,
}: TaskCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on the actions menu
    if ((e.target as HTMLElement).closest("[data-quick-actions]")) {
      return;
    }
    if (onClick) {
      onClick(task);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/10 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "LOW":
        return "bg-green-500/10 text-green-700 border-green-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-500/10 text-gray-700 border-gray-200";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "IN_REVIEW":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "BLOCKED":
        return "bg-red-500/10 text-red-700 border-red-200";
      case "COMPLETED":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "CANCELLED":
        return "bg-gray-500/10 text-gray-500 border-gray-300";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "TODO":
        return "To Do";
      case "IN_PROGRESS":
        return "In Progress";
      case "IN_REVIEW":
        return "In Review";
      case "BLOCKED":
        return "Blocked";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const isOverdue = task.dueDate
    ? new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"
    : false;

  const isDueSoon = task.dueDate
    ? new Date(task.dueDate).getTime() - new Date().getTime() < 86400000 * 3 &&
      task.status !== "COMPLETED"
    : false;

  return (
    <Card
      className={`group relative cursor-pointer hover:shadow-md transition-all ${
        compact ? "p-2" : "min-h-[180px]"
      }`}
      onClick={handleClick}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        {/* Quick Actions Menu */}
        {showQuickActions &&
          !compact &&
          (onEdit ||
            onDelete ||
            onAssign ||
            onChangePriority ||
            onSetDueDate) && (
            <div
              data-quick-actions
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Task actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                  )}
                  {onAssign && (
                    <DropdownMenuItem onClick={() => onAssign(task)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign To
                    </DropdownMenuItem>
                  )}
                  {onChangePriority && (
                    <DropdownMenuItem onClick={() => onChangePriority(task)}>
                      <Flag className="mr-2 h-4 w-4" />
                      Change Priority
                    </DropdownMenuItem>
                  )}
                  {onSetDueDate && (
                    <DropdownMenuItem onClick={() => onSetDueDate(task)}>
                      <Clock className="mr-2 h-4 w-4" />
                      Set Due Date
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(task)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Task
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`font-medium line-clamp-2 ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              {task.title}
            </p>
            <Badge
              variant="outline"
              className={`text-xs whitespace-nowrap ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </Badge>
          </div>

          {/* Description */}
          {!compact && task.description && (
            <div
              className="text-xs text-muted-foreground line-clamp-3 prose prose-sm max-w-none overflow-hidden"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 space-y-2">
          {/* Assigned To */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium min-w-[70px]">
              Assigned To:
            </span>
            {task.assignedTo ? (
              <div className="flex items-center gap-2">
                <Avatar className={compact ? "h-5 w-5" : "h-6 w-6"}>
                  <AvatarImage
                    src={task.assignedTo.user.image || ""}
                    alt={task.assignedTo.user.name || "Assigned To"}
                  />
                  <AvatarFallback className="text-xs">
                    <User2 className={compact ? "h-3 w-3" : "h-4 w-4"} />
                  </AvatarFallback>
                </Avatar>
                {!compact && (
                  <span className="text-xs text-muted-foreground">
                    {task.assignedTo.user.name || task.assignedTo.user.email}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Unassigned
              </span>
            )}
          </div>

          {/* Time and Due Date Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Time Tracking */}
            {task.timeEntry > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {task.timeEntry < 60
                    ? `${task.timeEntry}m`
                    : `${Math.floor(task.timeEntry / 60)}h ${
                        task.timeEntry % 60 > 0 ? `${task.timeEntry % 60}m` : ""
                      }`}
                </span>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  isOverdue
                    ? "text-red-600 font-medium"
                    : isDueSoon
                    ? "text-orange-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge (optional) */}
        {showStatus && (
          <div className="mt-2 pt-2 border-t">
            <Badge
              variant="outline"
              className={`text-xs ${getStatusColor(task.status)}`}
            >
              {getStatusLabel(task.status)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
