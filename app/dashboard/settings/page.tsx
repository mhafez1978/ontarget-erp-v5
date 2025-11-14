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
} from "lucide-react";
import { StorageProviderCards } from "@/components/storage-provider-cards";
import { EmailProviderCards } from "@/components/email-provider-cards";
import { SubscriptionPlanCards } from "@/components/subscription-plan-cards";
import { UserManagementTable } from "@/components/user-management-table";

interface OAuthProvider {
  id: string;
  provider: "google" | "microsoft";
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
  }>({
    google: { enabled: false, clientId: "", clientSecret: "" },
    microsoft: { enabled: false, clientId: "", clientSecret: "" },
  });
  const [oauthLoading, setOauthLoading] = useState<{
    google: boolean;
    microsoft: boolean;
  }>({
    google: false,
    microsoft: false,
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

          setOauthProviders({
            google: {
              enabled: googleProvider?.enabled || false,
              clientId: googleProvider?.clientId || "",
              clientSecret: "",
            },
            microsoft: {
              enabled: microsoftProvider?.enabled || false,
              clientId: microsoftProvider?.clientId || "",
              clientSecret: "",
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
    provider: "google" | "microsoft",
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

  const handleOAuthUpdate = async (provider: "google" | "microsoft") => {
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
                        <Input
                          id="google-client-secret"
                          type="password"
                          placeholder="Enter Google OAuth Client Secret"
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
                        />
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
                        <Input
                          id="microsoft-client-secret"
                          type="password"
                          placeholder="Enter Microsoft Azure Client Secret"
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
                        />
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
