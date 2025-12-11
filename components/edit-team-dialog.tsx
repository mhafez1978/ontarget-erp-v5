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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

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

interface TeamMember {
  id: string;
  staffId: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  members?: TeamMember[];
}

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onSuccess: () => void;
}

interface TeamFormData {
  name: string;
  description: string;
}

export function EditTeamDialog({
  open,
  onOpenChange,
  team,
  onSuccess,
}: EditTeamDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [teamLeadIds, setTeamLeadIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when team changes
  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        description: team.description || "",
      });

      // Fetch staff members and current team members
      const fetchStaffAndMembers = async () => {
        setStaffLoading(true);
        try {
          // Fetch staff members
          const staffRes = await fetch(
            `/api/workforce/staff?companyId=${team.companyId}`
          );
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            setStaffMembers(staffData.staff || []);
          }

          // Fetch current team members
          const membersRes = await fetch(`/api/teams/${team.id}/members`);
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            const members = membersData.members || [];

            // Set selected members (all members regardless of role)
            setSelectedMembers(members.map((m: TeamMember) => m.staffId));

            // Find and set all managers
            const managers = members
              .filter((m: TeamMember) => m.role === "MANAGER")
              .map((m: TeamMember) => m.staffId);
            setManagerIds(managers);

            // Find and set all team leads
            const leads = members
              .filter((m: TeamMember) => m.role === "ADMIN")
              .map((m: TeamMember) => m.staffId);
            setTeamLeadIds(leads);
          }
        } catch (error) {
          console.error("Error fetching staff/members:", error);
        } finally {
          setStaffLoading(false);
        }
      };

      if (open) {
        fetchStaffAndMembers();
      }
    }
  }, [team, reset, open]);

  const onSubmit = async (data: TeamFormData) => {
    if (!team) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          managerIds,
          teamLeadIds,
          memberIds: selectedMembers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update team");
      }

      toast.success("Team updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update team"
      );
    } finally {
      setLoading(false);
    }
  };

  // Clean up state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedMembers([]);
      setManagerIds([]);
      setTeamLeadIds([]);
      setStaffMembers([]);
    }
  }, [open]);

  if (!team) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent 
        className="w-full sm:max-w-xl overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside during editing
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing on ESC key during editing
          if (loading) {
            e.preventDefault();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>Edit Team</SheetTitle>
          <SheetDescription>Update team information</SheetDescription>
        </SheetHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between px-6 mt-6 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Step 1: Team Details */}
          {step === 1 && (
            <>
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Team Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", {
                    required: "Team name is required",
                    minLength: {
                      value: 2,
                      message: "Team name must be at least 2 characters",
                    },
                  })}
                  placeholder="e.g., Engineering, Marketing, Sales"
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Brief description of the team's purpose..."
                  rows={4}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Step 2: Team Managers Selection */}
          {step === 2 && (
            <div className="space-y-2">
              <Label>Team Managers</Label>
              <div className="rounded-md border">
                <ScrollArea className="h-[150px]">
                  {staffLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-sm text-muted-foreground">
                        Loading staff...
                      </span>
                    </div>
                  ) : staffMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        No staff members available
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {staffMembers.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            id={`manager-${staff.id}`}
                            checked={managerIds.includes(staff.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setManagerIds((prev) => [...prev, staff.id]);
                                setSelectedMembers((prev) =>
                                  prev.includes(staff.id)
                                    ? prev
                                    : [...prev, staff.id]
                                );
                              } else {
                                setManagerIds((prev) =>
                                  prev.filter((id) => id !== staff.id)
                                );
                              }
                            }}
                            disabled={loading}
                          />
                          <label
                            htmlFor={`manager-${staff.id}`}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={staff.user.image || undefined}
                                alt={staff.user.name || "User"}
                              />
                              <AvatarFallback>
                                {staff.user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {staff.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {staff.jobTitle || staff.role}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {staff.role}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {managerIds.length} manager
                {managerIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Step 3: Team Leads Selection */}
          {step === 3 && (
            <div className="space-y-2">
              <Label>Team Leads</Label>
              <div className="rounded-md border">
                <ScrollArea className="h-[150px]">
                  {staffLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-sm text-muted-foreground">
                        Loading staff...
                      </span>
                    </div>
                  ) : staffMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        No staff members available
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {staffMembers.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            id={`lead-${staff.id}`}
                            checked={teamLeadIds.includes(staff.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTeamLeadIds((prev) => [...prev, staff.id]);
                                setSelectedMembers((prev) =>
                                  prev.includes(staff.id)
                                    ? prev
                                    : [...prev, staff.id]
                                );
                              } else {
                                setTeamLeadIds((prev) =>
                                  prev.filter((id) => id !== staff.id)
                                );
                              }
                            }}
                            disabled={loading}
                          />
                          <label
                            htmlFor={`lead-${staff.id}`}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={staff.user.image || undefined}
                                alt={staff.user.name || "User"}
                              />
                              <AvatarFallback>
                                {staff.user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {staff.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {staff.jobTitle || staff.role}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {staff.role}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {teamLeadIds.length} lead
                {teamLeadIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Step 4: Team Members Selection */}
          {step === 4 && (
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="rounded-md border">
                <ScrollArea className="h-[200px]">
                  {staffLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-sm text-muted-foreground">
                        Loading staff...
                      </span>
                    </div>
                  ) : staffMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        No staff members available
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {staffMembers.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            id={`member-${staff.id}`}
                            checked={selectedMembers.includes(staff.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMembers([
                                  ...selectedMembers,
                                  staff.id,
                                ]);
                              } else {
                                setSelectedMembers(
                                  selectedMembers.filter(
                                    (id) => id !== staff.id
                                  )
                                );
                              }
                            }}
                            disabled={loading}
                          />
                          <label
                            htmlFor={`member-${staff.id}`}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={staff.user.image || undefined}
                                alt={staff.user.name || "User"}
                              />
                              <AvatarFallback>
                                {staff.user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {staff.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {staff.jobTitle || staff.role}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {staff.role}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {selectedMembers.length} member
                {selectedMembers.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
            </div>
            <div>
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (step === 1) {
                      // Validate step 1 - team name required
                      const name = (
                        document.querySelector(
                          '[name="name"]'
                        ) as HTMLInputElement
                      )?.value;
                      if (!name?.trim()) {
                        return;
                      }
                    }
                    setStep(step + 1);
                  }}
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
