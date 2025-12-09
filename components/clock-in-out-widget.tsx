"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Coffee, LogOut, Loader2 } from "lucide-react";
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
      const diff = now.getTime() - startTime.getTime();
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
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isStaff) {
    return null; // Don't show widget if not a staff member
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              status === "CLOCKED_IN"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : status === "ON_BREAK"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                status === "CLOCKED_IN"
                  ? "bg-green-600 animate-pulse"
                  : status === "ON_BREAK"
                  ? "bg-yellow-600 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            {status === "CLOCKED_IN" && "Working"}
            {status === "ON_BREAK" && "On Break"}
            {status === "CLOCKED_OUT" && "Clocked Out"}
          </div>
          {elapsedTime && (
            <div className="mt-2 text-2xl font-bold">{elapsedTime}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {status === "CLOCKED_OUT" && (
            <Button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="w-full"
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Clock In
            </Button>
          )}

          {status === "CLOCKED_IN" && (
            <>
              <Button
                onClick={handleBreakStart}
                disabled={actionLoading}
                variant="outline"
                className="w-full"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Coffee className="h-4 w-4 mr-2" />
                )}
                Start Break
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={actionLoading}
                variant="destructive"
                className="w-full"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Clock Out
              </Button>
            </>
          )}

          {status === "ON_BREAK" && (
            <Button
              onClick={handleBreakEnd}
              disabled={actionLoading}
              className="w-full"
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              End Break
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
