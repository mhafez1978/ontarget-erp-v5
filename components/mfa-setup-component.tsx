"use client";


import { Shield, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import Image from "next/image";



;
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MfaSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  otpauthUrl: string;
}

interface MfaSetupComponentProps {
  onComplete?: (setupAt: Date) => void;
}

export function MfaSetupComponent({ onComplete }: MfaSetupComponentProps = {}) {
  const [step, setStep] = useState<"initial" | "setup" | "verify" | "complete">(
    "initial"
  );
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to setup MFA");
      }

      const data = await response.json();
      setSetupData(data);
      setStep("setup");

      toast.success("MFA Setup Started", {
        description: "Scan the QR code with your authenticator app",
      });
    } catch (error) {
      toast.error("Setup Failed", {
        description:
          error instanceof Error ? error.message : "Could not setup MFA",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Invalid Code", {
        description: "Please enter a 6-digit code",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid verification code");
      }

      setStep("complete");

      // Notify parent component
      onComplete?.(new Date());

      toast.success("MFA Enabled!", {
        description: "Two-factor authentication is now active",
      });
    } catch (error) {
      toast.error("Verification Failed", {
        description: error instanceof Error ? error.message : "Invalid code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const codesText = setupData.backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success("Copied!", {
      description: "Backup codes copied to clipboard",
    });
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const copySecret = () => {
    if (!setupData?.secret) return;

    navigator.clipboard.writeText(setupData.secret);
    toast.success("Copied!", {
      description: "Secret key copied to clipboard",
    });
  };

  if (step === "initial") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Why enable 2FA?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Protect your account from unauthorized access</li>
              <li>Required for sensitive operations</li>
              <li>Secure even if your password is compromised</li>
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">
              What you&apos;ll need:
            </h4>
            <p className="text-sm text-muted-foreground">
              An authenticator app like <strong>Google Authenticator</strong>,{" "}
              <strong>Authy</strong>, or{" "}
              <strong>Microsoft Authenticator</strong>
            </p>
          </div>

          <Button
            onClick={handleStartSetup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Setting up..." : "Enable Two-Factor Authentication"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "setup" && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Use your authenticator app to scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white rounded-lg">
            <div className="relative w-64 h-64">
              <Image
                src={setupData.qrCode}
                alt="MFA QR Code"
                fill
                className="object-contain"
                sizes="256px"
              />
            </div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Can&apos;t scan? Enter manually:
            </Label>
            <div className="flex gap-2">
              <Input
                value={setupData.secret}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={copySecret}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Backup Codes */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                  Save Your Backup Codes
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Store these codes securely. Each code can only be used once.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {setupData.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-2 rounded text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={copyBackupCodes}
              className="w-full"
            >
              {copiedCodes ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Backup Codes
                </>
              )}
            </Button>
          </div>

          <Button onClick={() => setStep("verify")} className="w-full">
            Continue to Verification
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("setup")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify & Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "complete") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>2FA Enabled!</CardTitle>
              <CardDescription>Your account is now more secure</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">What&apos;s next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You&apos;ll be asked for a code when you log in</li>
              <li>• Keep your backup codes in a safe place</li>
              <li>• You can disable 2FA anytime from settings</li>
            </ul>
          </div>

          <Badge variant="secondary" className="w-full justify-center py-2">
            <Shield className="h-4 w-4 mr-2" />
            Two-Factor Authentication Active
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return null;
}
