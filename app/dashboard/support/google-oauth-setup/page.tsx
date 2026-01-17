"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { KBArticle } from "@/components/kb-article";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StaffAndAbove } from "@/components/role-guard";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function GoogleOAuthSetupArticle() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data?.authenticated || data?.user?.role === "TRIAL") {
          router.push("/login");
          return;
        }

        setUser(data.user);
        setLoading(false);
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <DashboardLayout user={user || undefined}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 dark:text-gray-200">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <StaffAndAbove>
      <DashboardLayout user={user || undefined}>
        <KBArticle
          title="How to Connect Google OAuth 2.0 Advanced"
          description="Complete step-by-step guide to configure Google OAuth 2.0 for Gmail API email sending"
          category="Email Configuration"
          tags={["Gmail", "OAuth", "Email", "Setup", "Google Cloud"]}
          readTime="10 min"
          lastUpdated="November 17, 2025"
        >
          <Alert className="bg-amber-50 border-amber-200 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>⚠️ Advanced Setup - Consider Gmail SMTP Instead</strong>
              <p className="mt-2">
                This guide is for advanced users who specifically need OAuth.
                For most users, <strong>Gmail SMTP with App Password</strong> is
                much simpler and more reliable. Only use OAuth if you need
                fine-grained permissions or are required to use the Gmail API.
              </p>
            </AlertDescription>
          </Alert>

          <h2>Overview</h2>
          <p>
            Google OAuth 2.0 allows your OnTarget ERP system to send emails
            through Gmail API using secure OAuth authentication. This guide will
            walk you through the entire setup process from creating a Google
            Cloud project to testing your email configuration.
          </p>

          <h2>Prerequisites</h2>
          <ul>
            <li>A Google account (Gmail or Google Workspace)</li>
            <li>Super Admin access to OnTarget ERP</li>
            <li>Access to Google Cloud Console</li>
            <li>The Gmail address you want to send emails from</li>
          </ul>

          <h2>Step 1: Create Google Cloud Project</h2>
          <ol>
            <li>
              Go to{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Cloud Console
              </a>
            </li>
            <li>Click the project dropdown at the top next to Google Cloud</li>
            <li>
              Click <strong>New Project</strong>
            </li>
            <li>
              Enter a project name like OnTarget ERP Email or BB CMS Email
            </li>
            <li>
              Click <strong>Create</strong>
            </li>
            <li>Wait for the project to be created, about 30 seconds</li>
            <li>Select your newly created project from the project dropdown</li>
          </ol>

          <Alert className="my-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Tip:</strong> Give your project a clear name that
              identifies its purpose. This makes it easier to manage if you have
              multiple projects.
            </AlertDescription>
          </Alert>

          <h2>Step 2: Enable Gmail API</h2>
          <ol>
            <li>
              In your Google Cloud project, click the hamburger menu (☰) in the
              top left
            </li>
            <li>
              Navigate to <strong>APIs & Services → Library</strong>
            </li>
            <li>
              In the search bar, type <code>Gmail API</code>
            </li>
            <li>Click on Gmail API in the search results</li>
            <li>
              Click the blue <strong>Enable</strong> button
            </li>
            <li>Wait for it to enable, takes a few seconds</li>
          </ol>

          <h2>Step 3: Configure OAuth Consent Screen</h2>
          <p>
            This step configures the permission screen users see when
            authorizing your app.
          </p>
          <ol>
            <li>
              Go to <strong>APIs & Services → OAuth consent screen</strong>
            </li>
            <li>
              Choose user type:
              <ul>
                <li>
                  <strong>External</strong> - For personal Gmail accounts (most
                  common)
                </li>
                <li>
                  <strong>Internal</strong> - Only if you have Google Workspace
                  and want to restrict to your organization
                </li>
              </ul>
            </li>
            <li>
              Click <strong>Create</strong>
            </li>
            <li>
              Fill in the required fields:
              <ul>
                <li>
                  <strong>App name:</strong> OnTarget ERP or your system name
                </li>
                <li>
                  <strong>User support email:</strong> Your email address
                </li>
                <li>
                  <strong>Developer contact information:</strong> Your email
                  address
                </li>
              </ul>
            </li>
            <li>
              Click <strong>Save and Continue</strong>
            </li>
            <li>
              On the <strong>Scopes</strong> page:
              <ul>
                <li>
                  Click <strong>Add or Remove Scopes</strong>
                </li>
                <li>
                  In the filter box, search for:{" "}
                  <code>https://mail.google.com/</code>
                </li>
                <li>
                  Check the box for <strong>https://mail.google.com/</strong>{" "}
                  (full Gmail access)
                </li>
                <li>
                  Click <strong>Update</strong>
                </li>
                <li>
                  Click <strong>Save and Continue</strong>
                </li>
              </ul>
            </li>
            <li>
              On the <strong>Test users</strong> page:
              <ul>
                <li>
                  Click <strong>+ Add Users</strong>
                </li>
                <li>Enter the Gmail address you&apos;ll use to send emails</li>
                <li>
                  Click <strong>Add</strong>
                </li>
                <li>
                  Click <strong>Save and Continue</strong>
                </li>
              </ul>
            </li>
            <li>
              Review your settings and click <strong>Back to Dashboard</strong>
            </li>
          </ol>

          <Alert className="my-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Important:</strong> The test user must be the same Gmail
              address you&apos;ll use for sending emails. You can add up to 100
              test users.
            </AlertDescription>
          </Alert>

          <h2>Step 4: Create OAuth 2.0 Credentials</h2>
          <ol>
            <li>
              Go to <strong>APIs & Services → Credentials</strong>
            </li>
            <li>
              Click <strong>+ Create Credentials</strong> at the top
            </li>
            <li>
              Select <strong>OAuth client ID</strong>
            </li>
            <li>
              Application type: Select <strong>Web application</strong>
            </li>
            <li>Name: Enter OnTarget ERP Email Service or similar</li>
            <li>
              Under <strong>Authorized redirect URIs</strong>:
              <ul>
                <li>
                  Click <strong>+ Add URI</strong>
                </li>
                <li>
                  Enter exactly:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    https://developers.google.com/oauthplayground
                  </code>
                </li>
                <li>
                  <strong>Important:</strong> No trailing slash! Must be exactly
                  as shown.
                </li>
              </ul>
            </li>
            <li>
              Click <strong>Create</strong>
            </li>
            <li>
              A dialog will appear with your credentials:
              <ul>
                <li>
                  <strong>Client ID:</strong> Copy and save this (looks like:
                  123456789-abc...apps.googleusercontent.com)
                </li>
                <li>
                  <strong>Client Secret:</strong> Copy and save this (looks
                  like: GOCSPX-abc123...)
                </li>
              </ul>
            </li>
            <li>
              Click <strong>OK</strong> to close the dialog
            </li>
          </ol>

          <Alert className="my-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>Security Note:</strong> Keep your Client Secret secure!
              Never share it publicly or commit it to version control. OnTarget
              ERP stores it encrypted in the database.
            </AlertDescription>
          </Alert>

          <h2>Step 5: Generate Refresh Token (OAuth Playground)</h2>
          <p>
            Now we need to generate a refresh token that OnTarget ERP will use
            to send emails on your behalf.
          </p>

          <h3>5.1: Configure OAuth Playground</h3>
          <ol>
            <li>
              Go to{" "}
              <a
                href="https://developers.google.com/oauthplayground"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                OAuth 2.0 Playground
              </a>
            </li>
            <li>
              Click the <strong>⚙️ gear icon</strong> (Settings) in the top
              right corner
            </li>
            <li>
              Check the box: <strong>Use your own OAuth credentials</strong>
            </li>
            <li>
              Enter your credentials:
              <ul>
                <li>
                  <strong>OAuth Client ID:</strong> Paste the Client ID from
                  Step 4
                </li>
                <li>
                  <strong>OAuth Client Secret:</strong> Paste the Client Secret
                  from Step 4
                </li>
              </ul>
            </li>
            <li>
              Configure these important settings:
              <ul>
                <li>
                  <strong>OAuth flow:</strong> Server-side
                </li>
                <li>
                  <strong>OAuth endpoints:</strong> Google
                </li>
                <li>
                  <strong>Access token location:</strong> Authorization header
                  w/ Bearer prefix
                </li>
                <li>
                  <strong>Access type:</strong> Offline ⚠️ (CRITICAL!)
                </li>
                <li>
                  <strong>Force prompt:</strong> Consent screen
                </li>
              </ul>
            </li>
            <li>Click outside the settings panel to close it</li>
          </ol>

          <Alert className="my-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>Critical Setting:</strong> Access type MUST be set to{" "}
              <strong>Offline</strong>. If you use Online, you won&apos;t get a
              refresh token and will have to start over!
            </AlertDescription>
          </Alert>

          <h3>5.2: Authorize and Get Refresh Token</h3>
          <ol>
            <li>
              In the left panel, under{" "}
              <strong>Step 1: Select & authorize APIs</strong>
            </li>
            <li>
              Scroll down to find <strong>Gmail API v1</strong> and expand it
            </li>
            <li>
              Select the scope:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                https://mail.google.com/
              </code>
            </li>
            <li>
              Click the <strong>Authorize APIs</strong> button
            </li>
            <li>
              Sign in with your Google account (the one you added as a test
              user)
            </li>
            <li>
              You may see Google hasn&apos;t verified this app:
              <ul>
                <li>
                  Click <strong>Advanced</strong>
                </li>
                <li>
                  Click <strong>Go to [Your App Name] (unsafe)</strong>
                </li>
                <li>This is safe - it&apos;s your own app!</li>
              </ul>
            </li>
            <li>
              Review the permissions and click <strong>Allow</strong>
            </li>
            <li>You&apos;ll be redirected back to OAuth Playground</li>
            <li>
              In <strong>Step 2: Exchange authorization code for tokens</strong>
            </li>
            <li>
              Click <strong>Exchange authorization code for tokens</strong>
            </li>
            <li>
              You&apos;ll see a JSON response with:
              <ul>
                <li>access_token</li>
                <li>
                  <strong>refresh_token</strong> (this is what you need!)
                </li>
                <li>expires_in</li>
                <li>token_type</li>
              </ul>
            </li>
            <li>
              <strong>Copy the refresh_token</strong> - it starts with{" "}
              <code>1//</code> and is a long string
            </li>
          </ol>

          <h2>Step 6: Configure in OnTarget ERP</h2>
          <p>Now you have everything needed to configure OnTarget ERP!</p>
          <ol>
            <li>Log in to OnTarget ERP as Super Admin or Admin</li>
            <li>
              Navigate to <strong>Settings → Email Providers</strong> tab
            </li>
            <li>
              Click on the <strong>Google OAuth</strong> card (Advanced option)
            </li>
            <li>
              Fill in all the fields:
              <ul>
                <li>
                  <strong>Client ID:</strong> From Step 4
                </li>
                <li>
                  <strong>Client Secret:</strong> From Step 4
                </li>
                <li>
                  <strong>From Email Address:</strong> Your Gmail address like
                  you@gmail.com
                </li>
                <li>
                  <strong>From Name:</strong> Your name or company name like
                  John Doe or OnTarget ERP
                </li>
                <li>
                  <strong>Reply To:</strong> Optional alternate reply address
                </li>
                <li>
                  <strong>Refresh Token:</strong> The long token from Step 5
                  (starts with 1//)
                </li>
              </ul>
            </li>
            <li>
              Click <strong>Test Connection</strong>
            </li>
            <li>If successful, you&apos;ll see a success message</li>
            <li>
              Click <strong>Save & Activate</strong>
            </li>
          </ol>

          <Alert className="my-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Success!</strong> Your Google OAuth email provider is now
              configured and ready to send emails through Gmail API.
            </AlertDescription>
          </Alert>

          <h2>Troubleshooting</h2>

          <h3>Error 400: redirect_uri_mismatch</h3>
          <p>
            <strong>Problem:</strong> The redirect URI in OAuth Playground
            doesn&apos;t match your credentials.
          </p>
          <p>
            <strong>Solution:</strong>
          </p>
          <ul>
            <li>Go back to Google Cloud Console → Credentials</li>
            <li>Edit your OAuth client</li>
            <li>
              Make sure{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                https://developers.google.com/oauthplayground
              </code>{" "}
              is in Authorized redirect URIs
            </li>
            <li>No trailing slash!</li>
            <li>Save and wait 60 seconds for changes to propagate</li>
            <li>Try authorizing again</li>
          </ul>

          <h3>Error 403: access_denied</h3>
          <p>
            <strong>Problem:</strong> Your Gmail address is not added as a test
            user.
          </p>
          <p>
            <strong>Solution:</strong>
          </p>
          <ul>
            <li>Go to OAuth consent screen in Google Cloud Console</li>
            <li>Scroll to Test users section</li>
            <li>Click + Add Users</li>
            <li>Add your Gmail address</li>
            <li>Save and wait a minute</li>
            <li>Try authorizing again</li>
          </ul>

          <h3>No Refresh Token Received</h3>
          <p>
            <strong>Problem:</strong> The response only has access_token, no
            refresh_token.
          </p>
          <p>
            <strong>Solution:</strong>
          </p>
          <ul>
            <li>Access type must be Offline in OAuth Playground settings</li>
            <li>
              Revoke access: Go to{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Account Permissions
              </a>
            </li>
            <li>Remove your app</li>
            <li>Go back to OAuth Playground</li>
            <li>Make sure Access type = Offline</li>
            <li>Authorize again</li>
          </ul>

          <h3>Invalid Grant Error in OnTarget ERP</h3>
          <p>
            <strong>Problem:</strong> Test connection fails with invalid grant
          </p>
          <p>
            <strong>Solution:</strong>
          </p>
          <ul>
            <li>Refresh token may have expired or been revoked</li>
            <li>Generate a new refresh token following Step 5</li>
            <li>Update the refresh token in OnTarget ERP settings</li>
            <li>Make sure the Gmail account matches the one in From Email</li>
          </ul>

          <h2>Gmail Sending Limits</h2>
          <p>Be aware of Gmail&apos;s sending limits:</p>
          <ul>
            <li>
              <strong>Free Gmail accounts:</strong> 500 emails per day
            </li>
            <li>
              <strong>Google Workspace accounts:</strong> 2,000 emails per day
            </li>
            <li>Limits reset at midnight Pacific Time</li>
            <li>
              Exceeding limits will result in temporary sending suspension
              (usually 24 hours)
            </li>
          </ul>

          <h2>Best Practices</h2>
          <ul>
            <li>
              <strong>Use a dedicated email:</strong> Consider using a dedicated
              Gmail account for automated emails
            </li>
            <li>
              <strong>Monitor usage:</strong> Keep track of your daily sending
              volume
            </li>
            <li>
              <strong>Test first:</strong> Always test with the Test Connection
              button before activating
            </li>
            <li>
              <strong>Keep credentials secure:</strong> Never share your Client
              Secret or Refresh Token
            </li>
            <li>
              <strong>Regular maintenance:</strong> Refresh tokens can expire;
              be prepared to regenerate them
            </li>
            <li>
              <strong>Backup option:</strong> Configure a backup email provider
              (like Gmail SMTP) in case OAuth fails
            </li>
          </ul>

          <h2>When to Use OAuth vs SMTP</h2>
          <p>
            <strong>Use OAuth when:</strong>
          </p>
          <ul>
            <li>You need fine-grained permission control</li>
            <li>Your organization requires OAuth for security compliance</li>
            <li>You want to use Gmail API features beyond sending</li>
            <li>
              You&apos;re using Google Workspace with advanced security policies
            </li>
          </ul>
          <p>
            <strong>Use Gmail SMTP when:</strong>
          </p>
          <ul>
            <li>You want simple, reliable email sending</li>
            <li>You don&apos;t need API-level access</li>
            <li>You want easier setup and maintenance</li>
            <li>You&apos;re okay with using an App Password</li>
          </ul>

          <Alert className="my-4">
            <AlertDescription>
              <strong>Need Help?</strong> If you&apos;re still having issues,
              please contact support at{" "}
              <a
                href="mailto:support@ontarget-erp.com"
                className="text-primary underline"
              >
                support@ontarget-erp.com
              </a>{" "}
              or use the Contact Support tab on the Support page.
            </AlertDescription>
          </Alert>
        </KBArticle>
      </DashboardLayout>
    </StaffAndAbove>
  );
}
