"use client";

import {
  Database,
  HardDrive,
  Cloud,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface StorageConfig {
  // LOCAL
  path?: string;

  // AWS S3
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  region?: string;

  // Google Drive
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  folderId?: string;

  // OneDrive
  tenantId?: string;

  // DigitalOcean
  accessKey?: string;
  secretKey?: string;
  space?: string;
  endpoint?: string;
}

interface StorageProviderProps {
  userRole: string;
  companyId?: string;
}

export function StorageProviderSettings({
  userRole,
  companyId,
}: StorageProviderProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("LOCAL");
  const [config, setConfig] = useState<StorageConfig>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const scope = isSuperAdmin && !companyId ? "GLOBAL" : companyId;

  const providers = [
    {
      value: "LOCAL",
      label: "Local Storage (Coolify/Hetzner)",
      icon: HardDrive,
    },
    { value: "GOOGLE_DRIVE", label: "Google Drive", icon: Cloud },
    { value: "ONEDRIVE", label: "Microsoft OneDrive", icon: Cloud },
    { value: "AWS_S3", label: "Amazon S3", icon: Database },
    { value: "DIGITALOCEAN", label: "DigitalOcean Spaces", icon: Database },
  ];

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/settings/storage/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          config,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Connection successful!");
        setTestResult({ success: true, message: data.message });
      } else {
        toast.error(data.error || "Connection failed");
        setTestResult({
          success: false,
          message: data.error || "Connection failed",
        });
      }
    } catch (error) {
      console.error("Test connection error:", error);
      toast.error("Failed to test connection");
      setTestResult({ success: false, message: "Failed to test connection" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!testResult?.success) {
      toast.error("Please test the connection first");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          config,
          scope: scope || "GLOBAL",
          companyId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save storage configuration");
      }

      toast.success("Storage configuration saved successfully!");
      setTestResult(null);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save configuration"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfigForm = () => {
    switch (selectedProvider) {
      case "LOCAL":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="path">Storage Path</Label>
              <Input
                id="path"
                placeholder="../var/storage/cold"
                value={config.path || ""}
                onChange={(e) => setConfig({ ...config, path: e.target.value })}
              />
              <p className="text-xs dark:text-gray-200 mt-1">
                Default server storage path for cold data
              </p>
            </div>
          </div>
        );

      case "AWS_S3":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accessKeyId">Access Key ID *</Label>
              <Input
                id="accessKeyId"
                type="password"
                value={config.accessKeyId || ""}
                onChange={(e) =>
                  setConfig({ ...config, accessKeyId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="secretAccessKey">Secret Access Key *</Label>
              <Input
                id="secretAccessKey"
                type="password"
                value={config.secretAccessKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, secretAccessKey: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="bucket">Bucket Name *</Label>
              <Input
                id="bucket"
                placeholder="my-cold-storage"
                value={config.bucket || ""}
                onChange={(e) =>
                  setConfig({ ...config, bucket: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                placeholder="us-east-1"
                value={config.region || ""}
                onChange={(e) =>
                  setConfig({ ...config, region: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "GOOGLE_DRIVE":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                value={config.clientId || ""}
                onChange={(e) =>
                  setConfig({ ...config, clientId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <Input
                id="clientSecret"
                type="password"
                value={config.clientSecret || ""}
                onChange={(e) =>
                  setConfig({ ...config, clientSecret: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, apiKey: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="folderId">Folder ID (Optional)</Label>
              <Input
                id="folderId"
                placeholder="Root folder if empty"
                value={config.folderId || ""}
                onChange={(e) =>
                  setConfig({ ...config, folderId: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "ONEDRIVE":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                value={config.clientId || ""}
                onChange={(e) =>
                  setConfig({ ...config, clientId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <Input
                id="clientSecret"
                type="password"
                value={config.clientSecret || ""}
                onChange={(e) =>
                  setConfig({ ...config, clientSecret: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="tenantId">Tenant ID *</Label>
              <Input
                id="tenantId"
                value={config.tenantId || ""}
                onChange={(e) =>
                  setConfig({ ...config, tenantId: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "DIGITALOCEAN":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accessKey">Access Key *</Label>
              <Input
                id="accessKey"
                type="password"
                value={config.accessKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, accessKey: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="secretKey">Secret Key *</Label>
              <Input
                id="secretKey"
                type="password"
                value={config.secretKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, secretKey: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="space">Space Name *</Label>
              <Input
                id="space"
                placeholder="my-space"
                value={config.space || ""}
                onChange={(e) =>
                  setConfig({ ...config, space: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                placeholder="nyc3.digitaloceanspaces.com"
                value={config.endpoint || ""}
                onChange={(e) =>
                  setConfig({ ...config, endpoint: e.target.value })
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cold Storage Configuration
        </CardTitle>
        <CardDescription>
          {isSuperAdmin && !companyId
            ? "Configure global cold storage for all OnTarget ERP data (logs, archives, compliance data)"
            : "Configure company-specific cold storage for your data backups"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="provider">Storage Provider</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => {
                const Icon = provider.icon;
                return (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {provider.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {renderConfigForm()}

        {testResult && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md ${
              testResult.success
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleTestConnection}
            variant="outline"
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !testResult?.success}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-md text-sm space-y-2">
          <p className="font-medium">Storage Usage:</p>
          <ul className="space-y-1 dark:text-gray-200">
            <li>• Failed login attempts (archived after 30 days)</li>
            <li>• Visitor tracking logs (archived after 30 days)</li>
            <li>• User activity logs (archived after 30 days)</li>
            <li>• Company data backups (compliance & legal)</li>
            <li>• Audit trail history (7 years retention)</li>
          </ul>
          {isSuperAdmin && (
            <p className="text-xs pt-2 border-t mt-3">
              <strong>FedRAMP & Legal Compliance:</strong> OnTarget ERP retains
              all subscriber data regardless of company deletion for legal
              compliance and court order readiness.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
