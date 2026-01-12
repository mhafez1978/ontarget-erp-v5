"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  SuperAdminCustomerView,
  AdminCustomerView,
  ManagerCustomerView,
  StaffCustomerView,
  ContractorCustomerView,
} from "@/components/customer-views";

// Role-based customer view component renderer
function getRoleCustomerView(role: string, userName?: string | null) {
  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminCustomerView userName={userName} />;
    case "ADMIN":
      return <AdminCustomerView userName={userName} />;
    case "MANAGER":
      return <ManagerCustomerView userName={userName} />;
    case "STAFF":
      return <StaffCustomerView userName={userName} />;
    case "CONTRACTOR":
      return <ContractorCustomerView userName={userName} />;
    default:
      // For roles without customer access, show unauthorized message
      return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="dark:text-gray-200">
              You don&apos;t have permission to view customers.
            </p>
          </div>
        </div>
      );
  }
}

export default function CustomersPage() {
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
        // Check if user has access to customers page
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
      {getRoleCustomerView(user.role, user.name)}
    </DashboardLayout>
  );
}
