"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  memberCount: number;
  projectCount: number;
}

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onSuccess: () => void;
}

export function DeleteTeamDialog({
  open,
  onOpenChange,
  team,
  onSuccess,
}: DeleteTeamDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!team) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete team");
      }

      if (result.projectsUnassigned > 0) {
        toast.success(
          `Team deleted successfully! ${result.projectsUnassigned} project(s) are now unassigned.`
        );
      } else {
        toast.success("Team deleted successfully!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Team &quot;{team.name}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <div>
                Are you sure you want to delete this team? This action cannot be
                undone.
              </div>
              {team.memberCount > 0 && (
                <div className="text-sm dark:text-gray-200">
                  This team has {team.memberCount} member
                  {team.memberCount !== 1 ? "s" : ""}. They will be removed from
                  the team but their user accounts will remain active.
                </div>
              )}
              {team.projectCount > 0 && (
                <div className="text-sm dark:text-gray-200">
                  This team has {team.projectCount} project
                  {team.projectCount !== 1 ? "s" : ""}. These projects will
                  become unassigned and will need to be reassigned to another
                  team.
                </div>
              )}
              <div className="text-sm dark:text-gray-200">
                The team and all its assignments will be permanently removed.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Team"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
