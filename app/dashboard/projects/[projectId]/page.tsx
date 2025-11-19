"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  Users,
  CheckCircle2,
  Activity,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectOverviewTab } from "@/components/projects/project-overview-tab";
import { ProjectTeamTab } from "@/components/projects/project-team-tab";
import { ProjectActivityTab } from "@/components/projects/project-activity-tab";
import { TasksBoard } from "@/components/projects/tasks-board";
import { TaskDetailSheet } from "@/components/projects/task-detail-sheet";
import { CreateTaskDialog } from "@/components/projects/create-task-dialog";
import { ProjectNotes } from "@/components/projects/project-notes";
import { StickyNote } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeId: string | null;
  assignee?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
}

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
    timeEntry: number;
    assignee?: {
      id: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    } | null;
  }>;
  _count: {
    tasks: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<
    "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "BLOCKED"
  >("TODO");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  }>({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.user) {
        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
        });
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    async function fetchProjectData() {
      try {
        const [projectResponse, notesResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/notes`),
        ]);

        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project");
        }

        const projectData = await projectResponse.json();
        setProject(projectData.project);

        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    // Will be implemented in Task 17.3
    toast.info("Delete confirmation dialog not yet implemented");
  };

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

  // Calculate total time from tasks and notes
  const totalTaskTime =
    project?.tasks.reduce((sum, task) => sum + (task.timeEntry || 0), 0) || 0;
  const totalNoteTime = notes.reduce(
    (sum, note) => sum + (note.timeEntry || 0),
    0
  );
  const totalTimeMinutes = totalTaskTime + totalNoteTime;

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout user={user}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/projects")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {project.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {project.company.name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${getStatusColor(project.status)}`}
            >
              {project.status.replace("_", " ")}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project._count.tasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.team.members.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Time Tracked
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTimeMinutes > 0 ? formatTime(totalTimeMinutes) : "0m"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalTaskTime > 0 && `${formatTime(totalTaskTime)} tasks`}
                {totalTaskTime > 0 && totalNoteTime > 0 && " • "}
                {totalNoteTime > 0 && `${formatTime(totalNoteTime)} notes`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Start Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.targetStartDate
                  ? new Date(project.targetStartDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.targetEndDate
                  ? new Date(project.targetEndDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks
              <Badge variant="secondary" className="ml-2">
                {project._count.tasks}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="team">
              Team
              <Badge variant="secondary" className="ml-2">
                {project.team.members.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="mr-2 h-4 w-4" />
              Notes
              <Badge variant="secondary" className="ml-2">
                {notes.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ProjectOverviewTab project={project} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TasksBoard
              projectId={project.id}
              onTaskClick={(task) => {
                setSelectedTask(task);
                setIsTaskDetailOpen(true);
              }}
              onCreateTask={(status) => {
                setCreateTaskStatus(status as typeof createTaskStatus);
                setIsCreateTaskOpen(true);
              }}
              onEditTask={(task) => {
                setSelectedTask(task);
                setIsTaskDetailOpen(true);
              }}
              onDeleteTask={(task) => {
                setSelectedTask(task);
                setIsTaskDetailOpen(true);
              }}
              onAssignTask={(task) => {
                setSelectedTask(task);
                setIsTaskDetailOpen(true);
              }}
              onChangePriority={(task) => {
                setSelectedTask(task);
                setIsTaskDetailOpen(true);
              }}
              onSetDueDate={(task) => {
                setSelectedTask(task);
                setIsTaskDetailOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <ProjectTeamTab
              project={project}
              onAddMember={() =>
                toast.info("Add member dialog will be implemented in Task 16.2")
              }
              onRemoveMember={async () => {
                // Will be fully implemented in Task 16.2
                toast.info(
                  "Remove member functionality will be implemented in Task 16.2"
                );
              }}
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <ProjectNotes
              projectId={project.id}
              notes={notes}
              currentUserId={user.email || ""}
            />
          </TabsContent>
          <TabsContent value="activity" className="space-y-4">
            <ProjectActivityTab
              projectId={project.id}
              companyId={project.companyId}
            />
          </TabsContent>
        </Tabs>

        {/* Task Detail Sheet */}
        <TaskDetailSheet
          task={selectedTask}
          open={isTaskDetailOpen}
          onOpenChange={setIsTaskDetailOpen}
          onSave={async () => {
            // Refetch project data to update tasks
            try {
              const response = await fetch(`/api/projects/${projectId}`);
              if (response.ok) {
                const data = await response.json();
                setProject(data.project);
              }
            } catch (error) {
              console.error("Error refreshing project:", error);
            }
          }}
          onDelete={(taskId) => {
            // Remove task from local state
            if (project) {
              setProject({
                ...project,
                tasks: project.tasks.filter((t) => t.id !== taskId),
                _count: {
                  ...project._count,
                  tasks: project._count.tasks - 1,
                },
              });
            }
          }}
          teamMembers={project.team.members}
        />

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          projectId={projectId}
          initialStatus={createTaskStatus}
          onTaskCreated={async () => {
            // Refetch project data to update tasks
            try {
              const response = await fetch(`/api/projects/${projectId}`);
              if (response.ok) {
                const data = await response.json();
                setProject(data.project);
              }
            } catch (error) {
              console.error("Error refreshing project:", error);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
