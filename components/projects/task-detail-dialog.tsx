"use client";


import { Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

;
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirm";
import { TimeTracker } from "@/components/projects/time-tracker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdById: string;
  assignedToId: string | null;
  timeEntry: number;
  createdBy: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  assignedTo?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
}

interface TeamMember {
  id: string;
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
}

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDelete: (taskId: string) => void;
  teamMembers: TeamMember[];
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedToId: string;
}

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do", color: "bg-gray-500" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { value: "IN_REVIEW", label: "In Review", color: "bg-purple-500" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-500" },
  { value: "BLOCKED", label: "Blocked", color: "bg-red-500" },
];

const PRIORITY_OPTIONS = [
  { value: "URGENT", label: "Urgent", color: "bg-red-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-500" },
  { value: "LOW", label: "Low", color: "bg-green-500" },
];

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  teamMembers,
}: TaskDetailDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeEntry, setTimeEntry] = useState(0);
  const [description, setDescription] = useState("");

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<TaskFormData>({
      defaultValues: {
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: "",
        assignedToId: "UNASSIGNED",
      },
    });

  const watchedStatus = watch("status");
  const watchedPriority = watch("priority");
  const watchedAssignedToId = watch("assignedToId");

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
        assignedToId: task.assignedToId || "UNASSIGNED",
      });
      setDescription(task.description || "");
      setTimeEntry(task.timeEntry || 0);
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!task) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: description || null,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          assignedToId:
            data.assignedToId === "UNASSIGNED" ? null : data.assignedToId,
          timeEntry,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast.success("Task updated successfully");
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    const confirmed = await confirmToast(
      "Are you sure you want to delete this task?",
      { confirmLabel: "Delete task" }
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast.success("Task deleted successfully");
      onDelete(task.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    return (
      STATUS_OPTIONS.find((opt) => opt.value === status)?.color || "bg-gray-500"
    );
  };

  const getPriorityColor = (priority: string) => {
    return (
      PRIORITY_OPTIONS.find((opt) => opt.value === priority)?.color ||
      "bg-gray-500"
    );
  };

  const selectedAssignedTo = teamMembers.find(
    (member) => member.staff.id === watchedAssignedToId
  );

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>
            View and edit task information. Changes are saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Add a description..."
            />
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watchedStatus}
              onValueChange={(value) => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        watchedStatus
                      )}`}
                    />
                    <span>
                      {STATUS_OPTIONS.find((opt) => opt.value === watchedStatus)
                        ?.label || "Select status"}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${option.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={watchedPriority}
              onValueChange={(value) => setValue("priority", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(watchedPriority)}>
                      {PRIORITY_OPTIONS.find(
                        (opt) => opt.value === watchedPriority
                      )?.label || "Select priority"}
                    </Badge>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <Badge className={option.color}>{option.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <Separator />

          {/* Task Owner (Read-only) */}
          <div className="space-y-2">
            <Label>Created By</Label>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={task.createdBy.user.image || ""}
                  alt={task.createdBy.user.name || "User"}
                />
                <AvatarFallback>
                  {task.createdBy.user.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {task.createdBy.user.name || task.createdBy.user.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  Created this task
                </span>
              </div>
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select
              value={watchedAssignedToId}
              onValueChange={(value) => setValue("assignedToId", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedAssignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={selectedAssignedTo.staff.user.image || ""}
                          alt={selectedAssignedTo.staff.user.name || "User"}
                        />
                        <AvatarFallback>
                          {selectedAssignedTo.staff.user.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {selectedAssignedTo.staff.user.name ||
                          selectedAssignedTo.staff.user.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">
                  <span className="text-muted-foreground">Unassigned</span>
                </SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.staff.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={member.staff.user.image || ""}
                          alt={member.staff.user.name || "User"}
                        />
                        <AvatarFallback>
                          {member.staff.user.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {member.staff.user.name || member.staff.user.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Time Tracking */}
          <div className="space-y-2">
            <Label htmlFor="timeTracking" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Tracking
            </Label>
            <TimeTracker
              onTimeChange={setTimeEntry}
              initialMinutes={timeEntry}
            />
            <p className="text-xs text-muted-foreground">
              Track time spent on this task. Time is saved automatically when
              you save the task.
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? "Deleting..." : "Delete Task"}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
