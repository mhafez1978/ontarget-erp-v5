"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Coffee,
  CheckCircle2,
  XCircle,
  Calendar,
  Download,
  Filter,
  Loader2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  companyId?: string | null;
}

interface StaffMember {
  id: string;
  userId: string;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface Company {
  id: string;
  name: string;
}

interface TimeEntry {
  id: string;
  staffId: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  totalMinutes: number | null;
  totalHours: string | null;
  status: "CLOCKED_IN" | "ON_BREAK" | "CLOCKED_OUT";
  notes: string | null;
  isApproved: boolean;
  approvedBy: string | null;
  staff: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
}

export default function TimesheetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("this-week");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchStaffMembers();
      fetchTimeEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, selectedStaff, dateRange, startDate, endDate]);

  useEffect(() => {
    setSelectedStaff("all");
  }, [selectedCompany]);

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (!data.authenticated) {
        router.push("/");
        return;
      }

    setUser(data.user);
  } catch (error) {
      console.error("Failed to fetch user:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    if (!selectedCompany) return;

    try {
      const response = await fetch(
        `/api/workforce/staff?companyId=${selectedCompany}`
      );
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.staff || []);
      }
    } catch (error) {
      console.error("Failed to fetch staff members:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/company/my-companies");
      if (response.ok) {
        const data = await response.json();
        const companiesList: Company[] = data.companies || [];
        setCompanies(companiesList);

        // Prefer selected company that already exists, fallback to user default or first company
        if (!selectedCompany && companiesList.length > 0) {
          const preferred =
            companiesList.find((company) => company.id === user?.companyId) ||
            companiesList[0];
          setSelectedCompany(preferred.id);
        } else if (
          selectedCompany &&
          !companiesList.some((company) => company.id === selectedCompany)
        ) {
          const fallbackCompany =
            companiesList.find((company) => company.id === user?.companyId) ||
            companiesList[0];
          setSelectedCompany(fallbackCompany?.id || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchTimeEntries = async () => {
    if (!user?.companyId) return;

    try {
      const params = new URLSearchParams({
        companyId: selectedCompany,
      });

      // Add date range
      const { start, end } = getDateRangeParams();
      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      // Add staff filter (only if admin/manager viewing specific staff)
      if (selectedStaff !== "all" && isAdminOrManager()) {
        params.append("staffId", selectedStaff);
      }

      const response = await fetch(`/api/time-tracking/entries?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      } else {
        toast.error("Failed to load time entries");
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
      toast.error("Failed to load time entries");
    }
  };

  const getDateRangeParams = () => {
    const now = new Date();
    let start = "";
    let end = "";

    switch (dateRange) {
      case "this-week":
        start = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
        end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "last-week":
        const lastWeek = subWeeks(now, 1);
        start = format(
          startOfWeek(lastWeek, { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
        end = format(endOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "this-month":
        start = format(startOfMonth(now), "yyyy-MM-dd");
        end = format(endOfMonth(now), "yyyy-MM-dd");
        break;
      case "last-month":
        const lastMonth = subMonths(now, 1);
        start = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        end = format(endOfMonth(lastMonth), "yyyy-MM-dd");
        break;
      case "custom":
        start = startDate;
        end = endDate;
        break;
    }

    return { start, end };
  };

  const isAdminOrManager = () => {
    return ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user?.role || "");
  };

  const handleApprove = async (entryId: string) => {
    if (!isAdminOrManager()) {
      toast.error("Only admins and managers can approve time entries");
      return;
    }

    setApprovingId(entryId);
    try {
      const response = await fetch(`/api/time-tracking/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });

      if (response.ok) {
        toast.success("Time entry approved");
        fetchTimeEntries();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve entry");
      }
    } catch (error) {
      console.error("Failed to approve entry:", error);
      toast.error("Failed to approve entry");
    } finally {
      setApprovingId(null);
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    toast.info("Export feature coming soon");
  };

  const calculateWeeklyTotal = () => {
    return entries
      .reduce((sum, entry) => {
        return sum + parseFloat(entry.totalHours || "0");
      }, 0)
      .toFixed(2);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user || undefined}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timesheet</h1>
            <p className="text-muted-foreground">
              View and manage employee time tracking records
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Range Selector */}
              {companies.length > 1 && (
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select
                    value={selectedCompany}
                    onValueChange={setSelectedCompany}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
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
              )}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {dateRange === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Staff Filter (Admin/Manager only) */}
              {isAdminOrManager() && (
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select
                    value={selectedStaff}
                    onValueChange={setSelectedStaff}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.user.name || staff.user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Total hours for selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {calculateWeeklyTotal()} hours
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {entries.length} time {entries.length === 1 ? "entry" : "entries"}
            </p>
          </CardContent>
        </Card>

        {/* Time Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              Clock in/out records with break tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No time entries</h3>
                <p className="text-sm text-muted-foreground">
                  No clock in/out records found for the selected period
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdminOrManager() && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.staff.user.name || entry.staff.user.email}
                        </TableCell>
                        <TableCell>
                          {format(new Date(entry.clockIn), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(entry.clockIn), "HH:mm")}
                        </TableCell>
                        <TableCell>
                          {entry.clockOut
                            ? format(new Date(entry.clockOut), "HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coffee className="h-3 w-3 text-muted-foreground" />
                            {entry.breakMinutes} min
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {entry.totalHours || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {entry.status === "CLOCKED_OUT" ? (
                              <Badge variant="secondary">Completed</Badge>
                            ) : entry.status === "ON_BREAK" ? (
                              <Badge variant="outline">On Break</Badge>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )}
                            {entry.isApproved && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {isAdminOrManager() && (
                          <TableCell>
                            {!entry.isApproved &&
                              entry.status === "CLOCKED_OUT" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(entry.id)}
                                  disabled={approvingId === entry.id}
                                >
                                  {approvingId === entry.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                              )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
