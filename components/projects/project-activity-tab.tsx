"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  User2,
  FileEdit,
  Trash2,
  Eye,
  Plus,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  companyId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  company: {
    id: string;
    name: string;
  };
}

interface ProjectActivityTabProps {
  projectId: string;
  companyId: string;
}

export function ProjectActivityTab({
  projectId,
  companyId,
}: ProjectActivityTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const params = new URLSearchParams({
          entityType: "Project",
          entityId: projectId,
          companyId: companyId,
        });
        const response = await fetch(`/api/audit-logs?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch audit logs");
        }
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        toast.error("Failed to load activity log");
      } finally {
        setLoading(false);
      }
    }

    if (projectId && companyId) {
      fetchAuditLogs();
    }
  }, [projectId, companyId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "PROJECT_CREATED":
        return <Plus className="h-4 w-4" />;
      case "PROJECT_UPDATED":
        return <FileEdit className="h-4 w-4" />;
      case "PROJECT_DELETED":
        return <Trash2 className="h-4 w-4" />;
      case "PROJECT_VIEWED":
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "PROJECT_CREATED":
        return "text-green-600 bg-green-500/10";
      case "PROJECT_UPDATED":
        return "text-blue-600 bg-blue-500/10";
      case "PROJECT_DELETED":
        return "text-red-600 bg-red-500/10";
      case "PROJECT_VIEWED":
        return "text-gray-600 bg-gray-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getActionLabel = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getMetadataDescription = (log: AuditLog) => {
    const metadata = log.metadata || {};

    switch (log.action) {
      case "PROJECT_CREATED":
        return `Created project "${metadata.projectName}"`;
      case "PROJECT_UPDATED":
        if (metadata.changes) {
          const changes = Object.keys(metadata.changes);
          return `Updated ${changes.join(", ")}`;
        }
        return "Updated project details";
      case "PROJECT_DELETED":
        return `Deleted project "${metadata.projectName}"`;
      case "PROJECT_VIEWED":
        return "Viewed project details";
      default:
        return getActionLabel(log.action);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
          <p className="text-sm text-muted-foreground">
            Activity logs will appear here as actions are performed on this
            project
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {logs.map((log, index) => (
          <Card key={log.id} className="relative">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Timeline Line */}
                {index !== logs.length - 1 && (
                  <div className="absolute left-[49px] top-[60px] -bottom-4 w-0.5 bg-border" />
                )}

                {/* Avatar & Icon */}
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={log.user.image || ""}
                      alt={log.user.name || "User"}
                    />
                    <AvatarFallback>
                      <User2 className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ${getActionColor(
                      log.action
                    )}`}
                  >
                    {getActionIcon(log.action)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {log.user.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getMetadataDescription(log)}
                      </p>
                    </div>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {getActionLabel(log.action)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTimestamp(log.createdAt)}</span>
                    <span>•</span>
                    <span>
                      {new Date(log.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Metadata Details */}
                  {log.metadata &&
                    typeof log.metadata.changes === "object" &&
                    log.metadata.changes !== null && (
                      <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs">
                        {log.action === "PROJECT_UPDATED" && (
                          <div className="space-y-1">
                            {Object.entries(
                              log.metadata.changes as Record<string, unknown>
                            ).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2"
                              >
                                <span className="text-muted-foreground">
                                  {key}:
                                </span>
                                <span className="font-mono">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
