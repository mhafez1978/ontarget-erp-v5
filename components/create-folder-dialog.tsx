"use client";

import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "sonner";

interface Folder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
}

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  folders: Folder[];
  onFolderCreated?: () => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  companyId,
  folders,
  onFolderCreated,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/files/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName.trim(),
          parentId: parentId === "__root__" ? null : parentId || null,
          companyId,
          type: "CUSTOM",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create folder");
      }

      toast.success("Folder created successfully");
      onFolderCreated?.();
      handleClose();
    } catch (error) {
      console.error("Create folder error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create folder"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName("");
    setParentId("");
    onOpenChange(false);
  };

  // Build folder hierarchy for display
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder in your company file structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              disabled={creating}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-folder">Parent Folder (optional)</Label>
            <Select
              value={parentId}
              onValueChange={setParentId}
              disabled={creating}
            >
              <SelectTrigger id="parent-folder">
                <SelectValue placeholder="Root (no parent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">Root (no parent)</SelectItem>
                {rootFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
                {folders
                  .filter((f) => f.parentId)
                  .map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.path.replace(/^\//, "")}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs dark:text-gray-200">
              Select a parent folder or leave empty to create in the root
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !folderName.trim()}
          >
            {creating ? "Creating..." : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
