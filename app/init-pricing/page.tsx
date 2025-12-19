"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function InitializePricingPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/seed-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize pricing");
      }

      setSuccess(true);
      toast.success("Pricing initialized successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initialize";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Initialize Plan Pricing</CardTitle>
          <CardDescription>
            Set up default pricing for Essential, Growth, and Enterprise plans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>Pricing initialized successfully!</span>
            </div>
          ) : (
            <Button
              onClick={handleInitialize}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Initialize Default Pricing
                </>
              )}
            </Button>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              Error: {error}
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold">This will create:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Essential Plan: $29/month or $290/year</li>
              <li>Growth Plan: $79/month or $790/year (Popular)</li>
              <li>Enterprise Plan: $199/month or $1,990/year</li>
            </ul>
            <p className="mt-4">
              After initialization, you can customize prices in Settings → Plan
              Pricing Management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
