"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SuperAdminSecurityView } from "@/components/security-views/super-admin-security-view";
import { AdminSecurityView } from "@/components/security-views/admin-security-view";

export default function SecurityPage() {
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
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 dark:text-gray-200">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Only Super Admins and Admins can access this page
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="dark:text-gray-200">
              You don&apos;t have permission to view the security monitor.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      {user.role === "SUPER_ADMIN" ? (
        <SuperAdminSecurityView userName={user.name} />
      ) : (
        <AdminSecurityView userName={user.name} />
      )}
    </DashboardLayout>
  );
}
