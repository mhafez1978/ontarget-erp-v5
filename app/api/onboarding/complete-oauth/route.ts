import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { createSession } from "@/lib/session-manager";
import { sendEmail, getWelcomeCustomerEmail } from "@/lib/email-service";
import { getPlanPrice } from "@/lib/plan-prices";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Helper to extract client IP from request headers
function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

const completeSchema = z.object({
  token: z.string(),
  plan: z.enum(["ESSENTIAL", "GROWTH", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).optional().default("MONTHLY"),
  paymentMethodId: z.string(),
  stripeCustomerId: z.string().optional(),
  billingAddress: z.object({
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    countryCode: z.string().min(1, "Country code is required"),
    postalCode: z.string().min(1, "Postal code is required"),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 attempts per hour per IP
    const clientIp = getClientIp(request) || "unknown";
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.OAUTH_COMPLETE);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many signup attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const {
      token,
      plan,
      paymentMethodId,
      stripeCustomerId,
      billingAddress,
      billingCycle,
    } = parsed.data;

    const onboarding = await db.oAuthOnboarding.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: "Invalid onboarding token" },
        { status: 404 }
      );
    }

    if (onboarding.isUsed) {
      return NextResponse.json(
        { error: "Onboarding already completed" },
        { status: 400 }
      );
    }

    if (new Date() > onboarding.expiresAt) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_EXPIRED,
        userId: onboarding.userId,
        description: `Expired OAuth onboarding token attempted to complete for ${onboarding.user.email}`,
        metadata: { token: onboarding.token },
      }).catch(console.error);

      return NextResponse.json(
        { error: "Onboarding token expired" },
        { status: 400 }
      );
    }

    // Only support root onboarding here
    if (onboarding.context !== "root") {
      return NextResponse.json(
        { error: "Invalid onboarding context" },
        { status: 400 }
      );
    }

    // Server-side price validation to prevent tampering
    try {
      const expectedPrice = getPlanPrice(plan, billingCycle);
      console.log(
        `[OAuth Complete] Plan: ${plan}, Cycle: ${billingCycle}, Expected Price: $${expectedPrice}`
      );
      // Note: Actual payment amount should be validated in payment processing
      // This ensures the plan selection is valid
    } catch (error) {
      console.error("[OAuth Complete] Invalid plan configuration:", error);
      return NextResponse.json(
        { error: "Invalid plan or billing cycle" },
        { status: 400 }
      );
    }

    // Finalize onboarding in a transaction
    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      // Update user plan, billing cycle, and billing address
      const updatedUser = await tx.user.update({
        where: { id: onboarding.userId },
        data: {
          plan,
          billingCycle,
          addressLine1: billingAddress.addressLine1,
          addressLine2: billingAddress.addressLine2 || undefined,
          city: billingAddress.city,
          state: billingAddress.state,
          country: billingAddress.country,
          countryCode: billingAddress.countryCode,
          postalCode: billingAddress.postalCode,
        },
      });

      // Persist stripe customer external id if provided
      try {
        if (stripeCustomerId) {
          await tx.customerPaymentProvider.create({
            data: {
              userId: updatedUser.id,
              provider: "STRIPE",
              externalId: stripeCustomerId,
              metadata: paymentMethodId ? { paymentMethodId } : undefined,
            },
          });
        }
      } catch (err) {
        console.error("Failed to store payment provider info:", err);
      }

      // Mark onboarding as used
      await tx.oAuthOnboarding.update({
        where: { id: onboarding.id },
        data: { isUsed: true, usedAt: now, completedAt: now },
      });

      return { user: updatedUser };
    });

    // Audit completion with geo-location data
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_COMPLETED,
      userId: result.user.id,
      description: `OAuth onboarding completed for ${result.user.email}`,
      metadata: { token: token, plan },
      ipAddress: clientIp,
    }).catch(console.error);

    // Send welcome email after successful onboarding
    const userEmail = result.user.email;
    if (userEmail) {
      try {
        // TypeScript narrowing workaround
        const verifiedEmail: string = userEmail;
        const userName = result.user.name || verifiedEmail;

        console.log(
          `[OAuth Onboarding] Sending welcome email to: ${verifiedEmail}`
        );
        const { subject, html } = await getWelcomeCustomerEmail(
          userName,
          verifiedEmail
        );
        await sendEmail({
          to: verifiedEmail,
          subject,
          html,
        });
        console.log(
          `[OAuth Onboarding] Welcome email sent successfully to: ${verifiedEmail}`
        );

        // Log welcome email sent
        await createAuditLog({
          action: AUDIT_ACTIONS.WELCOME_EMAIL_SENT,
          userId: result.user.id,
          entityType: "User",
          entityId: result.user.id,
          description: `Welcome email sent after OAuth onboarding: ${verifiedEmail}`,
          metadata: {
            email: verifiedEmail,
            userName: result.user.name,
            plan: plan,
            subject,
          },
        });
      } catch (emailError) {
        console.error(
          "[OAuth Onboarding] Failed to send welcome email:",
          emailError
        );
        // Log email failure but don't block onboarding completion
        await createAuditLog({
          action: AUDIT_ACTIONS.EMAIL_FAILED,
          userId: result.user.id,
          entityType: "User",
          entityId: result.user.id,
          description: `Failed to send welcome email after OAuth onboarding`,
          metadata: {
            error:
              emailError instanceof Error
                ? emailError.message
                : String(emailError),
          },
        }).catch(console.error);
      }
    } else {
      console.error(
        "[OAuth Onboarding] Cannot send welcome email: user email is null"
      );
    }

    // Create session and set cookie
    const session = await createSession({ userId: result.user.id, request });

    const response = NextResponse.json({
      success: true,
      message: "Onboarding completed",
      plan,
    });
    response.cookies.set("sessionToken", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error completing OAuth onboarding:", error);
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_COMPLETION_FAILED,
      description: "Error completing OAuth onboarding",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    }).catch(console.error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
