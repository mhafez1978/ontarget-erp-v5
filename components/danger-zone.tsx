"use client";

import { AlertTriangle, Download, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DangerZoneProps {
  companyId: string;
  companyName: string;
  isOwner: boolean;
}

export function DangerZone({
  companyId,
  companyName,
  isOwner,
}: DangerZoneProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Cancellation form state
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [deleteImmediately, setDeleteImmediately] = useState("false");

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const response = await fetch(
        `/api/company/export?companyId=${companyId}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to export data");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${companyName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Company data exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to export data"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);

      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          reason: cancelReason,
          feedback: cancelFeedback,
          deleteImmediately: deleteImmediately === "true",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      toast.success(data.message);
      setShowCancelDialog(false);

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/logout";
      }, 2000);
    } catch (error) {
      console.error("Cancellation failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel subscription"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a backup file");
      return;
    }

    try {
      setIsImporting(true);

      // Read file as JSON
      const fileText = await importFile.text();
      const backupData = JSON.parse(fileText);

      const response = await fetch("/api/company/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          backupData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import data");
      }

      toast.success("Data restored successfully! Refreshing...");
      setShowImportDialog(false);

      // Refresh page after short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import data"
      );
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="rounded-lg border border-muted bg-muted/50 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 dark:text-gray-200 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm dark:text-gray-200">
              Danger Zone
            </h3>
            <p className="text-sm dark:text-gray-200 mt-1">
              Only the company owner can access data export and account
              cancellation features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border-2 border-destructive/50 bg-destructive/5 p-6">
        <div className="flex items-start gap-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm dark:text-gray-200 mt-1">
              Irreversible actions that affect your company account and data.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-background">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Export Company Data</h4>
              <p className="text-sm dark:text-gray-200 mt-1">
                Download a complete backup of your company data including staff,
                customers, products, services, and orders.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="ml-4"
            >
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>

          {/* Import/Restore Data */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-background">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Restore from Backup</h4>
              <p className="text-sm dark:text-gray-200 mt-1">
                Upload a previously exported backup file to restore your company
                data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
              disabled={isImporting}
              className="ml-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              Restore
            </Button>
          </div>

          {/* Cancel Subscription */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
            <div className="flex-1">
              <h4 className="font-medium text-sm text-destructive">
                Cancel Subscription & Delete Account
              </h4>
              <p className="text-sm dark:text-gray-200 mt-1">
                Permanently cancel your subscription and delete your company
                account. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="ml-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel & Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Subscription & Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your subscription and schedule your account for
              deletion.
              <strong className="text-foreground">
                {" "}
                We recommend exporting your data first.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>When would you like to delete your account?</Label>
              <RadioGroup
                value={deleteImmediately}
                onValueChange={setDeleteImmediately}
              >
                <div className="flex items-start space-x-2 rounded-lg border p-4">
                  <RadioGroupItem
                    value="false"
                    id="schedule"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="schedule"
                      className="font-medium cursor-pointer"
                    >
                      Schedule for 30 days from now (Recommended)
                    </Label>
                    <p className="text-sm dark:text-gray-200 mt-1">
                      You&apos;ll have 30 days to change your mind and
                      reactivate your account.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 rounded-lg border border-destructive/50 p-4">
                  <RadioGroupItem
                    value="true"
                    id="immediate"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="immediate"
                      className="font-medium cursor-pointer text-destructive"
                    >
                      Delete immediately
                    </Label>
                    <p className="text-sm dark:text-gray-200 mt-1">
                      Your account will be deleted right away. This cannot be
                      undone.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Why are you leaving? (Optional)</Label>
              <select
                id="reason"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="too_expensive">Too expensive</option>
                <option value="missing_features">
                  Missing features I need
                </option>
                <option value="switching_competitor">
                  Switching to a competitor
                </option>
                <option value="no_longer_needed">
                  No longer need the service
                </option>
                <option value="technical_issues">Technical issues</option>
                <option value="poor_support">Poor customer support</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Additional feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us more about your experience..."
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                rows={4}
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Before you go:</p>
              <ul className="text-sm dark:text-gray-200 mt-2 space-y-1 list-disc list-inside">
                <li>Export your data using the button above</li>
                <li>All your company data will be permanently deleted</li>
                <li>Active subscriptions will be cancelled</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep My Account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel & Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Upload a previously exported backup file to restore your company
              data. This will add the data to your current company.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="backup-file">Select Backup File (.json)</Label>
            <input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full mt-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {importFile && (
              <p className="text-sm dark:text-gray-200 mt-2">
                Selected: {importFile.name} (
                {(importFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleImport();
              }}
              disabled={!importFile || isImporting}
            >
              {isImporting ? "Restoring..." : "Restore Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
