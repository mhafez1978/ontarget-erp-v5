"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  tax: number;
  discount: number;
  total: number;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  externalInvoiceUrl?: string;
  items: unknown[];
  notes?: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: null,
    email: null,
    image: null,
    role: "TRIAL",
  });
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(
    null
  );

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.authenticated && data.user) {
        const allowedRoles = ["ERP_CUSTOMER", "COMPANY_CUSTOMER"];

        if (!allowedRoles.includes(data.user.role)) {
          router.push("/dashboard");
          return;
        }

        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
        });
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await fetch("/api/invoices/my-invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        toast.error("Failed to load invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && user.role !== "TRIAL") {
      fetchInvoices();
    }
  }, [loading, user.role, fetchInvoices]);

  const handlePayInvoice = async (invoiceId: string) => {
    setProcessingPayment(invoiceId);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.paymentUrl) {
          // Redirect to payment page
          window.location.href = data.paymentUrl;
        } else {
          toast.success("Payment processed successfully");
          fetchInvoices(); // Refresh invoices
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      DRAFT: { variant: "secondary", label: "Draft" },
      SENT: { variant: "default", label: "Sent" },
      PAID: { variant: "outline", label: "Paid" },
      OVERDUE: { variant: "destructive", label: "Overdue" },
      CANCELLED: { variant: "secondary", label: "Cancelled" },
    };

    const config = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isPayable = (invoice: Invoice) => {
    return invoice.status === "SENT" || invoice.status === "OVERDUE";
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200" />
        </div>
      </DashboardLayout>
    );
  }

  const outstandingInvoices = invoices.filter((inv) => isPayable(inv));
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + Number(inv.total),
    0
  );

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="dark:text-gray-200">View and pay your invoices</p>
          </div>
        </div>

        {/* Summary Cards */}
        {outstandingInvoices.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <FileText className="h-5 w-5" />
                Outstanding Balance
              </CardTitle>
              <CardDescription className="text-orange-700">
                You have {outstandingInvoices.length} unpaid invoice
                {outstandingInvoices.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {formatCurrency(totalOutstanding)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>
              Your invoice history and payment records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 dark:text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                <p className="dark:text-gray-200">
                  Your invoices will appear here when issued
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {invoice.externalInvoiceUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    invoice.externalInvoiceUrl,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            {isPayable(invoice) && (
                              <Button
                                size="sm"
                                onClick={() => handlePayInvoice(invoice.id)}
                                disabled={processingPayment === invoice.id}
                              >
                                {processingPayment === invoice.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay Now
                                  </>
                                )}
                              </Button>
                            )}
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
      </div>
    </DashboardLayout>
  );
}
