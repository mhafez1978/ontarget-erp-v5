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

interface StorageProviderCardsProps {
  userRole: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "LOCAL" | "AWS_S3" | "GOOGLE_DRIVE" | "ONEDRIVE" | "DIGITALOCEAN";
  color: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "local",
    name: "Local Storage",
    description: "Coolify/Hetzner server storage",
    icon: "https://www.vectorlogo.zone/logos/hetzner/hetzner-icon.svg",
    type: "LOCAL",
    color: "from-[#D50C2D] to-[#B0091F]",
  },
  {
    id: "aws_s3",
    name: "Amazon S3",
    description: "AWS Simple Storage Service",
    icon: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg",
    type: "AWS_S3",
    color: "from-[#FF9900] to-[#F90]",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Google Cloud Storage & Drive API",
    icon: "https://www.vectorlogo.zone/logos/google_drive/google_drive-icon.svg",
    type: "GOOGLE_DRIVE",
    color: "from-[#4285F4] to-[#34A853]",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    description: "Microsoft OneDrive for Business",
    icon: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg",
    type: "ONEDRIVE",
    color: "from-[#0078D4] to-[#106EBE]",
  },
  {
    id: "digitalocean",
    name: "DigitalOcean Spaces",
    description: "S3-compatible object storage",
    icon: "https://www.vectorlogo.zone/logos/digitalocean/digitalocean-icon.svg",
    type: "DIGITALOCEAN",
    color: "from-[#0080FF] to-[#0069D9]",
  },
];

