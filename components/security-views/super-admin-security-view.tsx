"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Unlock,
  TrendingUp,
  BarChart3,
  PieChart,
  Monitor,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SessionManager } from "@/components/session-manager";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirm";
import { Globe } from "@/components/ui/globe";

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

interface SuperAdminSecurityViewProps {
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

interface BlacklistEntry {
  id: string;
  ipAddress: string;
  city: string | null;
  state: string | null;
  country: string | null;
  countryFlag: string | null;
  reason: string;
  failedAttempts: number;
  blockedAt: string;
  blockedUntil: string;
  isAutoBlocked: boolean;
  isPermanent: boolean;
  blockedBy: {
    id: string;
    name: string;
    email: string;
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
  topCountries: Array<{
    country: string;
    flag: string;
    attempts: number;
  }>;
  topTargetedEmails: Array<{
    email: string;
    attempts: number;
  }>;
  recentThreats: Array<{
    ipAddress: string;
    attempts: number;
  }>;
  attackTimeline: Array<{
    hour: string;
    count: number;
  }>;
}

export function SuperAdminSecurityView({
  userName,
}: SuperAdminSecurityViewProps) {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [isLoadingBlacklist, setIsLoadingBlacklist] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "attempts" | "blacklist" | "analytics" | "sessions"
  >("attempts");
  const [attackOrigins, setAttackOrigins] = useState<
    Array<{
      location: [number, number];
      size: number;
      ipAddress: string;
      city: string | null;
      country: string | null;
      attempts: number;
    }>
  >([]);
  const [isLoadingOrigins, setIsLoadingOrigins] = useState(false);

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

    if (activeTab === "attempts") {
      fetchAttempts();
    }
  }, [activeTab]);

  // Fetch blacklist
  useEffect(() => {
    const fetchBlacklist = async () => {
      try {
        setIsLoadingBlacklist(true);
        const response = await fetch("/api/security/blacklist?status=active");
        if (response.ok) {
          const data = await response.json();
          setBlacklist(data.blacklist || []);
        }
      } catch (error) {
        console.error("Error fetching blacklist:", error);
      } finally {
        setIsLoadingBlacklist(false);
      }
    };

    if (activeTab === "blacklist") {
      fetchBlacklist();
    }
  }, [activeTab]);

  // Fetch attack origins for map
  useEffect(() => {
    const fetchAttackOrigins = async () => {
      try {
        setIsLoadingOrigins(true);
        const response = await fetch("/api/security/attack-origins");
        if (response.ok) {
          const data = await response.json();
          setAttackOrigins(data.markers || []);
        }
      } catch (error) {
        console.error("Error fetching attack origins:", error);
      } finally {
        setIsLoadingOrigins(false);
      }
    };

    if (activeTab === "analytics") {
      fetchAttackOrigins();
    }
  }, [activeTab]);

