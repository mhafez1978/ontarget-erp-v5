"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function EmailProviderWizard() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);

  const copy = async (text: string, message = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch (e) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const Step1 = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Register a new app in Azure AD → <strong>App registrations</strong>.
        Example name: <em>OnTarget ERP Mailer</em>.
      </p>
      <div className="text-xs text-muted-foreground">
        After creation, copy the <strong>Application (client) ID</strong> and
        <strong> Directory (tenant) ID</strong> — you will paste these into the
        form later.
      </div>
      <div className="mt-2 text-xs text-muted-foreground p-2 border rounded bg-muted/4">
        Note: Redirect URIs (Reply URLs) and a Front-channel logout URL are
        required only for delegated (interactive user) auth flows. They are not
        required for server-side client_credentials (app-only) mail sending.
      </div>
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
            Application permissions:{" "}
            <strong>Microsoft Graph → Mail.Send (Application)</strong>
          </div>
        </div>
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Create a client secret (Certificates & secrets) and copy the value now —
        the value is shown only once.
      </p>
      <p className="text-sm text-muted-foreground">
        Add API permissions →{" "}
        <strong>Microsoft Graph → Application permissions → Mail.Send</strong>{" "}
        and then click{" "}
        <strong>Grant admin consent for &lt;your tenant&gt;</strong>. This
        action must be performed by a tenant administrator.
      </p>
      <div className="text-xs text-muted-foreground mt-2 p-2 border rounded bg-muted/5">
        Important: Implicit grant / hybrid flows (Access tokens / ID tokens) are
        for delegated or single-page apps and should not be enabled for
        server-side client_credentials (app-only) mail sending.
      </div>
      <div className="mt-2">
        <div className="flex gap-2">
          <Button
            onClick={() =>
              copy(
                "Mail.Send (Application) — ensure admin consent",
                "Permission copied"
              )
            }
          >
            Copy permission text
          </Button>
        </div>
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Finalize the form: paste Tenant ID, Client ID, Client Secret and From
        Email (must be a mailbox-enabled userPrincipalName like
        <em>admin@yourdomain.com</em>), then Save and click{" "}
        <strong>Test</strong>.
      </p>

      <p className="text-sm text-muted-foreground">
        Quick verification commands (run from a shell) — the first gets an
        access token, the second sends a test message. Replace placeholders.
      </p>

      <pre className="text-xs bg-background p-2 rounded border text-muted-foreground overflow-auto">{`curl -X POST "https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token" -d "client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&scope=https://graph.microsoft.com/.default&grant_type=client_credentials"`}</pre>

      <pre className="text-xs bg-background p-2 rounded border text-muted-foreground overflow-auto">{`curl -X POST "https://graph.microsoft.com/v1.0/users/<FROM_EMAIL>/sendMail" -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" -d '{"message":{"subject":"Test","body":{"contentType":"HTML","content":"Test"},"toRecipients":[{"emailAddress":{"address":"<RECIPIENT>"}}]}}'`}</pre>

      <p className="text-sm text-muted-foreground">
        Troubleshooting: If token acquisition fails, re-check Tenant ID, Client
        ID and Client Secret and confirm admin consent. If send returns "Access
        denied" ensure Mail.Send (Application) is granted and Exchange tenant
        settings allow app-only mail.
      </p>
    </div>
  );

  const getStepContent = () => {
    switch (step) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
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
          <div className="mb-4 text-sm text-muted-foreground">
            Follow these steps to create and configure an Azure AD application
            to send mail from the server using Microsoft Graph (app-only).
          </div>

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
                <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>
                  Next
                </Button>
              )}

              {step === 3 && (
                <Button
                  onClick={() => {
                    setOpen(false);
                    setStep(1);
                    toast.success(
                      "Wizard complete — use the form to paste values and Test"
                    );
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
