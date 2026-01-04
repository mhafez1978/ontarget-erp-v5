"use client";

import {
  MessageSquare,
  Check,
  X,
  Star,
  Trash2,
  Loader2,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
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

interface Testimonial {
  id: string;
  customerName: string;
  customerEmail: string;
  customerTitle: string | null;
  rating: number;
  testimonial: string;
  status: string;
  isFeatured: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export default function TestimonialsPage() {
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
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/company/my-companies");

      if (!response.ok) {
        console.error("Failed to fetch companies:", response.status);
        return;
      }

      const data = await response.json();
      console.log("Companies response:", data); // Debug log

      if (data.companies && data.companies.length > 0) {
        setCompanies(data.companies);
        setSelectedCompanyId(data.companies[0].id);
        console.log("Selected company:", data.companies[0]); // Debug log
      } else {
        console.log("No companies found for user");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      console.log("Auth response:", data); // Debug log

      if (data.authenticated && data.user) {
        const userData = {
          name: data.user.name || null,
          email: data.user.email || null,
          image: data.user.image || null,
          role: data.user.role || "GUEST",
        };
        console.log("Setting user:", userData); // Debug log
        setUser(userData);
        await fetchCompanies();
      } else {
        console.log("Not authenticated, redirecting..."); // Debug log
        toast.error("Please log in to access this page");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to fetch user session");
    } finally {
      setLoading(false);
    }
  }, [fetchCompanies]);

  const fetchTestimonials = useCallback(async () => {
    if (!selectedCompanyId) {
      console.log("[Testimonials Page] No company selected");
      return;
    }

    console.log(
      "[Testimonials Page] Fetching testimonials for company:",
      selectedCompanyId
    );
    console.log("[Testimonials Page] Status filter:", statusFilter);

    try {
      const url = `/api/admin/testimonials?companyId=${selectedCompanyId}&status=${statusFilter}`;
      console.log("[Testimonials Page] Fetching from:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("[Testimonials Page] Response status:", response.status);
      console.log("[Testimonials Page] Response data:", data);

      if (response.ok) {
        console.log("[Testimonials Page] Received testimonials:", data.length);
        // Sort: PENDING first, then by most recent
        const sorted = data.sort((a: Testimonial, b: Testimonial) => {
          // First priority: PENDING status on top
          if (a.status === "PENDING" && b.status !== "PENDING") return -1;
          if (a.status !== "PENDING" && b.status === "PENDING") return 1;

          // Second priority: Most recent first
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setTestimonials(sorted);
      } else {
        console.error("[Testimonials Page] Error response:", data);
        toast.error(data.error || "Failed to fetch testimonials");
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to fetch testimonials");
    }
  }, [selectedCompanyId, statusFilter]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchTestimonials();
    }
  }, [selectedCompanyId, fetchTestimonials]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (response.ok) {
        toast.success("Testimonial approved!");
        fetchTestimonials();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve testimonial");
      }
    } catch (error) {
      console.error("Error approving testimonial:", error);
      toast.error("Failed to approve testimonial");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (response.ok) {
        toast.success("Testimonial rejected");
        fetchTestimonials();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject testimonial");
      }
    } catch (error) {
      console.error("Error rejecting testimonial:", error);
      toast.error("Failed to reject testimonial");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeature = async (id: string, isFeatured: boolean) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });

      if (response.ok) {
        toast.success(
          isFeatured ? "Testimonial featured!" : "Testimonial unfeatured"
        );
        fetchTestimonials();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update testimonial");
      }
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast.error("Failed to update testimonial");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/testimonials/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Testimonial deleted");
        fetchTestimonials();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete testimonial");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    } finally {
      setDeleteId(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchTestimonials();
      toast.success("Testimonials refreshed");
    } catch (error) {
      console.error("Error refreshing testimonials:", error);
      toast.error("Failed to refresh testimonials");
    } finally {
      setIsRefreshing(false);
    }
  };

  const pendingCount = testimonials.filter(
    (t) => t.status === "PENDING"
  ).length;
  const approvedCount = testimonials.filter(
    (t) => t.status === "APPROVED"
  ).length;
  const rejectedCount = testimonials.filter(
    (t) => t.status === "REJECTED"
  ).length;

  // Show loading spinner while fetching user
  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Show message if no companies found
  if (companies.length === 0) {
    return (
      <DashboardLayout user={user}>
        <div className="container mx-auto py-6 px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No Companies Found</p>
              <p className="text-sm text-muted-foreground">
                You need to be an admin of a company to manage testimonials.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Store Testimonials</h1>
            <p className="text-muted-foreground">
              Manage customer testimonials for your storefront
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh testimonials"
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-xs">
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 max-w-xs">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({testimonials.length})</SelectItem>
                <SelectItem value="PENDING">
                  Pending ({pendingCount})
                </SelectItem>
                <SelectItem value="APPROVED">
                  Approved ({approvedCount})
                </SelectItem>
                <SelectItem value="REJECTED">
                  Rejected ({rejectedCount})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card
            className={
              pendingCount > 0
                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                : ""
            }
          >
            <CardHeader className="pb-3">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl text-yellow-600 dark:text-yellow-500">
                {pendingCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {approvedCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Rejected</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {rejectedCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Testimonials List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : testimonials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No testimonials found</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === "PENDING"
                  ? "No testimonials are awaiting review"
                  : statusFilter === "APPROVED"
                  ? "No approved testimonials yet"
                  : statusFilter === "REJECTED"
                  ? "No rejected testimonials"
                  : "Customer testimonials will appear here once submitted"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      testimonial.status === "PENDING"
                        ? "bg-yellow-50 dark:bg-yellow-950/10 border-l-4 border-l-yellow-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Customer Info - 25% */}
                      <div className="flex-shrink-0 w-48">
                        <div className="font-medium text-sm mb-1">
                          {testimonial.customerName}
                        </div>
                        {testimonial.customerTitle && (
                          <div className="text-xs text-muted-foreground">
                            {testimonial.customerTitle}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {testimonial.customerEmail}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < testimonial.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Testimonial Text - 45% */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 leading-relaxed">
                          &ldquo;{testimonial.testimonial}&rdquo;
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(testimonial.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>

                      {/* Status & Badges - 15% */}
                      <div className="flex-shrink-0 w-32">
                        <div className="flex flex-col gap-2">
                          <Badge
                            variant={
                              testimonial.status === "APPROVED"
                                ? "default"
                                : testimonial.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                            className="w-fit"
                          >
                            {testimonial.status}
                          </Badge>
                          {testimonial.isFeatured && (
                            <Badge variant="outline" className="gap-1 w-fit">
                              <Trophy className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions - 15% */}
                      <div className="flex-shrink-0">
                        <div className="flex gap-1">
                          {testimonial.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950"
                                onClick={() => handleApprove(testimonial.id)}
                                disabled={actionLoading === testimonial.id}
                                title="Approve"
                              >
                                {actionLoading === testimonial.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950"
                                onClick={() => handleReject(testimonial.id)}
                                disabled={actionLoading === testimonial.id}
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {testimonial.status === "APPROVED" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-8 w-8 p-0 ${
                                testimonial.isFeatured
                                  ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-950"
                                  : "text-muted-foreground hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-950"
                              }`}
                              onClick={() =>
                                handleFeature(
                                  testimonial.id,
                                  !testimonial.isFeatured
                                )
                              }
                              disabled={actionLoading === testimonial.id}
                              title={
                                testimonial.isFeatured ? "Unfeature" : "Feature"
                              }
                            >
                              <Trophy className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-100 dark:hover:bg-red-950"
                            onClick={() => setDeleteId(testimonial.id)}
                            disabled={actionLoading === testimonial.id}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This testimonial will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
