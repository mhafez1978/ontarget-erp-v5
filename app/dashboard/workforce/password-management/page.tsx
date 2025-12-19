"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, Shield, Search } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  plan: string;
  authMethod: string | null;
  hasPassword: boolean;
}

interface SelectedUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export default function PasswordManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await fetch("/api/user/profile");

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await userResponse.json();

        // Check if user is ADMIN or SUPER_ADMIN
        if (userData.role !== "ADMIN" && userData.role !== "SUPER_ADMIN") {
          toast.error("Unauthorized access");
          router.push("/dashboard");
          return;
        }

        setCurrentUser(userData);

        // Fetch users based on role
        let usersEndpoint = "/api/admin/users"; // Default for SUPER_ADMIN

        if (userData.role === "ADMIN") {
          // For ADMIN, fetch all users in their companies (owner + members + staff)
          usersEndpoint = "/api/admin/company-users";
        }

        const usersResponse = await fetch(usersEndpoint);

        if (!usersResponse.ok) {
          throw new Error("Failed to fetch users");
        }

        const usersData = await usersResponse.json();

        // Format users data - both endpoints now return { users: [...] }
        let usersList: UserProfile[] = usersData.users || [];

        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load password management page");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleOpenDialog = (user: UserProfile) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setNewPassword("");
    setConfirmPassword("");
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }

    setResetting(true);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success(
        `Password reset successfully for ${
          selectedUser.name || selectedUser.email
        }`
      );
      handleCloseDialog();
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password"
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <DashboardLayout user={undefined}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={{
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image,
        role: currentUser.role,
        plan: currentUser.plan,
      }}
    >
      <div className="p-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Password Management</h1>
          </div>
          <p className="text-muted-foreground">
            {currentUser.role === "SUPER_ADMIN"
              ? "Reset passwords for any user in the system"
              : "Reset passwords for members of your company"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Select a user to reset their password without requiring their
              current password
            </CardDescription>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery
                  ? "No users found matching your search"
                  : "No users available"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Auth Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || "—"}
                        </TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "SUPER_ADMIN"
                                ? "destructive"
                                : user.role === "ADMIN"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.authMethod === "oauth"
                              ? "OAuth"
                              : user.authMethod === "both"
                              ? "OAuth + Password"
                              : user.authMethod === "credentials"
                              ? "Password"
                              : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(user)}
                            disabled={
                              currentUser.role === "ADMIN" &&
                              user.role === "SUPER_ADMIN"
                            }
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Reset Password
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Reset Password
              </DialogTitle>
              <DialogDescription>
                Set a new password for{" "}
                <strong>{selectedUser?.name || selectedUser?.email}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="text-xs space-y-1">
                  <p
                    className={
                      newPassword.length >= 8
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    ✓ At least 8 characters
                  </p>
                  <p
                    className={
                      /[A-Z]/.test(newPassword)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    ✓ One uppercase letter
                  </p>
                  <p
                    className={
                      /[a-z]/.test(newPassword)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    ✓ One lowercase letter
                  </p>
                  <p
                    className={
                      /[0-9]/.test(newPassword)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    ✓ One number
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-600">Passwords match ✓</p>
                )}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> The user will be able to log in with
                  this new password immediately.
                  {selectedUser?.role !== "SUPER_ADMIN" &&
                    " They will not be notified of this change."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleResetPassword}
                disabled={
                  resetting ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
              >
                {resetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
