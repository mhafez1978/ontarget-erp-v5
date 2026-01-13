"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Building,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  enabled: boolean;
  historicalAnchored: boolean;
  enabledAt: string | null;
  transactionCount: number;
}

interface Props {
  userRole?: "SUPER_ADMIN" | "ADMIN";
}

export function CompanyBlockchainList({ userRole }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGloballyConfigured, setIsGloballyConfigured] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Dialog form state
  const [confirmText, setConfirmText] = useState("");
  const [anchorHistory, setAnchorHistory] = useState(true);
  const [understands, setUnderstands] = useState(false);
  const [understandsPermanence, setUnderstandsPermanence] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Budget configuration
  const [enableBudget, setEnableBudget] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState("1");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies/blockchain-status");
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.companies || []);
        setIsGloballyConfigured(data.isGloballyConfigured || false);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (company: Company) => {
    if (company.enabled) {
      // Already enabled - cannot disable
      toast.info("Blockchain is permanently enabled for this company", {
        description: "This setting cannot be disabled once activated",
      });
      return;
    }

    // Check if global Hedera is configured for ADMIN users
    if (userRole === "ADMIN" && !isGloballyConfigured) {
      toast.error("Global Hedera configuration required", {
        description:
          "Please contact your super admin to configure Hedera credentials first.",
      });
      return;
    }

    // Show confirmation dialog
    setSelectedCompany(company);
    setShowDialog(true);
  };

  const handleEnable = async () => {
    if (!selectedCompany) return;

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
          companyId: selectedCompany.id,
          enable: true,
          historicalAnchoring: anchorHistory,
          monthlyBudget: enableBudget ? parseFloat(monthlyBudget) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enable");

      toast.success(`Blockchain enabled for ${selectedCompany.name}`, {
        description:
          "All audit logs will now be permanently anchored to Hedera",
      });

      setShowDialog(false);
      fetchCompanies(); // Refresh list

      // Reset form
      setConfirmText("");
      setUnderstands(false);
      setUnderstandsPermanence(false);
      setAnchorHistory(true);
      setEnableBudget(false);
      setMonthlyBudget("1");
      setSelectedCompany(null);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to enable blockchain",
        {
          description: "Please check global Hedera configuration and try again",
        }
      );
      // Keep dialog open on error so user can retry
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

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center dark:text-gray-200">
          <Building className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm">No companies found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a company to enable blockchain records
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Alert banner for ADMIN users when global Hedera is not configured */}
      {userRole === "ADMIN" && !isGloballyConfigured && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Global Hedera Configuration Required</AlertTitle>
          <AlertDescription>
            Blockchain features are currently disabled. Please contact your
            super admin to configure the global Hedera credentials before you
            can enable blockchain records for your companies.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-muted">
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{company.name}</p>
                      {company.enabled ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    {company.enabled && (
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>
                          Enabled:{" "}
                          {company.enabledAt
                            ? new Date(company.enabledAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                        <span>Transactions: {company.transactionCount}</span>
                        {company.historicalAnchored && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓ Historical Anchored
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {company.enabled && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/dashboard/blockchain-ledger?companyId=${company.id}`}
                        target="_blank"
                        className="flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {company.enabled ? "Locked" : "Enable"}
                      </span>
                      <Switch
                        checked={company.enabled}
                        onCheckedChange={() => handleToggle(company)}
                        disabled={
                          company.enabled ||
                          (userRole === "ADMIN" && !isGloballyConfigured)
                        }
                        className="data-[state=checked]:bg-green-600"
                        aria-label={`Enable blockchain for ${company.name}`}
                      />
                    </div>
                    {company.enabled && (
                      <Lock className="h-3 w-3 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enable Confirmation Dialog */}
      {selectedCompany && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Enable Blockchain for {selectedCompany.name}
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
                      All audit logs will be <strong>permanently</strong>{" "}
                      anchored to Hedera
                    </li>
                    <li>
                      Records remain on-chain{" "}
                      <strong>even if the company is deleted</strong>
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
                <AlertTitle>What if the company closes?</AlertTitle>
                <AlertDescription className="text-sm space-y-2">
                  <p>
                    <strong>The blockchain data remains forever.</strong> This
                    is intentional:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      Proves records existed and weren&apos;t tampered with
                    </li>
                    <li>
                      Useful for tax audits, legal proceedings, or due diligence
                    </li>
                    <li>
                      Export verification links before deleting the company
                    </li>
                    <li>No ongoing costs after subscription ends</li>
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
                  Creates an immutable record of all past transactions and audit
                  events.
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
                      Transactions blocked when limit reached. Resets monthly.
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
                    I understand this action is <strong>irreversible</strong>{" "}
                    and audit logs will be permanently anchored
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
                    <strong>even after company deletion</strong> (this is a
                    feature, not a bug)
                  </Label>
                </div>
              </div>

              {/* Text Confirmation */}
              <div className="space-y-2">
                <Label htmlFor="confirmText" className="text-sm">
                  Type <strong>&quot;enable blockchain&quot;</strong> to confirm
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
                onClick={() => {
                  setShowDialog(false);
                  setSelectedCompany(null);
                  setConfirmText("");
                  setUnderstands(false);
                  setUnderstandsPermanence(false);
                }}
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
      )}
    </>
  );
}
