"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Info,
  Key,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Database,
  Users,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { StorageProviderCards } from "@/components/storage-provider-cards";
import { EmailProviderCards } from "@/components/email-provider-cards";
import { SubscriptionPlanCards } from "@/components/subscription-plan-cards";
import { UserManagementTable } from "@/components/user-management-table";

interface OAuthProvider {
  id: string;
  provider:
    | "google"
    | "microsoft"
    | "github"
    | "linkedin"
    | "yahoo"
    | "line"
    | "yandex"
    | "wechat";
  enabled: boolean;
  clientId: string;
  clientSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function SettingsPage() {
  const router = useRouter();
  const [geoTrackingEnabled, setGeoTrackingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OAuth Providers state
  const [oauthProviders, setOauthProviders] = useState<{
    google: { enabled: boolean; clientId: string; clientSecret: string };
    microsoft: { enabled: boolean; clientId: string; clientSecret: string };
    github: { enabled: boolean; clientId: string; clientSecret: string };
    linkedin: { enabled: boolean; clientId: string; clientSecret: string };
    yahoo: { enabled: boolean; clientId: string; clientSecret: string };
    line: { enabled: boolean; clientId: string; clientSecret: string };
    yandex: { enabled: boolean; clientId: string; clientSecret: string };
    wechat: { enabled: boolean; clientId: string; clientSecret: string };
  }>({
    google: { enabled: false, clientId: "", clientSecret: "" },
    microsoft: { enabled: false, clientId: "", clientSecret: "" },
    github: { enabled: false, clientId: "", clientSecret: "" },
    linkedin: { enabled: false, clientId: "", clientSecret: "" },
    yahoo: { enabled: false, clientId: "", clientSecret: "" },
    line: { enabled: false, clientId: "", clientSecret: "" },
    yandex: { enabled: false, clientId: "", clientSecret: "" },
    wechat: { enabled: false, clientId: "", clientSecret: "" },
  });
  const [oauthLoading, setOauthLoading] = useState<{
    google: boolean;
    microsoft: boolean;
    github: boolean;
    linkedin: boolean;
    yahoo: boolean;
    line: boolean;
    yandex: boolean;
    wechat: boolean;
  }>({
    google: false,
    microsoft: false,
    github: false,
    linkedin: false,
    yahoo: false,
    line: false,
    yandex: false,
    wechat: false,
  });

  // State to track password visibility for each provider
  const [showSecrets, setShowSecrets] = useState<{
    google: boolean;
    microsoft: boolean;
    github: boolean;
    linkedin: boolean;
    yahoo: boolean;
    line: boolean;
    yandex: boolean;
    wechat: boolean;
  }>({
    google: false,
    microsoft: false,
    github: false,
    linkedin: false,
    yahoo: false,
    line: false,
    yandex: false,
    wechat: false,
  });

  const [user, setUser] = useState({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
    plan: "ESSENTIAL",
    companyId: null as string | null,
  });

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data.authenticated || data.user.role === "GUEST") {
          router.push("/");
          return;
        }

        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
          plan: data.user.plan || "ESSENTIAL",
          companyId: data.user.companyId || null,
        });
      } catch (error) {
        console.error("Failed to check user:", error);
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  // Load current settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load geo-tracking settings
        const geoResponse = await fetch("/api/settings/geo-tracking");
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          setGeoTrackingEnabled(geoData.enabled || false);
        }

        // Load OAuth provider settings
        const oauthResponse = await fetch("/api/settings/oauth-providers");
        if (oauthResponse.ok) {
          const oauthData = await oauthResponse.json();
          const providers: OAuthProvider[] = oauthData.providers || [];

          const googleProvider = providers.find(
            (p: OAuthProvider) => p.provider === "google"
          );
          const microsoftProvider = providers.find(
            (p: OAuthProvider) => p.provider === "microsoft"
          );
          const githubProvider = providers.find(
            (p: OAuthProvider) => p.provider === "github"
          );
          const linkedinProvider = providers.find(
            (p: OAuthProvider) => p.provider === "linkedin"
          );
          const yahooProvider = providers.find(
            (p: OAuthProvider) => p.provider === "yahoo"
          );
          const lineProvider = providers.find(
            (p: OAuthProvider) => p.provider === "line"
          );
          const yandexProvider = providers.find(
            (p: OAuthProvider) => p.provider === "yandex"
          );
          const wechatProvider = providers.find(
            (p: OAuthProvider) => p.provider === "wechat"
          );

          setOauthProviders({
            google: {
              enabled: googleProvider?.enabled || false,
              clientId: googleProvider?.clientId || "",
              clientSecret: googleProvider?.clientSecret || "",
            },
            microsoft: {
              enabled: microsoftProvider?.enabled || false,
              clientId: microsoftProvider?.clientId || "",
              clientSecret: microsoftProvider?.clientSecret || "",
            },
            github: {
              enabled: githubProvider?.enabled || false,
              clientId: githubProvider?.clientId || "",
              clientSecret: githubProvider?.clientSecret || "",
            },
            linkedin: {
              enabled: linkedinProvider?.enabled || false,
              clientId: linkedinProvider?.clientId || "",
              clientSecret: linkedinProvider?.clientSecret || "",
            },
            yahoo: {
              enabled: yahooProvider?.enabled || false,
              clientId: yahooProvider?.clientId || "",
              clientSecret: yahooProvider?.clientSecret || "",
            },
            line: {
              enabled: lineProvider?.enabled || false,
              clientId: lineProvider?.clientId || "",
              clientSecret: lineProvider?.clientSecret || "",
            },
            yandex: {
              enabled: yandexProvider?.enabled || false,
              clientId: yandexProvider?.clientId || "",
              clientSecret: yandexProvider?.clientSecret || "",
            },
            wechat: {
              enabled: wechatProvider?.enabled || false,
              clientId: wechatProvider?.clientId || "",
              clientSecret: wechatProvider?.clientSecret || "",
            },
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleGeoTrackingToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/geo-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: checked }),
      });

      if (response.ok) {
        setGeoTrackingEnabled(checked);
      }
    } catch (error) {
      console.error("Failed to update geo-tracking setting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthToggle = async (
    provider:
      | "google"
      | "microsoft"
      | "github"
      | "linkedin"
      | "yahoo"
      | "line"
      | "yandex"
      | "wechat",
    checked: boolean
  ) => {
    setOauthLoading({ ...oauthLoading, [provider]: true });
    try {
      const response = await fetch("/api/settings/oauth-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          enabled: checked,
          clientId: oauthProviders[provider].clientId || null,
          clientSecret: oauthProviders[provider].clientSecret || null,
        }),
      });

      if (response.ok) {
        setOauthProviders({
          ...oauthProviders,
          [provider]: { ...oauthProviders[provider], enabled: checked },
        });
      }
    } catch (error) {
      console.error(`Failed to update ${provider} OAuth setting:`, error);
    } finally {
      setOauthLoading({ ...oauthLoading, [provider]: false });
    }
  };

  const handleOAuthUpdate = async (
    provider:
      | "google"
      | "microsoft"
      | "github"
      | "linkedin"
      | "yahoo"
      | "line"
      | "yandex"
      | "wechat"
  ) => {
    setOauthLoading({ ...oauthLoading, [provider]: true });
    try {
      const response = await fetch("/api/settings/oauth-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          enabled: oauthProviders[provider].enabled,
          clientId: oauthProviders[provider].clientId,
          clientSecret: oauthProviders[provider].clientSecret,
        }),
      });

      if (response.ok) {
        toast.success(
          `${
            provider === "google" ? "Google" : "Microsoft"
          } OAuth credentials saved successfully!`
        );
      }
    } catch (error) {
      console.error(`Failed to save ${provider} OAuth credentials:`, error);
      toast.error("Failed to save credentials. Please try again.");
    } finally {
      setOauthLoading({ ...oauthLoading, [provider]: false });
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and preferences
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="geo-tracking">
            <AccordionTrigger className="text-xl font-semibold">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geo Tracking
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-4">
                {/* Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1 flex-1">
                    <Label
                      htmlFor="geo-tracking"
                      className="text-base font-medium"
                    >
                      Enable Geo Tracking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Track visitor and user locations when they visit or log in
                    </p>
                  </div>
                  <Switch
                    id="geo-tracking"
                    checked={geoTrackingEnabled}
                    onCheckedChange={handleGeoTrackingToggle}
                    disabled={isLoading}
                  />
                </div>

                {/* API Information */}
                <div className="rounded-lg bg-muted p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-base">
                        About Geo Tracking API
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This feature uses <strong>ipapi.co</strong> - a free
                        geolocation API that provides accurate location data
                        without requiring an API key.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Features:</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        <li>
                          Free tier: 30,000 requests per month (1,000/day)
                        </li>
                        <li>No API key required</li>
                        <li>
                          Tracks: IP address, city, state/province, country,
                          country flag
                        </li>
                        <li>Automatic rate limiting protection</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">How it works:</h4>
                      <ul className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                        <li>
                          <strong>Visitors:</strong> When someone lands on your
                          frontpage, their location is captured and stored as a
                          guest visit
                        </li>
                        <li>
                          <strong>Users:</strong> When users log in, their
                          current session location is tracked in real-time
                        </li>
                        <li>
                          <strong>Session End:</strong> When a user logs out,
                          their session location data is transferred to their
                          user profile as &quot;last login&quot; information
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Data Collected:</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        <li>IP Address</li>
                        <li>City</li>
                        <li>State/Province</li>
                        <li>Country Name</li>
                        <li>Country Flag Emoji</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open("https://ipapi.co/", "_blank")}
                    >
                      Learn More About ipapi.co
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-xs text-muted-foreground">
                        {geoTrackingEnabled
                          ? "Geo tracking is currently active"
                          : "Geo tracking is currently inactive"}
                      </p>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        geoTrackingEnabled
                          ? "bg-green-500 animate-pulse"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* OAuth Provider Settings */}
          <AccordionItem value="oauth-providers">
            <AccordionTrigger className="text-xl font-semibold">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                OAuth Provider Integrations
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Provider Visibility on Login/Register Pages
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Important:</strong> When you enable a provider
                        below and save its credentials, the corresponding OAuth
                        button (Google or Microsoft) will automatically appear
                        on both the login and register pages. Disabled providers
                        will not show any button.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Enable OAuth authentication providers for your ERP system.
                  These settings are currently system-wide and apply to all
                  users.
                </p>

                {/* Google OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
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
                      </div>
                      <div>
                        <h3 className="font-semibold">Google OAuth</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with Google
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.google.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.google.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.google.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("google", checked)
                        }
                        disabled={oauthLoading.google}
                      />
                    </div>
                  </div>

                  {oauthProviders.google.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Setup Instructions */}
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Setup Instructions
                        </h4>
                        <ol className="text-sm space-y-2 list-decimal list-inside">
                          <li>
                            Go to{" "}
                            <a
                              href="https://console.cloud.google.com/apis/credentials"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                            >
                              Google Cloud Console - Credentials
                            </a>
                          </li>
                          <li>
                            Create a new project or select an existing one
                          </li>
                          <li>
                            Click &quot;Create Credentials&quot; → &quot;OAuth
                            client ID&quot;
                          </li>
                          <li>
                            Select &quot;Web application&quot; as the
                            application type
                          </li>
                          <li>
                            Add Authorized JavaScript origins:{" "}
                            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                              {process.env.NEXT_PUBLIC_APP_URL}
                            </code>
                          </li>
                          <li>
                            Add Authorized redirect URI:{" "}
                            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                              {process.env.NEXT_PUBLIC_APP_URL}
                              /api/auth/callback/google
                            </code>
                          </li>
                          <li>Click &quot;Create&quot;</li>
                          <li>
                            Copy the &quot;Client ID&quot; and &quot;Client
                            Secret&quot; and paste them below
                          </li>
                        </ol>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="google-client-id">Client ID</Label>
                        <Input
                          id="google-client-id"
                          placeholder="Enter Google OAuth Client ID"
                          value={oauthProviders.google.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              google: {
                                ...oauthProviders.google,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="google-client-secret">
                          Client Secret
                        </Label>
                        <div className="relative">
                          <Input
                            id="google-client-secret"
                            type={showSecrets.google ? "text" : "password"}
                            placeholder={
                              oauthProviders.google.clientSecret
                                ? "••••••••••••••••"
                                : "Enter Google OAuth Client Secret"
                            }
                            value={oauthProviders.google.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                google: {
                                  ...oauthProviders.google,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                google: !showSecrets.google,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.google ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("google")}
                        disabled={oauthLoading.google}
                        size="sm"
                      >
                        Save Google Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* Microsoft OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          Microsoft OAuth (Office 365)
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with Microsoft/Office 365
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.microsoft.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.microsoft.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.microsoft.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("microsoft", checked)
                        }
                        disabled={oauthLoading.microsoft}
                      />
                    </div>
                  </div>

                  {oauthProviders.microsoft.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Setup Instructions */}
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Setup Instructions
                        </h4>
                        <ol className="text-sm space-y-2 list-decimal list-inside">
                          <li>
                            Go to{" "}
                            <a
                              href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                            >
                              Azure Portal - App Registrations
                            </a>
                          </li>
                          <li>Click &quot;New registration&quot;</li>
                          <li>
                            Enter a name (e.g., &quot;OnTarget ERP OAuth&quot;)
                          </li>
                          <li>
                            Under &quot;Supported account types&quot;, select
                            &quot;Accounts in any organizational directory and
                            personal Microsoft accounts&quot;
                          </li>
                          <li>
                            Add Redirect URI:{" "}
                            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                              {process.env.NEXT_PUBLIC_APP_URL}
                              /api/auth/microsoft/callback
                            </code>
                          </li>
                          <li>Click &quot;Register&quot;</li>
                          <li>
                            Copy the &quot;Application (client) ID&quot; and
                            paste it below
                          </li>
                          <li>
                            Go to &quot;Certificates & secrets&quot; → &quot;New
                            client secret&quot;
                          </li>
                          <li>
                            Create a secret, copy the value immediately, and
                            paste it below
                          </li>
                        </ol>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="microsoft-client-id">
                          Application (Client) ID
                        </Label>
                        <Input
                          id="microsoft-client-id"
                          placeholder="Enter Microsoft Azure Application ID"
                          value={oauthProviders.microsoft.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              microsoft: {
                                ...oauthProviders.microsoft,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="microsoft-client-secret">
                          Client Secret
                        </Label>
                        <div className="relative">
                          <Input
                            id="microsoft-client-secret"
                            type={showSecrets.microsoft ? "text" : "password"}
                            placeholder={
                              oauthProviders.microsoft.clientSecret
                                ? "••••••••••••••••"
                                : "Enter Microsoft Azure Client Secret"
                            }
                            value={oauthProviders.microsoft.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                microsoft: {
                                  ...oauthProviders.microsoft,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                microsoft: !showSecrets.microsoft,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.microsoft ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("microsoft")}
                        disabled={oauthLoading.microsoft}
                        size="sm"
                      >
                        Save Microsoft Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* GitHub OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shadow-sm">
                        <svg
                          className="h-6 w-6 text-white dark:text-gray-900"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">GitHub OAuth</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with GitHub
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.github.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.github.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.github.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("github", checked)
                        }
                        disabled={oauthLoading.github}
                      />
                    </div>
                  </div>
                  {oauthProviders.github.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="github-client-id">Client ID</Label>
                        <Input
                          id="github-client-id"
                          placeholder="Enter GitHub OAuth Client ID"
                          value={oauthProviders.github.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              github: {
                                ...oauthProviders.github,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github-client-secret">
                          Client Secret
                        </Label>
                        <div className="relative">
                          <Input
                            id="github-client-secret"
                            type={showSecrets.github ? "text" : "password"}
                            placeholder={
                              oauthProviders.github.clientSecret
                                ? "••••••••••••••••"
                                : "Enter GitHub OAuth Client Secret"
                            }
                            value={oauthProviders.github.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                github: {
                                  ...oauthProviders.github,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                github: !showSecrets.github,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.github ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("github")}
                        disabled={oauthLoading.github}
                        size="sm"
                      >
                        Save GitHub Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* LinkedIn OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#0077B5] flex items-center justify-center shadow-sm">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">LinkedIn OAuth</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with LinkedIn
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.linkedin.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.linkedin.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.linkedin.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("linkedin", checked)
                        }
                        disabled={oauthLoading.linkedin}
                      />
                    </div>
                  </div>
                  {oauthProviders.linkedin.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin-client-id">Client ID</Label>
                        <Input
                          id="linkedin-client-id"
                          placeholder="Enter LinkedIn OAuth Client ID"
                          value={oauthProviders.linkedin.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              linkedin: {
                                ...oauthProviders.linkedin,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin-client-secret">
                          Client Secret
                        </Label>
                        <div className="relative">
                          <Input
                            id="linkedin-client-secret"
                            type={showSecrets.linkedin ? "text" : "password"}
                            placeholder={
                              oauthProviders.linkedin.clientSecret
                                ? "••••••••••••••••"
                                : "Enter LinkedIn OAuth Client Secret"
                            }
                            value={oauthProviders.linkedin.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                linkedin: {
                                  ...oauthProviders.linkedin,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                linkedin: !showSecrets.linkedin,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.linkedin ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("linkedin")}
                        disabled={oauthLoading.linkedin}
                        size="sm"
                      >
                        Save LinkedIn Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* Yahoo OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#6001D2] flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xl">Y!</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Yahoo OAuth</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with Yahoo
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.yahoo.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.yahoo.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.yahoo.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("yahoo", checked)
                        }
                        disabled={oauthLoading.yahoo}
                      />
                    </div>
                  </div>
                  {oauthProviders.yahoo.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="yahoo-client-id">Client ID</Label>
                        <Input
                          id="yahoo-client-id"
                          placeholder="Enter Yahoo OAuth Client ID"
                          value={oauthProviders.yahoo.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              yahoo: {
                                ...oauthProviders.yahoo,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yahoo-client-secret">
                          Client Secret
                        </Label>
                        <div className="relative">
                          <Input
                            id="yahoo-client-secret"
                            type={showSecrets.yahoo ? "text" : "password"}
                            placeholder={
                              oauthProviders.yahoo.clientSecret
                                ? "••••••••••••••••"
                                : "Enter Yahoo OAuth Client Secret"
                            }
                            value={oauthProviders.yahoo.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                yahoo: {
                                  ...oauthProviders.yahoo,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                yahoo: !showSecrets.yahoo,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.yahoo ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("yahoo")}
                        disabled={oauthLoading.yahoo}
                        size="sm"
                      >
                        Save Yahoo Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* LINE OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#00B900] flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xl">
                          LINE
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">LINE OAuth</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with LINE
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.line.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.line.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.line.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("line", checked)
                        }
                        disabled={oauthLoading.line}
                      />
                    </div>
                  </div>
                  {oauthProviders.line.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="line-client-id">Channel ID</Label>
                        <Input
                          id="line-client-id"
                          placeholder="Enter LINE Channel ID"
                          value={oauthProviders.line.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              line: {
                                ...oauthProviders.line,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="line-client-secret">
                          Channel Secret
                        </Label>
                        <div className="relative">
                          <Input
                            id="line-client-secret"
                            type={showSecrets.line ? "text" : "password"}
                            placeholder={
                              oauthProviders.line.clientSecret
                                ? "••••••••••••••••"
                                : "Enter LINE Channel Secret"
                            }
                            value={oauthProviders.line.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                line: {
                                  ...oauthProviders.line,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                line: !showSecrets.line,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.line ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("line")}
                        disabled={oauthLoading.line}
                        size="sm"
                      >
                        Save LINE Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* Yandex OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#FF0000] flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xl">Я</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Yandex OAuth</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with Yandex
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.yandex.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.yandex.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.yandex.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("yandex", checked)
                        }
                        disabled={oauthLoading.yandex}
                      />
                    </div>
                  </div>
                  {oauthProviders.yandex.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="yandex-client-id">Application ID</Label>
                        <Input
                          id="yandex-client-id"
                          placeholder="Enter Yandex Application ID"
                          value={oauthProviders.yandex.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              yandex: {
                                ...oauthProviders.yandex,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yandex-client-secret">
                          Client Secret
                        </Label>
                        <div className="relative">
                          <Input
                            id="yandex-client-secret"
                            type={showSecrets.yandex ? "text" : "password"}
                            placeholder={
                              oauthProviders.yandex.clientSecret
                                ? "••••••••••••••••"
                                : "Enter Yandex Client Secret"
                            }
                            value={oauthProviders.yandex.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                yandex: {
                                  ...oauthProviders.yandex,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                yandex: !showSecrets.yandex,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.yandex ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("yandex")}
                        disabled={oauthLoading.yandex}
                        size="sm"
                      >
                        Save Yandex Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* WeChat OAuth */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#07C160] flex items-center justify-center shadow-sm">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088v-.034zm-3.01 2.402c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">WeChat OAuth</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with WeChat
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {oauthProviders.wechat.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                          {oauthProviders.wechat.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={oauthProviders.wechat.enabled}
                        onCheckedChange={(checked) =>
                          handleOAuthToggle("wechat", checked)
                        }
                        disabled={oauthLoading.wechat}
                      />
                    </div>
                  </div>
                  {oauthProviders.wechat.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="wechat-client-id">App ID</Label>
                        <Input
                          id="wechat-client-id"
                          placeholder="Enter WeChat App ID"
                          value={oauthProviders.wechat.clientId}
                          onChange={(e) =>
                            setOauthProviders({
                              ...oauthProviders,
                              wechat: {
                                ...oauthProviders.wechat,
                                clientId: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wechat-client-secret">App Secret</Label>
                        <div className="relative">
                          <Input
                            id="wechat-client-secret"
                            type={showSecrets.wechat ? "text" : "password"}
                            placeholder={
                              oauthProviders.wechat.clientSecret
                                ? "••••••••••••••••"
                                : "Enter WeChat App Secret"
                            }
                            value={oauthProviders.wechat.clientSecret}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                wechat: {
                                  ...oauthProviders.wechat,
                                  clientSecret: e.target.value,
                                },
                              })
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                wechat: !showSecrets.wechat,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSecrets.wechat ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOAuthUpdate("wechat")}
                        disabled={oauthLoading.wechat}
                        size="sm"
                      >
                        Save WeChat Credentials
                      </Button>
                    </div>
                  )}
                </div>

                {/* Information */}
                <div className="rounded-lg bg-muted p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-base">
                        OAuth Provider Setup
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        To enable OAuth authentication, you need to configure
                        your application in the respective provider&apos;s
                        developer console.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Google OAuth Setup:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                        <li>Go to Google Cloud Console</li>
                        <li>Create a new project or select existing</li>
                        <li>Enable Google+ API</li>
                        <li>Create OAuth 2.0 credentials</li>
                        <li>
                          Add authorized redirect URI:{" "}
                          <code className="text-xs bg-background px-1 py-0.5 rounded">
                            http://localhost:3001/api/auth/callback/google
                          </code>
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">
                        Microsoft OAuth Setup:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                        <li>Go to Azure Portal</li>
                        <li>Register a new application</li>
                        <li>Add platform: Web</li>
                        <li>
                          Add redirect URI:{" "}
                          <code className="text-xs bg-background px-1 py-0.5 rounded">
                            http://localhost:3001/api/auth/callback/microsoft
                          </code>
                        </li>
                        <li>Create a new client secret</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Storage Provider Configuration - SUPER_ADMIN and ADMIN */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <AccordionItem value="storage-provider">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Cold Storage Configuration
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <StorageProviderCards userRole={user.role} />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Email Provider Configuration - SUPER_ADMIN and ADMIN */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <AccordionItem value="email-provider">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Service Configuration
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <EmailProviderCards userRole={user.role} />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* User Management - Only for SUPER_ADMIN */}
          {user.role === "SUPER_ADMIN" && (
            <AccordionItem value="user-management">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Directory
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <UserManagementTable />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Subscription Plan Management - Only for ADMIN */}
          {user.role === "ADMIN" && (
            <AccordionItem value="subscription-plan">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Subscription Plan
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <SubscriptionPlanCards />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
