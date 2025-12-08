/**
 * Session Management Library
 *
 * Provides secure session management for SOC 2 and FedRAMP compliance.
 *
 * Features:
 * - Session creation with geo-tracking
 * - Session validation and expiration
 * - Session refresh/extension
 * - Session revocation (single or all)
 * - Suspicious activity detection
 * - Multi-session management
 *
 * Security:
 * - Random session tokens (UUID v4)
 * - IP address validation
 * - Geographic location tracking
 * - Automatic expiration
 * - Activity tracking
 */

import { db } from "@/lib/db";
import crypto from "crypto";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export interface GeoLocation {
  ip?: string;
  ipv4?: string;
  ipv6?: string;
  city?: string;
  region?: string;
  country?: string;
  country_name?: string;
  country_code?: string;
  flag?: string;
}

export interface SessionData {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  sessionIpAddress: string | null;
  sessionIpv4: string | null;
  sessionIpv6: string | null;
  sessionCity: string | null;
  sessionState: string | null;
  sessionCountry: string | null;
  sessionCountryFlag: string | null;
}

export interface CreateSessionOptions {
  userId: string;
  geoLocation?: GeoLocation;
  userAgent?: string;
  expiresInDays?: number; // Default: 7 days
  request?: NextRequest;
}

type HeaderLike = { get(name: string): string | null };

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in (value as Record<string, unknown>)
  );
}

async function fetchServerGeoLocation(
  req?: NextRequest
): Promise<GeoLocation | null> {
  try {
    let headerStore: (Headers & HeaderLike) | HeaderLike | null = null;

    if (req?.headers) {
      headerStore = req.headers;
    } else {
      try {
        const maybeHeaders = headers();
        headerStore = isPromise<HeaderLike>(maybeHeaders)
          ? await maybeHeaders
          : (maybeHeaders as HeaderLike);
      } catch {
        headerStore = null;
      }
    }

    if (!headerStore && !req) {
      return null;
    }

    const forwardedFor = headerStore?.get("x-forwarded-for") || "";
    const realIp = headerStore?.get("x-real-ip") || "";

    const appUrl =
      req?.nextUrl?.origin ||
      process.env.INTERNAL_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    const response = await fetch(new URL("/api/get-location", appUrl), {
      method: "GET",
      headers: {
        "x-forwarded-for": forwardedFor,
        "x-real-ip": realIp,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      ip: data.ip,
      ipv4: data.ipv4,
      ipv6: data.ipv6,
      city: data.city,
      region: data.region,
      country: data.country_name || data.country,
      country_name: data.country_name,
      country_code: data.country_code,
      flag: data.flag,
    };
  } catch (error) {
    console.error("[Session] Failed to fetch geo location:", error);
    return null;
  }
}

export interface ValidateSessionResult {
  valid: boolean;
  session?: SessionData;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    plan: string;
    image: string | null;
  };
  reason?: string;
}

/**
 * Create a new session for a user
 */
export async function createSession(
  options: CreateSessionOptions
): Promise<SessionData> {
  const { userId, userAgent, expiresInDays = 7 } = options;

  let sessionGeo = options.geoLocation;
  if (!sessionGeo) {
    sessionGeo = (await fetchServerGeoLocation(options.request)) ?? undefined;
  }

  if (!sessionGeo && options.request) {
    sessionGeo = (await fetchServerGeoLocation()) ?? undefined;
  }

  // Generate random session token
  const sessionToken = crypto.randomUUID();

  // Calculate expiration
  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);

  // Create session record
  const session = await db.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      sessionIpAddress: sessionGeo?.ip || null,
      sessionIpv4: sessionGeo?.ipv4 || null,
      sessionIpv6: sessionGeo?.ipv6 || null,
      sessionCity: sessionGeo?.city || null,
      sessionState: sessionGeo?.region || null,
      sessionCountry: sessionGeo?.country_name || sessionGeo?.country || null,
      sessionCountryFlag: sessionGeo?.flag || null,
      sessionUserAgent: userAgent || null,
    },
  });

  return session;
}

/**
 * Validate a session token and return user data
 */
export async function validateSession(
  sessionToken: string,
  options?: {
    validateIp?: boolean;
    currentIp?: string;
  }
): Promise<ValidateSessionResult> {
  if (!sessionToken) {
    return { valid: false, reason: "No session token provided" };
  }

  try {
    // Get session with user data
    const session = await db.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            image: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    // Check if session is expired
    if (session.expires < new Date()) {
      // Clean up expired session
      await db.session.delete({ where: { id: session.id } });
      return { valid: false, reason: "Session expired" };
    }

    // Check if user account is active
    if (!session.user.isActive) {
      return { valid: false, reason: "User account is inactive" };
    }

    // Optional: Validate IP address hasn't changed (stricter security)
    if (options?.validateIp && options?.currentIp) {
      if (
        session.sessionIpAddress &&
        session.sessionIpAddress !== options.currentIp
      ) {
        // IP changed - potential session hijacking
        // For now, we'll allow it but log it
        console.warn(
          `[Security] IP address changed for session ${session.id}:`,
          {
            original: session.sessionIpAddress,
            current: options.currentIp,
            userId: session.userId,
          }
        );
        // In stricter mode, you would return { valid: false, reason: "IP address mismatch" }
      }
    }

    return {
      valid: true,
      session: session as SessionData,
      user: session.user,
    };
  } catch (error) {
    console.error("[Session Validation Error]:", error);
    return { valid: false, reason: "Session validation failed" };
  }
}

