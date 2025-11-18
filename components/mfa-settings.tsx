"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MfaSetupComponent } from "@/components/mfa-setup-component";

interface MfaSettingsProps {
  initialMfaEnabled: boolean;
  initialMfaSetupAt?: Date | null;
  onMfaStatusChange?: (enabled: boolean, setupAt?: Date) => void;
}

export function MfaSettings({
  initialMfaEnabled,
  initialMfaSetupAt,
  onMfaStatusChange,
}: MfaSettingsProps) {
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaEnabled);
  const [mfaSetupAt, setMfaSetupAt] = useState(initialMfaSetupAt);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    setMfaEnabled(initialMfaEnabled);
    setMfaSetupAt(initialMfaSetupAt);
  }, [initialMfaEnabled, initialMfaSetupAt]);

  const handleDisableMfa = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast.error("Invalid Code", {
        description: "Please enter a 6-digit code",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: disableCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disable MFA");
      }

      setMfaEnabled(false);
      setMfaSetupAt(null);
      setShowDisableDialog(false);
      setDisableCode("");

      // Notify parent component
      onMfaStatusChange?.(false, undefined);

      toast.success("2FA Disabled", {
        description: "Two-factor authentication has been turned off",
      });
    } catch (error) {
      toast.error("Failed to Disable", {
        description: error instanceof Error ? error.message : "Invalid code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSetup) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowSetup(false)}>
          ← Back to Settings
        </Button>
        <MfaSetupComponent
          onComplete={(setupAt) => {
            setMfaEnabled(true);
            setMfaSetupAt(setupAt);
            setShowSetup(false);
            // Notify parent component
            onMfaStatusChange?.(true, setupAt);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Secure your account with 2FA</CardDescription>
              </div>
            </div>
            {mfaEnabled ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaEnabled ? (
            <>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-green-800 dark:text-green-200">
                      Your account is protected
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Two-factor authentication is active since{" "}
                      {mfaSetupAt
                        ? new Date(mfaSetupAt).toLocaleDateString()
                        : "recently"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    You&apos;ll need your authenticator app when logging in
                  </li>
                  <li>Use backup codes if you lose your device</li>
                  <li>Keep your backup codes in a safe place</li>
                </ul>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
                className="w-full"
              >
                Disable Two-Factor Authentication
              </Button>
            </>
          ) : (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                      Enhance your security
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Enable 2FA to add an extra layer of protection to your
                      account
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Benefits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Protect against password theft</li>
                  <li>Required for sensitive operations</li>
                  <li>Industry-standard security practice</li>
                </ul>
              </div>

              <Button onClick={() => setShowSetup(true)} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disable MFA Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable Two-Factor Authentication?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will make your account less secure. Enter your current
              verification code to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                <strong>Warning:</strong> Your account will be less secure
                without 2FA.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disable-code">Verification Code</Label>
              <Input
                id="disable-code"
                type="text"
                placeholder="000000"
                value={disableCode}
                onChange={(e) =>
                  setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisableDialog(false);
                  setDisableCode("");
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisableMfa}
                disabled={isLoading || disableCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
