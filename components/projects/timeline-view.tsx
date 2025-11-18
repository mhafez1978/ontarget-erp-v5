"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  companyId: string;
  teamId: string;
  managerId: string | null;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
  };
  projectManager: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  teamLead: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  _count: {
    tasks: number;
  };
}

interface TimelineViewProps {
  projects: Project[];
}

const STATUS_CONFIG = {
  PLANNING: {
    label: "Planning",
    color: "bg-slate-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-500",
  },
  ON_HOLD: {
    label: "On Hold",
    color: "bg-yellow-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-500",
  },
} as const;

type DateRange = "today" | "week" | "month" | "quarter" | "year" | "all";
type ZoomLevel = "day" | "week" | "month";

export function TimelineView({ projects }: TimelineViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>("quarter");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("month");

  // Filter projects that have dates
  const projectsWithDates = useMemo(() => {
    return projects.filter((project) => project.startDate && project.endDate);
  }, [projects]);

  // Calculate timeline boundaries based on date range
  const { minDate, maxDate } = useMemo(() => {
    const now = new Date();

    // If date range is selected, use that instead of project dates
    if (dateRange !== "all") {
      let start = new Date(now);
      let end = new Date(now);

      switch (dateRange) {
        case "today":
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "week":
          start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          start.setHours(0, 0, 0, 0);
          end.setDate(start.getDate() + 6); // End of week (Saturday)
          end.setHours(23, 59, 59, 999);
          break;
        case "month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "quarter":
          const currentQuarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), currentQuarter * 3, 1);
          end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "year":
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          end.setHours(23, 59, 59, 999);
          break;
      }

      return { minDate: start, maxDate: end };
    }

    // "all" - use project dates
    if (projectsWithDates.length === 0) {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      const threeMonthsLater = new Date(now);
      threeMonthsLater.setMonth(now.getMonth() + 3);

      return {
        minDate: threeMonthsAgo,
        maxDate: threeMonthsLater,
      };
    }

    let min = new Date(projectsWithDates[0].startDate!);
    let max = new Date(projectsWithDates[0].endDate!);

    projectsWithDates.forEach((project) => {
      const start = new Date(project.startDate!);
      const end = new Date(project.endDate!);

      if (start < min) min = start;
      if (end > max) max = end;
    });

    // Add padding (1 month before and after)
    const paddedMin = new Date(min);
    paddedMin.setMonth(paddedMin.getMonth() - 1);
    const paddedMax = new Date(max);
    paddedMax.setMonth(paddedMax.getMonth() + 1);

    return { minDate: paddedMin, maxDate: paddedMax };
  }, [projectsWithDates, dateRange]);

  // Generate time markers based on zoom level
  // Generate time markers based on zoom level
  const timeMarkers = useMemo(() => {
    const markers: Array<{ date: Date; label: string }> = [];
    const current = new Date(minDate);

    switch (zoomLevel) {
      case "day":
        // Show day markers
        current.setHours(0, 0, 0, 0);
        while (current <= maxDate) {
          markers.push({
            date: new Date(current),
            label: current.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          });
          current.setDate(current.getDate() + 1);
        }
        break;

      case "week":
        // Show week markers (Mondays)
        current.setHours(0, 0, 0, 0);
        // Move to next Monday
        while (current.getDay() !== 1) {
          current.setDate(current.getDate() + 1);
        }
        while (current <= maxDate) {
          markers.push({
            date: new Date(current),
            label: current.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          });
          current.setDate(current.getDate() + 7);
        }
        break;

      case "month":
      default:
        // Show month markers
        current.setDate(1);
        while (current <= maxDate) {
          markers.push({
            date: new Date(current),
            label: current.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
          });
          current.setMonth(current.getMonth() + 1);
        }
        break;
    }

    return markers;
  }, [minDate, maxDate, zoomLevel]);

  // Calculate position and width for project bars
  const getProjectBarStyle = (project: Project) => {
    if (!project.startDate || !project.endDate) return null;

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const totalDuration = maxDate.getTime() - minDate.getTime();
    const projectStart = start.getTime() - minDate.getTime();
    const projectDuration = end.getTime() - start.getTime();

    const left = (projectStart / totalDuration) * 100;
    const width = (projectDuration / totalDuration) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  // Get today marker position
  const getTodayPosition = () => {
    const today = new Date();
    const totalDuration = maxDate.getTime() - minDate.getTime();
    const todayOffset = today.getTime() - minDate.getTime();
    const position = (todayOffset / totalDuration) * 100;

    return Math.max(0, Math.min(100, position));
  };

  const todayPosition = getTodayPosition();

  if (projectsWithDates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              No projects with scheduled dates
            </p>
            <p className="text-sm text-muted-foreground">
              Projects need both start and target end dates to appear in the
              timeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range and Zoom Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Range:</span>
              <Select
                value={dateRange}
                onValueChange={(value) => setDateRange(value as DateRange)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Zoom:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (zoomLevel === "month") setZoomLevel("week");
                  else if (zoomLevel === "week") setZoomLevel("day");
                }}
                disabled={zoomLevel === "day"}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                {zoomLevel === "day" && "Daily"}
                {zoomLevel === "week" && "Weekly"}
                {zoomLevel === "month" && "Monthly"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (zoomLevel === "day") setZoomLevel("week");
                  else if (zoomLevel === "week") setZoomLevel("month");
                }}
                disabled={zoomLevel === "month"}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Date Range Display */}
            <div className="text-sm text-muted-foreground">
              {minDate.toLocaleDateString()} - {maxDate.toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Header with Time Markers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-12 border-b overflow-x-auto">
            {/* Time Markers */}
            {timeMarkers.map((marker, index) => {
              const totalDuration = maxDate.getTime() - minDate.getTime();
              const markerOffset = marker.date.getTime() - minDate.getTime();
              const position = (markerOffset / totalDuration) * 100;

              return (
                <div
                  key={index}
                  className="absolute top-0 h-full flex flex-col"
                  style={{ left: `${position}%` }}
                >
                  <div className="h-full w-px bg-border" />
                  <div className="absolute top-0 left-0 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    {marker.label}
                  </div>
                </div>
              );
            })}

            {/* Today Marker */}
            {todayPosition >= 0 && todayPosition <= 100 && (
              <div
                className="absolute top-0 h-full"
                style={{ left: `${todayPosition}%` }}
              >
                <div className="h-full w-0.5 bg-primary" />
                <div className="absolute -top-1 left-0 -translate-x-1/2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div className="absolute top-0 left-2 text-xs font-medium text-primary whitespace-nowrap">
                  Today
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Bars */}
      <div className="space-y-2">
        {projectsWithDates.map((project) => {
          const barStyle = getProjectBarStyle(project);
          if (!barStyle) return null;

          return (
            <Card
              key={project.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  {/* Project Info (Fixed Width) */}
                  <div className="w-64 p-4 border-r shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium line-clamp-1">
                          {project.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {project.team.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {project._count.tasks} tasks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 p-4 relative">
                    <div className="relative h-8">
                      {/* Project Bar */}
                      <div
                        className={`absolute top-0 h-full rounded ${
                          STATUS_CONFIG[project.status].color
                        } opacity-80 hover:opacity-100 transition-opacity cursor-pointer group`}
                        style={barStyle}
                      >
                        <div className="h-full flex items-center justify-center px-2">
                          <span className="text-xs text-white font-medium truncate">
                            {project.name}
                          </span>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm whitespace-nowrap">
                            <div className="font-medium mb-1">
                              {project.name}
                            </div>
                            <div className="space-y-1 text-muted-foreground">
                              <div>
                                Start:{" "}
                                {new Date(
                                  project.startDate!
                                ).toLocaleDateString()}
                              </div>
                              <div>
                                End:{" "}
                                {new Date(
                                  project.endDate!
                                ).toLocaleDateString()}
                              </div>
                              <div>
                                Status: {STATUS_CONFIG[project.status].label}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-sm text-muted-foreground">Status:</span>
            {(
              Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>
            ).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded ${STATUS_CONFIG[status].color}`}
                />
                <span className="text-sm">{STATUS_CONFIG[status].label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
