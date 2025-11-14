"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";
import { CreateCompanyModal } from "@/components/create-company-modal";
import { getPulsateClassName } from "@/lib/hooks/use-form-dirty";

interface ErpCustomerViewProps {
  userName?: string | null;
  onRoleChange?: () => void;
}

export function ErpCustomerView({
  userName,
  onRoleChange,
}: ErpCustomerViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkCompanies();
  }, []);

  const checkCompanies = async () => {
    try {
      const response = await fetch("/api/company/my-companies");
      if (response.ok) {
        const data = await response.json();
        setHasCompany(data.count > 0);
      }
    } catch (error) {
      console.error("Failed to check companies:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCompanyCreated = () => {
    setShowModal(false);
    // Trigger role refresh in parent component
    if (onRoleChange) {
      onRoleChange();
    } else {
      // Fallback to page reload if callback not provided
      window.location.reload();
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If user has no company, show centered welcome message
  if (!hasCompany) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {userName || "Guest"}!
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              To get started with OnTarget ERP, you need to create your first
              company profile.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className={`${getPulsateClassName(true)} text-lg px-8 py-6`}
          >
            <Building2 className="mr-2 h-5 w-5" />
            Create Company
          </Button>
        </div>

        {showModal && (
          <CreateCompanyModal
            onSuccess={handleCompanyCreated}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // If user has a company, show regular dashboard
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome back, {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        View your orders, track shipments, and manage your account.
      </p>
    </div>
  );
}
