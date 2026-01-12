"use client";

import { Users, Loader2, Building2, Pencil, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { EditCustomerSheet } from "./edit-customer-sheet";
import { BulkImportCustomers } from "./bulk-import-customers";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirm";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  companyName: string;
  companyId: string;
  role: string;
  joinedAt: string;
}

interface CompanyGroup {
  id: string;
  name: string;
  customers: CustomerData[];
}

export function CompanyCustomers() {
  const [companies, setCompanies] = useState<CompanyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(
    null
  );
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Bulk import sheet state
  const [bulkOpen, setBulkOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setError(null);
      const response = await fetch("/api/customers/my-companies");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch customers");
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setEditSheetOpen(true);
  };

  const handleDelete = async (customer: CustomerData) => {
    const confirmed = await confirmToast(
      `Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`,
      { confirmLabel: "Delete customer" }
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete customer");
      }

      toast.success(`Customer "${customer.name}" deleted successfully`);
      fetchCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete customer"
      );
    }
  };

  const totalCustomers = companies.reduce(
    (sum, company) => sum + company.customers.length,
    0
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Company Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin dark:text-gray-200" />
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
            <Users className="h-5 w-5" />
            Company Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Error: {error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCustomers}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Company Customers ({totalCustomers})
            </CardTitle>
            <CardDescription>
              Customers across {companies.length}{" "}
              {companies.length === 1 ? "company" : "companies"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchCustomers}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => setBulkOpen(true)}>
              Bulk Import
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalCustomers === 0 ? (
          <div className="text-center py-8 dark:text-gray-200">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No customers yet</p>
            <p className="text-sm mt-2">
              Add your first customer to get started
            </p>
          </div>
        ) : (
          <Tabs defaultValue={companies[0]?.id} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {companies.map((company) => (
                <TabsTrigger
                  key={company.id}
                  value={company.id}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  {company.name}
                  <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                    {company.customers.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {companies.map((company) => (
              <TabsContent key={company.id} value={company.id} className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.customers.map((customer) => (
                        <TableRow key={`${company.id}-${customer.id}`}>
                          <TableCell className="font-medium capitalize">
                            {customer.name}
                          </TableCell>
                          <TableCell className="text-sm dark:text-gray-200">
                            {customer.email}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                              {customer.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm dark:text-gray-200">
                            {new Date(customer.joinedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(customer)}
                                title="Edit customer"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(customer)}
                                title="Delete customer"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>

      {/* Bulk import sheet */}
      <BulkImportCustomers
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={fetchCustomers}
      />

      <EditCustomerSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        customer={
          editingCustomer
            ? {
                id: editingCustomer.id,
                name: editingCustomer.name,
                email: editingCustomer.email,
                role: editingCustomer.role,
                companyId: editingCustomer.companyId,
              }
            : null
        }
        onSuccess={fetchCustomers}
      />
    </Card>
  );
}
