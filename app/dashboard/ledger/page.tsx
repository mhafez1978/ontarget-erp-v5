"use client";

import {
  ShoppingCart,
  FileText,
  DollarSign,
  Calculator,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Users,
  Clock,
  Globe,
  ChevronRight,
  Loader2,
} from "lucide-react";
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

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { HederaCostDashboard } from "@/components/hedera-cost-dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PayrollSummary } from "@/lib/payroll/types";

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

interface PayrollEntry {
  id: string;
  staffId: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  currency: string;
  hoursWorked: string;
  overtimeHours: string;
  grossAmount: string;
  netAmount: string;
  status: string;
  createdAt: string;
  taxBreakdown: {
    federalIncomeTax: number;
    stateIncomeTax: number;
    localIncomeTax: number;
    socialSecurity: number;
    medicare: number;
    medicareAdditional: number;
    stateUnemployment: number;
    stateDisabilityInsurance: number;
    totals: {
      totalTaxes: number;
      totalDeductions: number;
      netPay: number;
    };
  };
  staff: {
    user: {
      name: string;
      email: string;
    };
    employmentClassification?: string;
    payRate?: string;
  };
  jurisdiction?: {
    code: string;
    name: string;
  };
}

interface PendingPayrollEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: string | null;
  staff: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
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
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(
    null
  );
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<PendingPayrollEntry[]>(
    []
  );
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && selectedCompany) {
      fetchLedgerSummary();
      fetchPayrollData();
      fetchPendingPayrollEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (!data.authenticated || data.user?.role === "TRIAL") {
        router.push("/");
        return;
      }

      // LEDGER ACCESS CONTROL: Only ADMIN_OWNER and SUPER_ADMIN allowed
      const allowedRoles = ["ADMIN_OWNER", "SUPER_ADMIN"];
      if (!allowedRoles.includes(data.user?.role)) {
        toast.error(
          "Access Denied: Ledger is only accessible to company administrators"
        );
        router.push("/dashboard");
        return;
      }

      setUser(data.user);

      // Fetch user's companies
      await fetchCompanies();
    } catch (error) {
      console.error("Failed to fetch user:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/company/my-companies");
      if (response.ok) {
        const data = await response.json();
        const companyList = data.companies || [];
        setCompanies(companyList);

        if (!selectedCompany && companyList.length > 0) {
          setSelectedCompany(companyList[0].id);
        } else if (
          selectedCompany &&
          !companyList.some(
            (company: Company) => company.id === selectedCompany
          )
        ) {
          setSelectedCompany(companyList[0]?.id || "");
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

  const fetchPayrollData = async () => {
    if (!selectedCompany) return;

    setLoadingPayroll(true);
    try {
      console.log("Fetching payroll data for company:", selectedCompany);
      const response = await fetch(
        `/api/payroll/entries?companyId=${selectedCompany}`
      );
      console.log("Payroll API response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Payroll data received:", data);
        setPayrollEntries(data.entries || []);
        setPayrollSummary(data.summary || null);
      } else if (response.status === 403) {
        toast.error(
          "Access Denied: You don't have permission to view payroll data"
        );
      }
    } catch (error) {
      console.error("Failed to fetch payroll data:", error);
      toast.error("Failed to load payroll data");
    } finally {
      setLoadingPayroll(false);
    }
  };

  const fetchPendingPayrollEntries = async () => {
    if (!selectedCompany) {
      setPendingEntries([]);
      return;
    }

    setLoadingPending(true);
    try {
      const response = await fetch(
        `/api/payroll/pending?companyId=${selectedCompany}`
      );

      if (response.ok) {
        const data = await response.json();
        setPendingEntries(data.pendingEntries || []);
      } else if (response.status === 403) {
        toast.error("Access Denied: You can't view pending payroll entries");
      }
    } catch (error) {
      console.error("Failed to fetch pending payroll entries:", error);
    } finally {
      setLoadingPending(false);
    }
  };

  const runPayroll = async () => {
    if (!selectedCompany || processingPayroll) return;

    setProcessingPayroll(true);
    try {
      const response = await fetch("/api/payroll/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: selectedCompany }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || "Payroll processing failed");
        return;
      }

      toast.success(
        `Payroll run complete (${
          data.result?.payrollEntriesCreated || 0
        } entries)`
      );

      if (data.result?.skippedTimeEntries?.length) {
        const reasons = data.result.skippedTimeEntries
          .slice(0, 3)
          .map((entry: { reason: string }) => entry.reason)
          .join("; ");
        toast.warning(
          `Skipped ${data.result.skippedTimeEntries.length} entries: ${reasons}`
        );
      }

      await fetchPayrollData();
      await fetchLedgerSummary();
      await fetchPendingPayrollEntries();
    } catch (error) {
      console.error("Failed to run payroll:", error);
      toast.error("Failed to run payroll");
    } finally {
      setProcessingPayroll(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (
    amount: string | number,
    currency: string = "USD"
  ) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const payrollPrimaryTotals = payrollSummary?.totalsByCurrency[0];
  const payrollDisplayCurrency =
    payrollSummary?.primaryCurrency ?? payrollPrimaryTotals?.currency ?? "USD";
  const payrollGrossValue =
    payrollSummary?.totalGrossPay ?? payrollPrimaryTotals?.gross ?? "0.00";
  const payrollNetValue =
    payrollSummary?.totalNetPay ?? payrollPrimaryTotals?.net ?? "0.00";
  const payrollTaxesValue =
    payrollSummary?.totalTaxes ?? payrollPrimaryTotals?.taxes ?? "0.00";

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
            <p className="dark:text-gray-200">
              Manage your company&apos;s financial operations
            </p>
          </div>

          {/* Company Selector: only show if there are multiple selectable companies (owners/admins who own multiple)
              Managers/staff and single-company users will see no selector */}
          {companies.length > 1 && (
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
                <p className="text-xs dark:text-gray-200">From all invoices</p>
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
                <p className="text-xs dark:text-gray-200">Business expenses</p>
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
                <p className="text-xs dark:text-gray-200">Employee payments</p>
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
            <TabsTrigger value="blockchain" className="gap-2">
              <Globe className="h-4 w-4" />
              Blockchain Ledger
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
                  <ShoppingCart className="h-12 w-12 dark:text-gray-200 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-sm dark:text-gray-200 mb-4">
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
                  <FileText className="h-12 w-12 dark:text-gray-200 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No invoices yet
                  </h3>
                  <p className="text-sm dark:text-gray-200 mb-4">
                    Create your first invoice
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            {loadingPayroll ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    onClick={runPayroll}
                    disabled={
                      !selectedCompany ||
                      processingPayroll ||
                      loading ||
                      loadingPayroll
                    }
                  >
                    {processingPayroll ? "Processing payroll…" : "Run payroll"}
                  </Button>
                </div>

                {/* Payroll Summary Cards */}
                {payrollSummary && payrollSummary.totalEntries > 0 && (
                  <>
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total Gross Pay
                          </CardTitle>
                          <DollarSign className="h-4 w-4 dark:text-gray-200" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              payrollGrossValue,
                              payrollDisplayCurrency
                            )}
                          </div>
                          <p className="text-xs dark:text-gray-200">
                            Before taxes and deductions
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total Net Pay
                          </CardTitle>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                              payrollNetValue,
                              payrollDisplayCurrency
                            )}
                          </div>
                          <p className="text-xs dark:text-gray-200">
                            After taxes and deductions
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total Taxes
                          </CardTitle>
                          <FileText className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(
                              payrollTaxesValue,
                              payrollDisplayCurrency
                            )}
                          </div>
                          <p className="text-xs dark:text-gray-200">
                            Federal, state, and payroll
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Employees
                          </CardTitle>
                          <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {payrollSummary.staffCount}
                          </div>
                          <p className="text-xs dark:text-gray-200">
                            {payrollSummary.totalEntries} entries
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {payrollSummary.totalsByCurrency.length > 1 && (
                      <div className="grid gap-3 md:grid-cols-2">
                        {payrollSummary.totalsByCurrency.map(
                          (currencyTotal) => (
                            <div
                              key={currencyTotal.currency}
                              className="rounded-lg border border-dashed border-muted p-3 text-xs dark:text-gray-200"
                            >
                              <div className="font-semibold dark:text-gray-200">
                                {currencyTotal.currency} totals
                              </div>
                              <div className="space-y-1">
                                <div>
                                  Gross:{" "}
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(
                                      currencyTotal.gross,
                                      currencyTotal.currency
                                    )}
                                  </span>
                                </div>
                                <div>
                                  Net:{" "}
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(
                                      currencyTotal.net,
                                      currencyTotal.currency
                                    )}
                                  </span>
                                </div>
                                <div>
                                  Taxes:{" "}
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(
                                      currencyTotal.taxes,
                                      currencyTotal.currency
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Approved Timesheets</CardTitle>
                    <CardDescription>
                      Clocked-out entries ready for payroll processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPending ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : pendingEntries.length === 0 ? (
                      <p className="text-sm dark:text-gray-200">
                        No approved entries waiting for payment.
                      </p>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Hours</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="font-medium">
                                  {entry.staff.user.name ||
                                    entry.staff.user.email ||
                                    "Unknown"}
                                </TableCell>
                                <TableCell>
                                  {format(
                                    new Date(entry.clockIn),
                                    "MMM dd, yyyy"
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {entry.totalHours || "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">Approved</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payroll Entries Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payroll Entries</CardTitle>
                    <CardDescription>
                      Recent payroll processing history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payrollEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <DollarSign className="h-12 w-12 dark:text-gray-200 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          No payroll entries yet
                        </h3>
                        <p className="text-sm dark:text-gray-200 mb-4">
                          Set up payroll for your employees to get started
                        </p>
                        <Button
                          onClick={() => router.push("/dashboard/workforce")}
                        >
                          Configure Staff Payroll
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Jurisdiction</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Gross Pay</TableHead>
                            <TableHead>Taxes</TableHead>
                            <TableHead>Net Pay</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payrollEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {entry.staff.user.name}
                                  </div>
                                  <div className="text-sm dark:text-gray-200">
                                    {entry.staff.employmentClassification ||
                                      "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 dark:text-gray-200" />
                                  <div>
                                    <div>{formatDate(entry.periodStart)}</div>
                                    <div className="dark:text-gray-200">
                                      to {formatDate(entry.periodEnd)}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {entry.jurisdiction ? (
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 dark:text-gray-200" />
                                    <div>
                                      <div className="text-sm">
                                        {entry.jurisdiction.code}
                                      </div>
                                      <div className="text-xs dark:text-gray-200">
                                        {entry.jurisdiction.name}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="dark:text-gray-200">
                                    N/A
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 dark:text-gray-200" />
                                  <div className="text-sm">
                                    {parseFloat(entry.hoursWorked).toFixed(1)}h
                                    {parseFloat(entry.overtimeHours) > 0 && (
                                      <span className="text-xs dark:text-gray-200 ml-1">
                                        (+
                                        {parseFloat(
                                          entry.overtimeHours
                                        ).toFixed(1)}{" "}
                                        OT)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(
                                  entry.grossAmount,
                                  entry.currency
                                )}
                              </TableCell>
                              <TableCell className="text-red-600">
                                -
                                {formatCurrency(
                                  entry.taxBreakdown.totals.totalTaxes,
                                  entry.currency
                                )}
                              </TableCell>
                              <TableCell className="font-bold text-green-600">
                                {formatCurrency(
                                  entry.netAmount,
                                  entry.currency
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(entry.status)}>
                                  {entry.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEntry(entry)}
                                >
                                  Details
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Detail Modal */}
                {selectedEntry && (
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Payroll Entry Details</CardTitle>
                          <CardDescription>
                            {selectedEntry.staff.user.name} - Pay Period{" "}
                            {formatDate(selectedEntry.periodStart)} to{" "}
                            {formatDate(selectedEntry.periodEnd)}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Pay Summary */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm dark:text-gray-200">
                            Gross Pay
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              selectedEntry.grossAmount,
                              selectedEntry.currency
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm dark:text-gray-200">
                            Total Taxes
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            -
                            {formatCurrency(
                              selectedEntry.taxBreakdown.totals.totalTaxes,
                              selectedEntry.currency
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm dark:text-gray-200">Net Pay</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                              selectedEntry.netAmount,
                              selectedEntry.currency
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Tax Breakdown */}
                      <div>
                        <h3 className="font-semibold mb-3">Tax Breakdown</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 hover:bg-muted rounded">
                            <span className="text-sm">Federal Income Tax</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedEntry.taxBreakdown.federalIncomeTax,
                                selectedEntry.currency
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 hover:bg-muted rounded">
                            <span className="text-sm">State Income Tax</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedEntry.taxBreakdown.stateIncomeTax,
                                selectedEntry.currency
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 hover:bg-muted rounded">
                            <span className="text-sm">Local Income Tax</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedEntry.taxBreakdown.localIncomeTax,
                                selectedEntry.currency
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 hover:bg-muted rounded">
                            <span className="text-sm">Social Security</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedEntry.taxBreakdown.socialSecurity,
                                selectedEntry.currency
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 hover:bg-muted rounded">
                            <span className="text-sm">Medicare</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedEntry.taxBreakdown.medicare,
                                selectedEntry.currency
                              )}
                            </span>
                          </div>
                          {selectedEntry.taxBreakdown.medicareAdditional >
                            0 && (
                            <div className="flex justify-between p-2 hover:bg-muted rounded">
                              <span className="text-sm">
                                Additional Medicare Tax
                              </span>
                              <span className="font-medium">
                                {formatCurrency(
                                  selectedEntry.taxBreakdown.medicareAdditional,
                                  selectedEntry.currency
                                )}
                              </span>
                            </div>
                          )}
                          {selectedEntry.taxBreakdown.stateDisabilityInsurance >
                            0 && (
                            <div className="flex justify-between p-2 hover:bg-muted rounded">
                              <span className="text-sm">
                                State Disability Insurance
                              </span>
                              <span className="font-medium">
                                {formatCurrency(
                                  selectedEntry.taxBreakdown
                                    .stateDisabilityInsurance,
                                  selectedEntry.currency
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Employment Info */}
                      <div>
                        <h3 className="font-semibold mb-3">
                          Employment Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm dark:text-gray-200">
                              Classification
                            </p>
                            <p className="font-medium">
                              {selectedEntry.staff.employmentClassification ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm dark:text-gray-200">
                              Pay Rate
                            </p>
                            <p className="font-medium">
                              {selectedEntry.staff.payRate
                                ? formatCurrency(
                                    selectedEntry.staff.payRate,
                                    selectedEntry.currency
                                  )
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm dark:text-gray-200">
                              Hours Worked
                            </p>
                            <p className="font-medium">
                              {parseFloat(selectedEntry.hoursWorked).toFixed(2)}{" "}
                              hours
                            </p>
                          </div>
                          <div>
                            <p className="text-sm dark:text-gray-200">
                              Pay Date
                            </p>
                            <p className="font-medium">
                              {formatDate(selectedEntry.payDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
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
                  <Calculator className="h-12 w-12 dark:text-gray-200 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No accounting entries
                  </h3>
                  <p className="text-sm dark:text-gray-200 mb-4">
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
                  <Receipt className="h-12 w-12 dark:text-gray-200 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No expenses tracked
                  </h3>
                  <p className="text-sm dark:text-gray-200 mb-4">
                    Record your first business expense
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blockchain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Ledger</CardTitle>
                <CardDescription>
                  View Hedera transactions and company blockchain costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Hedera cost dashboard will handle zero-state and data fetching */}
                <HederaCostDashboard
                  companyId={selectedCompany}
                  isAdminView={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
