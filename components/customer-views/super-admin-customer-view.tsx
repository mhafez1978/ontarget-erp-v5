"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2, Trash2, Pencil } from "lucide-react";
import { AddSubscriberSheet } from "@/components/add-subscriber-sheet";
import { EditSubscriptionSheet } from "@/components/edit-subscription-sheet";
import { BulkImportCustomers } from "@/components/bulk-import-customers";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirm";
//import { OnTargetERPSubscribers } from "@/components/ontarget-erp-subscribers";

interface SuperAdminCustomerViewProps {
  userName?: string | null;
}

interface Subscriber {
  id: string;
  companyId: string;
  companyName: string;
  companyDescription: string | null;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export function SuperAdminCustomerView({
  userName,
}: SuperAdminCustomerViewProps) {
  const [isAddingSubscriber, setIsAddingSubscriber] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscriber | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Bulk import UI state (Super Admin should be able to import into any company)
  const [bulkOpen, setBulkOpen] = useState(false);

  // Additional state for standalone ERP customers (no company)
  const [erpCustomers, setErpCustomers] = useState<
    {
      id: string;
      name: string | null;
      email: string | null;
      plan: string | null;
      billingCycle: string | null;
      createdAt: string;
      emailVerified: boolean;
    }[]
  >([]);
  const [isLoadingErp, setIsLoadingErp] = useState(true);
  const [erpError, setErpError] = useState<string | null>(null);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/subscribers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subscribers");
      }

      setSubscribers(data.subscribers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching subscribers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchErpCustomers = async () => {
    try {
      setIsLoadingErp(true);
      setErpError(null);
      const res = await fetch("/api/erp-customers");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch ERP customers");
      }

      setErpCustomers(data.customers || []);
    } catch (err) {
      setErpError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching ERP customers:", err);
    } finally {
      setIsLoadingErp(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchErpCustomers();
  }, []);

  const handleEditSubscriber = (subscriber: Subscriber) => {
    setEditingSubscription(subscriber);
    setEditSheetOpen(true);
  };

  const handleDeleteSubscriber = async (subscriber: Subscriber) => {
    const confirmed = await confirmToast(
      `Are you sure you want to delete the subscription for "${subscriber.companyName}"? This will remove the company and all its data. This action cannot be undone.`,
      { confirmLabel: "Delete subscription" }
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/subscription/${subscriber.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete subscription");
      }

      toast.success(
        `Subscription for "${subscriber.companyName}" deleted successfully`
      );
      fetchSubscribers();
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete subscription"
      );
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "TRIAL":
        return "bg-blue-100 text-blue-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PAST_DUE":
        return "bg-yellow-100 text-yellow-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "ESSENTIAL":
        return "bg-purple-100 text-purple-800";
      case "GROWTH":
        return "bg-indigo-100 text-indigo-800";
      case "ENTERPRISE":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTrialDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const now = new Date();
    const endDate = new Date(trialEndsAt);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Customers</h1>
          <p className="text-muted-foreground">Welcome {userName || "Guest"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddingSubscriber(true)}
            className="shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
          <Button size="sm" onClick={() => setBulkOpen(true)} variant="outline">
            Bulk Import
          </Button>
        </div>
      </div>

      {/* OnTarget ERP Subscribers - Companies created today */}
      {/* <OnTargetERPSubscribers /> */}

      {/* Subscriber Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriber Directory ({subscribers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={fetchSubscribers}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                No subscriber customers yet. Click &quot;Add Customer&quot; to
                create your first subscriber.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Members
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Trial Info
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
                  {subscribers.map((subscriber) => {
                    const daysRemaining = getTrialDaysRemaining(
                      subscriber.trialEndsAt
                    );
                    return (
                      <tr key={subscriber.id} className="border-b">
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {subscriber.companyName}
                          </div>
                          {subscriber.companyDescription && (
                            <div className="text-sm text-muted-foreground">
                              {subscriber.companyDescription}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {subscriber.ownerName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscriber.ownerEmail}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {subscriber.memberCount}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(
                              subscriber.plan
                            )}`}
                          >
                            {subscriber.plan}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              subscriber.status
                            )}`}
                          >
                            {subscriber.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {subscriber.status === "TRIAL" &&
                          subscriber.trialEndsAt ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {daysRemaining !== null &&
                                  `${daysRemaining} days left`}
                              </div>
                              <div className="text-muted-foreground">
                                Ends: {formatDate(subscriber.trialEndsAt)}
                              </div>
                            </div>
                          ) : subscriber.billingCycleEnd ? (
                            <div className="text-sm text-muted-foreground">
                              Next: {formatDate(subscriber.billingCycleEnd)}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(subscriber.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditSubscriber(subscriber)}
                              title="Edit subscription"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteSubscriber(subscriber)}
                              title="Delete subscription"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual ERP Customers (no company) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            Individual Subscribers (No Company) ({erpCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingErp ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : erpError ? (
            <div className="text-center py-12">
              <p className="text-red-600">{erpError}</p>
              <Button
                onClick={fetchErpCustomers}
                variant="outline"
                className="mt-4"
              >
                Refresh
              </Button>
            </div>
          ) : erpCustomers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                No individual subscribers yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Verified
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {erpCustomers.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="px-4 py-4">
                        <div className="font-medium">{c.name || "—"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{c.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">{c.plan}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          {c.emailVerified ? "Yes" : "No"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Subscriber Sheet */}
      <AddSubscriberSheet
        open={isAddingSubscriber}
        onOpenChange={setIsAddingSubscriber}
        onSuccess={fetchSubscribers}
      />

      {/* Edit Subscription Sheet */}
      <EditSubscriptionSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        subscription={
          editingSubscription
            ? {
                id: editingSubscription.id,
                companyId: editingSubscription.companyId,
                companyName: editingSubscription.companyName,
                plan: editingSubscription.plan,
                status: editingSubscription.status,
                trialEndsAt: editingSubscription.trialEndsAt,
                billingCycleStart: editingSubscription.billingCycleStart,
                billingCycleEnd: editingSubscription.billingCycleEnd,
              }
            : null
        }
        onSuccess={fetchSubscribers}
      />

      {/* Bulk Import Sheet (Super Admin) */}
      <BulkImportCustomers
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={() => {
          // Refresh both lists in case imported customers were added to companies or as standalone users
          fetchSubscribers();
          fetchErpCustomers();
        }}
      />
    </div>
  );
}
