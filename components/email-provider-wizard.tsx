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
              1) Register a new app in Azure AD →{" "}
              <strong>App registrations</strong>. Use any name you like (eg.
              OnTarget-ERP-Mailer).
                Example name: <em>OnTarget ERP Mailer</em>.
              </p>
              <div className="text-xs text-muted-foreground">After creation, copy the <strong>Application (client) ID</strong> and <strong>Directory (tenant) ID</strong> — you will paste these into the form later.</div>
              <div className="mt-2 text-xs text-muted-foreground p-2 border rounded bg-muted/4">
                Redirect URIs (also shown in Azure as "Redirect URIs" or "Reply URLs") and a Front-channel logout URL are only required for delegated (interactive user) auth flows — not for the server-side client_credentials (app-only) flow we recommend for sending mail. If you later add a delegated login or SPA, register the exact Redirect URI(s) and optionally configure a Front-channel logout URL for single sign-out.
              </div>
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
                  Application permissions:{" "}
                  <strong>Microsoft Graph → Mail.Send (Application)</strong>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs p-2 border rounded bg-muted/4 text-muted-foreground">
              Implicit grant / hybrid flows are for interactive or single-page apps that request tokens directly from the authorization endpoint. If you plan to implement a delegated login (where a user signs in and you obtain a refresh token), you'll configure Redirect URIs and enable the appropriate token checkboxes (ID tokens / Access tokens) under Authentication. For server-side client_credentials (app-only) you do NOT enable implicit grant or add Redirect URIs for the mail sending flow.
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              2) Add API permissions and grant admin consent for the tenant.
              After adding Mail.Send (Application) click{" "}
              <strong>Grant admin consent</strong>.
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
                  <Button
                    onClick={() =>
                      copy(
                        "Mail.Send (Application) — ensure admin consent",
                        "Permission copied"
                      )
                    }
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              3) Create a Client secret (Certificates & secrets), copy the value
              and paste it into the Office365 Client Secret field in the Email
              Provider form.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label>Redirect URI</Label>
                <div className="mt-1 text-xs text-muted-foreground">
                  Not required for app-only (client_credentials), but add if you
                  later implement delegated flows.
                </div>
              </div>
              <div>
                <Label>Example values</Label>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tenant ID, Client ID, Client Secret and From Email
                  (userPrincipalName).
                </div>
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
                    2) Create a client secret (Certificates & secrets) — copy the value
                    now as you will not be able to view it again. Then add API
                    permissions.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add: <strong>Microsoft Graph → Application permissions → Mail.Send</strong> and then click
                    <strong> Grant admin consent for &lt;your tenant&gt;</strong>. This must be performed by a tenant administrator.
                  </p>

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
                    3) Finalize the form: paste Tenant ID, Client ID, Client Secret and
                    From Email (must be a mailbox-enabled userPrincipalName like
                    <em>admin@yourdomain.com</em>), then Save and click <strong>Test</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quick verification commands (run from a shell) — the first gets an
                    access token, the second sends a test message. Replace placeholders
                    and check responses.
                  </p>
                  <pre className="text-xs bg-background p-2 rounded border text-muted-foreground overflow-auto">curl -X POST "https://login.microsoftonline.com/&lt;TENANT_ID&gt;/oauth2/v2.0/token" -d "client_id=&lt;CLIENT_ID&gt;&client_secret=&lt;CLIENT_SECRET&gt;&scope=https://graph.microsoft.com/.default&grant_type=client_credentials"</pre>
                  <pre className="text-xs bg-background p-2 rounded border text-muted-foreground overflow-auto">curl -X POST "https://graph.microsoft.com/v1.0/users/&lt;FROM_EMAIL&gt;/sendMail" -H "Authorization: Bearer &lt;ACCESS_TOKEN&gt;" -H "Content-Type: application/json" -d '{"message":{"subject":"Test","body":{"contentType":"HTML","content":"Test"},"toRecipients":[{"emailAddress":{"address":"&lt;RECIPIENT&gt;"}}]}}'</pre>
                  <p className="text-sm text-muted-foreground">Troubleshooting: If token acquisition fails, re-check Tenant ID, Client ID and Client Secret and verify admin consent. If send returns "Access denied", your app likely lacks Mail.Send (Application) or Exchange tenant policies block app-only mail; confirm permissions and consult Exchange admin settings.</p>
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
