import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { createSession } from "@/lib/session-manager";

const completeSchema = z.object({
  token: z.string(),
  plan: z.enum(["ESSENTIAL", "GROWTH", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).optional().default("MONTHLY"),
  paymentMethodId: z.string(),
  stripeCustomerId: z.string().optional(),
  billingAddress: z
    .object({
      addressLine1: z.string(),
      addressLine2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      countryCode: z.string(),
      postalCode: z.string(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { token, plan, paymentMethodId, stripeCustomerId, billingAddress, billingCycle } = parsed.data;

    const onboarding = await db.oAuthOnboarding.findUnique({ where: { token }, include: { user: true } });

    if (!onboarding) {
      return NextResponse.json({ error: "Invalid onboarding token" }, { status: 404 });
    }

    if (onboarding.isUsed) {
      return NextResponse.json({ error: "Onboarding already completed" }, { status: 400 });
    }

    if (new Date() > onboarding.expiresAt) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_EXPIRED,
        userId: onboarding.userId,
        description: `Expired OAuth onboarding token attempted to complete for ${onboarding.user.email}`,
        metadata: { token: onboarding.token },
      }).catch(console.error);

      return NextResponse.json({ error: "Onboarding token expired" }, { status: 400 });
    }

    // Only support root onboarding here
    if (onboarding.context !== "root") {
      return NextResponse.json({ error: "Invalid onboarding context" }, { status: 400 });
    }

    // Finalize onboarding in a transaction
    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      // Update user plan & payment method
      const updatedUser = await tx.user.update({
        where: { id: onboarding.userId },
        data: {
          plan,
          billingCycle,

          ...(billingAddress && {
            addressLine1: billingAddress.addressLine1,
            addressLine2: billingAddress.addressLine2 || undefined,
            city: billingAddress.city,
            state: billingAddress.state,
            country: billingAddress.country,
            countryCode: billingAddress.countryCode,
            postalCode: billingAddress.postalCode,
          }),
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

    // Audit completion
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_COMPLETED,
      userId: result.user.id,
      description: `OAuth onboarding completed for ${result.user.email}`,
      metadata: { token: token, plan },
    }).catch(console.error);

    // Create session and set cookie
    const session = await createSession({ userId: result.user.id, request });

    const response = NextResponse.json({ success: true, message: "Onboarding completed", plan });
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
      metadata: { error: error instanceof Error ? error.message : String(error) },
    }).catch(console.error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
