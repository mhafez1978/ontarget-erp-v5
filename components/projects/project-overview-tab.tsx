"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  User2,
  Users,
  Clock,
  Target,
  AlertCircle,
  Mail,
} from "lucide-react";
import { InlineEditSection } from "@/components/projects/inline-edit-section";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  targetStartDate: string | null;
  targetEndDate: string | null;
  companyId: string;
  teamId: string;
  managerId: string | null;
  leadId: string | null;
  subscriberCompanyId: string | null;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
  };
  subscriberCompany?: {
    id: string;
    name: string;
  } | null;
  customer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
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

interface ProjectOverviewTabProps {
  project: Project;
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const [localProject, setLocalProject] = useState(project);

  // Calculate progress metrics
  const completedTasks = localProject.tasks.filter(
    (t) => t.status === "COMPLETED"
  ).length;
  const inProgressTasks = localProject.tasks.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const todoTasks = localProject.tasks.filter(
    (t) => t.status === "TODO"
  ).length;
  const inReviewTasks = localProject.tasks.filter(
    (t) => t.status === "IN_REVIEW"
  ).length;
  const blockedTasks = localProject.tasks.filter(
    (t) => t.status === "BLOCKED"
  ).length;
  const cancelledTasks = localProject.tasks.filter(
    (t) => t.status === "CANCELLED"
  ).length;
  const totalTasks = localProject._count.tasks;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate date info
  const today = new Date();
  const startDate = localProject.startDate
    ? new Date(localProject.startDate)
    : null;
  const endDate = localProject.endDate ? new Date(localProject.endDate) : null;
  const daysRemaining = endDate
    ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isDueSoon =
    daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Project Details Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InlineEditSection
            title="Description"
            value={localProject.description}
            fieldName="description"
            projectId={localProject.id}
            type="textarea"
            placeholder="Add a project description..."
            onSave={(newValue) => {
              setLocalProject({ ...localProject, description: newValue });
            }}
          />

          {/* Customer Section */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Customer
            </h4>
            {localProject.subscriberCompany ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  ERP Customer
                </Badge>
                <p className="text-sm font-medium">
                  {localProject.subscriberCompany.name}
                </p>
              </div>
            ) : localProject.customer ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Company Customer
                </Badge>
                <p className="text-sm font-medium">
                  {localProject.customer.name || localProject.customer.email}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No customer assigned (internal project)
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 border-t pt-4">order-t pt-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Company
              </h4>
              <p className="text-sm font-medium">{localProject.company.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Company cannot be changed after project creation
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Team
              </h4>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{localProject.team.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {localProject.team.members.length} members
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Team can be changed via project settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-bold">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <span>To Do</span>
              </div>
              <span className="font-medium">{todoTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>In Progress</span>
              </div>
              <span className="font-medium">{inProgressTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span>In Review</span>
              </div>
              <span className="font-medium">{inReviewTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Blocked</span>
              </div>
              <span className="font-medium">{blockedTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Completed</span>
              </div>
              <span className="font-medium">{completedTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <span>Cancelled</span>
              </div>
              <span className="font-medium">{cancelledTasks}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <InlineEditSection
              title="Start Date"
              value={localProject.startDate || ""}
              fieldName="startDate"
              projectId={localProject.id}
              type="date"
              icon={Calendar}
              placeholder="Set start date..."
              onSave={(newValue) => {
                setLocalProject({ ...localProject, startDate: newValue });
              }}
            />
            <InlineEditSection
              title="Target End Date"
              value={localProject.endDate || ""}
              fieldName="endDate"
              projectId={localProject.id}
              type="date"
              icon={Calendar}
              placeholder="Set end date..."
              onSave={(newValue) => {
                setLocalProject({ ...localProject, endDate: newValue });
              }}
            />
            {daysRemaining !== null && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Time Remaining</span>
                </div>
                <div className="flex items-center gap-2">
                  {isOverdue ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-medium text-red-500">
                        {Math.abs(daysRemaining)} days overdue
                      </p>
                    </>
                  ) : isDueSoon ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <p className="text-sm font-medium text-orange-500">
                        {daysRemaining} days remaining
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-medium">
                      {daysRemaining} days remaining
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Manager Card */}
      {localProject.projectManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-5 w-5" />
              Project Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={localProject.projectManager.user.image || ""}
                  alt={localProject.projectManager.user.name || "Manager"}
                />
                <AvatarFallback>
                  <User2 className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {localProject.projectManager.user.name || "Unnamed User"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{localProject.projectManager.user.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Lead Card */}
      {localProject.teamLead && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-5 w-5" />
              Team Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={localProject.teamLead.user.image || ""}
                  alt={localProject.teamLead.user.name || "Lead"}
                />
                <AvatarFallback>
                  <User2 className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {localProject.teamLead.user.name || "Unnamed User"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{localProject.teamLead.user.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Created
              </h4>
              <p className="text-sm">
                {new Date(localProject.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Last Updated
              </h4>
              <p className="text-sm">
                {new Date(localProject.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
