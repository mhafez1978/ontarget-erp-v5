"use client";

import {
  Calendar,
  Briefcase,
  Shield,
  CreditCard,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface StaffStatsWidgetProps {
  companyId: string;
}

export function StaffStatsWidget({ companyId }: StaffStatsWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    weeklyHours: number;
    weekStart: string;
    weekEnd: string;
    hireDate: string;
    daysEmployed: number;
    jobTitle: string;
    role: string;
    plan: string;
    payRate: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `/api/time-tracking/staff-stats?companyId=${companyId}`
        );
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch staff stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchStats();
    }
  }, [companyId]);

  if (loading) {
    return (
      <Card className="overflow-hidden border-2 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin dark:text-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      {/* Gradient Header */}
      <div className="relative px-6 py-8 text-white bg-gradient-to-br from-blue-500 to-indigo-600">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

        {/* Content */}
        <div className="relative text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 drop-shadow-lg" />
            <h3 className="text-xl font-bold tracking-tight">Weekly Stats</h3>
          </div>

          {/* Week Range Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 border border-white/30">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide">
              {stats.weekStart} - {stats.weekEnd}
            </span>
          </div>

          {/* Weekly Hours */}
          <div className="pt-2">
            <div className="text-5xl font-bold tracking-tight drop-shadow-2xl">
              {stats.weeklyHours}h
            </div>
            <div className="text-sm font-medium text-white/80 mt-1">
              hours worked this week
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <CardContent className="p-6 bg-gradient-to-b from-muted/30 to-background space-y-3">
        {/* Hire Date */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs dark:text-gray-200 font-medium">Hire Date</p>
            <p className="text-sm font-semibold">{stats.hireDate}</p>
          </div>
        </div>

        {/* Days Employed */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs dark:text-gray-200 font-medium">
              Days Employed
            </p>
            <p className="text-sm font-semibold">
              {stats.daysEmployed.toLocaleString()} days
            </p>
          </div>
        </div>

        {/* Job Title */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs dark:text-gray-200 font-medium">Job Title</p>
            <p className="text-sm font-semibold">{stats.jobTitle || "N/A"}</p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs dark:text-gray-200 font-medium">Role</p>
            <p className="text-sm font-semibold">{stats.role}</p>
          </div>
        </div>

        {/* Plan */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs dark:text-gray-200 font-medium">Plan</p>
            <p className="text-sm font-semibold">{stats.plan}</p>
          </div>
        </div>

        {/* Pay Rate */}
        {stats.payRate && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs dark:text-gray-200 font-medium">Pay Rate</p>
              <p className="text-sm font-semibold">{stats.payRate}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
