"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RootCompanyBrandingCard } from "@/components/root-company-branding-card";
import { CompanyWhiteLabelSettings } from "@/components/company-white-label-settings";
export default function BrandingPage() {
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <DashboardLayout user={user || undefined}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user || undefined}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.role === "SUPER_ADMIN"
              ? "System Branding"
              : "Company Branding"}
          </h1>
          <p className="dark:text-gray-200">
            {user?.role === "SUPER_ADMIN"
              ? "Manage the global OnTarget ERP branding and appearance"
              : "Customize your company's branding and appearance"}
          </p>
        </div>

        {user?.role === "SUPER_ADMIN" ? (
          <RootCompanyBrandingCard />
        ) : user?.role === "ADMIN" ? (
          <CompanyWhiteLabelSettings />
        ) : (
          <div className="text-center py-12">
            <p className="dark:text-gray-200">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
