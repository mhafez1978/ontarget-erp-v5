"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialStatus?:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "COMPLETED"
    | "BLOCKED";
  onTaskCreated?: () => void;
}

interface StaffMember {
  id: string;
  user: {
    name: string | null;
    email: string;
  };
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  initialStatus = "TODO",
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Load staff members when dialog opens
  const loadStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to load project");

      const project = await response.json();

      // Get all unique staff members from the project
      const staffSet = new Set<string>();
      const staff: StaffMember[] = [];

      if (project.projectManager) {
        staffSet.add(project.projectManager.id);
        staff.push(project.projectManager);
      }

      if (project.teamLead) {
        if (!staffSet.has(project.teamLead.id)) {
          staffSet.add(project.teamLead.id);
          staff.push(project.teamLead);
        }
      }

      if (project.team?.members) {
        project.team.members.forEach((member: StaffMember) => {
          if (!staffSet.has(member.id)) {
            staffSet.add(member.id);
            staff.push(member);
          }
        });
      }

      setStaffMembers(staff);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Failed to load team members");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && staffMembers.length === 0) {
      loadStaffMembers();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          priority,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create task");
      }

      toast.success("Task created successfully");

      // Reset form
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setDueDate("");
      setAssigneeId("");

      onOpenChange(false);

      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create task"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project with detailed description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe the task in detail..."
              editable={!isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as typeof status)}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as typeof priority)}
                disabled={isLoading}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                disabled={isLoading || isLoadingStaff}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user.name || member.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
