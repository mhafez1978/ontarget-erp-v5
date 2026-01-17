"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  SuperAdminProjectsView,
  AdminProjectsView,
  ManagerProjectsView,
  StaffProjectsView,
  ContractorProjectsView,
  CompanyCustomerProjectsView,
} from "@/components/projects-views";

// Role-based projects view component renderer
function getRoleProjectsView(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminProjectsView />;
    case "ADMIN_OWNER":
      return <AdminProjectsView />;
    case "COMPANY_MANAGER":
      return <ManagerProjectsView />;
    case "COMPANY_STAFF":
      return <StaffProjectsView />;
    case "COMPANY_CONTRACTOR":
      return <ContractorProjectsView />;
    case "ERP_CUSTOMER":
    case "COMPANY_CUSTOMER":
      // Company customers see projects where they are assigned as customer (read-only)
      return <CompanyCustomerProjectsView />;
    default:
      // For roles without projects access, show unauthorized message
      return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="dark:text-gray-200">
              You don&apos;t have permission to view projects.
            </p>
          </div>
        </div>
      );
  }
}

export default function ProjectsPage() {
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
    role: "TRIAL",
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        console.error("Auth check failed:", response.status);
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (data.authenticated && data.user) {
        // Check if user has access to projects page
        const allowedRoles = [
          "SUPER_ADMIN",
          "ADMIN_OWNER",
          "COMPANY_MANAGER",
          "COMPANY_STAFF",
          "COMPANY_CONTRACTOR",
          "ERP_CUSTOMER",
          "COMPANY_CUSTOMER",
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} containerClassName="max-w-none px-3 py-4">
      {getRoleProjectsView(user.role)}
    </DashboardLayout>
  );
}
