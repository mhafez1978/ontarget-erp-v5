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
import {
  Users,
  Loader2,
  Search,
  Grid3x3,
  List,
  UserPlus,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import { PendingDocumentsReview } from "@/components/pending-documents-review";

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
    addressLine1?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
  };
  role: string;
  jobTitle?: string | null;
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [editProfileImagePreview, setEditProfileImagePreview] =
    useState<string>("");

  // Employee selection state
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set()
  );

  // Initial form data for new staff member
  const initialFormData = {
    name: "",
    email: "",
    password: "",
    role: "STAFF" as "ADMIN" | "MANAGER" | "STAFF" | "CONTRACTOR",
    jobTitle: "SALES_REP" as string,
    employmentType: "FULL_TIME" as string,
  };

  const initialAddressData: AddressData = {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
  };

  // Form fields for new staff member
  const [formData, setFormData] = useState(initialFormData);

  const [addressData, setAddressData] =
    useState<AddressData>(initialAddressData);

  // Initial form data for editing staff member
  const initialEditFormData = {
    name: "",
    email: "",
    role: "STAFF" as "ADMIN" | "MANAGER" | "STAFF" | "CONTRACTOR",
    jobTitle: "SALES_REP" as string,
    employmentType: "FULL_TIME" as string,
    status: "ACTIVE" as string,
  };

  const initialEditAddressData: AddressData = {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
  };

  // Form fields for editing staff member
  const [editFormData, setEditFormData] = useState(initialEditFormData);

  const [editAddressData, setEditAddressData] = useState<AddressData>(
    initialEditAddressData
  );

  // Track if forms are dirty
  const isAddFormDirty = useFormDirty(initialFormData, formData);
  const isEditFormDirty = useFormDirty(initialEditFormData, editFormData);

  // Handle edit staff button click
  const handleEditStaff = (member: StaffMember, companyId: string) => {
    setEditingStaff(member);
    setSelectedCompanyId(companyId);
    setEditFormData({
      name: member.user.name || "",
      email: member.user.email || "",
      role: member.role as "ADMIN" | "MANAGER" | "STAFF" | "CONTRACTOR",
      jobTitle: member.jobTitle || "SALES_REP",
      employmentType: member.employmentType,
      status: member.status,
    });
    setEditAddressData({
      addressLine1: member.user.addressLine1 || "",
      addressLine2: member.user.addressLine2 || "",
      city: member.city || "",
      state: member.state || "",
      country: member.country || "",
      countryCode: "",
      postalCode: member.user.postalCode || "",
    });
    setIsEditStaffOpen(true);
  };

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

  // Handle delete staff member
  const handleDeleteStaff = async (staffId: string, companyId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    setIsDeleting(staffId);
    try {
      const response = await fetch(`/api/workforce/staff/${staffId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Staff member deleted successfully!");

        // Remove from local state
        setStaffByCompany((prev) => ({
          ...prev,
          [companyId]: prev[companyId].filter((s) => s.id !== staffId),
        }));
      } else {
        toast.error(data.error || "Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff member");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleResendWelcomeEmail = async (
    staffId: string,
    staffName: string
  ) => {
    if (
      !confirm(
        `Resend welcome email to ${staffName}? This will generate a new password.`
      )
    ) {
      return;
    }

    setIsResending(staffId);
    try {
      const response = await fetch(
        `/api/workforce/staff/${staffId}/resend-welcome`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Welcome email sent successfully!");
      } else {
        toast.error(data.error || "Failed to send welcome email");
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      toast.error("Failed to send welcome email");
    } finally {
      setIsResending(null);
    }
  };

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
              {/* Pending Documents Review */}
              <PendingDocumentsReview companyId={company.id} />

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

              {/* Selection Info Bar */}
              {selectedEmployees.size > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {selectedEmployees.size} employee
                          {selectedEmployees.size > 1 ? "s" : ""} selected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEmployees(new Set())}
                        >
                          Clear selection
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            toast.info(
                              "Send promotional email feature coming soon!"
                            );
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Promotional Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                        <div className="flex items-start justify-between space-x-4">
                          <Checkbox
                            checked={selectedEmployees.has(member.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedEmployees);
                              if (checked) {
                                newSelected.add(member.id);
                              } else {
                                newSelected.delete(member.id);
                              }
                              setSelectedEmployees(newSelected);
                            }}
                            className="mt-1"
                          />
                          <div className="flex items-start space-x-4 flex-1 min-w-0">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={member.user.image || undefined}
                                alt={member.user.name || "User"}
                              />
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
                                  {
                                    EMPLOYMENT_TYPE_LABELS[
                                      member.employmentType
                                    ]
                                  }
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

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleEditStaff(member, company.id)
                              }
                              title="Edit Staff Member"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleResendWelcomeEmail(
                                  member.id,
                                  member.user.name ||
                                    member.user.email ||
                                    "staff member"
                                )
                              }
                              disabled={isResending === member.id}
                              title="Resend Welcome Email"
                            >
                              {isResending === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                handleDeleteStaff(member.id, company.id)
                              }
                              disabled={isDeleting === member.id}
                              title="Delete Staff Member"
                            >
                              {isDeleting === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
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
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                filteredStaff.length > 0 &&
                                filteredStaff.every((member) =>
                                  selectedEmployees.has(member.id)
                                )
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEmployees(
                                    new Set(filteredStaff.map((m) => m.id))
                                  );
                                } else {
                                  setSelectedEmployees(new Set());
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Staff Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Employment Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Hire Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedEmployees.has(member.id)}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(
                                    selectedEmployees
                                  );
                                  if (checked) {
                                    newSelected.add(member.id);
                                  } else {
                                    newSelected.delete(member.id);
                                  }
                                  setSelectedEmployees(newSelected);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={member.user.image || undefined}
                                    alt={member.user.name || "User"}
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
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleEditStaff(member, company.id)
                                  }
                                  title="Edit Staff Member"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleResendWelcomeEmail(
                                      member.id,
                                      member.user.name ||
                                        member.user.email ||
                                        "staff member"
                                    )
                                  }
                                  disabled={isResending === member.id}
                                  title="Resend Welcome Email"
                                >
                                  {isResending === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    handleDeleteStaff(member.id, company.id)
                                  }
                                  disabled={isDeleting === member.id}
                                  title="Delete Staff Member"
                                >
                                  {isDeleting === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
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
              Add a new staff member to your company
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6 px-6">
            {/* Company Selection */}
            <div className="space-y-2">
              <Label htmlFor="company">Select Company *</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                required
              >
                <SelectTrigger id="company">
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                <Label htmlFor="profileImage">Profile Image</Label>
                <div className="flex items-center gap-4">
                  {profileImagePreview && (
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileImagePreview} alt="Preview" />
                      <AvatarFallback>
                        {formData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.startsWith("image/")) {
                            toast.error("Please select an image file");
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Image must be less than 5MB");
                            return;
                          }
                          setProfileImage(file);
                          setProfileImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum 5MB. JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                      <SelectItem value="FIELD_TECH">
                        Field Technician
                      </SelectItem>
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

              <p className="text-sm text-muted-foreground">
                Admin and Manager have elevated permissions
              </p>
            </div>

            {/* Address Information */}
            <div className="space-y-2">
              <AddressAutocomplete
                label="Address (Optional)"
                value={addressData}
                onChange={setAddressData}
              />
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
                  });
                  setAddressData({
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    country: "",
                    countryCode: "",
                    postalCode: "",
                  });
                  setSelectedCompanyId("");
                  setProfileImage(null);
                  setProfileImagePreview("");
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${getPulsateClassName(isAddFormDirty)}`}
                onClick={async () => {
                  if (
                    !formData.name ||
                    !formData.email ||
                    !formData.password ||
                    !selectedCompanyId
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
                        companyId: selectedCompanyId,
                        ...formData,
                        ...addressData,
                      }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      // Save company ID before clearing form
                      const addedToCompanyId = selectedCompanyId;

                      // Upload profile image if one was selected (await completion)
                      if (profileImage && data.user?.id) {
                        const imageFormData = new FormData();
                        imageFormData.append("image", profileImage);
                        imageFormData.append("userId", data.user.id);

                        try {
                          const imageResponse = await fetch(
                            "/api/user/profile/image",
                            {
                              method: "POST",
                              body: imageFormData,
                            }
                          );

                          if (!imageResponse.ok) {
                            console.error("Failed to upload profile image");
                            toast.error(
                              "Staff created but profile image upload failed"
                            );
                          }
                        } catch (imageError) {
                          console.error(
                            "Error uploading profile image:",
                            imageError
                          );
                          toast.error(
                            "Staff created but profile image upload failed"
                          );
                        }
                      }

                      toast.success("Staff member added successfully!");
                      setIsAddStaffOpen(false);

                      setFormData({
                        name: "",
                        email: "",
                        password: "",
                        role: "STAFF",
                        jobTitle: "SALES_REP",
                        employmentType: "FULL_TIME",
                      });
                      setAddressData({
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        country: "",
                        countryCode: "",
                        postalCode: "",
                      });
                      setSelectedCompanyId("");
                      setProfileImage(null);
                      setProfileImagePreview("");

                      // Force refresh staff list by clearing cache and refetching
                      setStaffByCompany((prev) => {
                        const updated = { ...prev };
                        delete updated[addedToCompanyId];
                        return updated;
                      });

                      // Switch to the company tab where staff was added
                      setActiveTab(addedToCompanyId);
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
      {/* Edit Staff Member Sheet */}
      <Sheet open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Staff Member</SheetTitle>
            <SheetDescription>
              Update staff member information for{" "}
              {companies.find((c) => c.id === selectedCompanyId)?.name}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6 px-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Personal Information</h3>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editProfileImage">Profile Image</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={
                        editProfileImagePreview ||
                        editingStaff?.user.image ||
                        undefined
                      }
                      alt="Profile"
                    />
                    <AvatarFallback>
                      {editFormData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      id="editProfileImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.startsWith("image/")) {
                            toast.error("Please select an image file");
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Image must be less than 5MB");
                            return;
                          }
                          setEditProfileImage(file);
                          setEditProfileImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum 5MB. JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Employment Details</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Company Role *</Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        role: value as
                          | "ADMIN"
                          | "MANAGER"
                          | "STAFF"
                          | "CONTRACTOR",
                      })
                    }
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-jobTitle">Job Title *</Label>
                  <Select
                    value={editFormData.jobTitle}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, jobTitle: value })
                    }
                  >
                    <SelectTrigger id="edit-jobTitle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALES_REP">
                        Sales Representative
                      </SelectItem>
                      <SelectItem value="CUSTOMER_SERVICE">
                        Customer Service
                      </SelectItem>
                      <SelectItem value="FIELD_TECH">
                        Field Technician
                      </SelectItem>
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
                  <Label htmlFor="edit-employmentType">Employment Type *</Label>
                  <Select
                    value={editFormData.employmentType}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        employmentType: value,
                      })
                    }
                  >
                    <SelectTrigger id="edit-employmentType">
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

              <div className="space-y-2">
                <Label htmlFor="edit-status">Employment Status *</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, status: value })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-2">
              <AddressAutocomplete
                label="Address (Optional)"
                value={editAddressData}
                onChange={setEditAddressData}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditStaffOpen(false);
                  setEditingStaff(null);
                  setEditProfileImage(null);
                  setEditProfileImagePreview("");
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${getPulsateClassName(isEditFormDirty)}`}
                onClick={async () => {
                  if (!editFormData.name || !editFormData.email) {
                    toast.error("Please fill in all required fields");
                    return;
                  }

                  if (!editingStaff) return;

                  setIsSaving(true);
                  try {
                    const response = await fetch(
                      `/api/workforce/staff/${editingStaff.id}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...editFormData,
                          ...editAddressData,
                        }),
                      }
                    );

                    const data = await response.json();

                    if (response.ok) {
                      // Upload profile image if one was selected (await completion)
                      if (editProfileImage && editingStaff.user?.id) {
                        const imageFormData = new FormData();
                        imageFormData.append("image", editProfileImage);
                        imageFormData.append("userId", editingStaff.user.id);

                        try {
                          const imageResponse = await fetch(
                            "/api/user/profile/image",
                            {
                              method: "POST",
                              body: imageFormData,
                            }
                          );

                          if (!imageResponse.ok) {
                            console.error("Failed to upload profile image");
                            toast.error(
                              "Staff updated but profile image upload failed"
                            );
                          }
                        } catch (imageError) {
                          console.error(
                            "Error uploading profile image:",
                            imageError
                          );
                          toast.error(
                            "Staff updated but profile image upload failed"
                          );
                        }
                      }

                      toast.success("Staff member updated successfully!");
                      setIsEditStaffOpen(false);
                      setEditingStaff(null);
                      setEditProfileImage(null);
                      setEditProfileImagePreview("");

                      // Refresh staff list
                      setStaffByCompany((prev) => {
                        const updated = { ...prev };
                        delete updated[selectedCompanyId];
                        return updated;
                      });
                    } else {
                      toast.error(
                        data.error || "Failed to update staff member"
                      );
                    }
                  } catch (error) {
                    console.error("Error updating staff:", error);
                    toast.error("Failed to update staff member");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Staff Member"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
