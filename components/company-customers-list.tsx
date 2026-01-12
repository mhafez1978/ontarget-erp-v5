"use client";

import { Users, Loader2, Building2 } from "lucide-react";
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

import { Button } from "@/components/ui/button";

interface CustomerData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  companyId: string;
  companyName: string;
  joinedAt: string;
  createdAt: string;
}

export function CompanyCustomersList() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyCustomers = async () => {
    try {
      setError(null);
      const response = await fetch("/api/customers/my-companies");

      console.log(
        "[CompanyCustomersList] API response status:",
        response.status
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("[CompanyCustomersList] API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch customers");
      }

      const data = await response.json();
      console.log("[CompanyCustomersList] API success, customers:", data);
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Failed to fetch company customers:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyCustomers();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCompanyCustomers, 60000);
    return () => clearInterval(interval);
  }, []);

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
              onClick={fetchCompanyCustomers}
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
              Company Customers ({customers.length})
            </CardTitle>
            <CardDescription>
              All customers across your companies
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={fetchCompanyCustomers}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <div className="text-center py-12 dark:text-gray-200">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-sm">
              Start adding customers to your company to see them here.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Company
                    </div>
                  </TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{customer.email || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-primary">
                        {customer.companyName}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm dark:text-gray-200">
                      {new Date(customer.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm dark:text-gray-200">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
