"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function EmailProviderWizard() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);

  // copy helper
  const copy = async (text: string, message = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch (e) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              1) Register a new app in Azure AD → <strong>App registrations</strong>. Use any name you like (eg. OnTarget-ERP-Mailer).
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label>Quick link</Label>
                <a
                  href="https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block mt-1 text-sm text-primary underline"
                >
                  Open Azure App registrations
                </a>
              </div>
              <div>
                <Label>What to add</Label>
                <div className="mt-1 text-xs text-muted-foreground">
                  Application permissions: <strong>Microsoft Graph → Mail.Send (Application)</strong>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              2) Add API permissions and grant admin consent for the tenant. After adding Mail.Send (Application) click <strong>Grant admin consent</strong>.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label>Permission note</Label>
                <Input
                  readOnly
                  value="Microsoft Graph → Application permissions → Mail.Send"
                />
              </div>
              <div>
                <Label>Copy quick note</Label>
                <div className="flex gap-2 mt-1">
                  <Button onClick={() => copy('Mail.Send (Application) — ensure admin consent', 'Permission copied')}>Copy</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              3) Create a Client secret (Certificates & secrets), copy the value and paste it into the Office365 Client Secret field in the Email Provider form.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label>Redirect URI</Label>
                <div className="mt-1 text-xs text-muted-foreground">Not required for app-only (client_credentials), but add if you later implement delegated flows.</div>
              </div>
              <div>
                <Label>Example values</Label>
                <div className="mt-1 text-xs text-muted-foreground">Tenant ID, Client ID, Client Secret and From Email (userPrincipalName).</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="outline">Open setup wizard</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Office 365 setup wizard</DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <div className="mb-4 text-sm text-muted-foreground">Follow these steps to create and configure an Azure AD application to send mail from the server using Microsoft Graph (app-only).</div>

          <div className="space-y-6">{getStepContent()}</div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                disabled={step <= 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                Back
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {step < 3 && (
                <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</Button>
              )}
              {step === 3 && (
                <Button
                  onClick={() => {
                    setOpen(false);
                    setStep(1);
                    toast.success("Wizard complete — use the form to paste values and Test");
                  }}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailProviderWizard;
