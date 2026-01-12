"use client";

import {
  Building2,
  Loader2,
  Users,
  Briefcase,
  TrendingUp,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MyOwnedCompanies } from "@/components/my-owned-companies";
import { AddCompanySheet } from "@/components/add-company-sheet";
import { EditCompanySheet } from "@/components/edit-company-sheet";
import { LogoImage } from "@/components/logo-image";
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

interface SubscriberCompany {
  id: string;
  name: string;
  slug: string | null;
  slogan: string | null;
  logo: string | null;
  owner: {
    name: string;
    email: string;
    plan: string;
    role: string;
  };
  memberCount: number;
  staffCount: number;
  createdAt: string;
}

interface SubscriberStats {
  total: number;
  byPlan: {
    ESSENTIAL: number;
    GROWTH: number;
    ENTERPRISE: number;
  };
  totalMembers: number;
  totalStaff: number;
}

interface SuperAdminCompanyViewProps {
  userName?: string | null;
}

export function SuperAdminCompanyView({
  userName,
}: SuperAdminCompanyViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [subscriberCompanies, setSubscriberCompanies] = useState<
    SubscriberCompany[]
  >([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats>({
    total: 0,
    byPlan: { ESSENTIAL: 0, GROWTH: 0, ENTERPRISE: 0 },
    totalMembers: 0,
    totalStaff: 0,
  });

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

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] =
    useState<SubscriberCompany | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] =
    useState<SubscriberCompany | null>(null);

  const fetchSubscriberCompanies = async () => {
    try {
      setSubscribersLoading(true);
      const response = await fetch("/api/companies/subscribers");

      if (!response.ok) {
        throw new Error("Failed to fetch subscriber companies");
      }

      const data = await response.json();
      setSubscriberCompanies(data.companies || []);
      setSubscriberStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch subscriber companies:", err);
    } finally {
      setSubscribersLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchSubscriberCompanies();
  }, []);

  const handleCompanyAdded = () => {
    // Trigger refresh of both company lists
    fetchCompanies();
    setRefreshKey((prev) => prev + 1);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "ESSENTIAL":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "GROWTH":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            All Companies
          </h2>
          <p className="dark:text-gray-200">
            Welcome back, {userName || "Admin"}! View all companies in the
            system.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin dark:text-gray-200" />
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
          <p className="dark:text-gray-200">
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
            Companies Management
          </h2>
          <p className="dark:text-gray-200">
            Welcome back, {userName || "Admin"}! Manage your companies and view
            all ERP subscribers.
          </p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="shrink-0">
          <Building2 className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="personal">My Personal Companies</TabsTrigger>
          <TabsTrigger value="subscribers">
            Subscriber Companies ({subscriberStats.total})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: My Personal Companies */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm dark:text-gray-200 mb-4">
                Companies you own as SUPER_ADMIN. These are free with unlimited
                access.
              </p>
              <MyOwnedCompanies key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Subscriber Companies (Paying Customers) */}
        <TabsContent value="subscribers" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 dark:text-gray-200" />
                  <p className="text-sm font-medium dark:text-gray-200">
                    Total Companies
                  </p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {subscriberStats.total}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 dark:text-gray-200" />
                  <p className="text-sm font-medium dark:text-gray-200">
                    Total Members
                  </p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {subscriberStats.totalMembers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 dark:text-gray-200" />
                  <p className="text-sm font-medium dark:text-gray-200">
                    Total Staff
                  </p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {subscriberStats.totalStaff}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 dark:text-gray-200" />
                  <p className="text-sm font-medium dark:text-gray-200">
                    By Plan
                  </p>
                </div>
                <div className="flex gap-2 mt-2 text-xs">
                  <Badge variant="secondary" className="bg-blue-100">
                    E: {subscriberStats.byPlan.ESSENTIAL}
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100">
                    G: {subscriberStats.byPlan.GROWTH}
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100">
                    Ent: {subscriberStats.byPlan.ENTERPRISE}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscriber Companies Table */}
          <Card>
            <CardContent className="pt-6">
              {subscribersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin dark:text-gray-200" />
                </div>
              ) : subscriberCompanies.length === 0 ? (
                <div className="text-center py-8 dark:text-gray-200">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No subscriber companies yet</p>
                  <p className="text-sm mt-2">
                    Companies with ESSENTIAL, GROWTH, or ENTERPRISE plans will
                    appear here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-center">Members</TableHead>
                        <TableHead className="text-center">Staff</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriberCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {company.logo ? (
                                <div className="relative h-8 w-8 rounded overflow-hidden">
                                  <LogoImage
                                    src={company.logo}
                                    alt={company.name}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                  />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                  <Building2 className="h-4 w-4 dark:text-gray-200" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {company.name}
                                </div>
                                {company.slogan && (
                                  <div className="text-xs dark:text-gray-200">
                                    {company.slogan}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{company.owner.name}</div>
                              <div className="text-xs dark:text-gray-200">
                                {company.owner.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getPlanBadgeColor(company.owner.plan)}
                            >
                              {company.owner.plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {company.memberCount}
                          </TableCell>
                          <TableCell className="text-center">
                            {company.staffCount}
                          </TableCell>
                          <TableCell className="text-sm dark:text-gray-200">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {company.slug ? (
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
                              ) : (
                                <span className="text-xs dark:text-gray-200">
                                  No store
                                </span>
                              )}

                              {/* Allow Super Admin to edit/delete subscriber companies */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCompanyForEdit(company);
                                  setIsEditingCompany(true);
                                }}
                                title="Edit Company"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCompanyToDelete(company);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete Company"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddCompanySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSuccess={handleCompanyAdded}
      />

      {/* Edit sheet for subscriber companies (Super Admin) */}
      <EditCompanySheet
        open={isEditingCompany}
        onOpenChange={(open) => setIsEditingCompany(open)}
        company={selectedCompanyForEdit as any}
        onSuccess={() => {
          fetchSubscriberCompanies();
          setSelectedCompanyForEdit(null);
        }}
      />

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{companyToDelete?.name}"? This
              will permanently delete the company and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!companyToDelete) return;
                try {
                  const res = await fetch(
                    `/api/company/${companyToDelete.id}`,
                    {
                      method: "DELETE",
                    }
                  );
                  if (!res.ok) throw new Error("Failed to delete company");
                  setDeleteDialogOpen(false);
                  setCompanyToDelete(null);
                  fetchSubscriberCompanies();
                } catch (err) {
                  console.error(err);
                }
              }}
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