export function StorageProviderCards({ userRole }: StorageProviderCardsProps) {
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

  // Local storage fields
  const [localPath, setLocalPath] = useState("../var/storage/cold");

  // AWS S3 fields
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [awsBucket, setAwsBucket] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");

  // Google Drive fields
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googleFolderId, setGoogleFolderId] = useState("");

  // OneDrive fields
  const [onedriveClientId, setOnedriveClientId] = useState("");
  const [onedriveClientSecret, setOnedriveClientSecret] = useState("");
  const [onedriveTenantId, setOnedriveTenantId] = useState("");

  // DigitalOcean fields
  const [doAccessKey, setDoAccessKey] = useState("");
  const [doSecretKey, setDoSecretKey] = useState("");
  const [doSpace, setDoSpace] = useState("");
  const [doEndpoint, setDoEndpoint] = useState("nyc3.digitaloceanspaces.com");

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
            ? "/api/settings/storage?scope=GLOBAL"
            : `/api/settings/storage?companyId=${selectedCompanyId}`;

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
          ? "/api/settings/storage?scope=GLOBAL"
          : `/api/settings/storage?companyId=${selectedCompanyId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (
        response.ok &&
        data.provider &&
        data.provider.provider === provider.type
      ) {
        const p = data.provider;
        setLocalPath(p.config?.path || "../var/storage/cold");
        setAwsAccessKeyId(p.config?.accessKeyId || "");
        setAwsSecretAccessKey(p.config?.secretAccessKey || "");
        setAwsBucket(p.config?.bucket || "");
        setAwsRegion(p.config?.region || "us-east-1");
        setGoogleClientId(p.config?.clientId || "");
        setGoogleClientSecret(p.config?.clientSecret || "");
        setGoogleApiKey(p.config?.apiKey || "");
        setGoogleFolderId(p.config?.folderId || "");
        setOnedriveClientId(p.config?.clientId || "");
        setOnedriveClientSecret(p.config?.clientSecret || "");
        setOnedriveTenantId(p.config?.tenantId || "");
        setDoAccessKey(p.config?.accessKey || "");
        setDoSecretKey(p.config?.secretKey || "");
        setDoSpace(p.config?.space || "");
        setDoEndpoint(p.config?.endpoint || "nyc3.digitaloceanspaces.com");

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
    setLocalPath("../var/storage/cold");
    setAwsAccessKeyId("");
    setAwsSecretAccessKey("");
    setAwsBucket("");
    setAwsRegion("us-east-1");
    setGoogleClientId("");
    setGoogleClientSecret("");
    setGoogleApiKey("");
    setGoogleFolderId("");
    setOnedriveClientId("");
    setOnedriveClientSecret("");
    setOnedriveTenantId("");
    setDoAccessKey("");
    setDoSecretKey("");
    setDoSpace("");
    setDoEndpoint("nyc3.digitaloceanspaces.com");
  };

  const handleTest = async () => {
    if (!selectedProvider) return;

    try {
      setIsTesting(true);
      setTestResult(null);

      const config = buildConfig();

      const response = await fetch("/api/settings/storage/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: "Connection successful!" });
        setTestSuccess(true);
        toast.success("Storage provider connection successful!");
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

      const response = await fetch("/api/settings/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Storage provider settings saved and activated!");
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

    const baseConfig: Record<
      string,
      string | number | boolean | null | object
    > = {
      provider: selectedProvider.type,
      isActive: false,
      scope: selectedCompanyId === "GLOBAL" ? "GLOBAL" : selectedCompanyId,
      companyId: selectedCompanyId === "GLOBAL" ? null : selectedCompanyId,
    };

    if (selectedProvider.type === "LOCAL") {
      baseConfig.config = { path: localPath };
    } else if (selectedProvider.type === "AWS_S3") {
      baseConfig.config = {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        bucket: awsBucket,
        region: awsRegion,
      };
    } else if (selectedProvider.type === "GOOGLE_DRIVE") {
      baseConfig.config = {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        apiKey: googleApiKey,
        folderId: googleFolderId,
      };
    } else if (selectedProvider.type === "ONEDRIVE") {
      baseConfig.config = {
        clientId: onedriveClientId,
        clientSecret: onedriveClientSecret,
        tenantId: onedriveTenantId,
      };
    } else if (selectedProvider.type === "DIGITALOCEAN") {
      baseConfig.config = {
        accessKey: doAccessKey,
        secretKey: doSecretKey,
        space: doSpace,
        endpoint: doEndpoint,
      };
    }

    return baseConfig;
  };

  const renderProviderFields = () => {
    if (!selectedProvider) return null;

    switch (selectedProvider.type) {
      case "LOCAL":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Local Storage:</strong> Store files directly on your
                Coolify/Hetzner server. Ensure the path exists and has proper
                permissions (chmod 755 or 777).
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Storage Path</Label>
                <Input
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="../var/storage/cold"
                />
                <p className="text-xs text-muted-foreground">
                  Absolute path to the directory on your server
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Create the directory with{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    mkdir -p ../var/storage/cold
                  </code>{" "}
                  and set permissions with{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    chmod 755 ../var/storage/cold
                  </code>
                  . Ensure your application has read/write access.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "AWS_S3":
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
                with <strong>AmazonS3FullAccess</strong> policy, then create an
                S3 bucket in{" "}
                <a
                  href="https://s3.console.aws.amazon.com/s3/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  S3 Console
                </a>
                .
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Access Key ID</Label>
                <Input
                  type="password"
                  value={awsAccessKeyId}
                  onChange={(e) => setAwsAccessKeyId(e.target.value)}
                  placeholder="AKIA••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  IAM user access key ID from AWS credentials
                </p>
              </div>
              <div className="space-y-2">
                <Label>Secret Access Key</Label>
                <Input
                  type="password"
                  value={awsSecretAccessKey}
                  onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  IAM user secret access key from AWS credentials
                </p>
              </div>
              <div className="space-y-2">
                <Label>Bucket Name</Label>
                <Input
                  value={awsBucket}
                  onChange={(e) => setAwsBucket(e.target.value)}
                  placeholder="my-cold-storage"
                />
                <p className="text-xs text-muted-foreground">
                  Your S3 bucket name (must be globally unique)
                </p>
              </div>
              <div className="space-y-2">
                <Label>AWS Region</Label>
                <Input
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  placeholder="us-east-1"
                />
                <p className="text-xs text-muted-foreground">
                  AWS region where your bucket is located
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Create an IAM user with
                  programmatic access and attach the{" "}
                  <strong>AmazonS3FullAccess</strong> policy. Create your bucket
                  in{" "}
                  <a
                    href="https://s3.console.aws.amazon.com/s3/home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    S3 Console
                  </a>{" "}
                  and configure appropriate versioning and lifecycle policies.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "GOOGLE_DRIVE":
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
                , enable Google Drive API, and create OAuth 2.0 credentials.
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
                <Label>API Key (Optional)</Label>
                <Input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIza••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Google Drive API key for additional operations
                </p>
              </div>
              <div className="space-y-2">
                <Label>Folder ID (Optional)</Label>
                <Input
                  value={googleFolderId}
                  onChange={(e) => setGoogleFolderId(e.target.value)}
                  placeholder="1a2b3c4d5e6f7g8h9i0j"
                />
                <p className="text-xs text-muted-foreground">
                  Specific folder ID to store files (leave empty for root)
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Enable the Google Drive API in{" "}
                  <a
                    href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    API Library
                  </a>{" "}
                  and create credentials in{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Credentials
                  </a>
                  .
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "ONEDRIVE":
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
                , grant <strong>Files.ReadWrite.All</strong> permission, and
                create a client secret.
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client ID (Application ID)</Label>
                <Input
                  value={onedriveClientId}
                  onChange={(e) => setOnedriveClientId(e.target.value)}
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
                  value={onedriveClientSecret}
                  onChange={(e) => setOnedriveClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Client secret value from Azure app registration
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input
                  value={onedriveTenantId}
                  onChange={(e) => setOnedriveTenantId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Azure AD Directory (tenant) ID
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Register your application in Azure
                  Portal and grant <strong>Files.ReadWrite.All</strong> under
                  Microsoft Graph permissions. Create a client secret in the
                  Certificates & secrets section.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );

      case "DIGITALOCEAN":
        return (
          <>
            <Alert className="mb-4 flex flex-row gap-3 bg-emerald-100">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <strong>Setup Required:</strong> Create a Space in{" "}
                <a
                  href="https://cloud.digitalocean.com/spaces"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  DigitalOcean Spaces
                </a>{" "}
                and generate Spaces access keys in{" "}
                <a
                  href="https://cloud.digitalocean.com/account/api/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  API Tokens
                </a>
                .
              </div>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Access Key</Label>
                <Input
                  type="password"
                  value={doAccessKey}
                  onChange={(e) => setDoAccessKey(e.target.value)}
                  placeholder="DO00••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  DigitalOcean Spaces access key
                </p>
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  value={doSecretKey}
                  onChange={(e) => setDoSecretKey(e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  DigitalOcean Spaces secret key
                </p>
              </div>
              <div className="space-y-2">
                <Label>Space Name</Label>
                <Input
                  value={doSpace}
                  onChange={(e) => setDoSpace(e.target.value)}
                  placeholder="my-space"
                />
                <p className="text-xs text-muted-foreground">
                  Your DigitalOcean Space name
                </p>
              </div>
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <Input
                  value={doEndpoint}
                  onChange={(e) => setDoEndpoint(e.target.value)}
                  placeholder="nyc3.digitaloceanspaces.com"
                />
                <p className="text-xs text-muted-foreground">
                  Space endpoint (e.g., nyc3, sfo3, ams3, sgp1)
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> Create a Space in your preferred
                  region and generate Spaces keys from{" "}
                  <a
                    href="https://cloud.digitalocean.com/account/api/spaces"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    API → Spaces Keys
                  </a>
                  . Spaces are S3-compatible for easy migration.
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
                Select &quot;Global Default&quot; to use the system-wide storage
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
            You&apos;re configuring the <strong>global default</strong> cold
            storage provider. All companies will use this unless they override
            it with their own settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Usage Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cold Storage Usage:</strong> Failed login attempts, visitor
          tracking logs, audit trails (7-year retention), company data backups,
          and compliance data.
        </AlertDescription>
      </Alert>

      {/* Provider Cards Grid */}
      <div className="ml-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    Currently storing files
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
                type="button"
              >
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
              <Button
                onClick={handleSave}
                disabled={isTesting || isSaving || !testSuccess}
                className="flex-1"
                type="button"
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
