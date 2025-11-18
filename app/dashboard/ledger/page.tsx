"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  FileText,
  DollarSign,
  Calculator,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface Company {
  id: string;
  name: string;
}

interface LedgerSummary {
  totalRevenue: string;
  totalExpenses: string;
  totalPayroll: string;
  currentBalance: string;
  bankConnected: boolean;
  stripeConnected: boolean;
}

export default function LedgerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary | null>(
    null
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && selectedCompany) {
      fetchLedgerSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (!data.authenticated || data.user?.role === "GUEST") {
        router.push("/");
        return;
      }

      // LEDGER ACCESS CONTROL: Only ADMIN and SUPER_ADMIN allowed
      const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
      if (!allowedRoles.includes(data.user?.role)) {
        toast.error(
          "Access Denied: Ledger is only accessible to company administrators"
        );
        router.push("/dashboard");
        return;
      }

      setUser(data.user);

      // Fetch user's companies
      await fetchCompanies(data.user.role);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async (userRole: string) => {
    try {
      const response = await fetch("/api/company/my-companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);

        // Auto-select first company if only one exists
        if (data.companies && data.companies.length === 1) {
          setSelectedCompany(data.companies[0].id);
        } else if (
          data.companies &&
          data.companies.length > 1 &&
          userRole === "SUPER_ADMIN"
        ) {
          // SUPER_ADMIN with multiple companies - let them choose
          setSelectedCompany(data.companies[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchLedgerSummary = async () => {
    if (!selectedCompany) return;

    try {
      const response = await fetch(
        `/api/ledger/summary?companyId=${selectedCompany}`
      );
      if (response.ok) {
        const data = await response.json();
        setLedgerSummary(data);
      } else if (response.status === 403) {
        toast.error(
          "Access Denied: You don't have permission to view this ledger"
        );
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch ledger summary:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user || undefined}>
      <div className="space-y-6">
        {/* Header with Company Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Company Ledger
            </h1>
            <p className="text-muted-foreground">
              Manage your company&apos;s financial operations
            </p>
          </div>

          {/* Company Selector for SUPER_ADMIN with multiple companies */}
          {user?.role === "SUPER_ADMIN" && companies.length > 1 && (
            <div className="w-[250px]">
              <Select
                value={selectedCompany}
                onValueChange={setSelectedCompany}
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
          )}
        </div>

        {/* Financial Summary Cards */}
        {ledgerSummary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${ledgerSummary.totalRevenue}
                </div>
                <p className="text-xs text-muted-foreground">
                  From all invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${ledgerSummary.totalExpenses}
                </div>
                <p className="text-xs text-muted-foreground">
                  Business expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${ledgerSummary.totalPayroll}
                </div>
                <p className="text-xs text-muted-foreground">
                  Employee payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${ledgerSummary.currentBalance}
                </div>
                <div className="flex gap-2 mt-2">
                  {ledgerSummary.bankConnected && (
                    <Badge variant="outline" className="text-xs">
                      Bank Connected
                    </Badge>
                  )}
                  {ledgerSummary.stripeConnected && (
                    <Badge variant="outline" className="text-xs">
                      Stripe Connected
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for different ledger sections */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Payroll
            </TabsTrigger>
            <TabsTrigger value="accounting" className="gap-2">
              <Calculator className="h-4 w-4" />
              Business Accounting
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="h-4 w-4" />
              Expense Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Manage customer orders and track their lifecycle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking your customer orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Generate and manage invoices, track payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No invoices yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first invoice
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payroll</CardTitle>
                <CardDescription>
                  Process employee payments and manage payroll schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No payroll entries
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up payroll for your employees
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Accounting</CardTitle>
                <CardDescription>
                  Chart of accounts, double-entry bookkeeping, financial reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No accounting entries
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking your business accounts
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Tracker</CardTitle>
                <CardDescription>
                  Track business expenses with categorization and receipt
                  uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No expenses tracked
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Record your first business expense
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
