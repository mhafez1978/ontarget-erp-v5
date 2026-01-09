"use client";


import { Loader2, Users, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface ExistingMember {
  id: string;
  staffId: string;
}

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  companyId: string;
  existingMembers: ExistingMember[];
  onSuccess: () => void;
}

const TEAM_ROLES = [
  {
    value: "ADMIN",
    label: "Admin",
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
  },
  {
    value: "MANAGER",
    label: "Manager",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  {
    value: "STAFF",
    label: "Staff",
    color: "bg-green-500/10 text-green-700 border-green-200",
  },
  {
    value: "CONTRACTOR",
    label: "Contractor",
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
  },
];

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  teamId,
  companyId,
  existingMembers,
  onSuccess,
}: AddTeamMemberDialogProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("STAFF");
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);

  // Fetch staff members when dialog opens
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!open || !companyId) return;

      setStaffLoading(true);
      try {
        const response = await fetch(
          `/api/workforce/staff?companyId=${companyId}`
        );
        const data = await response.json();

        if (response.ok && data.staff) {
          // Filter out existing team members
          const existingStaffIds = existingMembers.map((m) => m.staffId);
          const availableStaff = data.staff.filter(
            (staff: StaffMember) => !existingStaffIds.includes(staff.id)
          );
          setStaffMembers(availableStaff);
        } else {
          toast.error("Failed to load staff members");
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Failed to load staff members");
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaffMembers();
  }, [open, companyId, existingMembers]);

  const handleSubmit = async () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaffId,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add team member");
      }

      toast.success("Team member added successfully!");
      setSelectedStaffId("");
      setSelectedRole("STAFF");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add team member"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedStaffId("");
      setSelectedRole("STAFF");
      onOpenChange(false);
    }
  };

  const selectedStaff = staffMembers.find((s) => s.id === selectedStaffId);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Team Member</SheetTitle>
          <SheetDescription>
            Select a staff member and assign their role in the team
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Staff Member Selection */}
          <div className="space-y-2">
            <Label>
              Select Staff Member <span className="text-destructive">*</span>
            </Label>
            {staffLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : staffMembers.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No available staff members to add
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-2 space-y-2">
                  {staffMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedStaffId === member.id
                          ? "bg-primary/10 border-2 border-primary"
                          : "hover:bg-muted border-2 border-transparent"
                      }`}
                      onClick={() => setSelectedStaffId(member.id)}
                    >
                      {selectedStaffId === member.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={member.user.image || ""}
                          alt={member.user.name || "User"}
                        />
                        <AvatarFallback>
                          {member.user.name?.[0] ||
                            member.user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.user.name || member.user.email}
                        </p>
                        {member.jobTitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {member.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Selected Staff Preview */}
          {selectedStaff && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Selected Member:
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedStaff.user.image || ""}
                    alt={selectedStaff.user.name || "User"}
                  />
                  <AvatarFallback>
                    {selectedStaff.user.name?.[0] ||
                      selectedStaff.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedStaff.user.name || selectedStaff.user.email}
                  </p>
                  {selectedStaff.jobTitle && (
                    <p className="text-sm text-muted-foreground">
                      {selectedStaff.jobTitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Team Role <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={role.color}>
                        {role.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedRole === "ADMIN" && "Full team management access"}
              {selectedRole === "MANAGER" &&
                "Can manage projects and assign tasks"}
              {selectedRole === "STAFF" && "Can work on assigned tasks"}
              {selectedRole === "CONTRACTOR" &&
                "External workers who can be assigned tasks"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedStaffId}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
