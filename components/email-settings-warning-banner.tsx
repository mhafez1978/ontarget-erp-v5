"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Settings, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmailSettingsWarningBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if email provider is configured
    const checkEmailSettings = async () => {
      try {
        const response = await fetch("/api/settings/email-providers");
        if (response.ok) {
          const data = await response.json();

          // Check if any provider is configured (providers is an object, not array)
          const hasConfiguredProvider = data.providers
            ? Object.values(data.providers).some((p: unknown) => {
                const provider = p as {
                  enabled: boolean;
                  clientId: string | null;
                };
                return provider.enabled && provider.clientId;
              })
            : false;

          // Show banner if no provider is configured and not dismissed
          const dismissed = localStorage.getItem(
            "emailSettingsBannerDismissed"
          );
          if (!hasConfiguredProvider && !dismissed) {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to check email settings:", error);
      }
    };

    checkEmailSettings();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem("emailSettingsBannerDismissed", "true");
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Start setting up system global settings
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Configure geo tracking, oauth provider integrations, global cold
              storage settings, and email service provider configurations.
            </p>
            <div className="mt-3">
              <Link href="/dashboard/settings">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-100 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Global System Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 shrink-0 ml-2"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
