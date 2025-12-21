"use client";


import { Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";



;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FolderPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  isPasswordProtected?: boolean; // Made optional since it's not used
  mode: "set" | "verify" | "remove";
  onSuccess?: () => void;
}

export function FolderPasswordDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  mode,
  onSuccess,
}: FolderPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (mode === "set") {
      if (!password || password.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    if (mode === "verify" && !password) {
      toast.error("Please enter the folder password");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "remove"
          ? `/api/company/folders/${folderId}/password`
          : `/api/company/folders/${folderId}/password`;

      const response = await fetch(endpoint, {
        method: mode === "remove" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body:
          mode === "remove"
            ? undefined
            : JSON.stringify({
                password,
                action: mode,
              }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Operation failed");
      }

      if (mode === "set") {
        toast.success("Folder password set successfully");
      } else if (mode === "verify") {
        toast.success("Password verified");
      } else {
        toast.success("Folder password removed");
      }

      onSuccess?.();
      onOpenChange(false);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password operation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process password"
      );
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "set") return "Set Folder Password";
    if (mode === "verify") return "Enter Folder Password";
    return "Remove Folder Password";
  };

  const getDescription = () => {
    if (mode === "set")
      return `Set a password for "${folderName}". This will protect all files and subfolders.`;
    if (mode === "verify")
      return `This folder is password protected. Enter the password to access "${folderName}".`;
    return `Are you sure you want to remove password protection from "${folderName}"?`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "verify" ? (
              <Lock className="h-5 w-5 text-amber-600" />
            ) : (
              <Unlock className="h-5 w-5" />
            )}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {mode !== "remove" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {mode === "set" ? "New Password" : "Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "set"
                      ? "Enter password (min 8 characters)"
                      : "Enter password"
                  }
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mode === "verify") {
                      handleSubmit();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {mode === "set" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                />
              </div>
            )}

            {mode === "set" && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Password must be at least 8 characters</p>
                <p>• This password will protect all files and subfolders</p>
                <p>• Only admins and managers can set/remove passwords</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPassword("");
              setConfirmPassword("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant={mode === "remove" ? "destructive" : "default"}
          >
            {loading
              ? "Processing..."
              : mode === "set"
              ? "Set Password"
              : mode === "verify"
              ? "Unlock"
              : "Remove Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
