"use client";

import { MapPin, Users, Globe, LogsIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { GeoTrackingDisplay } from "@/components/geo-tracking-display";
import { AuditLogClientStatic } from "@/components/audit-log-client-static";
import { EmailSettingsWarningBanner } from "@/components/email-settings-warning-banner";
import { StaffStatusWidget } from "@/components/staff-status-widget";
import { ClockInOutWidget } from "@/components/clock-in-out-widget";
import { StaffStatsWidget } from "@/components/staff-stats-widget";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SuperAdminViewProps {
  userName?: string | null;
  companyId?: string | null;
}

export function SuperAdminView({ userName, companyId }: SuperAdminViewProps) {
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentVisitors, setRecentVisitors] = useState(0);
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string; role: string }>
  >([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    const fetchUserCompanies = async () => {
      try {
        const response = await fetch("/api/companies/my-owned");
        const data = await response.json();

        if (data.success) {
          setCompanies(data.companies);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchUserCompanies();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [sessionsRes, visitorsRes] = await Promise.all([
          fetch("/api/tracking/sessions"),
          fetch("/api/tracking/visitors"),
        ]);

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setActiveUsers(sessionsData.sessions?.length || 0);
        }

        if (visitorsRes.ok) {
          const visitorsData = await visitorsRes.json();
          // Prefer totalCount (all-time) when available, fall back to returned page length
          setRecentVisitors(
            visitorsData.totalCount ?? visitorsData.visitors?.length ?? 0
          );
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Super Admin, welcome {userName || "Guest"}!
      </h1>
      <p className="dark:text-gray-200">
        You have full access to all system features and administrative controls.
      </p>

      {/* System Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Logged-In Users
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-green-500">
              {activeUsers}
            </div>
            <p className="text-xs  md:text-md">Currently active sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors (All time)
            </CardTitle>
            <Globe className="h-4 w-4 text-purple-500 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-green-500">
              {recentVisitors}
            </div>
            <p className="text-xs md:text-md">
              All visitors tracked by geo-tracking system
            </p>
          </CardContent>
        </Card>
      </div>

      <EmailSettingsWarningBanner />

      {!loadingCompanies && companies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Staff Status by Company</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ClockInOutWidget companyId={companyId || companies[0]?.id} />
            <StaffStatsWidget companyId={companyId || companies[0]?.id} />
            {companies.map((company, index) => {
              const colors: Array<
                "red" | "purple" | "indigo" | "teal" | "amber" | "pink"
              > = ["red", "purple", "indigo", "teal", "amber", "pink"];
              const colorVariant = colors[index % colors.length];

              return (
                <StaffStatusWidget
                  key={index}
                  companyId={company.id}
                  companyName={company.name}
                  colorVariant={colorVariant}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Geo-tracking Display in Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="geo-tracking">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geo-Tracking & Visitor Analytics
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <GeoTrackingDisplay />
          </AccordionContent>
        </AccordionItem>
        {/* Audit Logs Display in Accordion */}
        <AccordionItem value="audit-logs">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <LogsIcon className="h-5 w-5" />
              Company Action Logs
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AuditLogClientStatic showRefreshButton={true} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
