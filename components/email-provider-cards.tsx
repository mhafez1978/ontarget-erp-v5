"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Crown,
  Eye,
  EyeOff,
} from "lucide-react";
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

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Company {
  id: string;
  name: string;
}

interface EmailProviderCardsProps {
  userRole: string;
  userId?: string | null;
}

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  type:
    | "NODEMAILER"
    | "SMTP"
    | "GOOGLE_OAUTH"
    | "OFFICE365"
    | "SENDGRID"
    | "MAILGUN"
    | "AWS_SES"
    | "RESEND";
  color: string;
  isDefault?: boolean;
  isGmail?: boolean; // Flag to indicate Gmail SMTP preset
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "nodemailer",
    name: "Nodemailer (SMTP)",
    description: "Default ERP email service via SMTP",
    icon: "https://www.vectorlogo.zone/logos/nodejs/nodejs-icon.svg",
    type: "NODEMAILER",
    color: "from-[#68A063] to-[#43853D]",
    isDefault: true,
  },
  {
    id: "gmail",
    name: "Gmail SMTP",
    description: "Gmail SMTP with App Password (Recommended)",
    icon: "https://www.vectorlogo.zone/logos/google/google-icon.svg",
    type: "SMTP",
    color: "from-[#4285F4] to-[#34A853]",
    isGmail: true,
  },
  {
    id: "google",
    name: "Google OAuth",
    description: "Gmail API with OAuth 2.0 (Advanced)",
    icon: "https://www.vectorlogo.zone/logos/google/google-icon.svg",
    type: "GOOGLE_OAUTH",
    color: "from-[#34A853] to-[#FBBC05]",
  },
  {
    id: "office365",
    name: "Office 365",
    description: "Microsoft Graph API with OAuth 2.0",
    icon: "https://cdn.simpleicons.org/microsoftoffice/D83B01",
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
    icon: "https://cdn.simpleicons.org/resend/000000",
    type: "RESEND",
    color: "from-[#000000] to-[#1a1a1a]",
  },
];

