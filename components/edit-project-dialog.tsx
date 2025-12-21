"use client";


import { Loader2, Calendar } from "lucide-react";
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

;
import { toast } from "sonner";

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

interface CompanyCustomer {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  companyId: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  teamId: string;
  companyId: string;
  status: string;
  projectManagerId: string | null;
  teamLeadId: string | null;
  startDate: string | null;
  endDate: string | null;
  customerId: string | null;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
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
    value: "BLOCKED",
    label: "Blocked",
    color: "bg-orange-500/10 text-orange-700",
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

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: EditProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [customers, setCustomers] = useState<CompanyCustomer[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [projectManagerId, setProjectManagerId] = useState("none");
  const [teamLeadId, setTeamLeadId] = useState("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerId, setCustomerId] = useState<string>("none");

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setTeamId(project.teamId);
      setStatus(project.status);
      setProjectManagerId(project.projectManagerId || "none");
      setTeamLeadId(project.teamLeadId || "none");
      setStartDate(project.startDate ? project.startDate.split("T")[0] : "");
      setEndDate(project.endDate ? project.endDate.split("T")[0] : "");
      setCustomerId(project.customerId || "none");
    }
  }, [project]);

  // Fetch teams when dialog opens
  useEffect(() => {
    const fetchTeams = async () => {
      if (!open || !project?.companyId) return;

      setTeamsLoading(true);
      try {
        const response = await fetch(
          `/api/teams?companyId=${project.companyId}`
        );
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
  }, [open, project?.companyId]);

  // Fetch staff when dialog opens
  useEffect(() => {
    const fetchStaff = async () => {
      if (!open || !project?.companyId) return;

      setStaffLoading(true);
      try {
        const response = await fetch(
          `/api/workforce/staff?companyId=${project.companyId}`
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
  }, [open, project?.companyId]);

  // Fetch company customers (COMPANY_CUSTOMER role) when dialog opens
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!open || !project?.companyId) return;

      setCustomersLoading(true);
      try {
        const response = await fetch("/api/customers/my-companies");
        const data = await response.json();

        if (response.ok && data.customers) {
          const filtered = (data.customers as CompanyCustomer[]).filter(
            (c) => c.companyId === project.companyId
          );
          setCustomers(filtered);
        } else {
          toast.error("Failed to load customers");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, [open, project?.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project) return;

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
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          teamId,
          status,
          projectManagerId:
            projectManagerId === "none" ? null : projectManagerId,
          teamLeadId: teamLeadId === "none" ? null : teamLeadId,
          startDate: startDate || null,
          endDate: endDate || null,
          customerId: customerId === "none" ? null : customerId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update project");
      }

      toast.success("Project updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update project"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const selectedTeam = teams.find((t) => t.id === teamId);
  const selectedPM = staff.find((s) => s.id === projectManagerId);
  const selectedTL = staff.find((s) => s.id === teamLeadId);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Project</SheetTitle>
          <SheetDescription>
            Update project details and team assignments
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 mt-6">
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
                Assigned to: <strong>{selectedTeam.name}</strong>
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

          {/* Customer (Company Customer) */}
          <div className="space-y-2">
            <Label htmlFor="customer">
              Customer{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (Company customer, optional)
              </span>
            </Label>
            {customersLoading ? (
              <div className="flex items-center justify-center py-4 border rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={customerId} onValueChange={setCustomerId}>
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
            )}
            {selectedCustomer && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={selectedCustomer.image || ""}
                    alt={selectedCustomer.name || "Customer"}
                  />
                  <AvatarFallback>
                    {selectedCustomer.name?.[0] ||
                      selectedCustomer.email?.[0]?.toUpperCase() ||
                      "C"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {selectedCustomer.name || selectedCustomer.email}
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
            <Button type="submit" disabled={loading || !name || !teamId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Project"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
