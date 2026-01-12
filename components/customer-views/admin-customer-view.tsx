"use client";

import { UserPlus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { CompanyCustomers } from "@/components/company-customers";
import { AddCustomerSheet } from "@/components/add-customer-sheet";
import { Button } from "@/components/ui/button";
interface AdminCustomerViewProps {
  userName?: string | null;
}

export function AdminCustomerView({ userName }: AdminCustomerViewProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/company/my-companies");

      if (response.ok) {
        const data = await response.json();

        // API returns a flat 'companies' array
        const companyList = (data.companies || []).map(
          (c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          })
        );

        setCompanies(companyList);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCustomerAdded = () => {
    // Trigger refresh of customer list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Customer Management
          </h2>
          <p className="dark:text-gray-200">
            Welcome back, {userName || "Admin"}! Manage your company customers
            here.
          </p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="shrink-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <CompanyCustomers key={refreshKey} />

      <AddCustomerSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        companies={loadingCompanies ? [] : companies}
        onSuccess={handleCustomerAdded}
      />
    </div>
  );
}
