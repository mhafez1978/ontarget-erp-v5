"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Loader2, Search, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

export function SuperAdminWorkforceView() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [employmentTypeFilter, setEmploymentTypeFilter] =
    useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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

  // Fetch staff when company changes
  useEffect(() => {
    if (!selectedCompanyId) return;

    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/workforce/staff?companyId=${selectedCompanyId}`
        );
        const data = await response.json();

        if (response.ok) {
          setStaff(data.staff || []);
        } else {
          setError(data.error || "Failed to fetch staff");
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
        setError("Failed to fetch staff");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Workforce Management
        </h1>
        <p className="text-muted-foreground">
          Manage staff across your companies
        </p>
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
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
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
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
                        <Button variant="ghost" size="sm">
                          Edit
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
    </div>
  );
}
