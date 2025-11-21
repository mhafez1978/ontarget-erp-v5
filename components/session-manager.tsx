"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: string;
  isCurrent: boolean;
  location: string;
  ipAddress: string;
  country: string | null;
  countryFlag: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

interface SessionManagerProps {
  userRole: "SUPER_ADMIN" | "ADMIN" | string;
  currentUserId?: string;
}

export function SessionManager({
  userRole,
  currentUserId,
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "ADMIN";

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const endpoint = isSuperAdmin
        ? "/api/auth/sessions/all" // Super admin sees all sessions
        : isAdmin
        ? "/api/auth/sessions/company" // Admin sees company sessions
        : "/api/auth/sessions"; // Regular user sees own sessions

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (session: Session) => {
    if (session.isCurrent) {
      toast.error("Cannot revoke your current session. Use logout instead.");
      return;
    }

    setSessionToRevoke(session);
    setShowRevokeDialog(true);
  };

  const confirmRevokeSession = async () => {
    if (!sessionToRevoke) return;

    try {
      setRevoking(sessionToRevoke.id);
      const response = await fetch(
        `/api/auth/sessions?sessionId=${sessionToRevoke.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke session");
      }

      toast.success("Session revoked successfully");
      fetchSessions();
    } catch (error) {
      console.error("Failed to revoke session:", error);
      toast.error("Failed to revoke session");
    } finally {
      setRevoking(null);
      setShowRevokeDialog(false);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAll = () => {
    setShowRevokeAllDialog(true);
  };

  const confirmRevokeAll = async () => {
    try {
      setRevokingAll(true);
      const response = await fetch("/api/auth/sessions/revoke-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke all sessions");
      }

      const data = await response.json();
      toast.success(data.message || "All other sessions revoked successfully");
      fetchSessions();
    } catch (error) {
      console.error("Failed to revoke all sessions:", error);
      toast.error("Failed to revoke all sessions");
    } finally {
      setRevokingAll(false);
      setShowRevokeAllDialog(false);
    }
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceInfo = (userAgent?: string | null) => {
    if (!userAgent) return "Unknown Device";
    
    const ua = userAgent;
    let os = "Unknown OS";
    let browser = "Unknown Browser";
    
    // Detect OS
    if (ua.includes("Mac OS X")) {
      os = "macOS";
    } else if (ua.includes("Windows NT 10")) {
      os = "Windows 10/11";
    } else if (ua.includes("Windows NT 6.3")) {
      os = "Windows 8.1";
    } else if (ua.includes("Windows NT 6.2")) {
      os = "Windows 8";
    } else if (ua.includes("Windows NT 6.1")) {
      os = "Windows 7";
    } else if (ua.includes("Windows")) {
      os = "Windows";
    } else if (ua.includes("Linux")) {
      os = "Linux";
    } else if (ua.includes("iPhone")) {
      os = "iOS";
    } else if (ua.includes("Android")) {
      os = "Android";
    }
    
    // Detect Browser
    if (ua.includes("Edg/")) {
      browser = "Edge";
    } else if (ua.includes("Chrome/") && !ua.includes("Edg")) {
      browser = "Chrome";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
      browser = "Safari";
    } else if (ua.includes("Firefox/")) {
      browser = "Firefox";
    } else if (ua.includes("Opera/") || ua.includes("OPR/")) {
      browser = "Opera";
    }
    
    return `${os} • ${browser}`;
  };

  const getLocationDisplay = (session: Session) => {
    if (session.location && session.location !== "Unknown") {
      return (
        <div className="flex items-center gap-1">
          {session.countryFlag && <span>{session.countryFlag}</span>}
          <span>{session.location}</span>
        </div>
      );
    }
    return "Unknown";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            {isSuperAdmin
              ? "All active sessions across the system"
              : isAdmin
              ? "Active sessions for your company users"
              : "Manage your active sessions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? "All active sessions across the system"
                  : isAdmin
                  ? "Active sessions for your company users"
                  : "Manage your active sessions"}
              </CardDescription>
            </div>
            {activeSessions.length > 0 && !isSuperAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAll}
                disabled={revokingAll}
              >
                {revokingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Revoke All Other Sessions
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active sessions</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Session */}
              {currentSession && !isSuperAdmin && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Current Session
                  </h3>
                  <Card className="border-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getDeviceIcon(currentSession.userAgent)}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs">
                                This Device
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {getDeviceInfo(currentSession.userAgent)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {getLocationDisplay(currentSession)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Expires{" "}
                              {formatDistanceToNow(
                                new Date(currentSession.expiresAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              IP: {currentSession.ipAddress}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Other Sessions */}
              {activeSessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Other Active Sessions ({activeSessions.length})
                  </h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {(isSuperAdmin || isAdmin) && (
                            <TableHead>User</TableHead>
                          )}
                          <TableHead>Device</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeSessions.map((session) => (
                          <TableRow key={session.id}>
                            {(isSuperAdmin || isAdmin) && (
                              <TableCell>
                                <div>
                                  <div className="font-medium text-sm">
                                    {session.userName || "Unknown User"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {session.userEmail}
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(session.userAgent)}
                                <span className="text-sm">{getDeviceInfo(session.userAgent)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {getLocationDisplay(session)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono">
                                {session.ipAddress}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(session.expiresAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeSession(session)}
                                disabled={revoking === session.id}
                              >
                                {revoking === session.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Single Session Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              {sessionToRevoke && (
                <>
                  This will immediately terminate the session from{" "}
                  <strong>{sessionToRevoke.location}</strong> (
                  {sessionToRevoke.ipAddress}). The user will need to log in
                  again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog
        open={showRevokeAllDialog}
        onOpenChange={setShowRevokeAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate all your other active sessions (
              {activeSessions.length} session
              {activeSessions.length !== 1 ? "s" : ""}). You will remain logged
              in on this device, but all other devices will need to log in
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
