"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  AlertTriangle,
  Ban,
  Loader2,
  Clock,
  Monitor,
} from "lucide-react";
import { SessionManager } from "@/components/session-manager";
import { Button } from "@/components/ui/button";

// Simple time ago formatter
function timeAgo(date: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

interface AdminSecurityViewProps {
  userName?: string | null;
}

interface FailedAttempt {
  id: string;
  email: string;
  ipAddress: string;
  ipv4: string | null;
  ipv6: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryFlag: string | null;
  attemptedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface SecurityStats {
  failedAttempts: {
    lastHour: number;
    last24Hours: number;
    last7Days: number;
    total: number;
  };
  blockedIps: {
    active: number;
  };
}

export function AdminSecurityView({ userName }: AdminSecurityViewProps) {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [activeTab, setActiveTab] = useState<"attempts" | "sessions">(
    "attempts"
  );

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch("/api/security/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch failed attempts
  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setIsLoadingAttempts(true);
        const response = await fetch("/api/security/failed-attempts?limit=20");
        if (response.ok) {
          const data = await response.json();
          setFailedAttempts(data.attempts || []);
        }
      } catch (error) {
        console.error("Error fetching attempts:", error);
      } finally {
        setIsLoadingAttempts(false);
      }
    };

    fetchAttempts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Security Monitor
        </h1>
        <p className="text-muted-foreground">
          Welcome {userName || "Admin"}! View security alerts and failed login
          attempts.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Hour</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.failedAttempts.lastHour || 0}
                </div>
                <p className="text-xs text-muted-foreground">Failed attempts</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.failedAttempts.last24Hours || 0}
                </div>
                <p className="text-xs text-muted-foreground">Failed attempts</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.failedAttempts.last7Days || 0}
                </div>
                <p className="text-xs text-muted-foreground">Failed attempts</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.blockedIps.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently blocked
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Failed Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Login Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAttempts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : failedAttempts.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No failed login attempts. All systems secure! 🎉
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>User Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        {attempt.email}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {attempt.ipv4 || attempt.ipAddress}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {attempt.countryFlag && (
                            <span className="text-lg">
                              {attempt.countryFlag}
                            </span>
                          )}
                          <span className="text-sm">
                            {[attempt.city, attempt.state, attempt.country]
                              .filter(Boolean)
                              .join(", ") || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timeAgo(attempt.attemptedAt)}
                      </TableCell>
                      <TableCell>
                        {attempt.user ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-500"
                          >
                            Exists
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-500/10 text-gray-500"
                          >
                            Unknown
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-muted-foreground shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Admin Security Access</h3>
              <p className="text-sm text-muted-foreground">
                As an admin, you can view security statistics and failed login
                attempts for your system. For advanced features like IP
                blacklist management and detailed analytics, contact your Super
                Admin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Failed Attempts and Sessions */}
      <div className="flex gap-2 border-b mt-6">
        <Button
          variant={activeTab === "attempts" ? "default" : "ghost"}
          onClick={() => setActiveTab("attempts")}
          className="rounded-b-none"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Failed Attempts
        </Button>
        <Button
          variant={activeTab === "sessions" ? "default" : "ghost"}
          onClick={() => setActiveTab("sessions")}
          className="rounded-b-none"
        >
          <Monitor className="h-4 w-4 mr-2" />
          Active Sessions
        </Button>
      </div>

      {/* Active Sessions */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <SessionManager userRole="ADMIN" />
        </div>
      )}
    </div>
  );
}
