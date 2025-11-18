"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface EmailProviderSettingsProps {
  userRole: string;
}

const PROVIDER_TYPES = [
  { value: "SMTP", label: "SMTP (Generic)" },
  { value: "GMAIL", label: "Gmail (Google Workspace)" },
  { value: "OFFICE365", label: "Office 365 / Outlook" },
  { value: "SENDGRID", label: "SendGrid" },
  { value: "MAILGUN", label: "Mailgun" },
  { value: "AWS_SES", label: "Amazon SES" },
  { value: "RESEND", label: "Resend" },
];

export function EmailProviderSettings({
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
            sendgridApiKey: "",
            mailgunApiKey: "",
            mailgunDomain: p.mailgunDomain || "",
            awsRegion: p.awsRegion || "us-east-1",
            awsAccessKey: "",
            awsSecretKey: "",
            office365TenantId: p.office365TenantId || "",
            office365ClientId: p.office365ClientId || "",
            office365ClientSecret: p.office365ClientSecret || "",
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
          setSendgridApiKey(configValues.sendgridApiKey);
          setMailgunApiKey(configValues.mailgunApiKey);
          setMailgunDomain(configValues.mailgunDomain);
          setAwsRegion(configValues.awsRegion);
          setAwsAccessKey(configValues.awsAccessKey);
          setAwsSecretKey(configValues.awsSecretKey);
          setOffice365TenantId(configValues.office365TenantId);
          setOffice365ClientId(configValues.office365ClientId);
          setOffice365ClientSecret(configValues.office365ClientSecret);
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

      if (response.ok) {
        setTestResult({ success: true, message: "Connection successful!" });
        toast.success("Email provider connection successful!");
      } else {
        setTestResult({
          success: false,
          message: data.error || "Connection failed",
        });
        toast.error(data.error || "Connection failed");
      }
    } catch {
      setTestResult({
        success: false,
        message: "Failed to test connection",
      });
      toast.error("Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
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
      // Gmail uses smtp.gmail.com with port 587 and TLS
      config.smtpHost = "smtp.gmail.com";
      config.smtpPort = 587;
      config.smtpUsername = smtpUsername;
      // Only include password if it's been changed (not empty)
      if (smtpPassword) {
        config.smtpPassword = smtpPassword;
      }
      config.smtpSecure = true;
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Selector for ADMIN */}
      {userRole === "ADMIN" && (
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
              <p className="text-sm text-muted-foreground">
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
                <p className="text-xs text-muted-foreground">
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  16-character app password from Google Account settings
                </p>
              </div>
            </TabsContent>

            {/* Office 365 Configuration */}
            <TabsContent value="OFFICE365" className="space-y-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Office 365 uses Microsoft Graph API with OAuth 2.0. Register
                  an app in Azure Portal and grant Mail.Send permission.
                </AlertDescription>
              </Alert>
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
                <div className="relative">
                  <Input
                    type={showOffice365Secret ? "text" : "password"}
                    value={office365ClientSecret}
                    onChange={(e) => setOffice365ClientSecret(e.target.value)}
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
              disabled={isTesting || isSaving}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
