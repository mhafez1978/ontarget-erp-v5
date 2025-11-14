"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, MapPin, Globe, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisitorData {
  id: string;
  ipAddress: string;
  ipv4: string | null;
  ipv6: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryFlag: string | null;
  visitedAt: string;
  landingPage: string | null;
}

interface ActiveSession {
  id: string;
  userName: string | null;
  userEmail: string | null;
  companyName: string | null;
  role: string;
  sessionCity: string | null;
  sessionState: string | null;
  sessionCountry: string | null;
  sessionCountryFlag: string | null;
  sessionIpAddress: string | null;
  sessionIpv4: string | null;
  sessionIpv6: string | null;
}

export function GeoTrackingDisplay() {
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [geoTrackingEnabled, setGeoTrackingEnabled] = useState<boolean | null>(
    null
  );
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user role
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role || null);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  const fetchTrackingData = async () => {
    try {
      // Check geo-tracking settings
      const settingsRes = await fetch("/api/settings/geo-tracking");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setGeoTrackingEnabled(settingsData.enabled || false);
      }

      const [visitorsRes, sessionsRes] = await Promise.all([
        fetch("/api/tracking/visitors"),
        fetch("/api/tracking/sessions"),
      ]);

      if (visitorsRes.ok) {
        const visitorsData = await visitorsRes.json();
        setVisitors(visitorsData.visitors || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setActiveSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch tracking data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading tracking data...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show warning for SUPER_ADMIN if geo-tracking is disabled
  if (geoTrackingEnabled === false && userRole === "SUPER_ADMIN") {
    return (
      <div className="space-y-4">
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  Geo-Tracking is Disabled
                </CardTitle>
                <CardDescription className="text-yellow-800 dark:text-yellow-200 mt-2">
                  Visitor tracking is currently disabled. Enable it in settings
                  to start tracking visitors and sessions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button variant="default">Go to Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Active Logged-In Users ({activeSessions.length})
              </CardTitle>
              <CardDescription>
                Users currently logged in with live location data
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={fetchTrackingData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active logged-in users at the moment
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {session.userName || session.userEmail || "User"}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {session.role.replace("_", " ")}
                      </span>
                    </div>
                    {session.companyName && (
                      <p className="text-xs text-muted-foreground">
                        {session.companyName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {[
                            session.sessionCity,
                            session.sessionState,
                            session.sessionCountry,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Location unavailable"}
                        </span>
                      </div>
                      {session.sessionCountryFlag && (
                        <span className="text-base">
                          {session.sessionCountryFlag}
                        </span>
                      )}
                    </div>
                    {(session.sessionIpv4 || session.sessionIpv6) && (
                      <div className="text-xs text-muted-foreground">
                        {session.sessionIpv4 && (
                          <span className="mr-3">
                            IPv4: {session.sessionIpv4}
                          </span>
                        )}
                        {session.sessionIpv6 && (
                          <span>IPv6: {session.sessionIpv6}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Visitors (Guests) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Visitors (Guests: {visitors.length})
              </CardTitle>
              <CardDescription>
                Non-logged-in visitors from the last 24 hours
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={fetchTrackingData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {visitors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent visitors tracked
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {visitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium text-sm">Guest Visitor</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="truncate">
                          {[visitor.city, visitor.state, visitor.country]
                            .filter(Boolean)
                            .join(", ") || "Location unavailable"}
                        </span>
                        {visitor.countryFlag && (
                          <span className="text-base shrink-0">
                            {visitor.countryFlag}
                          </span>
                        )}
                      </div>
                      {(visitor.ipv4 || visitor.ipv6 || visitor.ipAddress) && (
                        <div className="text-xs text-muted-foreground">
                          {visitor.ipv4 && (
                            <span className="mr-3">IPv4: {visitor.ipv4}</span>
                          )}
                          {visitor.ipv6 && <span>IPv6: {visitor.ipv6}</span>}
                          {!visitor.ipv4 &&
                            !visitor.ipv6 &&
                            visitor.ipAddress && (
                              <span>
                                {visitor.ipAddress.includes(":")
                                  ? "IPv6"
                                  : "IPv4"}
                                : {visitor.ipAddress}
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0 ml-2">
                    <p>{new Date(visitor.visitedAt).toLocaleTimeString()}</p>
                    <p>{new Date(visitor.visitedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
