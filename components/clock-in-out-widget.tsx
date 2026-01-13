"use client";

import { Clock, Coffee, LogOut, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ClockInOutWidgetProps {
  companyId: string;
}

export function ClockInOutWidget({ companyId }: ClockInOutWidgetProps) {
  const [status, setStatus] = useState<
    "CLOCKED_OUT" | "CLOCKED_IN" | "ON_BREAK"
  >("CLOCKED_OUT");
  const [currentEntry, setCurrentEntry] = useState<{
    id: string;
    clockIn: string;
    breakStart?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");
  const [isStaff, setIsStaff] = useState(false);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/time-tracking/status?companyId=${companyId}`
      );
      const data = await response.json();

      if (data.success) {
        setIsStaff(data.isStaff);
        setStatus(data.status || "CLOCKED_OUT");
        setCurrentEntry(data.entry);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchStatus();
    }
  }, [companyId, fetchStatus]);

  // Update elapsed time every minute
  useEffect(() => {
    if (!currentEntry) {
      setElapsedTime("");
      return;
    }

    const updateTime = () => {
      const startTime =
        status === "ON_BREAK" && currentEntry.breakStart
          ? new Date(currentEntry.breakStart)
          : new Date(currentEntry.clockIn);
      const now = new Date();
      const diff = Math.abs(now.getTime() - startTime.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedTime(`${hours}h ${minutes}m`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentEntry, status]);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/time-tracking/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Clocked in successfully");
        await fetchStatus();
      } else {
        toast.error(data.error || "Failed to clock in");
      }
    } catch (error) {
      console.error("Clock in error:", error);
      toast.error("Failed to clock in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/time-tracking/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Clocked out successfully. Total: ${data.timeEntry.totalHours}h`
        );
        await fetchStatus();
      } else {
        toast.error(data.error || "Failed to clock out");
      }
    } catch (error) {
      console.error("Clock out error:", error);
      toast.error("Failed to clock out");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakStart = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/time-tracking/break-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Break started");
        await fetchStatus();
      } else {
        toast.error(data.error || "Failed to start break");
      }
    } catch (error) {
      console.error("Break start error:", error);
      toast.error("Failed to start break");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/time-tracking/break-end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Break ended");
        await fetchStatus();
      } else {
        toast.error(data.error || "Failed to end break");
      }
    } catch (error) {
      console.error("Break end error:", error);
      toast.error("Failed to end break");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin dark:text-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isStaff) {
    return null; // Don't show widget if not a staff member
  }

  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      {/* Gradient Header */}
      <div
        className={`relative px-6 py-8 text-white transition-all duration-500 ${
          status === "CLOCKED_IN"
            ? "bg-gradient-to-br from-green-500 to-emerald-600"
            : status === "ON_BREAK"
            ? "bg-gradient-to-br from-yellow-500 to-orange-600"
            : "bg-gradient-to-br from-slate-500 to-slate-600"
        }`}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

        {/* Content */}
        <div className="relative text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 drop-shadow-lg" />
            <h3 className="text-xl font-bold tracking-tight">Time Clock</h3>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 border border-white/30">
            <div
              className={`h-3 w-3 rounded-full bg-white shadow-lg ${
                status !== "CLOCKED_OUT" ? "animate-pulse" : ""
              }`}
            />
            <span className="text-sm font-semibold tracking-wide">
              {status === "CLOCKED_IN" && "Working"}
              {status === "ON_BREAK" && "On Break"}
              {status === "CLOCKED_OUT" && "Clocked Out"}
            </span>
          </div>

          {/* Elapsed Time - Always show */}
          <div className="pt-2">
            <div className="text-5xl font-bold tracking-tight drop-shadow-2xl">
              {elapsedTime || "0h 0m"}
            </div>
            <div className="text-sm font-medium text-white/80 mt-1">
              {status === "ON_BREAK"
                ? "break duration"
                : status === "CLOCKED_IN"
                ? "time worked"
                : "not working"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <CardContent className="p-6 bg-linear-to-b from-muted/30 to-background">
        <div className="flex flex-col gap-3">
          {status === "CLOCKED_OUT" && (
            <Button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-linear-to-r from-green-500 to-emerald-600 hover:to-emerald-400 "
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Clock className="h-5 w-5 mr-2" />
              )}
              Clock-in
            </Button>
          )}

          {status === "CLOCKED_IN" && (
            <>
              <Button
                onClick={handleBreakStart}
                disabled={actionLoading}
                variant="outline"
                className="w-full h-12 font-semibold border-2 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-700 dark:hover:bg-yellow-900/20 transition-all duration-200"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Coffee className="h-5 w-5 mr-2" />
                )}
                Start Break
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={actionLoading}
                variant="destructive"
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-linear-to-r from-purple-500 to-pink-600 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5 mr-2" />
                )}
                Clock Out
              </Button>
            </>
          )}

          {status === "ON_BREAK" && (
            <Button
              onClick={handleBreakEnd}
              disabled={actionLoading}
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Clock className="h-5 w-5 mr-2" />
              )}
              End Break & Resume
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
