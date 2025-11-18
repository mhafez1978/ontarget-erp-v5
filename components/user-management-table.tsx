"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Loader2, ShieldAlert, RefreshCcw } from "lucide-react";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  isActive: boolean;
  plan: string;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  trialEndsAt: Date | null;
  ownedCompanies: {
    id: string;
    name: string;
  }[];
}

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/users");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load users"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setUpdatingUsers((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/settings/users/${userId}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user status");
      }

      const data = await response.json();

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isActive: data.user.isActive } : user
        )
      );

      toast.success(data.message);
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    } finally {
      setUpdatingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Badge variant="destructive">Super Admin</Badge>;
      case "ADMIN":
        return <Badge variant="default">Admin</Badge>;
      case "MANAGER":
        return <Badge variant="secondary">Manager</Badge>;
      case "STAFF":
        return <Badge variant="outline">Staff</Badge>;
      case "CONTRACTOR":
        return <Badge variant="outline">Contractor</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              User Directory
            </CardTitle>
            <CardDescription>
              Manage user account status across the entire platform (
              {users.length} total users)
            </CardDescription>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 rounded-md mb-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-medium">Account Disable Feature</p>
              <p>
                Disabled accounts cannot log in or access any system features.
                Use this to temporarily suspend user access without deleting
                their data.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                <strong>Note:</strong> You cannot disable your own account. Data
                retention policies still apply to disabled accounts.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Companies
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Last Login
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Created
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isUpdating = updatingUsers.has(user.id);
                return (
                  <tr
                    key={user.id}
                    className={`border-b ${
                      !user.isActive ? "opacity-60 bg-muted/30" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <div className="relative h-8 w-8 rounded-full overflow-hidden">
                            <Image
                              src={user.image}
                              alt={user.name || "User"}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {user.name?.charAt(0).toUpperCase() ||
                                user.email?.charAt(0).toUpperCase() ||
                                "?"}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.name || "Unnamed User"}
                            {!user.isActive && (
                              <ShieldAlert className="h-3 w-3 text-destructive" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-4 py-4">
                      <Badge variant="outline">{user.plan}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      {user.ownedCompanies.length > 0 ? (
                        <div className="text-sm">
                          {user.ownedCompanies.map((company) => (
                            <div
                              key={company.id}
                              className="text-muted-foreground"
                            >
                              {company.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No companies
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() =>
                            handleToggleActive(user.id, user.isActive)
                          }
                          disabled={isUpdating}
                        />
                        {isUpdating && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