export function EmailProviderCards({
  userRole,
  userId,
}: EmailProviderCardsProps & { userId?: string | null }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("GLOBAL");
  const [companyOwnerId, setCompanyOwnerId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderConfig | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [globalActiveProvider, setGlobalActiveProvider] = useState<
    string | null
  >(null);
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
  const [office365SecretDirty, setOffice365SecretDirty] = useState(false);
  const [office365SecretError, setOffice365SecretError] = useState<
    string | null
  >(null);
  const [originalOffice365TenantId, setOriginalOffice365TenantId] =
    useState("");
  const [originalOffice365ClientId, setOriginalOffice365ClientId] =
    useState("");

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

  // Nodemailer (SMTP) fields
  const [nodemailerHost, setNodemailerHost] = useState("");
  const [nodemailerPort, setNodemailerPort] = useState("587");
  const [nodemailerUsername, setNodemailerUsername] = useState("");
  const [nodemailerPassword, setNodemailerPassword] = useState("");
  const [nodemailerSecure, setNodemailerSecure] = useState(false);

  // Common fields
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");

  // Password visibility toggles
  const [showNodemailerPassword, setShowNodemailerPassword] = useState(false);
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [showMailgunKey, setShowMailgunKey] = useState(false);
  const [showAwsKeys, setShowAwsKeys] = useState(false);
  const [showOffice365Secret, setShowOffice365Secret] = useState(false);

  // Fetch companies for ADMIN_OWNER and SUPER_ADMIN users
  useEffect(() => {
    if (
      userRole === "ADMIN_OWNER" ||
      userRole === "ADMIN_NONOWNER" ||
      userRole === "SUPER_ADMIN"
    ) {
      const fetchCompanies = async () => {
        try {
          const response = await fetch("/api/companies/my-owned");
          const data = await response.json();
          if (response.ok) {
            setCompanies(data.companies || []);
            // For ADMIN_OWNER users, default to first company instead of GLOBAL
            if (
              (userRole === "ADMIN_OWNER" || userRole === "ADMIN_NONOWNER") &&
              data.companies?.length > 0
            ) {
              setSelectedCompanyId(data.companies[0].id);
            }
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

        // If viewing a company (not GLOBAL), also fetch the global provider
        if (selectedCompanyId !== "GLOBAL") {
          const globalResponse = await fetch(
            "/api/settings/email-provider?scope=GLOBAL"
          );
          const globalData = await globalResponse.json();

          if (globalResponse.ok && globalData.provider?.isActive) {
            setGlobalActiveProvider(globalData.provider.provider);
          } else {
            setGlobalActiveProvider(null);
          }
        } else {
          setGlobalActiveProvider(null);
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

    // If Gmail SMTP preset, auto-fill Gmail settings
    if (provider.isGmail) {
      setNodemailerHost("smtp.gmail.com");
      setNodemailerPort("587");
      setNodemailerSecure(true);
    }

    // Fetch existing config
    try {
      const url =
        selectedCompanyId === "GLOBAL"
          ? "/api/settings/email-provider?scope=GLOBAL"
          : `/api/settings/email-provider?companyId=${selectedCompanyId}`;

      const response = await fetch(url);
      const data = await response.json();

      // Also fetch company owner id for permission checks when company-scoped
      if (selectedCompanyId !== "GLOBAL") {
        try {
          const cResp = await fetch(`/api/company/${selectedCompanyId}`);
          if (cResp.ok) {
            const cJson = await cResp.json();
            setCompanyOwnerId(cJson.company?.ownerId || null);
          } else {
            setCompanyOwnerId(null);
          }
        } catch (e) {
          setCompanyOwnerId(null);
        }
      } else {
        setCompanyOwnerId(null);
      }

      if (
        response.ok &&
        data.provider &&
        data.provider.provider === provider.type
      ) {
        const p = data.provider;
        setGoogleClientId(p.googleClientId || "");
        // Don't load encrypted secrets - keep field empty so user knows to re-enter
        setGoogleClientSecret("");
        setGoogleFromEmail(p.googleFromEmail || "");
        // Don't load encrypted refresh token
        setGoogleRefreshToken("");
        setOffice365TenantId(p.office365TenantId || "");
        setOffice365ClientId(p.office365ClientId || "");
        // track original values so we can detect tenant/client changes
        setOriginalOffice365TenantId(p.office365TenantId || "");
        setOriginalOffice365ClientId(p.office365ClientId || "");
        // Don't load encrypted secrets - keep field empty
        setOffice365ClientSecret("");
        setOffice365SecretDirty(false);
        setOffice365SecretError(null);
        setOffice365FromEmail(p.office365FromEmail || "");
        setSendgridApiKey("");
        setMailgunApiKey("");
        setMailgunDomain(p.mailgunDomain || "");
        setAwsRegion(p.awsRegion || "us-east-1");
        setAwsAccessKey("");
        setAwsSecretKey("");
        setResendApiKey("");
        setNodemailerHost(p.smtpHost || "");
        setNodemailerPort(p.smtpPort?.toString() || "587");
        setNodemailerUsername(p.smtpUsername || "");
        setNodemailerPassword(""); // Don't populate with encrypted value
        setNodemailerSecure(p.smtpSecure || false);
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
    setOriginalOffice365TenantId("");
    setOriginalOffice365ClientId("");
    setOffice365ClientSecret("");
    setOffice365SecretDirty(false);
    setOffice365SecretError(null);
    setOffice365FromEmail("");
    setSendgridApiKey("");
    setMailgunApiKey("");
    setMailgunDomain("");
    setAwsRegion("us-east-1");
    setAwsAccessKey("");
    setAwsSecretKey("");
    setResendApiKey("");
    setNodemailerHost("");
    setNodemailerPort("587");
    setNodemailerUsername("");
    setNodemailerPassword("");
    setNodemailerSecure(false);
    setFromEmail("");
    setFromName("");
    setReplyToEmail("");
  };

  const handleTest = async () => {
    if (!selectedProvider) return;

    // Check permission: if company-scoped and not owner, disallow
    const isGlobal = selectedCompanyId === "GLOBAL";
    const canEdit = isGlobal
      ? userRole === "SUPER_ADMIN"
      : companyOwnerId === userId || userRole === "SUPER_ADMIN";
    if (!canEdit) {
      setTestResult({
        success: false,
        message: "Only company owner can test this provider",
      });
      setTestSuccess(false);
      return;
    }

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

    // Office365-specific guard: if tenant/client changed and no secret provided, block save
    if (selectedProvider.type === "OFFICE365") {
      const tenantChanged =
        office365TenantId.trim() !== originalOffice365TenantId;
      const clientChanged =
        office365ClientId.trim() !== originalOffice365ClientId;
      const secretProvided = String(office365ClientSecret || "").trim() !== "";

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
      if (office365ClientSecret)
        config.office365ClientSecret = office365ClientSecret;
      config.office365FromEmail = office365FromEmail;
    } else if (selectedProvider.type === "SENDGRID") {
      if (sendgridApiKey) config.sendgridApiKey = sendgridApiKey;
    } else if (selectedProvider.type === "MAILGUN") {
      if (mailgunApiKey) config.mailgunApiKey = mailgunApiKey;
      config.mailgunDomain = mailgunDomain;
    } else if (selectedProvider.type === "AWS_SES") {
      config.awsRegion = awsRegion;
      if (awsAccessKey) config.awsAccessKey = awsAccessKey;
      if (awsSecretKey) config.awsSecretKey = awsSecretKey;
    } else if (selectedProvider.type === "RESEND") {
      if (resendApiKey) config.resendApiKey = resendApiKey;
    } else if (
      selectedProvider.type === "NODEMAILER" ||
      selectedProvider.type === "SMTP"
    ) {
      // Gmail SMTP preset configuration
      if (selectedProvider.isGmail) {
        config.smtpHost = "smtp.gmail.com";
        config.smtpPort = 587;
        config.smtpUsername = nodemailerUsername;
        if (nodemailerPassword) {
          // Remove spaces from app password
          config.smtpPassword = nodemailerPassword.replace(/\s/g, "");
        }
        config.smtpSecure = false; // Use STARTTLS on port 587
      } else {
        // Custom SMTP configuration
        config.smtpHost = nodemailerHost;
        config.smtpPort = parseInt(nodemailerPort) || 587;
        config.smtpUsername = nodemailerUsername;
        if (nodemailerPassword) {
          config.smtpPassword = nodemailerPassword;
        }
        config.smtpSecure = nodemailerSecure;
      }
    }

    return config;
  };

  const renderProviderFields = () => {
    if (!selectedProvider) return null;

    switch (selectedProvider.type) {
      case "GOOGLE_OAUTH":
        return (
          <>
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div className="flex-1 text-sm">
                <strong className="text-amber-900">
                  ⚠️ Advanced Setup - Not Recommended
                </strong>
                <p className="mt-2 text-amber-800">
                  Consider using <strong>Gmail SMTP</strong> instead - it&apos;s
                  much simpler and more reliable. Google OAuth requires complex
                  setup and token management.
                </p>
              </div>
            </Alert>

            <Alert className="mb-4 flex flex-col gap-2 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                <div className="flex-1 text-sm">
                  <strong className="text-blue-900">
                    Google OAuth Setup Instructions
                  </strong>
                </div>
              </div>
              <div className="ml-7 text-sm space-y-3 text-blue-900">
                <div>
                  <strong>Step 1: Create Google Cloud Project</strong>
                  <ol className="mt-1 space-y-1 list-decimal list-inside text-xs">
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
                    <li>Create a new project or select existing one</li>
                    <li>Note your Project ID</li>
                  </ol>
                </div>

                <div>
                  <strong>Step 2: Enable Gmail API</strong>
                  <ol className="mt-1 space-y-1 list-decimal list-inside text-xs">
                    <li>
                      In your project, go to <strong>APIs & Services</strong> →{" "}
                      <strong>Library</strong>
                    </li>
                    <li>Search for &ldquo;Gmail API&rdquo;</li>
                    <li>
                      Click on it and click <strong>Enable</strong>
                    </li>
                  </ol>
                </div>

                <div>
                  <strong>Step 3: Create OAuth 2.0 Credentials</strong>
                  <ol className="mt-1 space-y-1 list-decimal list-inside text-xs">
                    <li>
                      Go to <strong>APIs & Services</strong> →{" "}
                      <strong>Credentials</strong>
                    </li>
                    <li>
                      Click <strong>Create Credentials</strong> →{" "}
                      <strong>OAuth client ID</strong>
                    </li>
                    <li>
                      Configure consent screen if prompted (External, add test
                      users)
                    </li>
                    <li>
                      Application type: <strong>Web application</strong>
                    </li>
                    <li>Name: &ldquo;OnTarget ERP Email&rdquo;</li>
                    <li>
                      Authorized redirect URIs:{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        https://developers.google.com/oauthplayground
                      </code>
                    </li>
                    <li>
                      Click <strong>Create</strong> and copy your{" "}
                      <strong>Client ID</strong> and{" "}
                      <strong>Client Secret</strong>
                    </li>
                  </ol>
                </div>

                <div>
                  <strong>
                    Step 4: Generate Refresh Token (OAuth Playground)
                  </strong>
                  <ol className="mt-1 space-y-1 list-decimal list-inside text-xs">
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
                    <li>Click the ⚙️ gear icon (Settings) in top right</li>
                    <li>
                      Check{" "}
                      <strong>
                        &ldquo;Use your own OAuth credentials&rdquo;
                      </strong>
                    </li>
                    <li>
                      Enter your <strong>Client ID</strong> and{" "}
                      <strong>Client Secret</strong>
                    </li>
                    <li>Close settings</li>
                    <li>
                      In <strong>Step 1</strong>, scroll down and select:{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        https://mail.google.com/
                      </code>{" "}
                      (full Gmail access)
                    </li>
                    <li>
                      Click <strong>Authorize APIs</strong>
                    </li>
                    <li>
                      Sign in with the Gmail account you want to send from
                    </li>
                    <li>
                      Click <strong>Allow</strong> to grant permissions
                    </li>
                    <li>
                      In <strong>Step 2</strong>, click{" "}
                      <strong>Exchange authorization code for tokens</strong>
                    </li>
                    <li>
                      Copy the <strong>Refresh token</strong> (starts with
                      &ldquo;1//&rdquo;)
                    </li>
                  </ol>
                </div>

                <div className="pt-2 border-t border-blue-200">
                  <strong>Step 5: Configure Below</strong>
                  <p className="text-xs mt-1">
                    Enter your Client ID, Client Secret, Gmail address, and the
                    Refresh Token you just generated.
                  </p>
                </div>

                <div className="pt-2 border-t border-blue-200">
                  <strong className="text-xs">
                    Common Issues & Solutions:
                  </strong>
                  <ul className="mt-1 space-y-0.5 text-[10px] leading-tight text-blue-800">
                    <li>
                      <strong>Error 400: redirect_uri_mismatch</strong> - Make
                      sure you added{" "}
                      <code className="bg-blue-100 px-0.5 rounded text-[9px]">
                        https://developers.google.com/oauthplayground
                      </code>{" "}
                      (no trailing slash) to Authorized redirect URIs
                    </li>
                    <li>
                      <strong>Error 403: access_denied</strong> - Add your Gmail
                      address to <strong>Test users</strong> in OAuth consent
                      screen
                    </li>
                    <li>
                      <strong>OAuth Playground Settings</strong> - Use: OAuth
                      flow = Server-side, Access type = <strong>Offline</strong>{" "}
                      (critical!), Force prompt = Consent screen
                    </li>
                    <li>
                      <strong>Scope Required</strong> - Select{" "}
                      <code className="bg-blue-100 px-0.5 rounded text-[9px]">
                        https://mail.google.com/
                      </code>{" "}
                      under Gmail API v1 in Step 1
                    </li>
                  </ul>
                </div>
              </div>
            </Alert>
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="text-sm text-blue-900">
                    <strong>🎯 Quick Setup (One-Time)</strong>
                    <ol className="mt-2 space-y-1 text-xs list-decimal list-inside">
                      <li>
                        Enter Client ID & Secret from Google Cloud Console below
                      </li>
                      <li>
                        Click the green &quot;Authenticate with Google&quot;
                        button
                      </li>
                      <li>Sign in and allow permissions</li>
                      <li>Done! Emails work forever (no maintenance needed)</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Client ID
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="xxxxxxxxx.apps.googleusercontent.com"
                  required
                />
                <p className="text-xs dark:text-gray-200">
                  From{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Google Cloud Console → Credentials
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Client Secret
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxxx"
                  required
                />
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ Required to authenticate - paste from Google Cloud Console
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  From Email Address
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={googleFromEmail}
                  onChange={(e) => setGoogleFromEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  required
                />
                <p className="text-xs dark:text-gray-200">
                  The Gmail address that will send emails
                </p>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="text-sm text-green-900">
                    <strong>✨ Ready to Authenticate?</strong>
                    <p className="mt-1 text-xs">
                      Fill in the 3 required fields above, then click the button
                      below. After one-time setup, the system automatically
                      handles all token refreshing forever!
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                onClick={async () => {
                  if (
                    !googleClientId ||
                    !googleClientSecret ||
                    !googleFromEmail
                  ) {
                    toast.error(
                      "Please fill in Client ID, Client Secret, and From Email first"
                    );
                    return;
                  }

                  try {
                    const response = await fetch(
                      "/api/email-provider/google-oauth/authorize",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          clientId: googleClientId,
                          clientSecret: googleClientSecret,
                          fromEmail: googleFromEmail,
                        }),
                      }
                    );

                    const data = await response.json();

                    if (response.ok && data.authUrl) {
                      // Append state parameters to the auth URL
                      const url = new URL(data.authUrl);
                      url.searchParams.append(
                        "state",
                        JSON.stringify({
                          clientId: googleClientId,
                          clientSecret: googleClientSecret,
                          fromEmail: googleFromEmail,
                        })
                      );

                      // Open in new window
                      const authWindow = window.open(
                        url.toString(),
                        "Google OAuth",
                        "width=600,height=700,scrollbars=yes"
                      );

                      if (authWindow) {
                        toast.success("Opening Google authentication...");

                        // Poll for window close and check for success
                        const pollTimer = setInterval(() => {
                          if (authWindow.closed) {
                            clearInterval(pollTimer);
                            // Refresh the page or refetch provider data
                            setTimeout(() => {
                              window.location.reload();
                            }, 500);
                          }
                        }, 500);
                      } else {
                        toast.error(
                          "Popup blocked! Please allow popups and try again."
                        );
                      }
                    } else {
                      toast.error(data.error || "Failed to start OAuth flow");
                    }
                  } catch (error) {
                    console.error("OAuth authorization error:", error);
                    toast.error("Failed to start authentication");
                  }
                }}
                variant="outline"
                className="w-full border-green-500 text-green-700 hover:bg-green-50"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                🚀 Authenticate with Google (Production Flow)
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alternative:</strong> If you prefer the manual OAuth
                  Playground method, follow the detailed setup guide above and
                  paste your refresh token in the field.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "OFFICE365":
        return (
          <>
            <Alert className="mb-4 flex flex-col gap-3 bg-emerald-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <strong>
                    Office 365 setup (Microsoft Graph — OAuth 2.0)
                  </strong>
                </div>
              </div>

              <div className="ml-7 text-xs text-emerald-900">
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Register a new app in the{" "}
                    <a
                      href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      Azure Portal
                    </a>
                    .
                  </li>
                  <li>
                    Create a Client Secret (Certificates & secrets) and copy the
                    value — you can only see it once.
                  </li>
                  <li>
                    Under <strong>API permissions</strong> → Microsoft Graph →
                    <strong> Application permissions</strong>, add
                    <code className="mx-1 px-1 bg-muted/10 rounded">
                      Mail.Send
                    </code>
                    and then click <strong>Grant admin consent</strong>.
                  </li>
                  <li>
                    For daemon/app-only authentication (recommended for the ERP
                    email service) you do not need a Redirect URI — use the
                    Tenant ID, Client ID and Client Secret below.
                  </li>
                </ol>

                <div className="mt-2">
                  <strong>Example URIs</strong>
                  <div className="mt-1 ml-4 text-[11px] leading-tight">
                    <div>
                      <code className="rounded px-1 bg-muted/10">
                        Redirect URI (user OAuth)
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
                          (This app uses <code>NEXT_PUBLIC_APP_URL</code> to
                          build the redirect URI on the server — set it to your
                          app URL.)
                        </div>
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
                        (Azure will perform a GET redirect after sign-out;
                        choose your public landing page such as &apos;/&apos; or
                        a dedicated &apos;/logout&apos; page.)
                      </div>
                    </div>
                    <div className="mt-1 italic">
                      Daemon / app-only (no redirect): use Tenant ID, Client ID
                      and Client Secret in the ERP settings.
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input
                  value={office365TenantId}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setOffice365TenantId(v);
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
                      setOffice365SecretDirty(Boolean(v));
                      setOffice365SecretError(null);
                      setTestSuccess(false);
                    }}
                    placeholder="Leave empty to keep existing"
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
                {office365SecretError && (
                  <div className="text-xs text-destructive mb-1">
                    {office365SecretError}
                  </div>
                )}
                <p className="text-xs dark:text-gray-200">
                  Paste the client secret <strong>value</strong> from Azure (the
                  value shown once after creation). Do not paste the secret{" "}
                  <em>ID</em> and avoid surrounding whitespace.
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
                <div className="relative">
                  <Input
                    type={showSendgridKey ? "text" : "password"}
                    value={sendgridApiKey}
                    onChange={(e) => setSendgridApiKey(e.target.value)}
                    placeholder="Leave empty to keep existing"
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
                <p className="text-xs dark:text-gray-200">
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
                <div className="relative">
                  <Input
                    type={showMailgunKey ? "text" : "password"}
                    value={mailgunApiKey}
                    onChange={(e) => setMailgunApiKey(e.target.value)}
                    placeholder="Leave empty to keep existing"
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
                <p className="text-xs dark:text-gray-200">
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
                <p className="text-xs dark:text-gray-200">
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
                <p className="text-xs dark:text-gray-200">
                  AWS region where SES is configured (e.g., us-east-1,
                  eu-west-1)
                </p>
              </div>
              <div className="space-y-2">
                <Label>AWS Access Key ID</Label>
                <div className="relative">
                  <Input
                    type={showAwsKeys ? "text" : "password"}
                    value={awsAccessKey}
                    onChange={(e) => setAwsAccessKey(e.target.value)}
                    placeholder="Leave empty to keep existing"
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
                <p className="text-xs dark:text-gray-200">
                  IAM user access key ID from AWS credentials
                </p>
              </div>
              <div className="space-y-2">
                <Label>AWS Secret Access Key</Label>
                <div className="relative">
                  <Input
                    type={showAwsKeys ? "text" : "password"}
                    value={awsSecretKey}
                    onChange={(e) => setAwsSecretKey(e.target.value)}
                    placeholder="Leave empty to keep existing"
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
                <p className="text-xs dark:text-gray-200">
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
                <p className="text-xs dark:text-gray-200">
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

      case "NODEMAILER":
      case "SMTP":
        return (
          <>
            {selectedProvider.isGmail ? (
              <Alert className="mb-4 flex flex-row gap-3 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                <div className="flex-1 text-sm">
                  <strong>Gmail SMTP Setup:</strong>
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    <li>
                      Go to your{" "}
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80"
                      >
                        Google Account Security
                      </a>
                    </li>
                    <li>Enable 2-Step Verification (if not enabled)</li>
                    <li>
                      Go to{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80"
                      >
                        App Passwords
                      </a>
                    </li>
                    <li>Generate a new app password for &ldquo;Mail&rdquo;</li>
                    <li>
                      Use that 16-character password below (not your regular
                      Gmail password)
                    </li>
                  </ol>
                  <p className="mt-2 text-xs dark:text-gray-200">
                    <strong>Note:</strong> Gmail SMTP is pre-configured for you.
                    Just enter your Gmail address and App Password.
                  </p>
                </div>
              </Alert>
            ) : (
              <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <strong>Default ERP Email Service:</strong> Configure your
                  SMTP server settings to send emails. This is the recommended
                  default provider for the OnTarget ERP system.
                </div>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input
                  value={nodemailerHost}
                  onChange={(e) => setNodemailerHost(e.target.value)}
                  placeholder="smtp.example.com"
                />
                <p className="text-xs dark:text-gray-200">
                  {selectedProvider.isGmail
                    ? "Pre-configured for Gmail (smtp.gmail.com)"
                    : "SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={nodemailerPort}
                    onChange={(e) => setNodemailerPort(e.target.value)}
                    placeholder="587"
                  />
                  <p className="text-xs dark:text-gray-200">
                    {selectedProvider.isGmail
                      ? "Pre-configured (587 with TLS)"
                      : "Usually 587 (TLS) or 465 (SSL)"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Secure Connection (TLS)</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="nodemailer-secure"
                      checked={nodemailerSecure}
                      onChange={(e) => setNodemailerSecure(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label
                      htmlFor="nodemailer-secure"
                      className="text-sm dark:text-gray-200"
                    >
                      {selectedProvider.isGmail
                        ? "Enabled (Required)"
                        : "Use SSL/TLS (port 465)"}
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>SMTP Username</Label>
                <Input
                  value={nodemailerUsername}
                  onChange={(e) => setNodemailerUsername(e.target.value)}
                  placeholder={
                    selectedProvider.isGmail
                      ? "your-email@gmail.com"
                      : "your-email@example.com"
                  }
                />
                <p className="text-xs dark:text-gray-200">
                  {selectedProvider.isGmail
                    ? "Your Gmail address"
                    : "Usually your email address"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>SMTP Password</Label>
                <div className="relative">
                  <Input
                    type={showNodemailerPassword ? "text" : "password"}
                    value={nodemailerPassword}
                    onChange={(e) => setNodemailerPassword(e.target.value)}
                    placeholder={
                      selectedProvider.isGmail
                        ? "16-character App Password"
                        : "Leave empty to keep existing"
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() =>
                      setShowNodemailerPassword(!showNodemailerPassword)
                    }
                  >
                    {showNodemailerPassword ? (
                      <EyeOff className="h-4 w-4 dark:text-gray-200" />
                    ) : (
                      <Eye className="h-4 w-4 dark:text-gray-200" />
                    )}
                  </Button>
                </div>
                <p className="text-xs dark:text-gray-200">
                  {selectedProvider.isGmail
                    ? "Use the 16-character App Password from Google (NOT your regular Gmail password)"
                    : "Your email password or app-specific password"}
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Common SMTP Providers:</strong>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>
                      <strong>Gmail:</strong> smtp.gmail.com:587 (Enable 2FA and
                      use App Password)
                    </li>
                    <li>
                      <strong>Outlook/Office 365:</strong>{" "}
                      smtp.office365.com:587
                    </li>
                    <li>
                      <strong>Yahoo:</strong> smtp.mail.yahoo.com:587
                    </li>
                    <li>
                      <strong>Custom Domain:</strong> Contact your hosting
                      provider for SMTP details
                    </li>
                  </ul>
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
      {/* Company Selector for ADMIN_OWNER and SUPER_ADMIN */}
      {(userRole === "ADMIN_OWNER" ||
        userRole === "ADMIN_NONOWNER" ||
        userRole === "SUPER_ADMIN") &&
        companies.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>Configuration Level</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  {userRole === "SUPER_ADMIN" && (
                    <option value="GLOBAL">
                      🌐 Global Default (System-wide)
                    </option>
                  )}
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      🏢 {company.name} (Company Override)
                    </option>
                  ))}
                </select>
                <p className="text-xs dark:text-gray-200">
                  {userRole === "SUPER_ADMIN"
                    ? "Configure global default settings or override for specific companies you own."
                    : "Choose a company to override the global email settings with custom configuration."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {userRole === "SUPER_ADMIN" && selectedCompanyId === "GLOBAL" && (
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
      <div className="ml-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((provider) => {
          const isActive = activeProvider === provider.type;
          const isGlobalActive =
            !isActive && globalActiveProvider === provider.type;
          const showBorderBeam = isActive || isGlobalActive;

          return (
            <Card
              key={provider.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
                isActive && "ring-2 ring-primary",
                isGlobalActive && "ring-2 ring-blue-500"
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
                      {isGlobalActive && (
                        <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white gap-1">
                          <Crown className="h-3 w-3" />
                          Global
                        </span>
                      )}
                    </h3>
                    <p className="text-sm dark:text-gray-200 mt-1">
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
                {isGlobalActive && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Crown className="h-4 w-4" />
                    Using global configuration
                  </div>
                )}
              </CardContent>

              {showBorderBeam && (
                <BorderBeam
                  size={100}
                  duration={8}
                  borderWidth={4}
                  colorFrom={isActive ? "#10b981" : "#3b82f6"}
                  colorTo={isActive ? "#a855f7" : "#8b5cf6"}
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
            {selectedProvider && selectedProvider.type !== "GOOGLE_OAUTH" && (
              <>
                {/* If company-scoped and user is not owner, show read-only notice */}
                {selectedCompanyId !== "GLOBAL" &&
                  companyOwnerId !== userId &&
                  userRole !== "SUPER_ADMIN" && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <div className="flex-1 text-sm">
                        Only the company owner can modify email provider
                        settings. You can view the current configuration.
                      </div>
                    </Alert>
                  )}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleTest}
                    disabled={
                      isTesting ||
                      isSaving ||
                      (selectedCompanyId !== "GLOBAL" &&
                        companyOwnerId !== userId &&
                        userRole !== "SUPER_ADMIN")
                    }
                    variant="outline"
                    className="flex-1"
                  >
                    {isTesting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Test Connection
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={(() => {
                      if (isTesting || isSaving) return true;
                      if (!testSuccess) return true;
                      if (selectedProvider.type === "OFFICE365") {
                        const tenantChanged =
                          office365TenantId.trim() !==
                          originalOffice365TenantId;
                        const clientChanged =
                          office365ClientId.trim() !==
                          originalOffice365ClientId;
                        const missingSecret =
                          (tenantChanged || clientChanged) &&
                          String(office365ClientSecret || "").trim() === "";
                        if (missingSecret) return true;
                        if (office365SecretDirty && !testSuccess) return true;
                      }
                      // Owner-only check for saving company-scoped config
                      if (
                        selectedCompanyId !== "GLOBAL" &&
                        companyOwnerId !== userId &&
                        userRole !== "SUPER_ADMIN"
                      )
                        return true;
                      return false;
                    })()}
                    className="flex-1"
                  >
                    {isSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save & Activate
                  </Button>
                </div>
              </>
            )}

            {!testSuccess &&
              selectedProvider &&
              selectedProvider.type !== "GOOGLE_OAUTH" && (
                <p className="text-xs dark:text-gray-200 text-center">
                  Test connection successfully before saving
                </p>
              )}
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
