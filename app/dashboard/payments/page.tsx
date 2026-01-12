"use client";

import {
  CreditCard,
  Building2,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface PaymentGateway {
  id: string;
  provider: string;
  isEnabled: boolean;
  isTestMode: boolean;
  publicKey?: string;
  lastTestedAt?: string;
  lastTestResult?: string;
}

interface PlaidAccount {
  id: string;
  accountName?: string;
  accountMask?: string;
  accountType?: string;
  institutionName?: string;
  isActive: boolean;
  lastSyncAt?: string;
}

interface Company {
  id: string;
  name: string;
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    plan?: string;
  }>({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });

  // Company selection for SUPER_ADMIN/ADMIN with multiple companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Payment Gateways
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("stripe");
  const [gatewayConfig, setGatewayConfig] = useState({
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    isTestMode: true,
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Plaid Accounts
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccount[]>([]);
  const [linkingAccount, setLinkingAccount] = useState(false);

  useEffect(() => {
    loadUserAndCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadPaymentGateways();
      loadPlaidAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  const loadUserAndCompanies = async () => {
    try {
      const userResponse = await fetch("/api/auth/me");
      const userData = await userResponse.json();

      if (userData.authenticated && userData.user) {
        setUser({
          name: userData.user.name,
          email: userData.user.email,
          image: userData.user.image,
          role: userData.user.role,
          plan: userData.user.plan,
        });

        // Load companies for company selector
        const companiesResponse = await fetch("/api/companies");
        const companiesData = await companiesResponse.json();
        // API returns { success, companies, count }
        const list = companiesData?.companies || [];
        setCompanies(list);

        // Auto-select first company if any
        if (list.length > 0) {
          setSelectedCompanyId(list[0].id);
        }

        setLoading(false);
      } else {
        // Not authenticated, stay in loading state (will be handled by dashboard layout)
        console.error("User not authenticated");
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      toast.error("Failed to load user data");
      setLoading(false);
    }
  };

  const loadPaymentGateways = async () => {
    try {
      const response = await fetch(
        `/api/company/payment-gateways?companyId=${selectedCompanyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setGateways(data);

        // Load config for first enabled gateway
        if (data.length > 0) {
          setSelectedProvider(data[0].provider);
          setGatewayConfig({
            publicKey: data[0].publicKey || "",
            secretKey: data[0].secretKey || "",
            webhookSecret: data[0].webhookSecret || "",
            isTestMode: data[0].isTestMode,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load payment gateways:", error);
    }
  };

  const loadPlaidAccounts = async () => {
    try {
      const response = await fetch(
        `/api/company/plaid-accounts?companyId=${selectedCompanyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setPlaidAccounts(data);
      }
    } catch (error) {
      console.error("Failed to load Plaid accounts:", error);
    }
  };

  const handleSaveGateway = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    try {
      const response = await fetch("/api/company/payment-gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          provider: selectedProvider,
          ...gatewayConfig,
        }),
      });

      if (response.ok) {
        toast.success("Payment gateway saved successfully");
        loadPaymentGateways();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save payment gateway");
      }
    } catch (error) {
      console.error("Failed to save payment gateway:", error);
      toast.error("Failed to save payment gateway");
    }
  };

  const handleTestConnection = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setTestingConnection(true);
    try {
      const response = await fetch(
        `/api/company/payment-gateways/${selectedProvider}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: selectedCompanyId,
            ...gatewayConfig,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success(result.message || "Connection successful!");
      } else {
        toast.error(result.message || "Connection failed");
      }

      loadPaymentGateways(); // Refresh to show test result
    } catch (error) {
      console.error("Failed to test connection:", error);
      toast.error("Failed to test connection");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleToggleGateway = async (gatewayId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(
        `/api/company/payment-gateways/${gatewayId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEnabled }),
        }
      );

      if (response.ok) {
        toast.success(isEnabled ? "Gateway enabled" : "Gateway disabled");
        loadPaymentGateways();
      } else {
        toast.error("Failed to update gateway");
      }
    } catch (error) {
      console.error("Failed to update gateway:", error);
      toast.error("Failed to update gateway");
    }
  };

  const handleLinkBankAccount = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setLinkingAccount(true);
    try {
      // Create Plaid Link token
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: selectedCompanyId }),
      });

      if (response.ok) {
        await response.json();
        // TODO: Initialize Plaid Link UI with linkToken
        // Do not log the token value to console to avoid exposing it in logs
        console.info("Plaid link token obtained (redacted)");
        toast.info("Plaid Link integration coming soon");
      } else {
        toast.error("Failed to initialize bank account linking");
      }
    } catch (error) {
      console.error("Failed to link bank account:", error);
      toast.error("Failed to link bank account");
    } finally {
      setLinkingAccount(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Check role access
  const canManagePayments = ["SUPER_ADMIN", "ADMIN"].includes(user?.role || "");

  if (!canManagePayments) {
    return (
      <DashboardLayout user={user}>
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don&apos;t have permission to manage payment settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Payment Management
          </h1>
          <p className="dark:text-gray-200">
            Manage bank accounts, transactions, and invoices. For payment
            gateway configuration, go to Settings → Payment Provider
            Configuration.
          </p>
        </div>

        {/* Company Selector for SUPER_ADMIN/multi-company admins */}
        {companies.length >= 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Company</CardTitle>
              <CardDescription>
                Choose which company to configure payments for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {!selectedCompanyId ? (
          <Card>
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
              <CardDescription>
                Please select a company to configure payment settings
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Tabs defaultValue="accounts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accounts">
                <Building2 className="mr-2 h-4 w-4" />
                Bank Accounts
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <Activity className="mr-2 h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <FileText className="mr-2 h-4 w-4" />
                Invoices
              </TabsTrigger>
            </TabsList>

            {/* Bank Accounts Tab - now the default */}
            <TabsContent value="accounts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bank Accounts (Plaid)</CardTitle>
                  <CardDescription>
                    Link your business bank account for ACH payments, payroll,
                    and more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleLinkBankAccount}
                    disabled={linkingAccount}
                  >
                    {linkingAccount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      "Link Bank Account"
                    )}
                  </Button>

                  {plaidAccounts.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {plaidAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <h4 className="font-medium">
                              {account.institutionName}
                            </h4>
                            <p className="text-sm dark:text-gray-200">
                              {account.accountName} •••• {account.accountMask}
                            </p>
                            <p className="text-xs dark:text-gray-200 capitalize">
                              {account.accountType}
                            </p>
                          </div>
                          <Badge
                            variant={account.isActive ? "default" : "secondary"}
                          >
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    View all payment transactions for this company
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm dark:text-gray-200">
                    Transaction history coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>
                    Create and manage invoices for your customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm dark:text-gray-200">
                    Invoice management coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
