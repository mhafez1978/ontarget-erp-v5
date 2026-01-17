"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  SuperAdminView,
  AdminView,
  ManagerView,
  StaffView,
  ErpCustomerView,
  CompanyCustomerView,
  ContractorView,
  SupplierView,
  GuestView,
} from "@/components/dashboard-views";

// Role-based view component renderer
function getRoleView(
  role: string,
  userName?: string | null,
  companyId?: string | null,
  onRoleChange?: () => void
) {
  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminView userName={userName} companyId={companyId} />;
    case "ADMIN_OWNER":
      return <AdminView userName={userName} companyId={companyId} />;
    case "COMPANY_MANAGER":
      return <ManagerView userName={userName} companyId={companyId} />;
    case "COMPANY_STAFF":
      return <StaffView userName={userName} companyId={companyId} />;
    case "ERP_CUSTOMER":
      return (
        <ErpCustomerView userName={userName} onRoleChange={onRoleChange} />
      );
    case "COMPANY_CUSTOMER":
      return <CompanyCustomerView userName={userName} />;
    case "COMPANY_CONTRACTOR":
      return <ContractorView userName={userName} companyId={companyId} />;
    case "COMPANY_SUPPLIER":
      return <SupplierView userName={userName} />;
    case "TRIAL":
    default:
      return <GuestView userName={userName} />;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    companyId?: string | null;
  }>({
    name: null,
    email: null,
    image: null,
    role: "TRIAL",
    companyId: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });
      const data = await response.json();

      if (data.authenticated && data.user) {
        // Redirect TRIAL users away from dashboard
        if (data.user.role === "TRIAL") {
          router.push("/");
          return;
        }

        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
          companyId: data.user.companyId,
        });
      } else {
        // Not authenticated, redirect to login
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleRoleChange = () => {
    // Re-fetch user data to get updated role
    setLoading(true);
    fetchUser();
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Role-based Welcome Message */}
        {getRoleView(user.role, user.name, user.companyId, handleRoleChange)}
      </div>
    </DashboardLayout>
  );
}
