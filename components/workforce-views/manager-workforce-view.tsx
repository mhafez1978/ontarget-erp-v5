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
  Loader2,
  Search,
  Pencil,
  UserPlus,
  Grid3x3,
  List,
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
import { toast } from "sonner";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";

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
  };
  role: string;
  jobTitle?: string | null;
  employmentType: string;
  status: string;
  hireDate: string;
  isFeatured?: boolean;
  bio?: string | null;
  displayOrder?: number;
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
  MANAGER: "Manager",
  SALES_REP: "Sales Rep",
  CUSTOMER_SERVICE: "Customer Service",
  FIELD_TECH: "Field Tech",
  BACK_OFFICE: "Back Office",
  STAFF: "Staff",
};

const ROLE_COLORS = {
  MANAGER: "bg-blue-500",
  SALES_REP: "bg-green-500",
  CUSTOMER_SERVICE: "bg-orange-500",
  FIELD_TECH: "bg-yellow-500",
  BACK_OFFICE: "bg-gray-500",
  STAFF: "bg-cyan-500",
};

export function ManagerWorkforceView() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [companyName, setCompanyName] = useState<string>("");
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

  // Sheet states
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [editProfileImagePreview, setEditProfileImagePreview] =
    useState<string>("");

  // Initial form data for new staff member
  const initialFormData = {
    name: "",
    email: "",
    password: "",
    role: "STAFF" as
      | "SALES_REP"
      | "CUSTOMER_SERVICE"
      | "FIELD_TECH"
      | "BACK_OFFICE"
      | "STAFF",
    jobTitle: "SALES_REP" as string,
    employmentType: "FULL_TIME" as string,
    isFeatured: false,
    bio: "",
    displayOrder: 0,
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
    role: "STAFF" as
      | "SALES_REP"
      | "CUSTOMER_SERVICE"
      | "FIELD_TECH"
      | "BACK_OFFICE"
      | "STAFF",
    jobTitle: "SALES_REP" as string,
    employmentType: "FULL_TIME" as string,
    status: "ACTIVE" as string,
    isFeatured: false,
    bio: "",
    displayOrder: 0,
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

  // Fetch staff from manager's company
  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workforce/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");

      const data = await response.json();
      setStaff(data.staff || []);
      setCompanyName(data.companyName || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load staff members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setEditFormData({
      name: member.user.name || "",
      email: member.user.email || "",
      role: member.role as
        | "SALES_REP"
        | "CUSTOMER_SERVICE"
        | "FIELD_TECH"
        | "BACK_OFFICE"
        | "STAFF",
      jobTitle: member.jobTitle || "SALES_REP",
      employmentType: member.employmentType,
      status: member.status,
      isFeatured: member.isFeatured || false,
      bio: member.bio || "",
      displayOrder: member.displayOrder || 0,
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
    setEditProfileImagePreview(member.user.image || "");
    setIsEditStaffOpen(true);
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

  // Filter staff based on search and filters
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
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
            Manage staff members {companyName && `for ${companyName}`}
          </p>
        </div>
        <Button onClick={() => setIsAddStaffOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

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
                  <SelectItem value="SALES_REP">Sales Rep</SelectItem>
                  <SelectItem value="CUSTOMER_SERVICE">
                    Customer Service
                  </SelectItem>
                  <SelectItem value="FIELD_TECH">Field Tech</SelectItem>
                  <SelectItem value="BACK_OFFICE">Back Office</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
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

      {/* Staff Display */}
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
                        <div className="flex items-center gap-3">
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
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {member.user.name || "No name"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {member.user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]
                          } text-white`}
                        >
                          {ROLE_LABELS[
                            member.role as keyof typeof ROLE_LABELS
                          ] || member.role}
                        </Badge>
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
              Add a new staff member to your team
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSaving(true);

              try {
                // Upload profile image first if provided
                let uploadedImageUrl = "";
                if (profileImage) {
                  const imageFormData = new FormData();
                  imageFormData.append("image", profileImage);
                  imageFormData.append("userId", "temp");

                  const imageResponse = await fetch("/api/user/profile/image", {
                    method: "POST",
                    body: imageFormData,
                  });

                  if (!imageResponse.ok) {
                    throw new Error("Failed to upload profile image");
                  }

                  const imageData = await imageResponse.json();
                  uploadedImageUrl = imageData.imageUrl;
                }

                // Create staff member
                const response = await fetch("/api/workforce/staff", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    jobTitle: formData.jobTitle,
                    employmentType: formData.employmentType,
                    isFeatured: formData.isFeatured,
                    bio: formData.bio,
                    displayOrder: formData.displayOrder,
                    addressLine1: addressData.addressLine1,
                    addressLine2: addressData.addressLine2,
                    city: addressData.city,
                    state: addressData.state,
                    country: addressData.country,
                    countryCode: addressData.countryCode,
                    postalCode: addressData.postalCode,
                    image: uploadedImageUrl,
                  }),
                });

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || "Failed to add staff member");
                }

                const data = await response.json();

                // If we have an uploaded image and a user ID, update the user's image
                if (uploadedImageUrl && data.user?.id) {
                  await fetch("/api/user/profile/image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: data.user.id,
                      imageUrl: uploadedImageUrl,
                    }),
                  });
                }

                toast.success("Staff member added successfully");

                // Refresh staff list
                await fetchStaff();

                // Reset form
                setFormData(initialFormData);
                setAddressData(initialAddressData);
                setProfileImage(null);
                setProfileImagePreview("");
                setIsAddStaffOpen(false);
              } catch (error) {
                console.error("Error adding staff:", error);
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to add staff member"
                );
              } finally {
                setIsSaving(false);
              }
            }}
            className="space-y-6 mt-6"
          >
            {/* Profile Image */}
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
                    Maximum 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Personal Information</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
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
                  required
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
                  required
                />
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Employment Details</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(
                      value:
                        | "SALES_REP"
                        | "CUSTOMER_SERVICE"
                        | "FIELD_TECH"
                        | "BACK_OFFICE"
                        | "STAFF"
                    ) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALES_REP">Sales Rep</SelectItem>
                      <SelectItem value="CUSTOMER_SERVICE">
                        Customer Service
                      </SelectItem>
                      <SelectItem value="FIELD_TECH">Field Tech</SelectItem>
                      <SelectItem value="BACK_OFFICE">Back Office</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Sales Representative"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                  />
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
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACTOR_1099">1099</SelectItem>
                      <SelectItem value="SEASONAL">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Storefront Display */}
            <div className="space-y-4 border-2 border-purple-300 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-400">
                🌟 Storefront Display (Meet the Team)
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isFeatured" className="cursor-pointer">
                  Feature on Storefront (Meet the Team)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Public Bio (Optional)</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Brief bio to display on storefront..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first in the team section
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold">Address</h3>
              <AddressAutocomplete
                value={addressData}
                onChange={setAddressData}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData(initialFormData);
                  setAddressData(initialAddressData);
                  setProfileImage(null);
                  setProfileImagePreview("");
                  setIsAddStaffOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className={`flex-1 ${getPulsateClassName(isAddFormDirty)}`}
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
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Staff Member Sheet */}
      <Sheet open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Staff Member</SheetTitle>
            <SheetDescription>Update staff member information</SheetDescription>
          </SheetHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editingStaff) return;

              setIsSaving(true);

              try {
                // Upload new profile image if provided
                let uploadedImageUrl = editProfileImagePreview;
                if (editProfileImage) {
                  const imageFormData = new FormData();
                  imageFormData.append("image", editProfileImage);
                  imageFormData.append("userId", editingStaff.userId);

                  const imageResponse = await fetch("/api/user/profile/image", {
                    method: "POST",
                    body: imageFormData,
                  });

                  if (!imageResponse.ok) {
                    throw new Error("Failed to upload profile image");
                  }

                  const imageData = await imageResponse.json();
                  uploadedImageUrl = imageData.imageUrl;
                }

                // Update staff member
                const response = await fetch(
                  `/api/workforce/staff/${editingStaff.id}`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: editFormData.name,
                      email: editFormData.email,
                      role: editFormData.role,
                      jobTitle: editFormData.jobTitle,
                      employmentType: editFormData.employmentType,
                      status: editFormData.status,
                      isFeatured: editFormData.isFeatured,
                      bio: editFormData.bio,
                      displayOrder: editFormData.displayOrder,
                      addressLine1: editAddressData.addressLine1,
                      addressLine2: editAddressData.addressLine2,
                      city: editAddressData.city,
                      state: editAddressData.state,
                      country: editAddressData.country,
                      countryCode: editAddressData.countryCode,
                      postalCode: editAddressData.postalCode,
                      image: uploadedImageUrl,
                    }),
                  }
                );

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(
                    data.error || "Failed to update staff member"
                  );
                }

                toast.success("Staff member updated successfully");

                // Refresh staff list
                await fetchStaff();

                // Reset form
                setEditFormData(initialEditFormData);
                setEditAddressData(initialEditAddressData);
                setEditProfileImage(null);
                setEditProfileImagePreview("");
                setEditingStaff(null);
                setIsEditStaffOpen(false);
              } catch (error) {
                console.error("Error updating staff:", error);
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to update staff member"
                );
              } finally {
                setIsSaving(false);
              }
            }}
            className="space-y-6 mt-6"
          >
            {/* Profile Image */}
            <div className="space-y-2">
              <Label htmlFor="editProfileImage">Profile Image</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={editProfileImagePreview || undefined}
                    alt="Preview"
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
                    Maximum 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Personal Information</h3>

              <div className="space-y-2">
                <Label htmlFor="editName">Full Name *</Label>
                <Input
                  id="editName"
                  placeholder="John Doe"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">Email Address *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Employment Details</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editRole">Role *</Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(
                      value:
                        | "SALES_REP"
                        | "CUSTOMER_SERVICE"
                        | "FIELD_TECH"
                        | "BACK_OFFICE"
                        | "STAFF"
                    ) => setEditFormData({ ...editFormData, role: value })}
                  >
                    <SelectTrigger id="editRole">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALES_REP">Sales Rep</SelectItem>
                      <SelectItem value="CUSTOMER_SERVICE">
                        Customer Service
                      </SelectItem>
                      <SelectItem value="FIELD_TECH">Field Tech</SelectItem>
                      <SelectItem value="BACK_OFFICE">Back Office</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editJobTitle">Job Title</Label>
                  <Input
                    id="editJobTitle"
                    placeholder="e.g., Sales Representative"
                    value={editFormData.jobTitle}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        jobTitle: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEmploymentType">Employment Type *</Label>
                  <Select
                    value={editFormData.employmentType}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        employmentType: value,
                      })
                    }
                  >
                    <SelectTrigger id="editEmploymentType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACTOR_1099">1099</SelectItem>
                      <SelectItem value="SEASONAL">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editStatus">Status *</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, status: value })
                  }
                >
                  <SelectTrigger id="editStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Storefront Display */}
            <div className="space-y-4 border-2 border-purple-300 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-400">
                🌟 Storefront Display (Meet the Team)
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsFeatured"
                  checked={editFormData.isFeatured}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      isFeatured: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="editIsFeatured" className="cursor-pointer">
                  Feature on Storefront (Meet the Team)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editBio">Public Bio (Optional)</Label>
                <textarea
                  id="editBio"
                  value={editFormData.bio}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, bio: e.target.value })
                  }
                  placeholder="Brief bio to display on storefront..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDisplayOrder">Display Order</Label>
                <Input
                  id="editDisplayOrder"
                  type="number"
                  value={editFormData.displayOrder}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first in the team section
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold">Address</h3>
              <AddressAutocomplete
                value={editAddressData}
                onChange={setEditAddressData}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditFormData(initialEditFormData);
                  setEditAddressData(initialEditAddressData);
                  setEditProfileImage(null);
                  setEditProfileImagePreview("");
                  setEditingStaff(null);
                  setIsEditStaffOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className={`flex-1 ${getPulsateClassName(isEditFormDirty)}`}
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
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
