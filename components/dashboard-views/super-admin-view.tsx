"use client";

import { useState, useEffect } from "react";
import { GeoTrackingDisplay } from "@/components/geo-tracking-display";
import { AuditLog } from "@/components/audit-log";
import { EmailSettingsWarningBanner } from "@/components/email-settings-warning-banner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Globe, LogsIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SuperAdminViewProps {
  userName?: string | null;
}

export function SuperAdminView({ userName }: SuperAdminViewProps) {
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentVisitors, setRecentVisitors] = useState(0);

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
          setRecentVisitors(visitorsData.visitors?.length || 0);
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Super Admin, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        You have full access to all system features and administrative controls.
      </p>

      {/* Email Settings Warning Banner */}
      <EmailSettingsWarningBanner />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Logged-In Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Visitors (24h)
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Guest visitors tracked
            </p>
          </CardContent>
        </Card>
      </div>

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
            <AuditLog />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
