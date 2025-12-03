import { NextRequest, NextResponse } from "next/server";
import { PENDING_COOKIE, verifyPendingMfaToken } from "@/lib/mfa-pending";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(PENDING_COOKIE)?.value;
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
