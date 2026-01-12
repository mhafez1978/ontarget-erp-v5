"use client";

import { Globe, CheckCircle2, Loader2 } from "lucide-react";
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

interface GeoProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "IP_API" | "IPINFO" | "IPGEOLOCATION";
  color: string;
  requiresApiKey: boolean;
  limits: string;
}

const PROVIDERS: GeoProviderConfig[] = [
  {
    id: "ip_api",
    name: "IP-API.com",
    description: "45 requests/minute (No API key required)",
    icon: "🌍",
    type: "IP_API",
    color: "from-blue-500 to-cyan-500",
    requiresApiKey: false,
    limits: "27,000/day free",
  },
  {
    id: "ipinfo",
    name: "IPinfo.io",
    description: "50,000 requests/month with API key",
    icon: "https://ipinfo.io/static/ipinfo-small.svg",
    type: "IPINFO",
    color: "from-green-500 to-emerald-500",
    requiresApiKey: true,
    limits: "50k/month free",
  },
  {
    id: "ipgeolocation",
    name: "IP Geolocation",
    description: "30,000 requests/month with API key",
    icon: "🗺️",
    type: "IPGEOLOCATION",
    color: "from-purple-500 to-pink-500",
    requiresApiKey: true,
    limits: "30k/month free",
  },
];

export function GeoTrackingProviderCards() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] =
    useState<GeoProviderConfig | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/geo-tracking");
      const data = await response.json();

      if (response.ok) {
        setIsEnabled(data.enabled || false);
        setActiveProvider(data.provider || null);
        setApiKey(data.apiKey || "");
      }
    } catch (error) {
      console.error("Error fetching geo tracking settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (provider: GeoProviderConfig) => {
    setSelectedProvider(provider);
    setIsSheetOpen(true);

    // Load existing config if this is the active provider
    if (provider.type === activeProvider) {
      // API key already loaded
    } else {
      setApiKey("");
    }
  };

  const handleTest = async () => {
    if (!selectedProvider) return;

    setIsTesting(true);
    try {
      const response = await fetch("/api/settings/geo-tracking/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider.type,
          apiKey: selectedProvider.requiresApiKey ? apiKey : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Connection successful! Location: ${data.city}, ${data.country}`
        );
      } else {
        toast.error(data.error || "Connection test failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) return;

    if (selectedProvider.requiresApiKey && !apiKey.trim()) {
      toast.error("API key is required for this provider");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/geo-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: true,
          provider: selectedProvider.type,
          apiKey: selectedProvider.requiresApiKey ? apiKey : undefined,
        }),
      });

      if (response.ok) {
        toast.success("Geo tracking settings saved successfully");
        setActiveProvider(selectedProvider.type);
        setIsEnabled(true);
        setIsSheetOpen(false);
        fetchSettings();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/settings/geo-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          provider: activeProvider,
          apiKey,
        }),
      });

      if (response.ok) {
        setIsEnabled(enabled);
        toast.success(
          enabled ? "Geo tracking enabled" : "Geo tracking disabled"
        );
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Geo Tracking</h3>
          <p className="text-sm dark:text-gray-200">
            Track user locations for security and analytics
          </p>
        </div>
        <Button
          className={
            isEnabled
              ? "bg-green-500 hover:bg-slate-500 hover:text-white"
              : "bg-slate-500 text-white hover:bg-green-500 hover:text-slate-900"
          }
          onClick={() => handleToggle(!isEnabled)}
        >
          {isEnabled ? "Enabled" : "Enable"}
        </Button>
      </div>

      {!activeProvider && (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            Select a provider below to enable geo tracking
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        {PROVIDERS.map((provider) => {
          const isActive = isEnabled && provider.type === activeProvider;

          return (
            <Card
              key={provider.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                isActive && "ring-2 ring-primary"
              )}
              onClick={() => handleCardClick(provider)}
            >
              {isActive && (
                <>
                  <BorderBeam size={250} duration={12} delay={9} />
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                </>
              )}

              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br text-2xl",
                      provider.color
                    )}
                  >
                    {provider.icon.startsWith("http") ? (
                      <Image
                        src={provider.icon}
                        alt={provider.name}
                        width={32}
                        height={32}
                        className="rounded"
                      />
                    ) : (
                      provider.icon
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">{provider.name}</h4>
                    <p className="text-sm dark:text-gray-200">
                      {provider.description}
                    </p>
                    <p className="text-xs dark:text-gray-200">
                      {provider.limits}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configure {selectedProvider?.name}</SheetTitle>
            <SheetDescription>{selectedProvider?.description}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {selectedProvider?.requiresApiKey && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <p className="text-xs dark:text-gray-200">
                  Get your free API key from{" "}
                  {selectedProvider.type === "IPINFO" && (
                    <a
                      href="https://ipinfo.io/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      ipinfo.io
                    </a>
                  )}
                  {selectedProvider.type === "IPGEOLOCATION" && (
                    <a
                      href="https://ipgeolocation.io/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      ipgeolocation.io
                    </a>
                  )}
                </p>
              </div>
            )}

            {!selectedProvider?.requiresApiKey && (
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  This provider doesn&apos;t require an API key. Just test and
                  save to activate.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={
                  isTesting ||
                  (selectedProvider?.requiresApiKey && !apiKey.trim())
                }
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
                disabled={
                  isSaving ||
                  (selectedProvider?.requiresApiKey && !apiKey.trim())
                }
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Activate"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
