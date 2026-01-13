"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BorderBeam } from "@/components/ui/border-beam";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  type: "UNSPLASH" | "PEXELS";
  color: string;
  requiresSecret?: boolean;
}

// Request types for settings API
type ImageProviderBase = {
  provider: "UNSPLASH" | "PEXELS";
  apiKey?: string;
  apiSecret?: string;
};

type ImageProviderTestRequest = ImageProviderBase;

type ImageProviderSaveRequest = ImageProviderBase & {
  isActive: boolean;
  scope: "GLOBAL" | string;
  companyId?: string | null;
};

// Zod schemas for runtime validation
const ImageProviderTestSchema = z.object({
  provider: z.enum(["UNSPLASH", "PEXELS"]),
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().optional(),
});

const ImageProviderSaveSchema = z.object({
  provider: z.enum(["UNSPLASH", "PEXELS"]),
  isActive: z.boolean(),
  scope: z.string(),
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().optional(),
});

const PROVIDERS: ProviderConfig[] = [
  {
    id: "unsplash",
    name: "Unsplash",
    description: "Search the Unsplash image library (requires Access Key)",
    type: "UNSPLASH",
    color: "from-gray-800 to-gray-600",
    requiresSecret: false,
  },
  {
    id: "pexels",
    name: "Pexels",
    description: "Search the Pexels image library (requires API Key)",
    type: "PEXELS",
    color: "from-teal-600 to-cyan-500",
    requiresSecret: false,
  },
];

function UnsplashLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#111" />
      <circle cx="16" cy="16" r="6" fill="#fff" />
    </svg>
  );
}

function PexelsLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="#06b6d4" />
      <path
        d="M7 12c0-2.761 4-6 5-6s5 3.239 5 6-4 6-5 6-5-3.239-5-6z"
        fill="#fff"
      />
    </svg>
  );
}

function ProviderLogo({ type }: { type: "UNSPLASH" | "PEXELS" }) {
  return type === "UNSPLASH" ? <UnsplashLogo /> : <PexelsLogo />;
}

