"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BorderBeam } from "@/components/ui/border-beam";
import { AlertCircle, CheckCircle2, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Company {
  id: string;
  name: string;
}

interface EmailProviderCardsProps {
  userRole: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  type:
    | "GOOGLE_OAUTH"
    | "OFFICE365"
    | "SENDGRID"
    | "MAILGUN"
    | "AWS_SES"
    | "RESEND";
  color: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "google",
    name: "Google OAuth",
    description: "Gmail API with OAuth 2.0",
    icon: "https://www.vectorlogo.zone/logos/google/google-icon.svg",
    type: "GOOGLE_OAUTH",
    color: "from-[#4285F4] to-[#34A853]",
  },
  {
    id: "office365",
    name: "Office 365",
    description: "Microsoft Graph API with OAuth 2.0",
    icon: "https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_logo_%282019%E2%80%93present%29.svg",
    type: "OFFICE365",
    color: "from-[#D83B01] to-[#EA4300]",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Twilio SendGrid email API",
    icon: "https://www.vectorlogo.zone/logos/sendgrid/sendgrid-icon.svg",
    type: "SENDGRID",
    color: "from-[#1A82E2] to-[#00B3E3]",
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Powerful transactional email API",
    icon: "https://www.vectorlogo.zone/logos/mailgun/mailgun-icon.svg",
    type: "MAILGUN",
    color: "from-[#F06B66] to-[#FF4438]",
  },
  {
    id: "aws_ses",
    name: "Amazon SES",
    description: "AWS Simple Email Service",
    icon: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg",
    type: "AWS_SES",
    color: "from-[#FF9900] to-[#F90]",
  },
  {
    id: "resend",
    name: "Resend",
    description: "Modern email API for developers",
    icon: "https://react.email/static/icons/resend-icon.svg",
    type: "RESEND",
    color: "from-[#000000] to-[#1a1a1a]",
  },
];

