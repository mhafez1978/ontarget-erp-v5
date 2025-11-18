/**
 * Session Validation Helper for API Routes
 *
 * Provides a simple way to validate sessions in API routes
 * and return standardized error responses.
 *
 * Usage:
 * ```typescript
 * import { validateSessionForAPI } from "@/lib/validate-session";
 *
 * export async function POST(request: NextRequest) {
 *   const validation = await validateSessionForAPI(request);
 *   if (!validation.valid) {
 *     return validation.response; // Returns appropriate error response
 *   }
 *
 *   const { user, session } = validation;
 *   // Continue with authenticated request
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, type ValidateSessionResult } from "./session-manager";

export interface SessionValidationSuccess {
  valid: true;
  user: NonNullable<ValidateSessionResult["user"]>;
  session: NonNullable<ValidateSessionResult["session"]>;
}

export interface SessionValidationError {
  valid: false;
  response: NextResponse;
  reason: string;
}

export type SessionValidation =
  | SessionValidationSuccess
  | SessionValidationError;

/**
 * Validate session from request cookies
 * Returns user data if valid, or error response if invalid
 */
export async function validateSessionForAPI(
  request: NextRequest
): Promise<SessionValidation> {
  try {
    // Get session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: "Unauthorized - No session token" },
          { status: 401 }
        ),
        reason: "No session token",
      };
    }

    // Get client IP for validation
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null;

    // Validate session
    const validation = await validateSession(sessionToken, {
      validateIp: false, // Set to true for stricter security
      currentIp: clientIp || undefined,
    });

    if (!validation.valid || !validation.user || !validation.session) {
      return {
        valid: false,
        response: NextResponse.json(
          {
            error: `Unauthorized - ${validation.reason || "Invalid session"}`,
          },
          { status: 401 }
        ),
        reason: validation.reason || "Invalid session",
      };
    }

    return {
      valid: true,
      user: validation.user,
      session: validation.session,
    };
  } catch (error) {
    console.error("[Session Validation Error]:", error);
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Session validation failed" },
        { status: 500 }
      ),
      reason: "Validation error",
    };
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(
  user: SessionValidationSuccess["user"],
  roles: string | string[]
): boolean {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Validate session and check for specific role
 */
export async function validateSessionWithRole(
  request: NextRequest,
  requiredRoles: string | string[]
): Promise<SessionValidation> {
  const validation = await validateSessionForAPI(request);

  if (!validation.valid) {
    return validation;
  }

  if (!hasRole(validation.user, requiredRoles)) {
    return {
      valid: false,
      response: NextResponse.json(
        {
          error: `Forbidden - Requires ${
            Array.isArray(requiredRoles)
              ? requiredRoles.join(" or ")
              : requiredRoles
          } role`,
        },
        { status: 403 }
      ),
      reason: "Insufficient permissions",
    };
  }

  return validation;
}
