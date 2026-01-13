"use client";

import { Users, MapPin, Globe, UserCheck, AlertCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  createdAt: string;
  expiresAt: string;
}

export function GeoTrackingDisplay() {
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [geoTrackingEnabled, setGeoTrackingEnabled] = useState<boolean | null>(
    null
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const [visitorsCursor, setVisitorsCursor] = useState<string | null>(null);
  const [hasMoreVisitors, setHasMoreVisitors] = useState(true);
  const [loadingMoreVisitors, setLoadingMoreVisitors] = useState(false);
  const [totalVisitorsCount, setTotalVisitorsCount] = useState(0);

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

  // Utility: deduplicate arrays of objects with an `id` field
  const uniqueById = <T extends { id: string }>(items: T[]) => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const it of items) {
      if (!it || !it.id) continue;
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  };

  // Merge prev and incoming while keeping unique ids (prev items preserved first)
  const mergeUnique = <T extends { id: string }>(prev: T[], incoming: T[]) => {
    const seen = new Set<string>(prev.map((p) => p.id));
    const filteredIncoming = (incoming || []).filter(
      (i) => i && !seen.has(i.id)
    );
    return [...prev, ...filteredIncoming];
  };

  const fetchTrackingData = useCallback(
    async (showLoading = true, resetVisitors = true) => {
      if (showLoading) {
        setIsLoading(true);
      }
      try {
        // Check geo-tracking settings
        const settingsRes = await fetch("/api/settings/geo-tracking", {
          cache: "no-store",
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setGeoTrackingEnabled(settingsData.enabled || false);
        }

        const [visitorsRes, sessionsRes] = await Promise.all([
          fetch("/api/tracking/visitors?limit=20", { cache: "no-store" }),
          fetch("/api/tracking/sessions", { cache: "no-store" }),
        ]);

        if (visitorsRes.ok) {
          const visitorsData = await visitorsRes.json();
          const incomingVisitors = visitorsData.visitors || [];
          if (resetVisitors) {
            setVisitors(uniqueById(incomingVisitors));
          } else {
            setVisitors((prev) => mergeUnique(prev, incomingVisitors));
          }
          setVisitorsCursor(visitorsData.nextCursor || null);
          setHasMoreVisitors(visitorsData.hasMore || false);
          // Use totalCount (all-time) when available for dashboard totals
          setTotalVisitorsCount(
            visitorsData.totalCount ?? visitorsData.visitors?.length ?? 0
          );
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          const incomingSessions = sessionsData.sessions || [];
          setActiveSessions(uniqueById(incomingSessions));
        }
      } catch (error) {
        console.error("Failed to fetch tracking data:", error);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const loadMoreVisitors = useCallback(async () => {
    if (!hasMoreVisitors || loadingMoreVisitors || !visitorsCursor) return;

    setLoadingMoreVisitors(true);
    try {
      const response = await fetch(
        `/api/tracking/visitors?cursor=${visitorsCursor}&limit=20`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const data = await response.json();
        const incoming = data.visitors || [];
        setVisitors((prev) => mergeUnique(prev, incoming));
        setVisitorsCursor(data.nextCursor || null);
        setHasMoreVisitors(data.hasMore || false);
      }
    } catch (error) {
      console.error("Failed to load more visitors:", error);
    } finally {
      setLoadingMoreVisitors(false);
    }
  }, [hasMoreVisitors, loadingMoreVisitors, visitorsCursor]);

  useEffect(() => {
    fetchTrackingData();
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchTrackingData(false, false), 30000);
    return () => clearInterval(interval);
  }, [fetchTrackingData]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreVisitors &&
          !loadingMoreVisitors
        ) {
          loadMoreVisitors();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById("visitors-sentinel");
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMoreVisitors, loadingMoreVisitors, loadMoreVisitors]);

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
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchTrackingData()}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-sm dark:text-gray-200 text-center py-8">
              No active logged-in users at the moment
            </p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
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
                      <p className="text-xs dark:text-gray-200">
                        {session.companyName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs dark:text-gray-200 flex-wrap">
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
                      <div className="text-xs dark:text-gray-200">
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
                    {session.createdAt && (
                      <div className="text-xs dark:text-gray-200">
                        <span>
                          Logged in:{" "}
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
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
                Visitors (Guests: {totalVisitorsCount})
              </CardTitle>
              <CardDescription>
                Non-logged-in visitors (all time)
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchTrackingData()}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {visitors.length === 0 ? (
            <p className="text-sm dark:text-gray-200 text-center py-8">
              No recent visitors tracked
            </p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
              {visitors.map((visitor) => (
                <div
                  key={`${visitor.id}-${visitor.visitedAt}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Globe className="h-4 w-4 dark:text-gray-200 shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium text-sm">Guest Visitor</p>
                      <div className="flex items-center gap-2 text-xs dark:text-gray-200 flex-wrap">
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
                        <div className="text-xs dark:text-gray-200">
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
                  <div className="text-right text-xs dark:text-gray-200 shrink-0 ml-2">
                    <p>{new Date(visitor.visitedAt).toLocaleTimeString()}</p>
                    <p>{new Date(visitor.visitedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {/* Infinite scroll sentinel */}
              {hasMoreVisitors && (
                <div id="visitors-sentinel" className="py-4 text-center">
                  {loadingMoreVisitors ? (
                    <p className="text-sm dark:text-gray-200">
                      Loading more visitors...
                    </p>
                  ) : (
                    <p className="text-xs dark:text-gray-200">
                      Scroll for more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
