"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { TimeTracker } from "@/components/projects/time-tracker";

interface Task {
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

interface TaskDetailSheetProps {
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
  assigneeId: string;
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

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  teamMembers,
}: TaskDetailSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeEntry, setTimeEntry] = useState(0);

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<TaskFormData>({
      defaultValues: {
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: "",
        assigneeId: "",
      },
    });

  const watchedStatus = watch("status");
  const watchedPriority = watch("priority");
  const watchedAssigneeId = watch("assigneeId");

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
        assigneeId: task.assigneeId || "",
      });
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
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          assigneeId: data.assigneeId || null,
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

    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

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

  const selectedAssignee = teamMembers.find(
    (member) => member.staff.id === watchedAssigneeId
  );

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription>
            View and edit task information. Changes are saved immediately.
          </SheetDescription>
        </SheetHeader>

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
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Add a description..."
              rows={5}
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

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              value={watchedAssigneeId}
              onValueChange={(value) => setValue("assigneeId", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedAssignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={selectedAssignee.staff.user.image || ""}
                          alt={selectedAssignee.staff.user.name || "User"}
                        />
                        <AvatarFallback>
                          {selectedAssignee.staff.user.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {selectedAssignee.staff.user.name ||
                          selectedAssignee.staff.user.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
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
      </SheetContent>
    </Sheet>
  );
}
