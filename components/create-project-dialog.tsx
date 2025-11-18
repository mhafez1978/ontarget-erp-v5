"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Team {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  role: string;
  jobTitle: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

const PROJECT_STATUSES = [
  {
    value: "PLANNING",
    label: "Planning",
    color: "bg-blue-500/10 text-blue-700",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    color: "bg-green-500/10 text-green-700",
  },
  {
    value: "ON_HOLD",
    label: "On Hold",
    color: "bg-yellow-500/10 text-yellow-700",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    color: "bg-gray-500/10 text-gray-700",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    color: "bg-red-500/10 text-red-700",
  },
];

export function CreateProjectDialog({
  open,
  onOpenChange,
  companyId,
  onSuccess,
}: CreateProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [projectManagerId, setProjectManagerId] = useState("none");
  const [teamLeadId, setTeamLeadId] = useState("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch teams when dialog opens
  useEffect(() => {
    const fetchTeams = async () => {
      if (!open || !companyId) return;

      setTeamsLoading(true);
      try {
        const response = await fetch(`/api/teams?companyId=${companyId}`);
        const data = await response.json();

        if (response.ok && data.teams) {
          setTeams(data.teams);
        } else {
          toast.error("Failed to load teams");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast.error("Failed to load teams");
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, [open, companyId]);

  // Fetch staff when dialog opens
  useEffect(() => {
    const fetchStaff = async () => {
      if (!open || !companyId) return;

      setStaffLoading(true);
      try {
        const response = await fetch(
          `/api/workforce/staff?companyId=${companyId}`
        );
        const data = await response.json();

        if (response.ok && data.staff) {
          setStaff(data.staff);
        } else {
          toast.error("Failed to load staff");
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Failed to load staff");
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaff();
  }, [open, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!teamId) {
      toast.error("Please select a team");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          teamId,
          companyId,
          status,
          projectManagerId:
            projectManagerId === "none" ? null : projectManagerId,
          teamLeadId: teamLeadId === "none" ? null : teamLeadId,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create project");
      }

      toast.success("Project created successfully!");
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName("");
      setDescription("");
      setTeamId("");
      setStatus("PLANNING");
      setProjectManagerId("none");
      setTeamLeadId("none");
      setStartDate("");
      setEndDate("");
      onOpenChange(false);
    }
  };

  const selectedTeam = teams.find((t) => t.id === teamId);
  const selectedPM = staff.find((s) => s.id === projectManagerId);
  const selectedTL = staff.find((s) => s.id === teamLeadId);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Project</SheetTitle>
          <SheetDescription>
            Add a new project to organize work and tasks
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Redesign"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project goals, scope, and key deliverables..."
              rows={4}
            />
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <Label htmlFor="team">
              Team <span className="text-destructive">*</span>
            </Label>
            {teamsLoading ? (
              <div className="flex items-center justify-center py-4 border rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : teams.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No teams available. You need to create a team first before you
                  can create a project.{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() =>
                      (window.location.href = "/dashboard/settings")
                    }
                  >
                    Go to Settings
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={teamId} onValueChange={setTeamId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedTeam && (
              <p className="text-xs text-muted-foreground">
                Project will be assigned to:{" "}
                <strong>{selectedTeam.name}</strong>
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={s.color}>
                        {s.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>

          {/* Project Manager */}
          <div className="space-y-2">
            <Label htmlFor="projectManager">Project Manager (Optional)</Label>
            {staffLoading ? (
              <div className="flex items-center justify-center py-4 border rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={projectManagerId}
                onValueChange={setProjectManagerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.user.name || member.user.email}</span>
                        {member.jobTitle && (
                          <span className="text-xs text-muted-foreground">
                            - {member.jobTitle}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedPM && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={selectedPM.user.image || ""}
                    alt={selectedPM.user.name || "PM"}
                  />
                  <AvatarFallback>
                    {selectedPM.user.name?.[0] ||
                      selectedPM.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {selectedPM.user.name || selectedPM.user.email}
                </span>
              </div>
            )}
          </div>

          {/* Team Lead */}
          <div className="space-y-2">
            <Label htmlFor="teamLead">Team Lead (Optional)</Label>
            {staffLoading ? (
              <div className="flex items-center justify-center py-4 border rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={teamLeadId} onValueChange={setTeamLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.user.name || member.user.email}</span>
                        {member.jobTitle && (
                          <span className="text-xs text-muted-foreground">
                            - {member.jobTitle}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedTL && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={selectedTL.user.image || ""}
                    alt={selectedTL.user.name || "TL"}
                  />
                  <AvatarFallback>
                    {selectedTL.user.name?.[0] ||
                      selectedTL.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {selectedTL.user.name || selectedTL.user.email}
                </span>
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name || !teamId || teams.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
