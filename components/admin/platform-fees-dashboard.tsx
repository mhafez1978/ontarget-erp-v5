"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformFeeStats {
  totalFeesCollected: number;
  totalTransactions: number;
  byPlan: {
    planName: string;
    feesCollected: number;
    transactions: number;
    averageFeePercent: number;
  }[];
  byCompany: {
    companyId: string;
    companyName: string;
    planName: string;
    feesCollected: number;
    transactions: number;
    feePercent: number;
  }[];
  recentTransactions: {
    id: string;
    companyName: string;
    amount: number;
    feeAmount: number;
    feePercent: number;
    createdAt: string;
  }[];
}

export function PlatformFeesAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformFeeStats | null>(null);
  const [timeRange, setTimeRange] = useState("30"); // days

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/platform-fees/stats?days=${timeRange}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching platform fee stats:", error);
      toast.error("Failed to load platform fee statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 dark:text-gray-200">
        No platform fee data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Fees</h2>
          <p className="dark:text-gray-200">
            Revenue from marketplace transactions
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Fees Collected
            </CardTitle>
            <DollarSign className="h-4 w-4 dark:text-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalFeesCollected)}
            </div>
            <p className="text-xs dark:text-gray-200">
              From {stats.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 dark:text-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs dark:text-gray-200">Using fallback gateway</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Users className="h-4 w-4 dark:text-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCompany.length}</div>
            <p className="text-xs dark:text-gray-200">Using platform gateway</p>
          </CardContent>
        </Card>
      </div>

      {/* Fees by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Fees by Plan</CardTitle>
          <CardDescription>
            Platform fee breakdown by subscription tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Fee %</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Fees Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.byPlan.map((plan) => (
                <TableRow key={plan.planName}>
                  <TableCell className="font-medium">{plan.planName}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{plan.averageFeePercent}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {plan.transactions}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(plan.feesCollected)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fees by Company */}
      <Card>
        <CardHeader>
          <CardTitle>Fees by Company</CardTitle>
          <CardDescription>
            Top companies using the fallback gateway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Fee %</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Fees Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.byCompany.slice(0, 10).map((company) => (
                <TableRow key={company.companyId}>
                  <TableCell className="font-medium">
                    {company.companyName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.planName}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{company.feePercent}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {company.transactions}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(company.feesCollected)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest orders with platform fees</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Order Amount</TableHead>
                <TableHead className="text-right">Platform Fee</TableHead>
                <TableHead className="text-right">Fee %</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.companyName}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(transaction.feeAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.feePercent}%
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
