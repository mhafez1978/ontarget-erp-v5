"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import BusinessHubView from "@/components/hub-views/business-hub-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings } from "lucide-react";
import Link from "next/link";

export default function HubPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  }>({
    id: "",
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });
  const [loading, setLoading] = useState(true);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [emailConfigLevel, setEmailConfigLevel] = useState<
    "GLOBAL" | "COMPANY" | null
  >(null);
  const [checkingEmail, setCheckingEmail] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.authenticated && data.user) {
        // Check if user has access to hub page
        const allowedRoles = ["SUPER_ADMIN", "ADMIN"];

        if (!allowedRoles.includes(data.user.role)) {
          // Redirect unauthorized users back to dashboard
          router.push("/dashboard");
          return;
        }

        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
        });

        // Check if email is configured
        const emailCheck = await fetch("/api/hub/check-email-config");
        const emailData = await emailCheck.json();
        setEmailConfigured(emailData.configured || false);
        setEmailConfigLevel(emailData.configLevel || null);
        setCheckingEmail(false);
      } else {
        // Not authenticated - redirect to login
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading || checkingEmail) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show warning if email is not configured
  if (!emailConfigured) {
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdmin = user.role === "ADMIN";

    return (
      <DashboardLayout user={user}>
        <div className="container max-w-2xl mx-auto py-8">
          <Card className="border-yellow-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <CardTitle>Email Service Not Configured</CardTitle>
                  <CardDescription>
                    {isSuperAdmin &&
                      "Configure Global Root Company Email Provider"}
                    {isAdmin && "Email Provider Not Configured"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSuperAdmin && (
                <>
                  <p className="text-muted-foreground">
                    <strong>
                      Configure Global Root Company Provider for all subscribers
                      and internal system
                    </strong>{" "}
                    before you can access the Business Hub.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    As a Super Admin, you need to set up the global email
                    provider that will be used by all subscribers and the
                    internal system. This is required to send emails through the
                    Business Hub.
                  </p>
                </>
              )}
              {isAdmin && !emailConfigLevel && (
                <>
                  <p className="text-muted-foreground">
                    <strong>The global email system is not configured</strong> -
                    Set up your own company&apos;s email provider.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The Super Admin has not configured a global email provider
                    yet. You can set up your own company-specific email provider
                    to access the Business Hub and send emails to your team.
                  </p>
                </>
              )}
              <div className="flex gap-2">
                <Link href="/dashboard/settings">
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Settings
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <BusinessHubView role={user.role} userId={user.id} />
    </DashboardLayout>
  );
}
