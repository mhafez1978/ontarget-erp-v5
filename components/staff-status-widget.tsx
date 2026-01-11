"use client";

import { Users, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StaffMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  jobTitle: string | null;
  status:
    | "OFFLINE"
    | "LOGGED_IN_CLOCKED_OUT"
    | "LOGGED_OUT_CLOCKED_IN"
    | "CLOCKED_IN"
    | "ON_BREAK";
  isLoggedIn: boolean;
  isClockedIn: boolean;
  currentEntry?: {
    id: string;
    clockIn: string;
    breakStart: string | null;
    status: string;
  } | null;
  lastSeen?: string | null;
}

interface StaffStatusWidgetProps {
  companyId: string;
  companyName?: string;
  colorVariant?: "red" | "purple" | "indigo" | "teal" | "amber" | "pink";
}

export function StaffStatusWidget({
  companyId,
  companyName,
  colorVariant = "red",
}: StaffStatusWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    const fetchStaffStatus = async (isInitial = false) => {
      try {
        const response = await fetch(
          `/api/time-tracking/staff-status?companyId=${companyId}&lastUpdate=${lastUpdate}`
        );
        const data = await response.json();

        if (data.success) {
          // Only update state if data actually changed
          setStaffMembers((prev) => {
            const prevJson = JSON.stringify(prev);
            const newJson = JSON.stringify(data.staff || []);

            // If nothing changed, don't trigger re-render
            if (prevJson === newJson && !isInitial) {
              return prev;
            }

            return data.staff || [];
          });

          if (data.hasChanges) {
            setLastUpdate(Date.now());
          }
        }
      } catch (error) {
        console.error("Failed to fetch staff status:", error);
      } finally {
        if (isInitial) {
          setLoading(false);
        }
      }
    };

    if (companyId) {
      fetchStaffStatus(true);

      // Check for updates every 10 seconds (reduced flashing)
      // This only re-renders if data actually changed
      const interval = setInterval(() => fetchStaffStatus(false), 10000);

      // Also listen for custom events from audit log
      const handleStatusChange = (event: CustomEvent) => {
        if (event.detail?.companyId === companyId) {
          fetchStaffStatus(false);
        }
      };

      window.addEventListener(
        "staff-status-change",
        handleStatusChange as EventListener
      );

      return () => {
        clearInterval(interval);
        window.removeEventListener(
          "staff-status-change",
          handleStatusChange as EventListener
        );
      };
    }
  }, [companyId, lastUpdate]);

  const getColorClasses = () => {
    const colors = {
      red: "bg-gradient-to-br from-red-400 to-amber-400",
      purple: "bg-gradient-to-br from-purple-100 to-purple-500",
      indigo: "bg-gradient-to-br from-indigo-500 to-indigo-700",
      teal: "bg-gradient-to-br from-teal-500 to-teal-700",
      amber: "bg-gradient-to-br from-amber-500 to-amber-700",
      pink: "bg-gradient-to-br from-pink-500 to-pink-700",
    };
    return colors[colorVariant];
  };

  const getStatusColor = (member: StaffMember) => {
    // Green: Logged in AND clocked in (ideal working state)
    if (member.status === "CLOCKED_IN") {
      return "bg-green-500";
    }
    // Orange: On break
    if (member.status === "ON_BREAK") {
      return "bg-orange-500";
    }
    // Light blue: Logged in but not clocked in
    if (member.status === "LOGGED_IN_CLOCKED_OUT") {
      return "bg-blue-400";
    }
    // Red: Clocked in but logged out (problem state!)
    if (member.status === "LOGGED_OUT_CLOCKED_IN") {
      return "bg-red-500";
    }
    // Yellow (dark) / Gray (light): Offline
    return "bg-yellow-500 dark:bg-yellow-500 light:bg-gray-400";
  };

  const getStatusLabel = (member: StaffMember) => {
    if (member.status === "CLOCKED_IN") {
      return "Working";
    }
    if (member.status === "ON_BREAK") {
      return "On Break";
    }
    if (member.status === "LOGGED_IN_CLOCKED_OUT") {
      return "Online - Not Working";
    }
    if (member.status === "LOGGED_OUT_CLOCKED_IN") {
      return "Not Clocked Out";
    }
    return "Offline";
  };

  const activeCounts = {
    working: staffMembers.filter((m) => m.status === "CLOCKED_IN").length,
    break: staffMembers.filter((m) => m.status === "ON_BREAK").length,
    online: staffMembers.filter((m) => m.status === "LOGGED_IN_CLOCKED_OUT")
      .length,
    error: staffMembers.filter((m) => m.status === "LOGGED_OUT_CLOCKED_IN")
      .length,
    offline: staffMembers.filter((m) => m.status === "OFFLINE").length,
  };

  if (loading) {
    return (
      <Card className="overflow-hidden border-2 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      {/* Gradient Header */}
      <div className={`relative px-6 py-8 text-white ${getColorClasses()}`}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

        {/* Content */}
        <div className="relative text-center space-y-3">
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 drop-shadow-lg" />
              {companyName && (
                <h1 className="text-2xl font-black opacity-90">
                  {companyName}
                </h1>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
              <span className="font-semibold">
                {activeCounts.working} Working
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-400 shadow-lg shadow-orange-400/50" />
              <span className="font-semibold">{activeCounts.break} Break</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
              <span className="font-semibold">
                {activeCounts.online} Online
              </span>
            </div>
            {activeCounts.error > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400 shadow-lg shadow-red-400/50" />
                <span className="font-semibold">
                  {activeCounts.error} Error
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50" />
              <span className="font-semibold">
                {activeCounts.offline} Offline
              </span>
            </div>
          </div>

          {/* Total Count */}
          <div className="pt-2">
            <div className="text-5xl font-bold tracking-tight drop-shadow-2xl">
              {staffMembers.length}
            </div>
            <p className="w-1/2 mx-auto text-sm font-medium opacity-90 tracking-wide mt-1">
              Online Members
            </p>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] w-full">
          <div className="p-2 space-y-1">
            {staffMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No staff members found
              </div>
            ) : (
              staffMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={member.user.image || undefined}
                        alt={member.user.name || "Staff"}
                      />
                      <AvatarFallback className="text-xs">
                        {member.user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Status Indicator */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(
                        member
                      )}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs font-semibold truncate">
                      {member.user.name || "Unknown"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {member.jobTitle || "Staff"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        member.status === "CLOCKED_IN"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : member.status === "ON_BREAK"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : member.status === "LOGGED_IN_CLOCKED_OUT"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : member.status === "LOGGED_OUT_CLOCKED_IN"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {getStatusLabel(member)}
                    </div>
                    {member.currentEntry && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(
                          member.currentEntry.clockIn
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                    {member.status === "OFFLINE" && member.lastSeen && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(member.lastSeen).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(member.lastSeen).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
