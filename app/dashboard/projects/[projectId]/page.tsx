"use client";

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
  Plus,
  StickyNote,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "sonner";
import { ProjectOverviewTab } from "@/components/projects/project-overview-tab";
import { ProjectTeamTab } from "@/components/projects/project-team-tab";
import { ProjectActivityTab } from "@/components/projects/project-activity-tab";
import { TasksBoard } from "@/components/projects/tasks-board";
import { TaskDetailDialog } from "@/components/projects/task-detail-dialog";
import { CreateTaskDialog } from "@/components/projects/create-task-dialog";
import { ProjectNotes } from "@/components/projects/project-notes";
import { EditProjectDialog } from "@/components/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  order: number;
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

const FINANCE_FEATURE_FLAG =
  process.env.NEXT_PUBLIC_PROJECT_FINANCE_FEATURE === "true";

type FinancialEntryType = "EXPENSE" | "PURCHASE";

interface FinancialEntry {
  id: string;
  entryType: FinancialEntryType;
  description: string | null;
  vendor: string | null;
  referenceId: string | null;
  amount: string;
  cost: string;
  markupAmount: string | null;
  markupPercent: string | null;
  currency: string;
  occurrenceDate: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: {
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
}

interface FinancialFormState {
  description: string;
  vendor: string;
  referenceId: string;
  cost: string;
  markupAmount: string;
  markupPercent: string;
  currency: string;
  occurrenceDate: string;
  receiptUrl: string;
  notes: string;
}

const initialFinancialFormState: FinancialFormState = {
  description: "",
  vendor: "",
  referenceId: "",
  cost: "",
  markupAmount: "",
  markupPercent: "",
  currency: "USD",
  occurrenceDate: "",
  receiptUrl: "",
  notes: "",
};

const createEmptyFinancialFormState = (): FinancialFormState => ({
  ...initialFinancialFormState,
});

const formatMoney = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }

  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const dateForInput = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value.split("T")[0];
};

const tabValueForType = (type: FinancialEntryType) =>
  type === "EXPENSE" ? "expenses" : "purchases";

