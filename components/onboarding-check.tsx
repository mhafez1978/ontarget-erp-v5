"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function OnboardingCheck() {
  const router = useRouter();
  const [onboardingData, setOnboardingData] = useState<{
    needsOnboarding: boolean;
    onboardingUrl?: string;
    company?: { name: string };
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkOnboarding() {
      try {
        const response = await fetch("/api/onboarding/check");
        if (response.ok && isMounted) {
          const data = await response.json();
          setOnboardingData(data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to check onboarding status:", error);
        }
      }
    }

    checkOnboarding();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!onboardingData?.needsOnboarding || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        Complete Your Onboarding
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <p className="mb-3">
          Before you can access all features, please complete your onboarding by
          uploading required employment documents for{" "}
          {onboardingData.company?.name}.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(onboardingData.onboardingUrl!)}
            size="sm"
            variant="default"
          >
            Complete Onboarding
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            size="sm"
            variant="outline"
          >
            Remind Me Later
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
