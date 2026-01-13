"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Lock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  companyId: string;
  companyName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export function CompanyEnableHederaModal({
  companyId,
  companyName,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<{
    enabled: boolean;
    historicalAnchored: boolean;
    enabledAt: string | null;
    transactionCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialogInternal, setShowDialogInternal] = useState(false);
  const isOpen = typeof open === "boolean" ? open : showDialogInternal;
  const setOpen = (v: boolean) => {
    if (onOpenChange) {
      onOpenChange(v);
    } else {
      setShowDialogInternal(v);
    }
  };

  // Form state
  const [confirmText, setConfirmText] = useState("");
  const [anchorHistory, setAnchorHistory] = useState(true);
  const [understands, setUnderstands] = useState(false);
  const [understandsPermanence, setUnderstandsPermanence] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Budget configuration
  const [enableBudget, setEnableBudget] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState("1");

  useEffect(() => {
    fetchStatus();
  }, [companyId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(
        `/api/company/hedera/status?companyId=${companyId}`
      );
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch Hedera status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (confirmText.toLowerCase() !== "enable blockchain") {
      toast.error('Please type "enable blockchain" exactly to confirm');
      return;
    }

    if (!understands || !understandsPermanence) {
      toast.error("Please confirm you understand all warnings");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company/hedera/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          enable: true,
          historicalAnchoring: anchorHistory,
          monthlyBudget: enableBudget ? parseFloat(monthlyBudget) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enable");

      toast.success("Blockchain immutable records enabled", {
        description:
          "All audit logs will now be permanently anchored to Hedera",
      });

      setOpen(false);
      await fetchStatus();
      if (onSuccess) await onSuccess();

      // Reset form
      setConfirmText("");
      setUnderstands(false);
      setUnderstandsPermanence(false);
      setAnchorHistory(true);
      setEnableBudget(false);
      setMonthlyBudget("1");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to enable blockchain"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blockchain Status
            </div>
            {status?.enabled ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Enabled
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Enabled Date</p>
                  <p className="font-medium">
                    {status.enabledAt
                      ? new Date(status.enabledAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transactions Anchored</p>
                  <p className="font-medium">{status.transactionCount}</p>
                </div>
              </div>

              {status.historicalAnchored && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Historical Records Anchored</AlertTitle>
                  <AlertDescription>
                    All past audit logs have been cryptographically anchored to
                    Hedera.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="/dashboard/blockchain-ledger"
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    View Transaction Ledger
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm dark:text-gray-200">
                Blockchain immutable records are not enabled for your company.
                Enable this feature to cryptographically anchor all audit logs
                to Hedera.
              </p>
              <Button onClick={() => setOpen(true)} className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Enable Blockchain Records
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enable Dialog */}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Enable Blockchain Immutable Records
              {companyName ? ` — ${companyName}` : ""}
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be reversed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Critical Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>⚠️ IRREVERSIBLE ACTION</AlertTitle>
              <AlertDescription className="space-y-2">
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>
                    Once enabled,{" "}
                    <strong>blockchain anchoring CANNOT be disabled</strong>
                  </li>
                  <li>
                    All audit logs will be <strong>permanently</strong> anchored
                    to Hedera
                  </li>
                  <li>
                    Records remain on-chain{" "}
                    <strong>even if your account is deleted</strong>
                  </li>
                  <li>
                    This ensures trust but means historical data cannot be
                    hidden
                  </li>
                  <li>
                    Small transaction fees apply (≈0.0001 HBAR per record)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Data Permanence Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>What if my business closes?</AlertTitle>
              <AlertDescription className="text-sm space-y-2">
                <p>
                  <strong>The blockchain data remains forever.</strong> This is
                  intentional and valuable:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Proves your records existed and weren't tampered with</li>
                  <li>
                    Useful for tax audits, legal proceedings, or investor due
                    diligence
                  </li>
                  <li>Export verification links before closing your account</li>
                  <li>
                    No ongoing costs after subscription ends (existing data
                    stays accessible)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Historical Anchoring Option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anchorHistory"
                  checked={anchorHistory}
                  onCheckedChange={(checked) => setAnchorHistory(!!checked)}
                />
                <Label
                  htmlFor="anchorHistory"
                  className="text-sm cursor-pointer"
                >
                  Also anchor all historical audit logs (recommended)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                This will create an immutable record of all past transactions,
                invoices, and audit events.
              </p>
            </div>

            {/* Budget Configuration */}
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <Label className="text-sm font-semibold">
                  Monthly Budget (Optional)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableBudget"
                  checked={enableBudget}
                  onCheckedChange={(checked) => setEnableBudget(!!checked)}
                />
                <Label
                  htmlFor="enableBudget"
                  className="text-sm cursor-pointer"
                >
                  Set spending limit to prevent overuse
                </Label>
              </div>

              {enableBudget && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="monthlyBudget" className="text-sm">
                    Monthly Limit (HBAR)
                  </Label>
                  <Input
                    id="monthlyBudget"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="1.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Transactions will be blocked when this limit is reached.
                    Resets monthly.
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation Checkboxes */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understands"
                  checked={understands}
                  onCheckedChange={(checked) => setUnderstands(!!checked)}
                />
                <Label
                  htmlFor="understands"
                  className="text-sm cursor-pointer leading-tight"
                >
                  I understand this action is <strong>irreversible</strong> and
                  audit logs will be permanently anchored
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understandsPermanence"
                  checked={understandsPermanence}
                  onCheckedChange={(checked) =>
                    setUnderstandsPermanence(!!checked)
                  }
                />
                <Label
                  htmlFor="understandsPermanence"
                  className="text-sm cursor-pointer leading-tight"
                >
                  I understand blockchain data remains{" "}
                  <strong>even after account deletion</strong> (this is a
                  feature, not a bug)
                </Label>
              </div>
            </div>

            {/* Text Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirmText" className="text-sm">
                Type <strong>"enable blockchain"</strong> to confirm
              </Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="enable blockchain"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnable}
              disabled={
                !understands ||
                !understandsPermanence ||
                confirmText.toLowerCase() !== "enable blockchain" ||
                submitting
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Enable Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
