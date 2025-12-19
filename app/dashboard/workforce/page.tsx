"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Shield } from "lucide-react";
import {
  SuperAdminWorkforceView,
  AdminWorkforceView,
  ManagerWorkforceView,
} from "@/components/workforce-views";

// Role-based workforce view component renderer
function getRoleWorkforceView(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminWorkforceView />;
    case "ADMIN":
      return <AdminWorkforceView />;
    case "MANAGER":
      return <ManagerWorkforceView />;
    default:
      // For roles without workforce access, show unauthorized message
      return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don&apos;t have permission to view the workforce management.
            </p>
          </div>
        </div>
      );
  }
}

export default function WorkforcePage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  }>({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.authenticated && data.user) {
        // Check if user has access to workforce page
        const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

        if (!allowedRoles.includes(data.user.role)) {
          // Redirect unauthorized users back to dashboard
          router.push("/dashboard");
          return;
        }

        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
        });
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

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Password Management Quick Access Card for Admins */}
        {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
          <Card className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Shield className="h-5 w-5" />
                Password Management
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Reset user passwords without requiring their current password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {user.role === "SUPER_ADMIN"
                    ? "Reset passwords for any user in the system"
                    : "Reset passwords for members of your company"}
                </p>
                <Button
                  onClick={() =>
                    router.push("/dashboard/workforce/password-management")
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Manage Passwords
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-based workforce view */}
        {getRoleWorkforceView(user.role)}
      </div>
    </DashboardLayout>
  );
}