const labelForType = (type: FinancialEntryType) =>
  type === "EXPENSE" ? "Expense" : "Purchase";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<
    Array<{
      id: string;
      content: string;
      timeEntry: number;
      createdAt: string;
      updatedAt: string;
      author: {
        id: string;
        user: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
        };
      };
    }>
  >([]);
  const [financialEntries, setFinancialEntries] = useState<
    Record<FinancialEntryType, FinancialEntry[]>
  >({
    EXPENSE: [],
    PURCHASE: [],
  });
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeRefreshTrigger, setFinanceRefreshTrigger] = useState(0);
  const [isFinanceDialogOpen, setIsFinanceDialogOpen] = useState(false);
  const [financeDialogType, setFinanceDialogType] =
    useState<FinancialEntryType>("EXPENSE");
  const [isEditingFinancialEntry, setIsEditingFinancialEntry] = useState(false);
  const [selectedFinancialEntry, setSelectedFinancialEntry] =
    useState<FinancialEntry | null>(null);
  const [financeFormState, setFinanceFormState] = useState<FinancialFormState>(
    createEmptyFinancialFormState()
  );
  const [financeSubmitting, setFinanceSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [createTaskStatus, setCreateTaskStatus] = useState<
    "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "BLOCKED"
  >("TODO");
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
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

  const currentFinanceType: FinancialEntryType | null =
    activeTab === "expenses"
      ? "EXPENSE"
      : activeTab === "purchases"
      ? "PURCHASE"
      : null;

  const loadFinancialEntries = useCallback(
    async (type: FinancialEntryType) => {
      if (!projectId) {
        return;
      }

      setFinanceLoading(true);
      try {
        const response = await fetch(
          `/api/projects/${projectId}/financial-entries?entryType=${type}`
        );

        if (!response.ok) {
          throw new Error("Failed to load financial entries");
        }

        const data = await response.json();
        setFinancialEntries((prev) => ({
          ...prev,
          [type]: data.entries ?? [],
        }));
      } catch (error) {
        console.error("Error fetching financial entries:", error);
        toast.error("Unable to load financial entries");
      } finally {
        setFinanceLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (!FINANCE_FEATURE_FLAG || !currentFinanceType) {
      return;
    }

    loadFinancialEntries(currentFinanceType);
  }, [
    FINANCE_FEATURE_FLAG,
    currentFinanceType,
    financeRefreshTrigger,
    loadFinancialEntries,
  ]);

  const handleFinanceDialogOpen = (
    type: FinancialEntryType,
    entry?: FinancialEntry
  ) => {
    setFinanceDialogType(type);
    if (entry) {
      setIsEditingFinancialEntry(true);
      setSelectedFinancialEntry(entry);
      setFinanceFormState({
        description: entry.description ?? "",
        vendor: entry.vendor ?? "",
        referenceId: entry.referenceId ?? "",
        cost: entry.cost ?? "",
        markupAmount: entry.markupAmount ?? "",
        markupPercent: entry.markupPercent ?? "",
        currency: entry.currency ?? "USD",
        occurrenceDate: dateForInput(entry.occurrenceDate),
        receiptUrl: entry.receiptUrl ?? "",
        notes: entry.notes ?? "",
      });
    } else {
      setIsEditingFinancialEntry(false);
      setSelectedFinancialEntry(null);
      setFinanceFormState(createEmptyFinancialFormState());
    }

    setIsFinanceDialogOpen(true);
  };

  const handleFinanceDialogClose = () => {
    setIsFinanceDialogOpen(false);
    setIsEditingFinancialEntry(false);
    setSelectedFinancialEntry(null);
    setFinanceFormState(createEmptyFinancialFormState());
    setFinanceDialogType("EXPENSE");
    setFinanceSubmitting(false);
  };

  const handleFinanceDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleFinanceDialogClose();
      return;
    }

    setIsFinanceDialogOpen(true);
  };

  const handleFinanceFormChange = (
    field: keyof FinancialFormState,
    value: string
  ) => {
    setFinanceFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFinanceSave = async () => {
    if (!projectId) {
      return;
    }

    const trimmedCost = financeFormState.cost.trim();
    if (!trimmedCost) {
      toast.error("Cost is required");
      return;
    }

    setFinanceSubmitting(true);

    const payload: Record<string, unknown> = {
      cost: trimmedCost,
    };

    if (!isEditingFinancialEntry) {
      payload.entryType = financeDialogType;
    }

    const attachValue = (key: string, value: string | undefined) => {
      if (value === undefined) {
        return;
      }

      const trimmed = value.trim();
      if (trimmed.length > 0) {
        payload[key] = trimmed;
      }
    };

    attachValue("description", financeFormState.description);
    attachValue("vendor", financeFormState.vendor);
    attachValue("referenceId", financeFormState.referenceId);
    attachValue("markupAmount", financeFormState.markupAmount);
    attachValue("markupPercent", financeFormState.markupPercent);
    const trimmedCurrencyInput = financeFormState.currency.trim();
    if (trimmedCurrencyInput.length > 0) {
      payload.currency = trimmedCurrencyInput.toUpperCase();
    }
    attachValue("occurrenceDate", financeFormState.occurrenceDate);
    attachValue("receiptUrl", financeFormState.receiptUrl);
    attachValue("notes", financeFormState.notes);

    const entryLabel = labelForType(financeDialogType);
    const endpoint =
      isEditingFinancialEntry && selectedFinancialEntry
        ? `/api/projects/${projectId}/financial-entries/${selectedFinancialEntry.id}`
        : `/api/projects/${projectId}/financial-entries`;
    const method = isEditingFinancialEntry ? "PATCH" : "POST";

    try {
      const savePromise = fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to save entry");
        }
        return data;
      });

      await toast.promise(savePromise, {
        loading: isEditingFinancialEntry
          ? `Updating ${entryLabel.toLowerCase()}...`
          : `Saving ${entryLabel.toLowerCase()}...`,
        success: isEditingFinancialEntry
          ? `${entryLabel} updated`
          : `${entryLabel} created`,
        error: `Unable to save ${entryLabel.toLowerCase()}`,
      });

      setFinanceRefreshTrigger((prev) => prev + 1);
      handleFinanceDialogClose();
    } catch (error) {
      console.error("Error saving financial entry:", error);
    } finally {
      setFinanceSubmitting(false);
    }
  };

  const handleDeleteFinancialEntry = async (entry: FinancialEntry) => {
    if (!projectId) {
      return;
    }

    try {
      const deletePromise = fetch(
        `/api/projects/${projectId}/financial-entries/${entry.id}`,
        { method: "DELETE" }
      ).then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete entry");
        }
      });

      await toast.promise(deletePromise, {
        loading: "Deleting entry...",
        success: "Entry deleted",
        error: "Failed to delete entry",
      });

      setFinanceRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting financial entry:", error);
    }
  };

  const renderFinancialTabContent = (type: FinancialEntryType) => {
    const entries = financialEntries[type];
    const isActiveTab = currentFinanceType === type;
    const label = labelForType(type);

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold dark:text-gray-200">
            {label} overview
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFinanceDialogOpen(type)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {label}
          </Button>
        </div>

        {financeLoading && isActiveTab ? (
          <div className="flex items-center justify-center rounded border border-dashed border-border p-8 text-sm dark:text-gray-200">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading {label.toLowerCase()}...
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded border border-dashed border-border p-6 text-sm dark:text-gray-200">
            No {label.toLowerCase()} recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted text-[0.65rem] uppercase tracking-wide dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3 font-normal">Description</th>
                  <th className="px-4 py-3 font-normal">Vendor</th>
                  <th className="px-4 py-3 font-normal text-right">Cost</th>
                  <th className="px-4 py-3 font-normal text-right">Markup</th>
                  <th className="px-4 py-3 font-normal text-right">Amount</th>
                  <th className="px-4 py-3 font-normal">Currency</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                  <th className="px-4 py-3 font-normal">Creator</th>
                  <th className="px-4 py-3 font-normal">Receipt</th>
                  <th className="px-4 py-3 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">
                        {entry.description || "—"}
                      </div>
                      {entry.notes && (
                        <p className="text-[0.7rem] dark:text-gray-200">
                          {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {entry.vendor || "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {formatMoney(entry.cost)}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {entry.markupAmount ? (
                        <div>
                          <div>{formatMoney(entry.markupAmount)}</div>
                          {entry.markupPercent && (
                            <div className="text-[0.65rem] dark:text-gray-200">
                              {Number(entry.markupPercent).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {formatMoney(entry.amount)}
                    </td>
                    <td className="px-4 py-3 align-top">{entry.currency}</td>
                    <td className="px-4 py-3 align-top">
                      {entry.occurrenceDate
                        ? new Date(entry.occurrenceDate).toLocaleDateString(
                            "en-US"
                          )
                        : new Date(entry.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {entry.createdBy?.user?.name ||
                        entry.createdBy?.user?.email ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {entry.receiptUrl ? (
                        <a
                          href={entry.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() =>
                            handleFinanceDialogOpen(entry.entryType, entry)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-destructive"
                          onClick={() => handleDeleteFinancialEntry(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const handleEdit = () => {
    setIsEditProjectOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleteProjectOpen(true);
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
          <p className="dark:text-gray-200">Project not found</p>
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
                <p className="text-sm dark:text-gray-200">
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
            {/* Hide edit/delete buttons for company customers (read-only access) */}
            {user.role !== "ERP_CUSTOMER" &&
              user.role !== "COMPANY_CUSTOMER" && (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 dark:text-gray-200" />
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
              <Users className="h-4 w-4 dark:text-gray-200" />
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
              <Clock className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTimeMinutes > 0 ? formatTime(totalTimeMinutes) : "0m"}
              </div>
              <p className="text-xs dark:text-gray-200 mt-1">
                {totalTaskTime > 0 && `${formatTime(totalTaskTime)} tasks`}
                {totalTaskTime > 0 && totalNoteTime > 0 && " • "}
                {totalNoteTime > 0 && `${formatTime(totalNoteTime)} notes`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Start Date</CardTitle>
              <Calendar className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Date</CardTitle>
              <Calendar className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
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
            {FINANCE_FEATURE_FLAG && (
              <>
                <TabsTrigger value="expenses">
                  Expenses
                  <Badge variant="secondary" className="ml-2">
                    {financialEntries.EXPENSE.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="purchases">
                  Purchases
                  <Badge variant="secondary" className="ml-2">
                    {financialEntries.PURCHASE.length}
                  </Badge>
                </TabsTrigger>
              </>
            )}
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
              refreshTrigger={taskRefreshTrigger}
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
              onDeleteTask={async (task) => {
                // Show confirmation with sonner
                toast.warning(`Delete task "${task.title}"?`, {
                  description: "This action cannot be undone.",
                  action: {
                    label: "Delete",
                    onClick: async () => {
                      try {
                        const response = await fetch(
                          `/api/projects/${projectId}/tasks/${task.id}`,
                          {
                            method: "DELETE",
                          }
                        );

                        if (!response.ok) {
                          throw new Error("Failed to delete task");
                        }

                        toast.success("Task deleted successfully");
                        setTaskRefreshTrigger((prev) => prev + 1);
                      } catch (error) {
                        console.error("Error deleting task:", error);
                        toast.error("Failed to delete task");
                      }
                    },
                  },
                  cancel: {
                    label: "Cancel",
                    onClick: () => {},
                  },
                });
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
              userRole={user.role}
            />
          </TabsContent>
          {FINANCE_FEATURE_FLAG && (
            <TabsContent value="expenses" className="space-y-4">
              {renderFinancialTabContent("EXPENSE")}
            </TabsContent>
          )}
          {FINANCE_FEATURE_FLAG && (
            <TabsContent value="purchases" className="space-y-4">
              {renderFinancialTabContent("PURCHASE")}
            </TabsContent>
          )}
          <TabsContent value="activity" className="space-y-4">
            <ProjectActivityTab
              projectId={project.id}
              companyId={project.companyId}
            />
          </TabsContent>
        </Tabs>

        {/* Task Detail Sheet */}
        <TaskDetailDialog
          task={selectedTask}
          open={isTaskDetailOpen}
          onOpenChange={setIsTaskDetailOpen}
          onSave={async () => {
            // Refetch project data to update tasks and board
            try {
              const response = await fetch(`/api/projects/${projectId}`);
              if (response.ok) {
                const data = await response.json();
                setProject(data.project);
              }
            } catch (error) {
              console.error("Error refreshing project:", error);
            } finally {
              // Trigger task board to refetch tasks (priority, status, etc.)
              setTaskRefreshTrigger((prev) => prev + 1);
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
                // Trigger task board refresh
                setTaskRefreshTrigger((prev) => prev + 1);
              }
            } catch (error) {
              console.error("Error refreshing project:", error);
            }
          }}
        />

        <Dialog
          open={isFinanceDialogOpen}
          onOpenChange={handleFinanceDialogOpenChange}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {isEditingFinancialEntry ? "Edit" : "Add"}{" "}
                {labelForType(financeDialogType)}
              </DialogTitle>
              <DialogDescription>
                Capture costs, markup, and supporting details for this{" "}
                {labelForType(financeDialogType).toLowerCase()}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleFinanceSave();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={financeFormState.description}
                  onChange={(event) =>
                    handleFinanceFormChange("description", event.target.value)
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input
                    value={financeFormState.vendor}
                    onChange={(event) =>
                      handleFinanceFormChange("vendor", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference ID</Label>
                  <Input
                    value={financeFormState.referenceId}
                    onChange={(event) =>
                      handleFinanceFormChange("referenceId", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={financeFormState.cost}
                    onChange={(event) =>
                      handleFinanceFormChange("cost", event.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Markup Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={financeFormState.markupAmount}
                    onChange={(event) =>
                      handleFinanceFormChange(
                        "markupAmount",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Markup Percent</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={financeFormState.markupPercent}
                    onChange={(event) =>
                      handleFinanceFormChange(
                        "markupPercent",
                        event.target.value
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    value={financeFormState.currency}
                    onChange={(event) =>
                      handleFinanceFormChange("currency", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Occurrence Date</Label>
                  <Input
                    type="date"
                    value={financeFormState.occurrenceDate}
                    onChange={(event) =>
                      handleFinanceFormChange(
                        "occurrenceDate",
                        event.target.value
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Receipt URL</Label>
                  <Input
                    type="url"
                    value={financeFormState.receiptUrl}
                    onChange={(event) =>
                      handleFinanceFormChange("receiptUrl", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={financeFormState.notes}
                  onChange={(event) =>
                    handleFinanceFormChange("notes", event.target.value)
                  }
                  className="min-h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFinanceDialogClose}
                  disabled={financeSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={financeSubmitting}>
                  {financeSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditingFinancialEntry ? "Update" : "Create"}
                  <span className="ml-2">
                    {labelForType(financeDialogType)}
                  </span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        {project && (
          <EditProjectDialog
            open={isEditProjectOpen}
            onOpenChange={setIsEditProjectOpen}
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              teamId: project.teamId,
              companyId: project.companyId,
              status: project.status,
              projectManagerId: project.projectManager?.id || null,
              teamLeadId: project.teamLead?.id || null,
              startDate: project.startDate,
              endDate: project.endDate,
              customerId: project.customerId,
            }}
            onSuccess={async () => {
              try {
                const response = await fetch(`/api/projects/${projectId}`);
                if (response.ok) {
                  const data = await response.json();
                  setProject(data.project);
                }
              } catch (error) {
                console.error("Error refreshing project after edit:", error);
              }
            }}
          />
        )}

        {/* Delete Project Dialog */}
        {project && (
          <DeleteProjectDialog
            open={isDeleteProjectOpen}
            onOpenChange={setIsDeleteProjectOpen}
            projectId={project.id}
            projectName={project.name}
            taskCount={project._count.tasks}
            onSuccess={() => {
              setIsDeleteProjectOpen(false);
              router.push("/dashboard/projects");
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
