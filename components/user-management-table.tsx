"use client";

import { Users, Loader2, ShieldAlert, RefreshCcw, Trash2 } from "lucide-react";
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
import { Prisma } from "@prisma/client";

type User = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    role: true;
    isActive: true;
    plan: true;
    image: true;
    emailVerified: true;
    createdAt: true;
    lastLoginAt: true;
    trialEndsAt: true;
    ownedCompanies: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

interface UserManagementTableProps {
  currentUserRole?: string;
}

export function UserManagementTable({
  currentUserRole,
}: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set());

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

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${
          userName || "this user"
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingUsers((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      const data = await response.json();

      // Remove user from local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

      toast.success(data.message || "User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    } finally {
      setDeletingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const canDeleteUser = (user: User): boolean => {
    // Only SUPER_ADMIN can delete users
    if (currentUserRole !== "SUPER_ADMIN") return false;

    // Can only delete ERP_CUSTOMER role with ERP_CUSTOMER or GUEST plan
    return (
      user.role === "ERP_CUSTOMER" &&
      (user.plan === "ERP_CUSTOMER" || user.plan === "GUEST")
    );
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
          <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200" />
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
        <div className="bg-emerald-50 border border-blue-200 dark:border-emerald-200 p-4 rounded-md mb-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-emerald-700 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-emerald-700 dark:text-blue-100 space-y-1">
              <p className="font-medium dark:text-black">
                Account Disable Feature
              </p>
              <p className="dark:text-purple-500">
                Disabled accounts cannot log in or access any system features.
                Use this to temporarily suspend user access without deleting
                their data.
              </p>
              <p className="text-sm text-purple-700 dark:text-emerald-600 mt-2">
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
                  Actions
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
                          <div className="text-sm dark:text-gray-200">
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
                              className="dark:text-gray-200"
                            >
                              {company.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm dark:text-gray-200">
                          No companies
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm dark:text-gray-200">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-4 text-sm dark:text-gray-200">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-2">
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
                        {canDeleteUser(user) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={deletingUsers.has(user.id)}
                            title="Delete user account"
                          >
                            {deletingUsers.has(user.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
          <div className="text-center py-12 dark:text-gray-200">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
