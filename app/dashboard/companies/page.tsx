"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  SuperAdminCompanyView,
  AdminCompanyView,
} from "@/components/company-views";

// Role-based company view component renderer
function getRoleCompanyView(role: string, userName?: string | null) {
  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminCompanyView userName={userName} />;
    case "ADMIN":
      return <AdminCompanyView userName={userName} />;
    default:
      // For roles without company access, show unauthorized message
      return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don&apos;t have permission to view companies.
            </p>
          </div>
        </div>
      );
  }
}

export default function CompaniesPage() {
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
        // Check if user has access to companies page
        // Allow platform admins plus common company-level roles (manager/staff/contractor)
        const allowedRoles = [
          "SUPER_ADMIN",
          "ADMIN",
          "MANAGER",
          "STAFF",
          "CONTRACTOR",
        ];

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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {getRoleCompanyView(user.role, user.name)}
      </div>
    </DashboardLayout>
  );
}
