"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Key, Shield, Clock, TrendingUp, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface AccountInfo {
  id: string;
  provider: string;
  isPrimary: boolean;
  isActive: boolean;
  lastUsedAt: Date | null;
  timesUsed: number;
  email?: string | null;
  displayName?: string | null;
  linkedAt: Date;
}

interface LoginStats {
  totalLogins: number;
  activeProviders: number;
  totalProviders: number;
  mostUsedProvider?: string;
}

export function LoginMethodsCard() {
  const [loading, setLoading] = useState(true);
  const [loginMethods, setLoginMethods] = useState<AccountInfo[]>([]);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchLoginMethods();
  }, []);

  const fetchLoginMethods = async () => {
    try {
      const response = await fetch("/api/account/login-methods");
      if (response.ok) {
        const data = await response.json();
        setLoginMethods(data.loginMethods);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch login methods:", error);
      toast.error("Failed to load login methods");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    setProcessing(accountId);
    try {
      const response = await fetch("/api/account/login-methods/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Primary login method updated");
        fetchLoginMethods();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update primary login method");
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleActive = async (
    accountId: string,
    currentlyActive: boolean
  ) => {
    setProcessing(accountId);
    try {
      const response = await fetch("/api/account/login-methods/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          action: currentlyActive ? "disable" : "enable",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchLoginMethods();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to toggle login method");
    } finally {
      setProcessing(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "credentials":
        return "🔐";
      case "google":
        return "🔵";
      case "github":
        return "⚫";
      case "azure":
        return "🔷";
      case "facebook":
        return "🔵";
      case "apple":
        return "🍎";
      default:
        return "🔗";
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "credentials":
        return "Email & Password";
      case "google":
        return "Google";
      case "github":
        return "GitHub";
      case "azure":
        return "Microsoft Azure";
      case "facebook":
        return "Facebook";
      case "apple":
        return "Apple";
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Login Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Login Statistics
            </CardTitle>
            <CardDescription>Your authentication activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">{stats.totalLogins}</p>
                <p className="text-xs text-muted-foreground">Total Logins</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeProviders}</p>
                <p className="text-xs text-muted-foreground">Active Methods</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProviders}</p>
                <p className="text-xs text-muted-foreground">Linked Accounts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {getProviderIcon(stats.mostUsedProvider || "")}
                </p>
                <p className="text-xs text-muted-foreground">Most Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Methods Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Login Methods
          </CardTitle>
          <CardDescription>
            Manage how you sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loginMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {getProviderIcon(method.provider)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {getProviderName(method.provider)}
                      </h4>
                      {method.isPrimary && (
                        <Badge variant="default" className="text-xs">
                          Primary
                        </Badge>
                      )}
                      {!method.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    {method.email && (
                      <p className="text-sm text-muted-foreground">
                        {method.email}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Used {method.timesUsed} times
                      </p>
                      {method.lastUsedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last:{" "}
                          {new Date(method.lastUsedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Active/Inactive Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`active-${method.id}`}
                      checked={method.isActive}
                      onCheckedChange={() =>
                        handleToggleActive(method.id, method.isActive)
                      }
                      disabled={
                        processing === method.id ||
                        loginMethods.filter((m) => m.isActive).length === 1
                      }
                    />
                    <Label
                      htmlFor={`active-${method.id}`}
                      className="text-xs cursor-pointer"
                    >
                      {method.isActive ? "Active" : "Disabled"}
                    </Label>
                  </div>

                  {/* Set as Primary Button */}
                  {!method.isPrimary && method.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPrimary(method.id)}
                      disabled={processing === method.id}
                    >
                      Set as Primary
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {loginMethods.length === 0 && (
              <div className="text-center py-8">
                <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No login methods found. This should not happen.
                </p>
              </div>
            )}
          </div>

          {/* Add New Method Button */}
          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" className="w-full">
              <LinkIcon className="h-4 w-4 mr-2" />
              Link Another Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
