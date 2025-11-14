"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Users, Loader2, Search, Grid3x3, List, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  role: string;
  employmentType: string;
  status: string;
  hireDate: string;
  city: string | null;
  state: string | null;
  country: string | null;
  countryFlag: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES_REP: "Sales Rep",
  CUSTOMER_SERVICE: "Customer Service",
  FIELD_TECH: "Field Tech",
  BACK_OFFICE: "Back Office",
  GUEST: "Guest",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACTOR_1099: "1099 Contractor",
  SEASONAL: "Seasonal",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500",
  ON_LEAVE: "bg-yellow-500",
  TERMINATED: "bg-red-500",
  SUSPENDED: "bg-gray-500",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-500",
  ADMIN: "bg-blue-500",
  MANAGER: "bg-cyan-500",
  SALES_REP: "bg-green-500",
  CUSTOMER_SERVICE: "bg-orange-500",
  FIELD_TECH: "bg-yellow-500",
  BACK_OFFICE: "bg-gray-500",
  GUEST: "bg-slate-500",
};

export function AdminWorkforceView() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [staffByCompany, setStaffByCompany] = useState<
    Record<string, StaffMember[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields for new staff member
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as "ADMIN" | "MANAGER" | "STAFF" | "CONTRACTOR",
    jobTitle: "SALES_REP" as string,
    employmentType: "FULL_TIME" as string,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  // Fetch owned companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies/my-owned");
        const data = await response.json();

        if (response.ok && data.companies) {
          setCompanies(data.companies);
          if (data.companies.length > 0) {
            setActiveTab(data.companies[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch staff for active company
  useEffect(() => {
    if (!activeTab) return;

    const fetchStaff = async () => {
      // Skip if already loaded
      if (staffByCompany[activeTab]) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/workforce/staff?companyId=${activeTab}`
        );
        const data = await response.json();

        if (response.ok) {
          setStaffByCompany((prev) => ({
            ...prev,
            [activeTab]: data.staff || [],
          }));
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [activeTab, staffByCompany]);

  // Get filtered staff for current company
  const getFilteredStaff = () => {
    const currentStaff = staffByCompany[activeTab] || [];

    return currentStaff.filter((member) => {
      const matchesSearch =
        !searchTerm ||
        member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "ALL" || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  };

  const filteredStaff = getFilteredStaff();

  // Get role counts for current company
  const getRoleCounts = () => {
    const currentStaff = staffByCompany[activeTab] || [];
    const counts: Record<string, number> = { ALL: currentStaff.length };

    currentStaff.forEach((member) => {
      counts[member.role] = (counts[member.role] || 0) + 1;
    });

    return counts;
  };

  const roleCounts = getRoleCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workforce Management
          </h1>
          <p className="text-muted-foreground">
            Manage staff across all your companies
          </p>
        </div>
        <Button onClick={() => setIsAddStaffOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>{" "}
      {/* Company Tabs */}
      {companies.length > 0 ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {companies.map((company) => {
              const count = staffByCompany[company.id]?.length || 0;
              return (
                <TabsTrigger
                  key={company.id}
                  value={company.id}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  {company.name}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {companies.map((company) => (
            <TabsContent
              key={company.id}
              value={company.id}
              className="space-y-6"
            >
              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{company.name} Workforce</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          All Roles ({roleCounts.ALL || 0})
                        </SelectItem>
                        {Object.entries(ROLE_LABELS).map(([role, label]) => {
                          const count = roleCounts[role] || 0;
                          if (count === 0) return null;
                          return (
                            <SelectItem key={role} value={role}>
                              {label} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Display */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStaff.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      No staff members found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || roleFilter !== "ALL"
                        ? "Try adjusting your filters"
                        : "Add your first staff member to get started"}
                    </p>
                  </CardContent>
                </Card>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStaff.map((member) => (
                    <Card
                      key={member.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback>
                              {member.user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {member.user.name || "Unnamed"}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.user.email}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge
                                className={`${
                                  ROLE_COLORS[member.role]
                                } text-white`}
                              >
                                {ROLE_LABELS[member.role] || member.role}
                              </Badge>
                              <Badge variant="outline">
                                {EMPLOYMENT_TYPE_LABELS[member.employmentType]}
                              </Badge>
                              <Badge
                                className={`${
                                  STATUS_COLORS[member.status]
                                } text-white`}
                              >
                                {member.status}
                              </Badge>
                            </div>
                            {(member.city ||
                              member.state ||
                              member.country) && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {[member.city, member.state, member.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Employment Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Hire Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={member.user.image || undefined}
                                  />
                                  <AvatarFallback>
                                    {member.user.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {member.user.name || "Unnamed"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {member.user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${
                                  ROLE_COLORS[member.role]
                                } text-white`}
                              >
                                {ROLE_LABELS[member.role] || member.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {EMPLOYMENT_TYPE_LABELS[member.employmentType]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${
                                  STATUS_COLORS[member.status]
                                } text-white`}
                              >
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {[member.city, member.state, member.country]
                                  .filter(Boolean)
                                  .join(", ") || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {new Date(member.hireDate).toLocaleDateString()}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No companies found</p>
            <p className="text-sm text-muted-foreground">
              Create a company to start managing staff
            </p>
          </CardContent>
        </Card>
      )}
      {/* Add Staff Member Sheet */}
      <Sheet open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Staff Member</SheetTitle>
            <SheetDescription>
              Add a new staff member to{" "}
              {companies.find((c) => c.id === activeTab)?.name ||
                "your company"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6 px-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Personal Information</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Employment Details</h3>

              <div className="space-y-2">
                <Label htmlFor="role">Company Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as
                        | "ADMIN"
                        | "MANAGER"
                        | "STAFF"
                        | "CONTRACTOR",
                    })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Admin and Manager have elevated permissions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Select
                  value={formData.jobTitle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jobTitle: value })
                  }
                >
                  <SelectTrigger id="jobTitle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES_REP">
                      Sales Representative
                    </SelectItem>
                    <SelectItem value="CUSTOMER_SERVICE">
                      Customer Service
                    </SelectItem>
                    <SelectItem value="FIELD_TECH">Field Technician</SelectItem>
                    <SelectItem value="BACK_OFFICE">Back Office</SelectItem>
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    <SelectItem value="MANAGER_ROLE">Manager</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="COORDINATOR">Coordinator</SelectItem>
                    <SelectItem value="SPECIALIST">Specialist</SelectItem>
                    <SelectItem value="ANALYST">Analyst</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employmentType: value })
                  }
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACTOR_1099">
                      1099 Contractor
                    </SelectItem>
                    <SelectItem value="SEASONAL">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Address (Optional)</h3>

              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  placeholder="123 Main St"
                  value={formData.addressLine1}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine1: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Apt 4B"
                  value={formData.addressLine2}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine2: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="United States"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="10001"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddStaffOpen(false);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "STAFF",
                    jobTitle: "SALES_REP",
                    employmentType: "FULL_TIME",
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    country: "",
                    postalCode: "",
                  });
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (
                    !formData.name ||
                    !formData.email ||
                    !formData.password ||
                    !activeTab
                  ) {
                    toast.error("Please fill in all required fields");
                    return;
                  }

                  if (formData.password.length < 8) {
                    toast.error("Password must be at least 8 characters");
                    return;
                  }

                  setIsSaving(true);
                  try {
                    const response = await fetch("/api/workforce/staff", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        companyId: activeTab,
                        ...formData,
                      }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      toast.success("Staff member added successfully!");
                      setIsAddStaffOpen(false);
                      setFormData({
                        name: "",
                        email: "",
                        password: "",
                        role: "STAFF",
                        jobTitle: "SALES_REP",
                        employmentType: "FULL_TIME",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        country: "",
                        postalCode: "",
                      });

                      // Refresh staff list by removing from cache
                      const updatedStaff = { ...staffByCompany };
                      delete updatedStaff[activeTab];
                      setStaffByCompany(updatedStaff);
                    } else {
                      toast.error(data.error || "Failed to add staff member");
                    }
                  } catch (error) {
                    console.error("Error adding staff:", error);
                    toast.error("Failed to add staff member");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Staff Member"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