  const handleUnblock = async (id: string, ipAddress: string) => {
    const confirmed = await confirmToast(
      `Are you sure you want to unblock ${ipAddress}?`,
      { confirmLabel: "Unblock IP" }
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/security/blacklist/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from list
        setBlacklist((prev) => prev.filter((entry) => entry.id !== id));
        toast.success(`IP ${ipAddress} has been unblocked successfully`);
      } else {
        toast.error("Failed to unblock IP");
      }
    } catch (error) {
      console.error("Error unblocking IP:", error);
      toast.error("Error unblocking IP");
    }
  };

  const getAttemptSeverityColor = (attempts: number) => {
    if (attempts >= 6) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (attempts >= 4)
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Security Monitor
        </h1>
        <p className="text-muted-foreground">
          Welcome {userName || "Admin"}! Monitor failed login attempts and
          manage IP blacklist.
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Country</CardTitle>
            <Globe className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.topCountries[0]?.flag || "🌍"}{" "}
                  {stats?.topCountries[0]?.attempts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.topCountries[0]?.country || "No data"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "attempts" ? "default" : "ghost"}
          onClick={() => setActiveTab("attempts")}
          className="rounded-b-none"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Failed Attempts
        </Button>
        <Button
          variant={activeTab === "blacklist" ? "default" : "ghost"}
          onClick={() => setActiveTab("blacklist")}
          className="rounded-b-none"
        >
          <Shield className="h-4 w-4 mr-2" />
          IP Blacklist
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "ghost"}
          onClick={() => setActiveTab("analytics")}
          className="rounded-b-none"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Analytics
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

      {/* Failed Attempts Table */}
      {activeTab === "attempts" && (
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
      )}

      {/* IP Blacklist Table */}
      {activeTab === "blacklist" && (
        <Card>
          <CardHeader>
            <CardTitle>Blocked IP Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBlacklist ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : blacklist.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No IPs are currently blocked. System is clean! ✨
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blacklist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {entry.ipAddress}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {entry.countryFlag && (
                              <span className="text-lg">
                                {entry.countryFlag}
                              </span>
                            )}
                            <span className="text-sm">
                              {[entry.city, entry.state, entry.country]
                                .filter(Boolean)
                                .join(", ") || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.reason}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getAttemptSeverityColor(
                              entry.failedAttempts
                            )}
                          >
                            {entry.failedAttempts}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {timeAgo(entry.blockedAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.isPermanent ? (
                            <Badge variant="destructive">Permanent</Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              {timeAgo(entry.blockedUntil)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.isAutoBlocked ? (
                            <Badge
                              variant="outline"
                              className="bg-orange-500/10 text-orange-500"
                            >
                              Auto
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-purple-500/10 text-purple-500"
                            >
                              Manual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUnblock(entry.id, entry.ipAddress)
                            }
                            title="Unblock this IP"
                          >
                            <Unlock className="h-4 w-4" />
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
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Attack Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attack Timeline (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats?.attackTimeline && stats.attackTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.attackTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          hour12: true,
                        });
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Failed Attempts"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attack Origins Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Attack Origins Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOrigins ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : attackOrigins.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-2xl aspect-square">
                    <Globe
                      config={{
                        width: 800,
                        height: 800,
                        devicePixelRatio: 2,
                        phi: 0,
                        theta: 0.3,
                        dark: 0,
                        diffuse: 0.4,
                        mapSamples: 16000,
                        mapBrightness: 1.2,
                        baseColor: [1, 1, 1],
                        markerColor: [239 / 255, 68 / 255, 68 / 255], // Red color for attacks
                        glowColor: [1, 1, 1],
                        markers: attackOrigins.map((origin) => ({
                          location: origin.location,
                          size: origin.size,
                        })),
                        onRender: () => {},
                      }}
                    />
                  </div>
                  <div className="w-full max-w-2xl">
                    <h4 className="text-sm font-semibold mb-2">
                      Attack Hotspots (Last 7 Days)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {attackOrigins.slice(0, 10).map((origin, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                        >
                          <span className="font-mono text-xs">
                            {origin.ipAddress}
                          </span>
                          <span className="text-muted-foreground">
                            {[origin.city, origin.country]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {origin.attempts}x
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No attack origins to display
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Countries Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Top Attack Origins
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : stats?.topCountries && stats.topCountries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={stats.topCountries.map((c) => ({
                          name: `${c.flag} ${c.country}`,
                          value: c.attempts,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.topCountries.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#ef4444",
                                "#f97316",
                                "#eab308",
                                "#22c55e",
                                "#3b82f6",
                              ][index % 5]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Targeted Emails Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Most Targeted Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : stats?.topTargetedEmails &&
                  stats.topTargetedEmails.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stats.topTargetedEmails.slice(0, 8)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="email"
                        type="category"
                        width={150}
                        tickFormatter={(value) => {
                          if (value.length > 20) {
                            return value.substring(0, 17) + "...";
                          }
                          return value;
                        }}
                      />
                      <Tooltip />
                      <Bar dataKey="attempts" fill="#3b82f6" name="Attempts" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <SessionManager
            userRole="SUPER_ADMIN"
            currentUserId={userName || ""}
          />
        </div>
      )}
    </div>
  );
}
