import crypto from "crypto";
import { NextResponse } from "next/server";

const PENDING_COOKIE = "mfa_pending";
const FIVE_MINUTES = 60 * 5;

interface PendingMfaPayload {
  userId: string;
  email?: string | null;
  provider?: string | null;
  exp: number;
  nonce: string;
}

function getSecret() {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "dev-mfa-secret"
  );
}

export function createPendingMfaToken(
  userId: string,
  email?: string | null,
  provider?: string | null
): string {
  const payload: PendingMfaPayload = {
    userId,
    email: email || null,
    provider: provider || null,
    exp: Math.floor(Date.now() / 1000) + FIVE_MINUTES,
    nonce: crypto.randomUUID(),
  };

  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(base)
    .digest("base64url");
  return `${base}.${sig}`;
}

export function verifyPendingMfaToken(
  token: string | undefined | null
): PendingMfaPayload | null {
  if (!token) return null;
  const [base, sig] = token.split(".");
  if (!base || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(base)
    .digest("base64url");

  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(base, "base64url").toString("utf8")
    ) as PendingMfaPayload;

    if (payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export function buildMfaRedirectResponse(
  appUrl: string,
  token: string,
  provider?: string | null
) {
  const url = new URL("/login/mfa", appUrl);
  if (provider) {
    url.searchParams.set("provider", provider);
  }

  const response = NextResponse.redirect(url.toString());
  response.cookies.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: FIVE_MINUTES,
    path: "/",
  });
  return response;
}

export function clearPendingMfaCookie(response: NextResponse) {
  response.cookies.set(PENDING_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export { PENDING_COOKIE };
