"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function OnboardingUnavailablePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>Onboarding Required</CardTitle>
          <CardDescription>
            Your account needs to complete onboarding before you can access the
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            It looks like your onboarding is incomplete and we don't have an active
            onboarding link for you. Please contact your company administrator to
            reactivate onboarding — they can generate a fresh 48-hour link.
          </p>

          <div className="flex gap-3">
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
            <Button variant="outline" onClick={() => window.location.href = "mailto:admin@yourcompany.example"}>
              Contact Administrator
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
