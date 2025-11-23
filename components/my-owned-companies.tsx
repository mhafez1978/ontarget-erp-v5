"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Building2,
  Users,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EditCompanySheet } from "@/components/edit-company-sheet";
import { toast } from "sonner";

interface OwnedCompany {
  id: string;
  name: string;
  slug: string | null;
  slogan: string | null;
  description: string | null;
  logo: string | null;
  email: string | null;
  salesEmail: string | null;
  supportEmail: string | null;
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

export function MyOwnedCompanies() {
  const [companies, setCompanies] = useState<OwnedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<OwnedCompany | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<OwnedCompany | null>(
    null
  );

  const fetchMyCompanies = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch("/api/companies/my-owned");

      if (!response.ok) {
        throw new Error("Failed to fetch your companies");
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error("Failed to fetch owned companies:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCompanies();
  }, []);

  const handleEdit = (company: OwnedCompany) => {
    setSelectedCompany(company);
    setIsEditingCompany(true);
  };

  const handleDelete = (company: OwnedCompany) => {
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

      toast.success(`Company "${companyToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      fetchMyCompanies();
    } catch (err) {
      console.error("Failed to delete company:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete company"
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            My Personal Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            My Personal Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Error: {error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMyCompanies}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return null; // Don't show the card if no personal companies
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5" />
              My Personal Companies ({companies.length})
            </CardTitle>
            <CardDescription>Companies you personally own</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={fetchMyCompanies}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    Members
                  </div>
                </TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="font-medium">{company.name}</div>
                    {company.slogan && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {company.slogan}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
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
                  </TableCell>
                  <TableCell className="max-w-md">
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {company.description || "No description"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                      {company.memberCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Company Sheet */}
      <EditCompanySheet
        open={isEditingCompany}
        onOpenChange={setIsEditingCompany}
        company={selectedCompany}
        onSuccess={fetchMyCompanies}
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
    </Card>
  );
}
