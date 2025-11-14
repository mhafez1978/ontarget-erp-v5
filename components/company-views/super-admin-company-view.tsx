"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyOwnedCompanies } from "@/components/my-owned-companies";
import { AddCompanySheet } from "@/components/add-company-sheet";

// interface CompanyData {
//   id: string;
//   name: string;
//   description: string | null;
//   ownerName: string;
//   ownerEmail: string;
//   memberCount: number;
//   createdAt: string;
// }

interface SuperAdminCompanyViewProps {
  userName?: string | null;
}

export function SuperAdminCompanyView({
  userName,
}: SuperAdminCompanyViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCompanies = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch("/api/companies/all");

      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      await response.json();
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCompanyAdded = () => {
    // Trigger refresh of both company lists
    fetchCompanies();
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            All Companies
          </h2>
          <p className="text-muted-foreground">
            Welcome back, {userName || "Admin"}! View all companies in the
            system.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            All Companies
          </h2>
          <p className="text-muted-foreground">
            Welcome back, {userName || "Admin"}! View all companies in the
            system.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-red-500">
              <p>Error: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCompanies}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            My Companies
          </h2>
          <p className="text-muted-foreground">
            Welcome back, {userName || "Admin"}! View all companies you own.
          </p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="shrink-0">
          <Building2 className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Super Admin's Personal Companies */}
      <MyOwnedCompanies key={refreshKey} />

      <AddCompanySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSuccess={handleCompanyAdded}
      />
    </div>
  );
}
