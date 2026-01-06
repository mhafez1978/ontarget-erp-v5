"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface StripeConnectSettingsProps {
  companyId: string;
}

interface PlatformFeeInfo {
  hasConnectedAccount: boolean;
  accountStatus: string | null;
  willChargeFee: boolean;
  feePercent: number;
  planName: string;
}

export function StripeConnectSettings({
  companyId,
}: StripeConnectSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [feeInfo, setFeeInfo] = useState<PlatformFeeInfo | null>(null);

  useEffect(() => {
    fetchFeeInfo();
  }, [companyId]);

  const fetchFeeInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/platform-fees/info?companyId=${companyId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch platform fee info");
      }
      const data = await response.json();
      setFeeInfo(data);
    } catch (error) {
      console.error("Error fetching fee info:", error);
      toast.error("Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setConnecting(true);
      // Redirect to Stripe Connect OAuth
      window.location.href = "/api/stripe/connect/authorize";
    } catch (error) {
      console.error("Error initiating Stripe Connect:", error);
      toast.error("Failed to connect Stripe");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect your Stripe account? Future storefront orders will use the global gateway with platform fees."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/stripe/connect/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      toast.success("Stripe account disconnected");
      fetchFeeInfo();
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect Stripe account");
    }
  };

  const openStripeDashboard = () => {
    window.open("https://dashboard.stripe.com", "_blank");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Connect your Stripe account for direct payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (!feeInfo?.hasConnectedAccount) {
      return <Badge variant="outline">Not Connected</Badge>;
    }

    switch (feeInfo.accountStatus) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case "restricted":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Restricted
          </Badge>
        );
      default:
        return <Badge variant="outline">{feeInfo.accountStatus}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Connect
            </CardTitle>
            <CardDescription>
              Get paid directly to your bank account
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!feeInfo?.hasConnectedAccount ? (
          <>
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Connect your Stripe account</strong> to receive payments
                directly to your bank account. Without connecting, payments go
                through our global gateway with a{" "}
                <strong>{feeInfo?.feePercent}% platform fee</strong> (based on
                your {feeInfo?.planName} plan).
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Direct Payments</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Money goes directly to your Stripe account
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Automatic Payouts</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Stripe deposits to your bank in 2-7 business days
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">No Platform Fees</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Save {feeInfo?.feePercent}% on every transaction
                </p>
              </div>
            </div>

            <Button
              onClick={handleConnectStripe}
              disabled={connecting}
              className="w-full"
              size="lg"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Connect with Stripe
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You'll be redirected to Stripe to create or link your account
            </p>
          </>
        ) : (
          <>
            {feeInfo.accountStatus === "active" ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Your Stripe account is connected and active. Storefront orders
                  are processed directly through your account with no platform
                  fees.
                </AlertDescription>
              </Alert>
            ) : feeInfo.accountStatus === "pending" ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your Stripe account setup is pending. Please complete
                  verification in your Stripe dashboard.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your Stripe account is restricted. Please resolve issues in
                  your Stripe dashboard.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={openStripeDashboard}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Stripe Dashboard
              </Button>
              <Button onClick={handleDisconnect} variant="outline">
                Disconnect
              </Button>
            </div>
          </>
        )}

        {feeInfo?.willChargeFee && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Platform Fee</span>
              <Badge variant="secondary">{feeInfo.feePercent}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied to storefront transactions when using global gateway (
              {feeInfo.planName} plan)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
