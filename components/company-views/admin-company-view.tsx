"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddCompanySheet } from "@/components/add-company-sheet";
import { EditCompanySheet } from "@/components/edit-company-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  slug: string | null;
  slogan: string | null;
  description: string | null;
  logo: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  postalCode: string | null;
  memberCount: number;
  createdAt: string;
}

interface UserPlan {
  plan: "ESSENTIAL" | "GROWTH" | "ENTERPRISE";
  companyCount: number;
  canCreateMore: boolean;
  limit: number;
}

interface AdminCompanyViewProps {
  userName?: string | null;
}

export function AdminCompanyView({ userName }: AdminCompanyViewProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch("/api/companies/my-owned");

      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      const data = await response.json();
      setCompanies(data.companies || []);
      setUserPlan(data.userPlan || null);
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

  const getPlanLimitText = () => {
    if (!userPlan) return "";
    if (userPlan.plan === "ENTERPRISE") return "Unlimited companies";
    return `${userPlan.companyCount}/${userPlan.limit} companies used`;
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsEditingCompany(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      const response = await fetch(`/api/company/${companyToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete company");
      }

      const data = await response.json();

      setDeleteDialogOpen(false);
      setCompanyToDelete(null);

      // If role was demoted, reload the page to update UI
      if (data.roleDemoted) {
        toast.warning(
          "Company deleted. You have been demoted to ERP Customer role as this was your last company.",
          { duration: 5000 }
        );
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.success(`Company "${companyToDelete.name}" deleted successfully`);
        fetchCompanies();
      }
    } catch (err) {
      console.error("Failed to delete company:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete company"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Companies</h2>
          <p className="text-muted-foreground">
            Welcome back, {userName || "Admin"}! Manage your companies here.
          </p>
        </div>
        {userPlan?.canCreateMore && (
          <Button onClick={() => setIsAddingCompany(true)} className="shrink-0">
            <Building2 className="h-4 w-4 mr-2" />
            Create Company
          </Button>
        )}
      </div>

      {userPlan && (
        <div className="text-sm text-muted-foreground">
          {getPlanLimitText()}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchCompanies} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Building2 className="h-12 w-12 mx-auto opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">
            {userPlan?.canCreateMore
              ? 'No companies yet. Click "Create Company" to get started.'
              : "No companies yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Contact Info
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  Members
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b last:border-0">
                  <td className="px-4 py-4">
                    <div className="font-medium">{company.name}</div>
                    {company.slogan && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {company.slogan}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="space-y-1">
                      {company.email && (
                        <div className="text-muted-foreground">
                          {company.email}
                        </div>
                      )}
                      {company.phone && (
                        <div className="text-muted-foreground">
                          {company.phone}
                        </div>
                      )}
                      {company.website && (
                        <div className="text-muted-foreground truncate max-w-[200px]">
                          {company.website}
                        </div>
                      )}
                      {!company.email && !company.phone && !company.website && (
                        <span className="text-muted-foreground italic">
                          No contact info
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {company.description || "No description"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {company.memberCount}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {company.slug && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="View storefront"
                        >
                          <Link
                            href={`/store/${company.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(company)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Company Sheet */}
      <AddCompanySheet
        open={isAddingCompany}
        onOpenChange={setIsAddingCompany}
        onSuccess={fetchCompanies}
      />

      {/* Edit Company Sheet */}
      <EditCompanySheet
        open={isEditingCompany}
        onOpenChange={setIsEditingCompany}
        company={selectedCompany}
        onSuccess={fetchCompanies}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{companyToDelete?.name}&quot;
              and remove all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
