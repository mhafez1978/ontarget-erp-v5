"use client";

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
import {
  CreditCard,
  Building2,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

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
  const [user, setUser] = useState<{ role: string; plan: string } | null>(null);

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
      const userResponse = await fetch("/api/user");
      const userData = await userResponse.json();
      setUser(userData);

      // Load companies for company selector
      const companiesResponse = await fetch("/api/companies");
      const companiesData = await companiesResponse.json();
      setCompanies(companiesData || []);

      // Auto-select first company
      if (companiesData && companiesData.length > 0) {
        setSelectedCompanyId(companiesData[0].id);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      toast.error("Failed to load user data");
    } finally {
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
            secretKey: "", // Never send back
            webhookSecret: "", // Never send back
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
        const { linkToken } = await response.json();
        // TODO: Initialize Plaid Link UI with linkToken
        console.log("Plaid link token received:", linkToken);
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
      <DashboardLayout>
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
      <DashboardLayout>
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
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Payment Settings
          </h1>
          <p className="text-muted-foreground">
            Configure payment gateways, bank accounts, and manage transactions
          </p>
        </div>

        {/* Company Selector for SUPER_ADMIN/multi-company admins */}
        {companies.length > 1 && (
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
          <Tabs defaultValue="gateways" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="gateways">
                <CreditCard className="mr-2 h-4 w-4" />
                Payment Gateways
              </TabsTrigger>
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

            {/* Payment Gateways Tab */}
            <TabsContent value="gateways" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Gateway Configuration</CardTitle>
                  <CardDescription>
                    Configure payment providers to accept payments from
                    customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Payment Provider</Label>
                    <Select
                      value={selectedProvider}
                      onValueChange={setSelectedProvider}
                    >
                      <SelectTrigger id="provider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="square">
                          Square (Coming Soon)
                        </SelectItem>
                        <SelectItem value="authorize_net">
                          Authorize.Net (Coming Soon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="testMode"
                      checked={gatewayConfig.isTestMode}
                      onCheckedChange={(checked) =>
                        setGatewayConfig({
                          ...gatewayConfig,
                          isTestMode: checked,
                        })
                      }
                    />
                    <Label htmlFor="testMode">Test Mode (Sandbox)</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publicKey">
                      {selectedProvider === "stripe"
                        ? "Publishable Key"
                        : "Client ID"}
                    </Label>
                    <Input
                      id="publicKey"
                      placeholder={
                        selectedProvider === "stripe"
                          ? "pk_test_..."
                          : "Client ID"
                      }
                      value={gatewayConfig.publicKey}
                      onChange={(e) =>
                        setGatewayConfig({
                          ...gatewayConfig,
                          publicKey: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secretKey">
                      {selectedProvider === "stripe"
                        ? "Secret Key"
                        : "Client Secret"}
                    </Label>
                    <Input
                      id="secretKey"
                      type="password"
                      placeholder={
                        selectedProvider === "stripe"
                          ? "sk_test_..."
                          : "Client Secret"
                      }
                      value={gatewayConfig.secretKey}
                      onChange={(e) =>
                        setGatewayConfig({
                          ...gatewayConfig,
                          secretKey: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      placeholder="whsec_..."
                      value={gatewayConfig.webhookSecret}
                      onChange={(e) =>
                        setGatewayConfig({
                          ...gatewayConfig,
                          webhookSecret: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleSaveGateway}>
                      Save Configuration
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                    >
                      {testingConnection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Configured Gateways */}
              {gateways.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configured Gateways</CardTitle>
                    <CardDescription>
                      Payment gateways configured for this company
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {gateways.map((gateway) => (
                        <div
                          key={gateway.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium capitalize">
                                {gateway.provider}
                              </h4>
                              {gateway.isTestMode && (
                                <Badge variant="secondary">Test Mode</Badge>
                              )}
                              {gateway.lastTestResult === "success" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : gateway.lastTestResult === "failed" ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : null}
                            </div>
                            {gateway.publicKey && (
                              <p className="text-sm text-muted-foreground">
                                {gateway.publicKey.slice(0, 20)}...
                              </p>
                            )}
                            {gateway.lastTestedAt && (
                              <p className="text-xs text-muted-foreground">
                                Last tested:{" "}
                                {new Date(
                                  gateway.lastTestedAt
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={gateway.isEnabled}
                            onCheckedChange={(checked) =>
                              handleToggleGateway(gateway.id, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Bank Accounts Tab */}
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
                            <p className="text-sm text-muted-foreground">
                              {account.accountName} •••• {account.accountMask}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
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
                  <p className="text-sm text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
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
