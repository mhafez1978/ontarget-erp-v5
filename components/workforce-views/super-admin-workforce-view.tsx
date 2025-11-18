"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Users,
  Loader2,
  Search,
  Pencil,
  UserPlus,
  Grid3x3,
  List,
  Send,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";

interface Company {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  userId: string;
  companyId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
    canSetupPersonalEmail?: boolean;
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

const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACTOR_1099: "1099",
  SEASONAL: "Seasonal",
};

const STATUS_COLORS = {
  ACTIVE: "bg-green-500",
  ON_LEAVE: "bg-yellow-500",
  TERMINATED: "bg-red-500",
  SUSPENDED: "bg-gray-500",
};

const ROLE_LABELS = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  CONTRACTOR: "Contractor",
};

const ROLE_COLORS = {
  ADMIN: "bg-purple-500",
  MANAGER: "bg-blue-500",
  STAFF: "bg-green-500",
  CONTRACTOR: "bg-orange-500",
};

export function SuperAdminWorkforceView() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [employmentTypeFilter, setEmploymentTypeFilter] =
    useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isResending, setIsResending] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Sheet states
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [editProfileImagePreview, setEditProfileImagePreview] =
    useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

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
    canSetupPersonalEmail: false,
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
  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setEditFormData({
      name: member.user.name || "",
      email: member.user.email || "",
      role: member.role as "ADMIN" | "MANAGER" | "STAFF" | "CONTRACTOR",
      jobTitle: member.jobTitle || "SALES_REP",
      employmentType: member.employmentType,
      status: member.status,
      canSetupPersonalEmail: member.user.canSetupPersonalEmail || false,
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

  const handleResendWelcomeEmail = async (
    staffId: string,
    staffName: string
  ) => {
    const performResend = async () => {
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

    toast.warning(`Resend welcome email to ${staffName}?`, {
      description: "This will generate a new password.",
      action: {
        label: "Send",
        onClick: performResend,
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    const performDelete = async () => {
      setIsDeleting(staffId);
      try {
        const response = await fetch(`/api/workforce/staff/${staffId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Staff member deleted successfully!");
          // Refresh the staff list
          fetchStaff();
        } else {
          toast.error(data.error || "Failed to delete staff member");
        }
      } catch (error) {
        console.error("Error deleting staff member:", error);
        toast.error("Failed to delete staff member");
      } finally {
        setIsDeleting(null);
      }
    };

    toast.warning(`Delete ${staffName}?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: performDelete,
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  // Fetch owned companies for super admin
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies/my-owned");
        const data = await response.json();

        if (response.ok) {
          setCompanies(data.companies || []);
          if (data.companies && data.companies.length > 0) {
            setSelectedCompanyId(data.companies[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch staff function
  const fetchStaff = async () => {
    if (!selectedCompanyId) {
      console.log("[fetchStaff] No selectedCompanyId, skipping fetch");
      return;
    }

    console.log("[fetchStaff] Fetching staff for company:", selectedCompanyId);
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/workforce/staff?companyId=${selectedCompanyId}`
      );
      const data = await response.json();

      console.log("[fetchStaff] Response:", data);

      if (response.ok) {
        setStaff(data.staff || []);
        console.log("[fetchStaff] Staff count:", data.staff?.length || 0);
      } else {
        setError(data.error || "Failed to fetch staff");
        console.error("[fetchStaff] Error:", data.error);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to fetch staff");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch staff when company changes
  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  // Filter staff
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      !searchTerm ||
      member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    const matchesEmploymentType =
      employmentTypeFilter === "ALL" ||
      member.employmentType === employmentTypeFilter;
    const matchesStatus =
      statusFilter === "ALL" || member.status === statusFilter;

    return (
      matchesSearch && matchesRole && matchesEmploymentType && matchesStatus
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workforce Management
          </h1>
          <p className="text-muted-foreground">
            Manage staff across your companies
          </p>
        </div>
        <Button onClick={() => setIsAddStaffOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger>
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

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={employmentTypeFilter}
                onValueChange={setEmploymentTypeFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Employment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACTOR_1099">1099</SelectItem>
                  <SelectItem value="SEASONAL">Seasonal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Staff Members ({filteredStaff.length})</span>
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
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff members found
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((member) => (
                <Card
                  key={member.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between space-x-4">
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
                                ROLE_COLORS[
                                  member.role as keyof typeof ROLE_COLORS
                                ]
                              } text-white`}
                            >
                              {ROLE_LABELS[
                                member.role as keyof typeof ROLE_LABELS
                              ] || member.role}
                            </Badge>
                            <Badge variant="outline">
                              {
                                EMPLOYMENT_TYPE_LABELS[
                                  member.employmentType as keyof typeof EMPLOYMENT_TYPE_LABELS
                                ]
                              }
                            </Badge>
                            <Badge
                              className={`${
                                STATUS_COLORS[
                                  member.status as keyof typeof STATUS_COLORS
                                ]
                              } text-white`}
                            >
                              {member.status}
                            </Badge>
                          </div>
                          {(member.city || member.state || member.country) && (
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
                          onClick={() => handleEditStaff(member)}
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
                            handleDeleteStaff(
                              member.id,
                              member.user.name ||
                                member.user.email ||
                                "staff member"
                            )
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {member.user.name || "No name"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {member.user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {
                          EMPLOYMENT_TYPE_LABELS[
                            member.employmentType as keyof typeof EMPLOYMENT_TYPE_LABELS
                          ]
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              STATUS_COLORS[
                                member.status as keyof typeof STATUS_COLORS
                              ]
                            }`}
                          />
                          {member.status}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(member.hireDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {member.countryFlag && (
                            <span className="text-lg">
                              {member.countryFlag}
                            </span>
                          )}
                          <div className="flex flex-col text-sm">
                            {member.city && <span>{member.city}</span>}
                            {member.state && member.country && (
                              <span className="text-muted-foreground">
                                {member.state}, {member.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditStaff(member)}
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
                              handleDeleteStaff(
                                member.id,
                                member.user.name ||
                                  member.user.email ||
                                  "staff member"
                              )
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Member Sheet */}
      <Sheet open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Staff Member</SheetTitle>
            <SheetDescription>
              Add a new staff member to{" "}
              {companies.find((c) => c.id === selectedCompanyId)?.name}
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
                  setFormData(initialFormData);
                  setAddressData(initialAddressData);
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

                      // Show success message
                      toast.success("Staff member added successfully!");

                      // Show email status
                      if (data.emailSent) {
                        toast.success("Welcome email sent successfully!");
                      } else if (data.emailError) {
                        toast.error(
                          `Failed to send welcome email: ${data.emailError}`
                        );
                      }

                      setIsAddStaffOpen(false);

                      setFormData(initialFormData);
                      setAddressData(initialAddressData);
                      setProfileImage(null);
                      setProfileImagePreview("");

                      // Refresh staff list
                      fetchStaff();
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

              {/* Personal Email Provider Permission */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-canSetupPersonalEmail">
                      Allow Personal Email Setup
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable this staff member to connect their Office365 or
                      Gmail account for sending emails
                    </p>
                  </div>
                  <Switch
                    id="edit-canSetupPersonalEmail"
                    checked={editFormData.canSetupPersonalEmail}
                    onCheckedChange={(checked) =>
                      setEditFormData({
                        ...editFormData,
                        canSetupPersonalEmail: checked,
                      })
                    }
                  />
                </div>
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
                      fetchStaff();
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
