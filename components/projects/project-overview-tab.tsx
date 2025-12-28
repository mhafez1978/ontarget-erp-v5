"use client";

import {
  Calendar,
  User2,
  Users,
  Clock,
  Target,
  AlertCircle,
  Mail,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InlineEditSection } from "@/components/projects/inline-edit-section";
import { useState, useEffect } from "react";

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

interface CompanyCustomer {
  id: string;
  name: string | null;
  email: string | null;
}

interface ProjectOverviewTabProps {
  project: Project;
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const [localProject, setLocalProject] = useState(project);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customers, setCustomers] = useState<CompanyCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Keep localProject in sync when the parent project prop changes
  useEffect(() => {
    setLocalProject(project);
  }, [project]);

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
            title="Project Name"
            value={localProject.name}
            fieldName="name"
            projectId={localProject.id}
            type="text"
            placeholder="Set project name..."
            onSave={(newValue) => {
              setLocalProject((prev) => ({ ...prev, name: newValue }));
            }}
          />

          <InlineEditSection
            title="Description"
            value={localProject.description}
            fieldName="description"
            projectId={localProject.id}
            type="textarea"
            placeholder="Add a project description..."
            onSave={(newValue) => {
              setLocalProject((prev) => ({
                ...prev,
                description: newValue,
              }));
            }}
          />

          {/* Customer Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Customer
              </h4>
              {/* Allow editing only for company customer (not ERP subscriber company) */}
              {!localProject.subscriberCompany && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={async () => {
                    if (!isEditingCustomer && customers.length === 0) {
                      try {
                        setCustomersLoading(true);
                        const response = await fetch(
                          "/api/customers/my-companies"
                        );
                        const data = await response.json();
                        if (response.ok && data.customers) {
                          const filtered = (
                            data.customers as Array<{
                              id: string;
                              name: string;
                              email: string;
                              companyId: string;
                            }>
                          ).filter(
                            (c) => c.companyId === localProject.company.id
                          );
                          setCustomers(
                            filtered.map((c) => ({
                              id: c.id,
                              name: c.name,
                              email: c.email,
                            }))
                          );
                        }
                      } catch (error) {
                        console.error("Failed to load customers:", error);
                      } finally {
                        setCustomersLoading(false);
                      }
                    }
                    setIsEditingCustomer((prev) => !prev);
                  }}
                  aria-label="Edit customer"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>

            {isEditingCustomer && !localProject.subscriberCompany ? (
              customersLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading customers...
                </p>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No company customers available.
                </p>
              ) : (
                <div className="max-w-xs">
                  <Select
                    value={localProject.customer?.id || "none"}
                    onValueChange={async (value) => {
                      const nextCustomerId =
                        value === "none" ? null : value || null;
                      try {
                        const response = await fetch(
                          `/api/projects/${localProject.id}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              customerId: nextCustomerId,
                            }),
                          }
                        );
                        if (!response.ok) {
                          const err = await response.json().catch(() => ({}));
                          throw new Error(
                            err.error || "Failed to update customer"
                          );
                        }

                        if (nextCustomerId) {
                          const selected = customers.find(
                            (c) => c.id === nextCustomerId
                          );
                          setLocalProject((prev) => ({
                            ...prev,
                            customer: selected
                              ? {
                                  id: selected.id,
                                  name: selected.name,
                                  email: selected.email || "",
                                }
                              : prev.customer ?? null,
                          }));
                        } else {
                          setLocalProject((prev) => ({
                            ...prev,
                            customer: null,
                          }));
                        }
                      } catch (error) {
                        console.error("Error updating customer:", error);
                      } finally {
                        setIsEditingCustomer(false);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {customer.name || customer.email || "Customer"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            ) : localProject.subscriberCompany ? (
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

          <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
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
                setLocalProject((prev) => ({
                  ...prev,
                  startDate: newValue,
                }));
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
                setLocalProject((prev) => ({
                  ...prev,
                  endDate: newValue,
                }));
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
