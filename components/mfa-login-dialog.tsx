"use client";


import { Shield, Key } from "lucide-react";
import { useState } from "react";

;
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MfaLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  validatePath?: string;
}

export function MfaLoginDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
  onError,
  validatePath = "/api/auth/mfa/validate",
}: MfaLoginDialogProps) {
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"authenticator" | "backup">(
    "authenticator"
  );

  const handleVerify = async () => {
    const tokenToVerify = activeTab === "authenticator" ? code : backupCode;

    if (!tokenToVerify) {
      onError("Please enter a verification code");
      return;
    }

    if (activeTab === "authenticator" && tokenToVerify.length !== 6) {
      onError("Code must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(validatePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          token: tokenToVerify,
          isBackupCode: activeTab === "backup",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Verification failed");
      }

      onSuccess();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Invalid verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleVerify();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <AlertDialogTitle>Two-Factor Authentication</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Enter your verification code to continue
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "authenticator" | "backup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="authenticator">Authenticator</TabsTrigger>
            <TabsTrigger value="backup">Backup Code</TabsTrigger>
          </TabsList>

          <TabsContent value="authenticator" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-code">6-Digit Code</Label>
              <Input
                id="mfa-code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyPress={handleKeyPress}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the code from your authenticator app
              </p>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                type="text"
                placeholder="XXXXXXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="text-center text-xl tracking-wider font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                <Key className="h-3 w-3 inline mr-1" />
                Use one of your saved backup codes
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Each backup code can only be used once.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={
              isLoading ||
              (activeTab === "authenticator" ? code.length !== 6 : !backupCode)
            }
            className="flex-1"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
