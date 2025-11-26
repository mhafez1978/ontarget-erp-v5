import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PENDING_COOKIE, verifyPendingMfaToken } from "@/lib/mfa-pending";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_COOKIE)?.value;
  const payload = verifyPendingMfaToken(token);

  if (!payload) {
    return NextResponse.json({ pending: false }, { status: 401 });
  }

  return NextResponse.json({
    pending: true,
    userId: payload.userId,
    email: payload.email,
    provider: payload.provider,
  });
}