export default function ImageProviderCards() {
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderConfig | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<
    "not-tested" | "testing" | "success" | "failure"
  >("not-tested");

  // form
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  useEffect(() => {
    fetchActiveProvider();
  }, []);

  const fetchActiveProvider = async () => {
    try {
      const url = `/api/settings/image-provider?scope=GLOBAL`;
      const res = await fetch(url);
      const j = await res.json();
      if (res.ok && j.provider) {
        setActiveProvider(j.provider.provider);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = async (provider: ProviderConfig) => {
    setSelectedProvider(provider);
    setApiKey("");
    setApiSecret("");

    // fetch existing GLOBAL config
    try {
      const url = `/api/settings/image-provider?scope=GLOBAL`;
      const res = await fetch(url);
      const j = await res.json();
      if (res.ok && j.provider && j.provider.provider === provider.type) {
        setApiKey(j.provider.apiKey ? "XXXXXXXXXXXXXXXXXXXXXXXX" : "");
        // do not reveal secret value
        setApiSecret("");
      }
    } catch (e) {
      console.error(e);
    }

    setTestStatus("not-tested");
    setIsSheetOpen(true);
  };

  const handleTest = async () => {
    if (!selectedProvider) return;
    setIsTesting(true);
    setTestStatus("testing");
    try {
      const body: ImageProviderTestRequest = {
        provider: selectedProvider.type,
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
      };

      // Validate payload locally before sending
      const parsedTest = ImageProviderTestSchema.safeParse(body);
      if (!parsedTest.success) {
        toast.error(
          "Invalid test input: " + parsedTest.error.issues[0]?.message
        );
        setTestStatus("failure");
        setIsTesting(false);
        return;
      }

      const res = await fetch("/api/settings/image-provider/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (res.ok) {
        toast.success("Connection test succeeded");
        setTestStatus("success");
      } else {
        toast.error(j.error || "Connection test failed");
        setTestStatus("failure");
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection test failed");
      setTestStatus("failure");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) return;
    setIsSaving(true);
    try {
      const body: ImageProviderSaveRequest = {
        provider: selectedProvider.type,
        isActive: true,
        scope: "GLOBAL",
      };
      if (apiKey && apiKey !== "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        body.apiKey = apiKey;
      if (apiSecret) body.apiSecret = apiSecret;

      // Validate payload before saving
      const parsedSave = ImageProviderSaveSchema.safeParse(body);
      if (!parsedSave.success) {
        toast.error(
          "Invalid save input: " + parsedSave.error.issues[0]?.message
        );
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/settings/image-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (res.ok) {
        toast.success("Image provider saved");
        setActiveProvider(selectedProvider.type);
        setIsSheetOpen(false);
        setTestStatus("not-tested");
      } else {
        toast.error(j.error || "Failed to save");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Image Providers</h3>
          <p className="text-sm dark:text-gray-200">
            Configure Global Image Provider for AI-generated images used across
            the platform.
          </p>
        </div>
      </div>

      <div className="ml-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROVIDERS.map((p) => {
          const isActive = activeProvider === p.type;

          return (
            <div key={p.id} className="relative">
              <Card
                className={cn(
                  "relative cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
                  isActive && "ring-2 ring-primary"
                )}
                onClick={() => handleCardClick(p)}
              >
                <div className="p-6 flex flex-col items-center justify-between h-56">
                  <div
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-lg p-2",
                      p.color
                    )}
                  >
                    <ProviderLogo type={p.type} />
                  </div>

                  <div className="text-center">
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="text-sm dark:text-gray-200 mt-1">
                      {p.description}
                    </div>
                  </div>

                  <div className="w-full flex flexx-col items-center justify-center">
                    {isActive ? (
                      <span className="inline-flex items-center rounded-full bg-primary px-3 py-2 text-md font-medium text-green-600">
                        Currently Active
                      </span>
                    ) : (
                      <span className="text-md text-gray-600">
                        Currently Disabled
                      </span>
                    )}
                    <CheckCircle2
                      className={cn(
                        "h-5 w-5 text-green-600",
                        !isActive && "opacity-0"
                      )}
                    />
                  </div>
                </div>

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
            </div>
          );
        })}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-3/4 px-4">
          <SheetHeader>
            <SheetTitle>{selectedProvider?.name}</SheetTitle>
          </SheetHeader>
          <div className="w-full pt-4 space-y-4">
            {selectedProvider && (
              <div className="w-full mb-8">
                <div className="space-y-1">
                  <div className="font-semibold mb-4">
                    {selectedProvider.name} setup
                  </div>
                  <div className="w-full bg-slate-100 p-4 rounded-md dark:bg-gray-800 dark:text-gray-300">
                    {selectedProvider.type === "UNSPLASH" ? (
                      <ol className="w-full flex flex-col gap-2">
                        <li className="w-full">
                          Create an Unsplash developer account and register an
                          app to obtain an
                          <span className="font-black">
                            Access Key Client ID and or a Secret.
                          </span>
                          Paste the Access Key into the API Key field below.
                        </li>
                        <li>
                          <a
                            href="https://unsplash.com/developers"
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            Unsplash Developer docs
                          </a>
                        </li>
                        <li>
                          Keys are stored encrypted and are applied globally.
                        </li>
                      </ol>
                    ) : (
                      <div>
                        Sign up at Pexels and get your <strong>API Key</strong>{" "}
                        from your dashboard, then paste it into the API Key
                        field below.{" "}
                        <a
                          className="underline"
                          href="https://www.pexels.com/api/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Pexels docs
                        </a>
                        .
                        <div className="mt-1">
                          Keys are stored encrypted and are applied globally.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>API Key</Label>
              <Input
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus("not-tested");
                }}
                placeholder="Enter API Key"
              />
              <div className="mt-2">
                {testStatus === "success" && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    Test succeeded
                  </span>
                )}
                {testStatus === "failure" && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                    Test failed
                  </span>
                )}
                {testStatus === "testing" && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                    Testing...
                  </span>
                )}
                {testStatus === "not-tested" && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    Not tested
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>API Secret (optional)</Label>
              <Input
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API Secret (if required)"
              />
            </div>
            <div className="flex flex-row gap-2">
              <Button
                onClick={handleTest}
                disabled={isTesting || !selectedProvider}
              >
                {isTesting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Test Connection"
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  isSaving || !selectedProvider || testStatus !== "success"
                }
              >
                {isSaving ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Save"
                )}
              </Button>
              <Button variant="ghost" onClick={() => setIsSheetOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