export function EmailProviderCards({ userRole }: EmailProviderCardsProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("GLOBAL");
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderConfig | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Google OAuth fields
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleFromEmail, setGoogleFromEmail] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");

  // Office 365 OAuth fields
  const [office365TenantId, setOffice365TenantId] = useState("");
  const [office365ClientId, setOffice365ClientId] = useState("");
  const [office365ClientSecret, setOffice365ClientSecret] = useState("");
  const [office365FromEmail, setOffice365FromEmail] = useState("");

  // SendGrid fields
  const [sendgridApiKey, setSendgridApiKey] = useState("");

  // Mailgun fields
  const [mailgunApiKey, setMailgunApiKey] = useState("");
  const [mailgunDomain, setMailgunDomain] = useState("");

  // AWS SES fields
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");

  // Resend fields
  const [resendApiKey, setResendApiKey] = useState("");

  // Common fields
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");

  // Fetch companies for ADMIN users
  useEffect(() => {
    if (userRole === "ADMIN") {
      const fetchCompanies = async () => {
        try {
          const response = await fetch("/api/companies/my-owned");
          const data = await response.json();
          if (response.ok) {
            setCompanies(data.companies || []);
          }
        } catch (err) {
          console.error("Error fetching companies:", err);
        }
      };
      fetchCompanies();
    }
  }, [userRole]);

  // Fetch active provider
  useEffect(() => {
    const fetchActiveProvider = async () => {
      try {
        const url =
          selectedCompanyId === "GLOBAL"
            ? "/api/settings/email-provider?scope=GLOBAL"
            : `/api/settings/email-provider?companyId=${selectedCompanyId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.provider?.isActive) {
          setActiveProvider(data.provider.provider);
        } else {
          setActiveProvider(null);
        }
      } catch (err) {
        console.error("Error fetching active provider:", err);
      }
    };

    fetchActiveProvider();
  }, [selectedCompanyId]);

  const handleCardClick = async (provider: ProviderConfig) => {
    setSelectedProvider(provider);
    setTestSuccess(false);
    setTestResult(null);

    // Fetch existing config
    try {
      const url =
        selectedCompanyId === "GLOBAL"
          ? "/api/settings/email-provider?scope=GLOBAL"
          : `/api/settings/email-provider?companyId=${selectedCompanyId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (
        response.ok &&
        data.provider &&
        data.provider.provider === provider.type
      ) {
        const p = data.provider;
        setGoogleClientId(p.googleClientId || "");
        setGoogleClientSecret(p.googleClientSecret || "");
        setGoogleFromEmail(p.googleFromEmail || "");
        setGoogleRefreshToken(p.googleRefreshToken || "");
        setOffice365TenantId(p.office365TenantId || "");
        setOffice365ClientId(p.office365ClientId || "");
        setOffice365ClientSecret(p.office365ClientSecret || "");
        setOffice365FromEmail(p.office365FromEmail || "");
        setSendgridApiKey(p.sendgridApiKey || "");
        setMailgunApiKey(p.mailgunApiKey || "");
        setMailgunDomain(p.mailgunDomain || "");
        setAwsRegion(p.awsRegion || "us-east-1");
        setAwsAccessKey(p.awsAccessKey || "");
        setAwsSecretKey(p.awsSecretKey || "");
        setResendApiKey(p.resendApiKey || "");
        setFromEmail(p.fromEmail || "");
        setFromName(p.fromName || "");
        setReplyToEmail(p.replyToEmail || "");

        if (p.isConnected) {
          setTestSuccess(true);
          setTestResult({ success: true, message: "Connected" });
        }
      } else {
        // Reset form
        resetForm();
      }
    } catch (err) {
      console.error("Error fetching provider config:", err);
      resetForm();
    }

    setIsSheetOpen(true);
  };

  const resetForm = () => {
    setGoogleClientId("");
    setGoogleClientSecret("");
    setGoogleFromEmail("");
    setGoogleRefreshToken("");
    setOffice365TenantId("");
    setOffice365ClientId("");
    setOffice365ClientSecret("");
    setOffice365FromEmail("");
    setSendgridApiKey("");
    setMailgunApiKey("");
    setMailgunDomain("");
    setAwsRegion("us-east-1");
    setAwsAccessKey("");
    setAwsSecretKey("");
    setResendApiKey("");
    setFromEmail("");
    setFromName("");
    setReplyToEmail("");
  };

  const handleTest = async () => {
    if (!selectedProvider) return;

    try {
      setIsTesting(true);
      setTestResult(null);

      const config = buildConfig();

      const response = await fetch("/api/settings/email-provider/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: "Connection successful!" });
        setTestSuccess(true);
        toast.success("Email provider connection successful!");
      } else {
        setTestResult({
          success: false,
          message: data.error || "Connection failed",
        });
        setTestSuccess(false);
        toast.error(data.error || "Connection failed");
      }
    } catch {
      setTestResult({
        success: false,
        message: "Failed to test connection",
      });
      setTestSuccess(false);
      toast.error("Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) return;

    if (!testSuccess) {
      toast.error("Please test the connection successfully before saving");
      return;
    }

    try {
      setIsSaving(true);

      const config = buildConfig();
      // Auto-enable after successful test
      config.isActive = true;

      const response = await fetch("/api/settings/email-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Email provider settings saved and activated!");
        setActiveProvider(selectedProvider.type);
        setIsSheetOpen(false);
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const buildConfig = () => {
    if (!selectedProvider) return {};

    const config: Record<string, string | number | boolean | null> = {
      provider: selectedProvider.type,
      isActive: false, // Will be set to true after save
      fromEmail,
      fromName,
      replyToEmail,
      scope: selectedCompanyId === "GLOBAL" ? "GLOBAL" : selectedCompanyId,
      companyId: selectedCompanyId === "GLOBAL" ? null : selectedCompanyId,
    };

    if (selectedProvider.type === "GOOGLE_OAUTH") {
      config.googleClientId = googleClientId;
      config.googleClientSecret = googleClientSecret;
      config.googleFromEmail = googleFromEmail;
      config.googleRefreshToken = googleRefreshToken;
    } else if (selectedProvider.type === "OFFICE365") {
      config.office365TenantId = office365TenantId;
      config.office365ClientId = office365ClientId;
      config.office365ClientSecret = office365ClientSecret;
      config.office365FromEmail = office365FromEmail;
    } else if (selectedProvider.type === "SENDGRID") {
      config.sendgridApiKey = sendgridApiKey;
    } else if (selectedProvider.type === "MAILGUN") {
      config.mailgunApiKey = mailgunApiKey;
      config.mailgunDomain = mailgunDomain;
    } else if (selectedProvider.type === "AWS_SES") {
      config.awsRegion = awsRegion;
      config.awsAccessKey = awsAccessKey;
      config.awsSecretKey = awsSecretKey;
    } else if (selectedProvider.type === "RESEND") {
      config.resendApiKey = resendApiKey;
    }

    return config;
  };

  const renderProviderFields = () => {
    if (!selectedProvider) return null;

    switch (selectedProvider.type) {
      case "GOOGLE_OAUTH":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Setup Required:</strong> Create a project in{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Google Cloud Console
                </a>
                , enable Gmail API, create OAuth 2.0 credentials, and generate a
                refresh token using{" "}
                <a
                  href="https://developers.google.com/oauthplayground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  OAuth Playground
                </a>
                .
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="xxxxxxxxx.apps.googleusercontent.com"
                />
                <p className="text-xs text-muted-foreground">
                  OAuth 2.0 Client ID from Google Cloud Console
                </p>
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder="GOCSPX-••••••••••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  OAuth 2.0 Client Secret from Google Cloud Console
                </p>
              </div>
              <div className="space-y-2">
                <Label>From Email Address</Label>
                <Input
                  type="email"
                  value={googleFromEmail}
                  onChange={(e) => setGoogleFromEmail(e.target.value)}
                  placeholder="noreply@yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  Gmail address that will send emails
                </p>
              </div>
              <div className="space-y-2">
                <Label>Refresh Token</Label>
                <Input
                  type="password"
                  value={googleRefreshToken}
                  onChange={(e) => setGoogleRefreshToken(e.target.value)}
                  placeholder="1//••••••••••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  OAuth 2.0 Refresh Token (generate using OAuth Playground)
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Follow the setup guide in the
                  README for step-by-step instructions on configuring Google
                  OAuth.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "OFFICE365":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Setup Required:</strong> Register an app in{" "}
                <a
                  href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Azure Portal
                </a>
                , grant <strong>Mail.Send</strong> permission, and create a
                client secret.
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input
                  value={office365TenantId}
                  onChange={(e) => setOffice365TenantId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Azure AD Directory (tenant) ID
                </p>
              </div>
              <div className="space-y-2">
                <Label>Client ID (Application ID)</Label>
                <Input
                  value={office365ClientId}
                  onChange={(e) => setOffice365ClientId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Application (client) ID from Azure app registration
                </p>
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={office365ClientSecret}
                  onChange={(e) => setOffice365ClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Client secret value from Azure app registration
                </p>
              </div>
              <div className="space-y-2">
                <Label>From Email Address</Label>
                <Input
                  value={office365FromEmail}
                  onChange={(e) => setOffice365FromEmail(e.target.value)}
                  placeholder="noreply@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Email address that will send emails (must have a mailbox)
                </p>
              </div>
            </div>
          </>
        );

      case "SENDGRID":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Setup Required:</strong> Sign up or log in to{" "}
                <a
                  href="https://app.sendgrid.com/settings/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  SendGrid
                </a>
                , create an API key with <strong>Mail Send</strong> permission,
                and verify your sender email address.
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SendGrid API Key</Label>
                <Input
                  type="password"
                  value={sendgridApiKey}
                  onChange={(e) => setSendgridApiKey(e.target.value)}
                  placeholder="SG.••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  API key from SendGrid dashboard (starts with SG.)
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Create your API key in{" "}
                  <a
                    href="https://app.sendgrid.com/settings/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Settings → API Keys
                  </a>{" "}
                  with Full Access or Mail Send permissions. Remember to verify
                  your sender identity in{" "}
                  <a
                    href="https://app.sendgrid.com/settings/sender_auth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Sender Authentication
                  </a>
                  .
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "MAILGUN":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Setup Required:</strong> Sign up at{" "}
                <a
                  href="https://app.mailgun.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Mailgun
                </a>
                , create an API key, add and verify your sending domain in{" "}
                <a
                  href="https://app.mailgun.com/app/sending/domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Sending Domains
                </a>
                .
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mailgun API Key</Label>
                <Input
                  type="password"
                  value={mailgunApiKey}
                  onChange={(e) => setMailgunApiKey(e.target.value)}
                  placeholder="key-••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Private API key from Mailgun dashboard
                </p>
              </div>
              <div className="space-y-2">
                <Label>Mailgun Domain</Label>
                <Input
                  value={mailgunDomain}
                  onChange={(e) => setMailgunDomain(e.target.value)}
                  placeholder="mg.yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  Your verified sending domain (e.g., mg.yourdomain.com)
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Add your domain in{" "}
                  <a
                    href="https://app.mailgun.com/app/sending/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Sending → Domains
                  </a>
                  , then verify it by adding the required DNS records. Find your
                  API key in{" "}
                  <a
                    href="https://app.mailgun.com/app/account/security/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Settings → API Keys
                  </a>
                  .
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "AWS_SES":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Setup Required:</strong> Create an IAM user in{" "}
                <a
                  href="https://console.aws.amazon.com/iam/home#/users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  AWS IAM Console
                </a>{" "}
                with <strong>AmazonSESFullAccess</strong> policy, then verify
                your email address or domain in{" "}
                <a
                  href="https://console.aws.amazon.com/ses/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  SES Console
                </a>
                .
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>AWS Region</Label>
                <Input
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  placeholder="us-east-1"
                />
                <p className="text-xs text-muted-foreground">
                  AWS region where SES is configured (e.g., us-east-1,
                  eu-west-1)
                </p>
              </div>
              <div className="space-y-2">
                <Label>AWS Access Key ID</Label>
                <Input
                  value={awsAccessKey}
                  onChange={(e) => setAwsAccessKey(e.target.value)}
                  placeholder="AKIA••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  IAM user access key ID from AWS credentials
                </p>
              </div>
              <div className="space-y-2">
                <Label>AWS Secret Access Key</Label>
                <Input
                  type="password"
                  value={awsSecretKey}
                  onChange={(e) => setAwsSecretKey(e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  IAM user secret access key from AWS credentials
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Create an IAM user with
                  programmatic access and attach the{" "}
                  <strong>AmazonSESFullAccess</strong> policy. Verify your
                  sender email or domain in{" "}
                  <a
                    href="https://console.aws.amazon.com/ses/home#/verified-identities"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    SES → Verified Identities
                  </a>
                  . Note: New accounts start in sandbox mode with sending
                  limits.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "RESEND":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Setup Required:</strong> Sign up or log in to{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Resend
                </a>
                , create an API key, and verify your sending domain.
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Resend API Key</Label>
                <Input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  API key from Resend dashboard (starts with re_)
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Create your API key in{" "}
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    API Keys
                  </a>{" "}
                  section. Add and verify your domain in{" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Domains
                  </a>{" "}
                  by adding the required DNS records.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Selector for ADMIN */}
      {userRole === "ADMIN" && companies.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Configuration Level</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="GLOBAL">🌐 Global Default (System-wide)</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    🏢 {company.name} (Company Override)
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select &quot;Global Default&quot; to use the system-wide email
                configuration, or choose a company to override with custom
                settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {userRole === "SUPER_ADMIN" && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            You&apos;re configuring the <strong>global default</strong> email
            provider. All companies will use this unless they override it with
            their own settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((provider) => {
          const isActive = activeProvider === provider.type;

          return (
            <Card
              key={provider.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
                isActive && "ring-2 ring-primary"
              )}
              onClick={() => handleCardClick(provider)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br p-2",
                      provider.color
                    )}
                  >
                    <Image
                      src={provider.icon}
                      alt={provider.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain brightness-0 invert"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      {provider.name}
                      {isActive && (
                        <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.description}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Currently sending emails
                  </div>
                )}
              </CardContent>

              {isActive && (
                <BorderBeam
                  size={100}
                  duration={8}
                  borderWidth={4}
                  colorFrom="#10b981"
                  colorTo="#a855f7"
                />
              )}
            </Card>
          );
        })}
      </div>

      {/* Configuration Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedProvider && (
                <>
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br p-2",
                      selectedProvider.color
                    )}
                  >
                    <Image
                      src={selectedProvider.icon}
                      alt={selectedProvider.name}
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain brightness-0 invert"
                      unoptimized
                    />
                  </div>
                  Configure {selectedProvider.name}
                </>
              )}
            </SheetTitle>
            <SheetDescription>{selectedProvider?.description}</SheetDescription>
          </SheetHeader>

          <form className="mt-6 space-y-6 px-6">
            {/* Provider-specific fields */}
            {renderProviderFields()}

            {/* Common fields */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Sender Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="noreply@yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Your Company"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reply-To Email</Label>
                <Input
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  placeholder="support@yourdomain.com"
                />
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleTest}
                disabled={isTesting || isSaving}
                variant="outline"
                className="flex-1"
              >
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
              <Button
                onClick={handleSave}
                disabled={isTesting || isSaving || !testSuccess}
                className="flex-1"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Activate
              </Button>
            </div>

            {!testSuccess && (
              <p className="text-xs text-muted-foreground text-center">
                Test connection successfully before saving
              </p>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
