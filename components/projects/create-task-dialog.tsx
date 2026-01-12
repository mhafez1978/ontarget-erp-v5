"use client";

import { Loader2, Lock } from "lucide-react";
import { useState, useEffect } from "react";
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
interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialStatus?:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "BLOCKED"
    | "COMPLETED"
    | "CANCELLED";
  onTaskCreated?: () => void;
}

interface StaffMember {
  id: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface TeamMember {
  staff: StaffMember;
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
  const [createdById, setCreatedById] = useState<string>("");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Load staff members when dialog opens
  const loadStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      // Get current user info
      const userResponse = await fetch("/api/auth/me");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const currentUserId = userData.user?.id;

        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error("Failed to load project");

        const data = await response.json();
        const project = data.project || data; // Handle both {project: ...} and direct response
        console.log("Full response data:", data);
        console.log("Project data:", project);
        console.log("Project manager:", project.projectManager);
        console.log("Team lead:", project.teamLead);
        console.log("Team members:", project.team?.members);

        // Get all unique staff members from the project
        const staffSet = new Set<string>();
        const staff: StaffMember[] = [];

        if (project.projectManager) {
          console.log("Adding project manager:", project.projectManager);
          staffSet.add(project.projectManager.id);
          staff.push(project.projectManager);
        } else {
          console.log("No project manager found");
        }

        if (project.teamLead) {
          if (!staffSet.has(project.teamLead.id)) {
            console.log("Adding team lead:", project.teamLead);
            staffSet.add(project.teamLead.id);
            staff.push(project.teamLead);
          }
        } else {
          console.log("No team lead found");
        }

        if (project.team?.members) {
          console.log("Processing team members:", project.team.members.length);
          project.team.members.forEach((member: TeamMember) => {
            // Each member has a nested staff property with user data
            console.log("Team member:", member);
            if (member.staff && !staffSet.has(member.staff.id)) {
              console.log("Adding team member staff:", member.staff);
              staffSet.add(member.staff.id);
              staff.push(member.staff);
            }
          });
        } else {
          console.log("No team members found");
        }

        console.log("Final staff array:", staff);
        console.log("Staff count:", staff.length);
        setStaffMembers(staff);

        // Find current user's staff ID and set as default creator
        const currentUserStaff = staff.find(
          (s) =>
            s.user &&
            (s.user.email === userData.user?.email || s.id === currentUserId)
        );
        if (currentUserStaff) {
          setCreatedById(currentUserStaff.id);
        }
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Failed to load team members");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log("handleOpenChange called:", newOpen);
    console.log("staffMembers.length:", staffMembers.length);
    if (newOpen && staffMembers.length === 0) {
      console.log("Loading staff members...");
      loadStaffMembers();
    }
    onOpenChange(newOpen);
  };

  // Load staff members when dialog opens
  useEffect(() => {
    console.log("useEffect triggered, open:", open);
    if (open && staffMembers.length === 0) {
      console.log("Loading staff members via useEffect...");
      loadStaffMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!createdById) {
      toast.error("Task creator is required");
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
          createdById,
          assignedToId: assignedToId || null,
          isPrivate,
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
      setCreatedById("");
      setAssignedToId("");

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto px-6">
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

          <div className="flex flex-row justify-between">
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
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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

          <div className="flex flex-row justify-between">
            <div className="space-y-2">
              <Label htmlFor="assignee">Task Owner (Assignee)</Label>
              {isLoadingStaff ? (
                <div className="flex items-center gap-2 text-sm dark:text-gray-200">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <Select
                  value={createdById}
                  onValueChange={setCreatedById}
                  disabled={isLoading}
                >
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Select task owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.length === 0 ? (
                      <div className="p-2 text-sm dark:text-gray-200">
                        No team members found
                      </div>
                    ) : (
                      staffMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user.name || member.user.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
              {isLoadingStaff ? (
                <div className="flex items-center gap-2 text-sm dark:text-gray-200">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <Select
                  value={assignedToId}
                  onValueChange={setAssignedToId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select team member (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.length === 0 ? (
                      <div className="p-2 text-sm dark:text-gray-200">
                        No team members found
                      </div>
                    ) : (
                      staffMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user.name || member.user.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 py-2 px-4 rounded-lg border bg-muted/50">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="isPrivate"
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>Private task (hidden from company customers)</span>
            </label>
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
