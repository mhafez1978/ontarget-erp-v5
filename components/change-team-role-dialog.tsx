"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ChangeTeamRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  memberId: string;
  memberName: string;
  currentRole: string;
  onSuccess: () => void;
}

const TEAM_ROLES = [
  {
    value: "ADMIN",
    label: "Admin",
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
    description: "Full team management access",
  },
  {
    value: "MANAGER",
    label: "Manager",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    description: "Can manage projects and assign tasks",
  },
  {
    value: "STAFF",
    label: "Staff",
    color: "bg-green-500/10 text-green-700 border-green-200",
    description: "Can work on assigned tasks",
  },
  {
    value: "CONTRACTOR",
    label: "Contractor",
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
    description: "External workers who can be assigned tasks",
  },
];

export function ChangeTeamRoleDialog({
  open,
  onOpenChange,
  teamId,
  memberId,
  memberName,
  currentRole,
  onSuccess,
}: ChangeTeamRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedRole === currentRole) {
      toast.info("No changes made to role");
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update team role");
      }

      toast.success("Team role updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating team role:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update team role"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedRole(currentRole);
      onOpenChange(false);
    }
  };

  const selectedRoleData = TEAM_ROLES.find((r) => r.value === selectedRole);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Change Team Role</SheetTitle>
          <SheetDescription>
            Update the team role for <strong>{memberName}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div>
              <Badge
                variant="outline"
                className={
                  TEAM_ROLES.find((r) => r.value === currentRole)?.color
                }
              >
                {TEAM_ROLES.find((r) => r.value === currentRole)?.label}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              New Role <span className="text-destructive">*</span>
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
            {selectedRoleData && (
              <p className="text-xs text-muted-foreground">
                {selectedRoleData.description}
              </p>
            )}
          </div>

          {selectedRole !== currentRole && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This will change {memberName}&apos;s permissions and access
                level within the team.
              </p>
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
            onClick={handleSubmit}
            disabled={loading || selectedRole === currentRole}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Role"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