/**
 * Refresh/extend a session (update expiration)
 */
export async function refreshSession(
  sessionToken: string,
  expiresInDays: number = 7
): Promise<boolean> {
  try {
    const newExpires = new Date();
    newExpires.setDate(newExpires.getDate() + expiresInDays);

    // Use updateMany so we don't get a P2025 when the session is missing
    // (e.g. expired/removed but token still in client cookie). updateMany
    // will return a count and won't throw if nothing was updated.
    const result = await db.session.updateMany({
      where: { sessionToken },
      data: { expires: newExpires },
    });

    return result.count > 0;
  } catch (error) {
    console.error("[Session Refresh Error]:", error);
    return false;
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionToken: string): Promise<boolean> {
  try {
    // deleteMany avoids throwing if the session record doesn't exist.
    const result = await db.session.deleteMany({ where: { sessionToken } });
    return result.count > 0;
  } catch (error) {
    console.error("[Session Revoke Error]:", error);
    return false;
  }
}

/**
 * Revoke a specific session by ID
 */
export async function revokeSessionById(sessionId: string): Promise<boolean> {
  try {
    // delete by id is expected, but use deleteMany for safety to avoid
    // Prisma errors if the record is missing.
    const result = await db.session.deleteMany({ where: { id: sessionId } });
    return result.count > 0;
  } catch (error) {
    console.error("[Session Revoke Error]:", error);
    return false;
  }
}

/**
 * Revoke all sessions for a user (except optionally the current one)
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionToken?: string
): Promise<number> {
  try {
    const result = await db.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionToken && {
          sessionToken: { not: exceptSessionToken },
        }),
      },
    });
    return result.count;
  } catch (error) {
    console.error("[Revoke All Sessions Error]:", error);
    return 0;
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const sessions = await db.session.findMany({
      where: {
        userId,
        expires: { gte: new Date() }, // Only active sessions
      },
      orderBy: {
        expires: "desc",
      },
    });

    return sessions;
  } catch (error) {
    console.error("[Get User Sessions Error]:", error);
    return [];
  }
}

/**
 * Clean up expired sessions (run this periodically via cron)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await db.session.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });
    return result.count;
  } catch (error) {
    console.error("[Cleanup Expired Sessions Error]:", error);
    return 0;
  }
}

/**
 * Detect suspicious activity for a user
 * Returns true if suspicious patterns detected
 */
export async function detectSuspiciousActivity(userId: string): Promise<{
  suspicious: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];

  try {
    const sessions = await db.session.findMany({
      where: {
        userId,
        expires: { gte: new Date() },
      },
    });

    // Check 1: Too many active sessions (> 10)
    if (sessions.length > 10) {
      reasons.push(`Unusual number of active sessions: ${sessions.length}`);
    }

    // Check 2: Multiple different countries
    const countries = new Set(
      sessions
        .map((s) => s.sessionCountry)
        .filter((c): c is string => c !== null)
    );
    if (countries.size > 3) {
      reasons.push(
        `Sessions from multiple countries: ${Array.from(countries).join(", ")}`
      );
    }

    // Check 3: Multiple different cities in short time
    const recentSessions = sessions.filter(
      (s) =>
        new Date(s.expires).getTime() - new Date().getTime() <
        24 * 60 * 60 * 1000
    );
    const cities = new Set(
      recentSessions
        .map((s) => s.sessionCity)
        .filter((c): c is string => c !== null)
    );
    if (cities.size > 5) {
      reasons.push(
        `Many different locations in 24 hours: ${Array.from(cities).join(", ")}`
      );
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  } catch (error) {
    console.error("[Detect Suspicious Activity Error]:", error);
    return { suspicious: false, reasons: [] };
  }
}

/**
 * Get session statistics for a user
 */
export async function getSessionStats(userId: string) {
  try {
    const sessions = await getUserSessions(userId);

    const countries = new Set(
      sessions
        .map((s) => s.sessionCountry)
        .filter((c): c is string => c !== null)
    );
    const cities = new Set(
      sessions.map((s) => s.sessionCity).filter((c): c is string => c !== null)
    );

    return {
      totalSessions: sessions.length,
      countries: Array.from(countries),
      cities: Array.from(cities),
      oldestSession: sessions[sessions.length - 1],
      newestSession: sessions[0],
    };
  } catch (error) {
    console.error("[Get Session Stats Error]:", error);
    return null;
  }
}
