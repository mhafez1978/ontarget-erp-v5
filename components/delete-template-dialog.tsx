"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  onSuccess?: () => void;
}

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  onSuccess,
}: DeleteTemplateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }

      toast.success("Template deleted", {
        description: `${templateName} has been removed.`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to delete", {
        description:
          error instanceof Error ? error.message : "Could not delete template",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{templateName}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? "Deleting..." : "Delete Template"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
