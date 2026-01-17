"use client";

import {
  Loader2,
  Mail,
  AlertCircle,
  Crown,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";
import EmailProviderWizard from "@/components/email-provider-wizard";

interface Company {
  id: string;
  name: string;
}

interface EmailProviderSettingsProps {
  userRole: string;
}

interface TestDiagnostics {
  success?: boolean;
  error?: string;
  message?: string;
  tokenResponse?: {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  graphResponse?: {
    status?: number;
    statusText?: string;
    data?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

const PROVIDER_TYPES = [
  { value: "SMTP", label: "SMTP" },
  { value: "GMAIL", label: "Gmail (Legacy)" },
  { value: "GOOGLE_OAUTH", label: "Google OAuth (Recommended)" },
  { value: "OFFICE365", label: "Office 365 / Microsoft OAuth" },
  { value: "SENDGRID", label: "SendGrid" },
  { value: "MAILGUN", label: "Mailgun" },
  { value: "AWS_SES", label: "AWS SES" },
  { value: "RESEND", label: "Resend" },
];

export default function EmailProviderSettings({
  userRole,
}: EmailProviderSettingsProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("GLOBAL");
  const [provider, setProvider] = useState<string>("SMTP");
  const [isActive, setIsActive] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  // Raw diagnostics payload returned from the server (full JSON)
  const [testDiagnostics, setTestDiagnostics] =
    useState<TestDiagnostics | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Track whether the last test succeeded
  const [testSuccess, setTestSuccess] = useState(false);

  // Track secret-related UI state and validation
  const [office365SecretDirty, setOffice365SecretDirty] = useState(false);
  const [office365SecretError, setOffice365SecretError] = useState<
    string | null
  >(null);

  // SMTP fields
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false); // Default to STARTTLS (port 587)

  // SendGrid fields
  const [sendgridApiKey, setSendgridApiKey] = useState("");

  // Mailgun fields
  const [mailgunApiKey, setMailgunApiKey] = useState("");
  const [mailgunDomain, setMailgunDomain] = useState("");

  // AWS SES fields
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");

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

  // Common fields
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");

  // Password visibility toggles
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [showMailgunKey, setShowMailgunKey] = useState(false);
  const [showAwsKeys, setShowAwsKeys] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showGoogleRefreshToken, setShowGoogleRefreshToken] = useState(false);
  const [showOffice365Secret, setShowOffice365Secret] = useState(false);

  // Track dirty state
  const [isDirty, setIsDirty] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<Record<
    string,
    string | boolean
  > | null>(null);

  // Check if form is dirty whenever values change
  useEffect(() => {
    if (!originalConfig) {
      setIsDirty(false);
      return;
    }

    const currentConfig: Record<string, string | boolean> = {
      provider,
      isActive,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpSecure,
      googleClientId,
      googleClientSecret,
      googleFromEmail,
      googleRefreshToken,
      sendgridApiKey,
      mailgunApiKey,
      mailgunDomain,
      awsRegion,
      awsAccessKey,
      awsSecretKey,
      office365TenantId,
      office365ClientId,
      office365ClientSecret,
      office365FromEmail,
      fromEmail,
      fromName,
      replyToEmail,
    };

    const hasChanges = Object.keys(currentConfig).some(
      (key) => currentConfig[key] !== originalConfig[key]
    );
    setIsDirty(hasChanges);
  }, [
    provider,
    isActive,
    smtpHost,
    smtpPort,
    smtpUsername,
    smtpPassword,
    smtpSecure,
    googleClientId,
    googleClientSecret,
    googleFromEmail,
    googleRefreshToken,
    sendgridApiKey,
    mailgunApiKey,
    mailgunDomain,
    awsRegion,
    awsAccessKey,
    awsSecretKey,
    office365TenantId,
    office365ClientId,
    office365ClientSecret,
    office365FromEmail,
    fromEmail,
    fromName,
    replyToEmail,
    originalConfig,
  ]);

  // Fetch companies for ADMIN_OWNER users
  useEffect(() => {
    if (userRole === "ADMIN_OWNER" || userRole === "ADMIN_NONOWNER") {
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

  // Fetch email provider settings when company selection changes
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const url =
          selectedCompanyId === "GLOBAL"
            ? "/api/settings/email-provider?scope=GLOBAL"
            : `/api/settings/email-provider?companyId=${selectedCompanyId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.provider) {
          const p = data.provider;
          const configValues = {
            provider: p.provider,
            isActive: p.isActive,
            smtpHost: p.smtpHost || "",
            smtpPort: String(p.smtpPort || 587),
            smtpUsername: p.smtpUsername || "",
            smtpPassword: "",
            smtpSecure: p.smtpSecure,
            googleClientId: p.googleClientId || "",
            googleClientSecret: "",
            googleFromEmail: p.googleFromEmail || "",
            googleRefreshToken: "",
            sendgridApiKey: "",
            mailgunApiKey: "",
            mailgunDomain: p.mailgunDomain || "",
            awsRegion: p.awsRegion || "us-east-1",
            awsAccessKey: "",
            awsSecretKey: "",
            office365TenantId: p.office365TenantId || "",
            office365ClientId: p.office365ClientId || "",
            // Do NOT pre-fill secret inputs with stored (encrypted) values.
            // Stored secrets are encrypted in the DB; exposing them in the UI
            // would show ciphertext and cause errors if used for a token request.
            office365ClientSecret: "",
            office365FromEmail: p.office365FromEmail || "",
            fromEmail: p.fromEmail || "",
            fromName: p.fromName || "",
            replyToEmail: p.replyToEmail || "",
          };

          setProvider(configValues.provider);
          setIsActive(configValues.isActive);
          setSmtpHost(configValues.smtpHost);
          setSmtpPort(configValues.smtpPort);
          setSmtpUsername(configValues.smtpUsername);
          setSmtpPassword(configValues.smtpPassword);
          setSmtpSecure(configValues.smtpSecure);
          setGoogleClientId(configValues.googleClientId);
          setGoogleClientSecret(configValues.googleClientSecret);
          setGoogleFromEmail(configValues.googleFromEmail);
          setGoogleRefreshToken(configValues.googleRefreshToken);
          setSendgridApiKey(configValues.sendgridApiKey);
          setMailgunApiKey(configValues.mailgunApiKey);
          setMailgunDomain(configValues.mailgunDomain);
          setAwsRegion(configValues.awsRegion);
          setAwsAccessKey(configValues.awsAccessKey);
          setAwsSecretKey(configValues.awsSecretKey);
          setOffice365TenantId(configValues.office365TenantId);
          setOffice365ClientId(configValues.office365ClientId);
          setOffice365ClientSecret(configValues.office365ClientSecret);
          // Reset secret-related UI state when loading an existing configuration
          setOffice365SecretDirty(false);
          setOffice365SecretError(null);
          setTestSuccess(Boolean(p.isConnected));
          setOffice365FromEmail(configValues.office365FromEmail);
          setFromEmail(configValues.fromEmail);
          setFromName(configValues.fromName);
          setReplyToEmail(configValues.replyToEmail);

          // Save original config for dirty tracking
          setOriginalConfig(configValues);

          setTestResult(
            p.isConnected
              ? { success: true, message: "Connected" }
              : p.lastError
              ? { success: false, message: p.lastError }
              : null
          );
        } else {
          // Reset form for new configuration
          resetForm();
        }
      } catch (err) {
        console.error("Error fetching email settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [selectedCompanyId]);

  const resetForm = () => {
    setProvider("SMTP");
    setIsActive(false);
    setSmtpHost("");
    setSmtpPort("587");
    setSmtpUsername("");
    setSmtpPassword("");
    setSmtpSecure(true);
    setGoogleClientId("");
    setGoogleClientSecret("");
    setGoogleFromEmail("");
    setGoogleRefreshToken("");
    setSendgridApiKey("");
    setMailgunApiKey("");
    setMailgunDomain("");
    setAwsRegion("us-east-1");
    setAwsAccessKey("");
    setAwsSecretKey("");
    setOffice365TenantId("");
    setOffice365ClientId("");
    setOffice365ClientSecret("");
    setOffice365FromEmail("");
    setFromEmail("");
    setFromName("");
    setReplyToEmail("");
    setTestResult(null);
  };

  const handleTest = async () => {
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
      // Save raw diagnostics (helps admins debug token/grant/network issues)
      setTestDiagnostics(data || null);

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
    try {
      // Guard: prevent saving mismatched Office365 credentials
      if (provider === "OFFICE365") {
        const origTenant = String(originalConfig?.office365TenantId || "");
        const origClient = String(originalConfig?.office365ClientId || "");
        const tenantChanged = office365TenantId.trim() !== origTenant;
        const clientChanged = office365ClientId.trim() !== origClient;
        const secretProvided =
          String(office365ClientSecret || "").trim() !== "";

        if ((tenantChanged || clientChanged) && !secretProvided) {
          setOffice365SecretError(
            "You changed the Tenant or Client ID but did not provide the client secret. Paste the new client secret value and test the connection before saving."
          );
          toast.error(
            "Provide the new Office 365 client secret and test connection before saving."
          );
          return;
        }

        if (office365SecretDirty && !testSuccess) {
          setOffice365SecretError(
            "The client secret was changed but hasn't been verified. Run 'Test Connection' and wait for success before saving."
          );
          toast.error(
            "New client secret must be tested successfully before saving."
          );
          return;
        }
      }

      setIsSaving(true);

      const config = buildConfig();

      const response = await fetch("/api/settings/email-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Email provider settings saved successfully!");

        // Reset dirty state by updating original config
        const updatedConfig: Record<string, string | boolean> = {
          provider,
          isActive,
          smtpHost,
          smtpPort,
          smtpUsername,
          smtpPassword,
          smtpSecure,
          sendgridApiKey,
          mailgunApiKey,
          mailgunDomain,
          awsRegion,
          awsAccessKey,
          awsSecretKey,
          office365TenantId,
          office365ClientId,
          office365ClientSecret,
          office365FromEmail,
          fromEmail,
          fromName,
          replyToEmail,
        };
        setOriginalConfig(updatedConfig);
        setIsDirty(false);
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
    const config: Record<string, string | number | boolean | null> = {
      provider,
      isActive,
      fromEmail,
      fromName,
      replyToEmail,
      scope: selectedCompanyId === "GLOBAL" ? "GLOBAL" : selectedCompanyId,
      companyId: selectedCompanyId === "GLOBAL" ? null : selectedCompanyId,
    };

    if (provider === "SMTP") {
      config.smtpHost = smtpHost;
      config.smtpPort = parseInt(smtpPort);
      config.smtpUsername = smtpUsername;
      // Only include password if it's been changed (not empty)
      if (smtpPassword) {
        config.smtpPassword = smtpPassword;
      }
      config.smtpSecure = smtpSecure;
    } else if (provider === "GMAIL") {
      // Gmail uses smtp.gmail.com with port 587 and STARTTLS
      config.smtpHost = "smtp.gmail.com";
      config.smtpPort = 587;
      config.smtpUsername = smtpUsername;
      // Only include password if it's been changed (not empty)
      if (smtpPassword) {
        config.smtpPassword = smtpPassword.replace(/\s/g, ""); // Remove any spaces from app password
      }
      config.smtpSecure = false; // Use STARTTLS on port 587, not SSL
    } else if (provider === "GOOGLE_OAUTH") {
      // Google OAuth uses Gmail API with OAuth 2.0
      config.googleClientId = googleClientId;
      // Only include secret if it's been changed
      if (googleClientSecret) {
        config.googleClientSecret = googleClientSecret;
      }
      config.googleFromEmail = googleFromEmail;
      // Only include refresh token if it's been changed
      if (googleRefreshToken) {
        config.googleRefreshToken = googleRefreshToken;
      }
    } else if (provider === "OFFICE365") {
      // Office 365 uses OAuth with Microsoft Graph API
      config.office365TenantId = office365TenantId;
      config.office365ClientId = office365ClientId;
      // Only include secret if it's been changed
      if (office365ClientSecret) {
        config.office365ClientSecret = office365ClientSecret;
      }
      config.office365FromEmail = office365FromEmail;
    } else if (provider === "SENDGRID") {
      // Only include API key if it's been changed
      if (sendgridApiKey) {
        config.sendgridApiKey = sendgridApiKey;
      }
    } else if (provider === "MAILGUN") {
      // Only include API key if it's been changed
      if (mailgunApiKey) {
        config.mailgunApiKey = mailgunApiKey;
      }
      config.mailgunDomain = mailgunDomain;
    } else if (provider === "AWS_SES") {
      config.awsRegion = awsRegion;
      // Only include keys if they've been changed
      if (awsAccessKey) {
        config.awsAccessKey = awsAccessKey;
      }
      if (awsSecretKey) {
        config.awsSecretKey = awsSecretKey;
      }
    }

    return config;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin dark:text-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin help / quick setup panel */}
      <Card className="bg-muted/10 border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Quick Office 365 setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm dark:text-gray-200">
            <p>
              Recommended: use Microsoft Graph (app-only / client_credentials)
              for server-sent email. It avoids per-user refresh tokens and is
              the preferred secure server flow for backend mail delivery.
            </p>

            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>
                Register a new App in{" "}
                <strong>Azure Active Directory &gt; App registrations</strong>{" "}
                (example name: <em>OnTarget ERP Mailer</em>).
              </li>

              <li>
                Under <strong>Certificates & secrets</strong> create a new
                client secret — copy its value now (it is only shown once).
              </li>

              <li>
                Under <strong>API permissions</strong>, add
                <strong>
                  {" "}
                  Microsoft Graph → Application permissions → Mail.Send
                </strong>
                and then click{" "}
                <strong>Grant admin consent for &lt;your tenant&gt;</strong>.
                (Admin consent is required for app-only access.)
              </li>

              <li>
                Redirect URIs (Reply URLs) and the Front-channel logout URL are
                relevant only for delegated/auth-code flows. For server-side
                client_credentials you DO NOT need Redirect URIs.
              </li>

              <li>
                Choose a mailbox-enabled From Email (userPrincipalName) that the
                app will send as (e.g. admin@yourdomain.com).
              </li>

              <li>
                Paste Tenant ID, Client ID, Client Secret and From Email into
                the form below, Save, and click <strong>Test</strong>. The
                server will obtain a token (client_credentials) and attempt a
                Graph sendMail as a test.
              </li>
            </ol>

            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <a
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold bg-primary/10 border border-primary/20 hover:bg-primary/20"
                href="https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps"
                target="_blank"
                rel="noreferrer noopener"
              >
                Open Azure App registrations
              </a>

              {/* Wizard trigger */}
              <div>
                <EmailProviderWizard />
              </div>

              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold border bg-muted/5 hover:bg-muted/10"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(
                      "Scope required: Mail.Send (Application) — ensure admin consent"
                    );
                    toast.success(
                      "Copied required permission note to clipboard"
                    );
                  } catch {
                    toast.error("Failed to copy to clipboard");
                  }
                }}
              >
                Copy quick note
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Company Selector for ADMIN_OWNER */}
      {(userRole === "ADMIN_OWNER" || userRole === "ADMIN_NONOWNER") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Select Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select &quot;Global Default&quot; to use the system-wide email
                configuration, or choose a company to override with custom
                settings.
              </AlertDescription>
            </Alert>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select configuration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Global Default (System-wide)
                  </div>
                </SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} (Company Override)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Provider Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Type */}
          <div className="space-y-2">
            <Label>Email Service Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Enable This Provider</Label>
              <p className="text-sm dark:text-gray-200">
                Activate this email configuration for sending emails
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Provider-specific fields */}
          <Tabs value={provider} className="w-full">
            {/* SMTP Configuration */}
            <TabsContent value="SMTP" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="your-email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showSmtpPassword ? "text" : "password"}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="Leave empty to keep existing password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  >
                    {showSmtpPassword ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={smtpSecure}
                    onCheckedChange={setSmtpSecure}
                  />
                  <Label>Use SSL (Port 465)</Label>
                </div>
                <p className="text-xs dark:text-gray-200">
                  Leave unchecked for STARTTLS (Port 587 - Recommended). Check
                  for direct SSL/TLS (Port 465).
                </p>
              </div>
            </TabsContent>

            {/* Gmail Configuration */}
            <TabsContent value="GMAIL" className="space-y-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  For Gmail, use an App Password instead of your regular
                  password. Go to Google Account → Security → 2-Step
                  Verification → App passwords.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Gmail Address</Label>
                <Input
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label>App Password</Label>
                <div className="relative">
                  <Input
                    type={showSmtpPassword ? "text" : "password"}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="Leave empty to keep existing password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  >
                    {showSmtpPassword ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
                <p className="text-xs dark:text-gray-200">
                  16-character app password from Google Account settings
                </p>
              </div>
            </TabsContent>

            {/* Google OAuth Configuration */}
            <TabsContent value="GOOGLE_OAUTH" className="space-y-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">
                    Google OAuth uses Gmail API with OAuth 2.0 authentication.
                    Follow these steps:
                  </p>
                  <ol className="text-xs dark:text-gray-200 list-decimal ml-5 space-y-1">
                    <li>
                      Go to Google Cloud Console and create a new project (or
                      select existing).
                    </li>
                    <li>
                      Enable the <strong>Gmail API</strong> for your project.
                    </li>
                    <li>
                      Create OAuth 2.0 credentials (OAuth client ID) with type
                      &quot;Web application&quot;.
                    </li>
                    <li>
                      Add authorized redirect URI:{" "}
                      <code>
                        http://localhost:3000/api/auth/google/callback
                      </code>{" "}
                      or your production URL.
                    </li>
                    <li>
                      Use the OAuth playground or your app to obtain a refresh
                      token with scope:{" "}
                      <code>https://www.googleapis.com/auth/gmail.send</code>
                    </li>
                  </ol>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="Your Google OAuth Client ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <div className="relative">
                  <Input
                    type={showGoogleSecret ? "text" : "password"}
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                    placeholder="Leave empty to keep existing secret"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                  >
                    {showGoogleSecret ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>From Email (Gmail Address)</Label>
                <Input
                  value={googleFromEmail}
                  onChange={(e) => setGoogleFromEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Refresh Token</Label>
                <div className="relative">
                  <Input
                    type={showGoogleRefreshToken ? "text" : "password"}
                    value={googleRefreshToken}
                    onChange={(e) => setGoogleRefreshToken(e.target.value)}
                    placeholder="Leave empty to keep existing token"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() =>
                      setShowGoogleRefreshToken(!showGoogleRefreshToken)
                    }
                  >
                    {showGoogleRefreshToken ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
                <p className="text-xs dark:text-gray-200">
                  OAuth refresh token obtained from Google OAuth flow
                </p>
              </div>
            </TabsContent>

            {/* Office 365 Configuration */}
            <TabsContent value="OFFICE365" className="space-y-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">
                    Office 365 uses Microsoft Graph API (OAuth 2.0). To
                    configure the app correctly, follow these steps:
                  </p>
                  <ol className="text-xs dark:text-gray-200 list-decimal ml-5 space-y-1">
                    <li>
                      Register a new app in the Azure Portal (Azure Active
                      Directory → App registrations).
                    </li>
                    <li>
                      Create a Client Secret (Certificates & secrets) and copy
                      its <strong>value</strong> — you will only see it once.
                    </li>
                    <li>
                      Under API permissions → Microsoft Graph →{" "}
                      <strong>Application permissions</strong>, add{" "}
                      <code>Mail.Send</code> and grant{" "}
                      <strong>Admin consent</strong>.
                    </li>
                    <li>
                      For the ERP email service (daemon/service principal) you
                      do not need a Redirect URI — use the Tenant ID, Client ID
                      and Client Secret (app-only authentication).
                    </li>
                  </ol>

                  <div className="mt-2 text-xs dark:text-gray-200">
                    <strong>Example URIs</strong>
                    <div className="mt-1 ml-4">
                      <div>
                        <code className="rounded px-1 bg-muted/10">
                          Redirect URI (for user OAuth flows)
                        </code>
                        :
                        <div className="mt-1 ml-3">
                          <div className="font-mono">
                            http://localhost:3000/api/auth/microsoft/callback
                          </div>
                          <div className="mt-1 font-mono">
                            https://your-app.example.com/api/auth/microsoft/callback
                          </div>
                          <div className="mt-1 text-xs dark:text-gray-200">
                            (This app uses <code>NEXT_PUBLIC_APP_URL</code> when
                            building the redirect URI on the server — set it to
                            your app URL.)
                          </div>
                        </div>
                        <div className="mt-1">
                          <code className="rounded px-1 bg-muted/10">
                            Logout / Post-logout redirect
                          </code>
                          :
                          <div className="mt-1 ml-3 font-mono">
                            http://localhost:3000/
                          </div>
                          <div className="mt-1 ml-3 font-mono">
                            https://your-app.example.com/
                          </div>
                          <div className="mt-1 text-xs dark:text-gray-200">
                            (Azure expects a GET-accessible redirect after
                            sign-out — use &apos;/&apos; or a dedicated
                            &apos;/logout&apos; page.)
                          </div>
                        </div>
                      </div>
                      <div className="mt-1">
                        <em>Daemon / app-only (no redirect)</em>: use{" "}
                        <span className="font-mono">Tenant ID</span>,{" "}
                        <span className="font-mono">Client ID</span> and{" "}
                        <span className="font-mono">Client Secret</span> in the
                        ERP settings.
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input
                  value={office365TenantId}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setOffice365TenantId(v);
                    // Changing tenant invalidates a previous successful test
                    setTestSuccess(false);
                    setOffice365SecretError(null);
                  }}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <p className="text-xs dark:text-gray-200">
                  Azure AD Directory (tenant) ID
                </p>
              </div>
              <div className="space-y-2">
                <Label>Client ID (Application ID)</Label>
                <Input
                  value={office365ClientId}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setOffice365ClientId(v);
                    // Changing client id invalidates a previous successful test
                    setTestSuccess(false);
                    setOffice365SecretError(null);
                  }}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <p className="text-xs dark:text-gray-200">
                  Application (client) ID from Azure app registration
                </p>
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <div className="relative">
                  <Input
                    type={showOffice365Secret ? "text" : "password"}
                    value={office365ClientSecret}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setOffice365ClientSecret(v);
                      // Mark secret as dirty when a new value is entered and clear any prior error
                      setOffice365SecretDirty(Boolean(v));
                      setOffice365SecretError(null);
                      // New secret requires a re-test
                      setTestSuccess(false);
                    }}
                    placeholder="Leave empty to keep existing secret"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowOffice365Secret(!showOffice365Secret)}
                  >
                    {showOffice365Secret ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
                <p className="text-xs dark:text-gray-200">
                  Paste the client secret <strong>value</strong> from Azure (the
                  long value shown immediately after creation). Do not paste the
                  secret <em>ID</em>. Avoid leading/trailing spaces.
                </p>
              </div>
              <div className="space-y-2">
                <Label>From Email Address</Label>
                <Input
                  value={office365FromEmail}
                  onChange={(e) => setOffice365FromEmail(e.target.value)}
                  placeholder="noreply@company.com"
                />
                <p className="text-xs dark:text-gray-200">
                  Email address that will send emails (must have a mailbox)
                </p>
              </div>
              {/* Office365 tips (inline) */}
              {provider === "OFFICE365" && (
                <div className="rounded-lg border px-4 py-3 text-sm dark:text-gray-200 mt-3 bg-muted/5">
                  We recommend using Microsoft Graph (application permissions)
                  for server-sent mail. Make sure your AAD app has{" "}
                  <strong>Mail.Send (Application)</strong> and admin consent.
                  Use the panel above for setup steps.
                </div>
              )}
            </TabsContent>

            {/* SendGrid Configuration */}
            <TabsContent value="SENDGRID" className="space-y-4">
              <div className="space-y-2">
                <Label>SendGrid API Key</Label>
                <div className="relative">
                  <Input
                    type={showSendgridKey ? "text" : "password"}
                    value={sendgridApiKey}
                    onChange={(e) => setSendgridApiKey(e.target.value)}
                    placeholder="Leave empty to keep existing key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSendgridKey(!showSendgridKey)}
                  >
                    {showSendgridKey ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Mailgun Configuration */}
            <TabsContent value="MAILGUN" className="space-y-4">
              <div className="space-y-2">
                <Label>Mailgun API Key</Label>
                <div className="relative">
                  <Input
                    type={showMailgunKey ? "text" : "password"}
                    value={mailgunApiKey}
                    onChange={(e) => setMailgunApiKey(e.target.value)}
                    placeholder="Leave empty to keep existing key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowMailgunKey(!showMailgunKey)}
                  >
                    {showMailgunKey ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mailgun Domain</Label>
                <Input
                  value={mailgunDomain}
                  onChange={(e) => setMailgunDomain(e.target.value)}
                  placeholder="mg.yourdomain.com"
                />
              </div>
            </TabsContent>

            {/* AWS SES Configuration */}
            <TabsContent value="AWS_SES" className="space-y-4">
              <div className="space-y-2">
                <Label>AWS Region</Label>
                <Input
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  placeholder="us-east-1"
                />
              </div>
              <div className="space-y-2">
                <Label>AWS Access Key</Label>
                <div className="relative">
                  <Input
                    type={showAwsKeys ? "text" : "password"}
                    value={awsAccessKey}
                    onChange={(e) => setAwsAccessKey(e.target.value)}
                    placeholder="Leave empty to keep existing key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowAwsKeys(!showAwsKeys)}
                  >
                    {showAwsKeys ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>AWS Secret Key</Label>
                <div className="relative">
                  <Input
                    type={showAwsKeys ? "text" : "password"}
                    value={awsSecretKey}
                    onChange={(e) => setAwsSecretKey(e.target.value)}
                    placeholder="Leave empty to keep existing key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowAwsKeys(!showAwsKeys)}
                  >
                    {showAwsKeys ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Resend Configuration */}
            <TabsContent value="RESEND" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Resend uses API key authentication. Coming soon!
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Common Fields */}
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
          {/* Compute Office365 guards for UI disabling/messages */}
          {provider === "OFFICE365" && (
            <div className="mb-2">
              {/* Render secret-related UI error if present */}
              {office365SecretError && (
                <div className="text-sm text-destructive mb-2">
                  {office365SecretError}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4 items-center">
            <Button
              onClick={handleTest}
              disabled={isTesting || isSaving}
              variant="outline"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            <Button
              onClick={handleSave}
              disabled={(() => {
                // Basic disabled checks
                if (isTesting || isSaving) return true;

                // Office365 specific UI blocking
                if (provider === "OFFICE365") {
                  const origTenant = String(
                    originalConfig?.office365TenantId || ""
                  );
                  const origClient = String(
                    originalConfig?.office365ClientId || ""
                  );
                  const tenantChanged = office365TenantId.trim() !== origTenant;
                  const clientChanged = office365ClientId.trim() !== origClient;
                  const missingSecretForChange =
                    (tenantChanged || clientChanged) &&
                    String(office365ClientSecret || "").trim() === "";
                  const newSecretUnverified =
                    office365SecretDirty && !testSuccess;
                  if (missingSecretForChange || newSecretUnverified)
                    return true;
                }

                return false;
              })()}
              className="relative"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
              {isDirty && (
                <span
                  className="ml-2 h-2 w-2 rounded-full bg-orange-500 animate-pulse"
                  title="Unsaved changes"
                />
              )}
            </Button>
            {isDirty && (
              <span className="text-sm text-orange-600 font-medium">
                ● Unsaved changes
              </span>
            )}
            {/* If Save is disabled for Office365 show a hint */}
            {provider === "OFFICE365" &&
              originalConfig &&
              (((office365TenantId.trim() !==
                String(originalConfig.office365TenantId || "") ||
                office365ClientId.trim() !==
                  String(originalConfig.office365ClientId || "")) &&
                String(office365ClientSecret || "").trim() === "") ||
                (office365SecretDirty && !testSuccess)) && (
                <div className="text-xs dark:text-gray-200 ml-2">
                  Please provide a valid client secret and run{" "}
                  <strong>Test Connection</strong> successfully before saving.
                </div>
              )}
          </div>

          {/* Diagnostics panel for admins */}
          {testDiagnostics &&
            (userRole === "ADMIN_OWNER" || userRole === "SUPER_ADMIN") && (
              <div className="mt-3 rounded-lg border bg-muted/5 p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Diagnostics</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-muted/10"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            JSON.stringify(testDiagnostics, null, 2)
                          );
                          toast.success("Diagnostics copied to clipboard");
                        } catch {
                          toast.error("Failed to copy diagnostics");
                        }
                      }}
                    >
                      Copy
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-muted/10"
                      onClick={() => setIsDiagnosticsOpen((s) => !s)}
                    >
                      {isDiagnosticsOpen ? "Hide details" : "Show details"}
                    </button>
                  </div>

                  {/* Quick verify — token + send examples for admins */}
                  <div className="mt-4 rounded border bg-background p-3 text-xs dark:text-gray-200">
                    <div className="font-semibold mb-2">
                      Quick verification (advanced)
                    </div>
                    <div className="mb-2">
                      Run these commands from a shell to check token acquisition
                      and a test send. Replace placeholders.
                    </div>
                    <pre className="text-xs bg-muted/5 p-2 rounded overflow-auto">{`curl -s -X POST "https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token" -H "Content-Type: application/x-www-form-urlencoded" -d "client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&scope=https://graph.microsoft.com/.default&grant_type=client_credentials"`}</pre>
                    <pre className="text-xs bg-muted/5 p-2 rounded overflow-auto mt-2">{`curl -s -X POST "https://graph.microsoft.com/v1.0/users/<FROM_EMAIL>/sendMail" -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" -d '{"message":{"subject":"Test Email","body":{"contentType":"HTML","content":"Test message"},"toRecipients":[{"emailAddress":{"address":"<RECIPIENT>"}}]}}'`}</pre>
                    <div className="text-[11px] dark:text-gray-200 mt-2">
                      If token command returns error JSON (AADSTS...), share it
                      here and I’ll decode it. If send returns AccessDenied,
                      make sure Mail.Send (Application) permission has admin
                      consent and the mailbox exists.
                    </div>
                  </div>
                </div>

                {!isDiagnosticsOpen ? (
                  <div className="text-xs dark:text-gray-200">
                    {testDiagnostics.success
                      ? `Last test: success — ${testDiagnostics.message ?? ""}`
                      : `Last test: failed — ${
                          testDiagnostics.error ?? testDiagnostics.message ?? ""
                        }`}
                  </div>
                ) : (
                  <pre className="mt-2 max-h-72 overflow-auto rounded bg-background p-3 text-xs">
                    {JSON.stringify(testDiagnostics, null, 2)}
                  </pre>
                )}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
