"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Shield,
  TrendingUp,
  Loader2,
} from "lucide-react";
import type { HederaTransaction, HederaCostAlert } from "@prisma/client";

interface BalanceInfo {
  currentBalance: string;
  lowBalanceThreshold: string;
  isLow: boolean;
  lastCheck: string | null;
}

interface CompanyStats {
  transactionCount: number;
  currentMonthSpent: string;
  monthlyBudget: string | null;
  budgetRemaining: string | null;
  budgetExceeded: boolean;
  totalHistoricalCost: string;
  recentTransactions: Array<
    Pick<
      HederaTransaction,
      "id" | "hash" | "transactionId" | "costHbar" | "createdAt" | "status"
    >
  >;
}

type CostAlert = Pick<
  HederaCostAlert,
  "id" | "alertType" | "severity" | "message" | "createdAt"
>;

interface Settings {
  estimatedCostPerTx: string;
  totalTransactions: number;
  totalCostHbar: string;
  lowBalanceThreshold: string;
  useTestnet: boolean;
}

interface CostData {
  balance: BalanceInfo | null;
  company: CompanyStats | null;
  alerts: CostAlert[];
  settings: Settings | null;
}

export function HederaCostDashboard({
  companyId,
  isAdminView = false,
}: {
  companyId?: string;
  isAdminView?: boolean;
}) {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCostData = async () => {
    try {
      const url = companyId
        ? `/api/hedera/costs?companyId=${companyId}`
        : "/api/hedera/costs";
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch cost data:", error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch("/api/hedera/costs/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      fetchCostData();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatHbar = (
    value: string | number | { toString: () => string } | null
  ) => {
    if (!value) return "0";
    const numValue =
      typeof value === "string"
        ? parseFloat(value)
        : typeof value === "number"
        ? value
        : parseFloat(value.toString());
    return numValue.toFixed(4);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
          <p className="text-sm font-medium">Failed to load cost data</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please try refreshing the page
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if Hedera is configured at all
  const isConfigured = data.settings?.totalTransactions !== undefined;
  const hasAnyData =
    (data.settings?.totalTransactions ?? 0) > 0 ||
    data.balance?.currentBalance !== "0" ||
    (data.company?.transactionCount ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Zero State - Hedera Not Configured */}
      {!isConfigured && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="p-3 rounded-full bg-muted inline-flex mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Hedera Not Configured
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAdminView
                ? "Contact your super admin to configure Hedera blockchain credentials before enabling blockchain for your companies."
                : "Configure your Hedera account credentials in the Global Hedera Configuration section to start tracking blockchain transactions."}
            </p>
            {!isAdminView && (
              <Button variant="outline" size="sm" asChild>
                <a href="#blockchain-records">Configure Now</a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Zero State - No Transactions Yet */}
      {isConfigured && !hasAnyData && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="p-3 rounded-full bg-muted inline-flex mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAdminView
                ? "Enable blockchain for your companies using the toggle switches above to start tracking transaction costs."
                : "Enable blockchain for at least one company to start seeing transaction costs and usage statistics."}
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-6 text-left">
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                <p className="text-2xl font-bold">0.0000 ℏ</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Current Balance
                </p>
                <p className="text-2xl font-bold">0.0000 ℏ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {hasAnyData && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={
                alert.severity === "CRITICAL" ? "destructive" : "default"
              }
            >
              {getAlertIcon(alert.severity)}
              <AlertTitle className="ml-2">{alert.alertType}</AlertTitle>
              <AlertDescription className="ml-6 flex items-center justify-between">
                <span>{alert.message}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Balance Overview */}
      {hasAnyData && data.balance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hedera Account Balance</span>
              <Badge variant={data.balance.isLow ? "destructive" : "default"}>
                {data.settings?.useTestnet ? "Testnet" : "Mainnet"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">
                  {formatHbar(data.balance.currentBalance)} ℏ
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Low Balance Alert
                </p>
                <p className="text-2xl font-bold">
                  {formatHbar(data.balance.lowBalanceThreshold)} ℏ
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Check</p>
                <p className="text-sm">
                  {data.balance.lastCheck
                    ? new Date(data.balance.lastCheck).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Budget (if applicable) */}
      {hasAnyData && data.company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Company Budget & Usage</span>
              {data.company.budgetExceeded && (
                <Badge variant="destructive">Budget Exceeded</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-xl font-bold">
                  {formatHbar(data.company.currentMonthSpent)} ℏ
                </p>
              </div>
              {data.company.monthlyBudget && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Monthly Budget
                    </p>
                    <p className="text-xl font-bold">
                      {formatHbar(data.company.monthlyBudget)} ℏ
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-xl font-bold">
                      {formatHbar(data.company.budgetRemaining)} ℏ
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">
                  {data.company.transactionCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Statistics */}
      {hasAnyData && data.settings && (
        <Card>
          <CardHeader>
            <CardTitle>Global Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Estimated Cost/Transaction
                </p>
                <p className="text-xl font-bold">
                  {formatHbar(data.settings.estimatedCostPerTx)} ℏ
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-xl font-bold">
                  {data.settings.totalTransactions}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">
                  {formatHbar(data.settings.totalCostHbar)} ℏ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {hasAnyData &&
        data.company?.recentTransactions &&
        data.company.recentTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.company.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-mono">
                        {tx.hash.slice(0, 16)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          tx.status === "CONFIRMED"
                            ? "default"
                            : tx.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {tx.status}
                      </Badge>
                      <span className="text-sm font-semibold">
                        {formatHbar(tx.costHbar)} ℏ
                      </span>
                      {tx.transactionId && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://${
                              data.settings?.useTestnet ? "testnet." : ""
                            }hashscan.io/transaction/${tx.transactionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
