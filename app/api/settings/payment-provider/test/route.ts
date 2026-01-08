import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createPaymentProvider } from "@/lib/payment-providers";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const body = await request.json();
    const { provider, publicKey, secretKey, webhookSecret, isTestMode } =
      body as any;

    if (!provider)
      return NextResponse.json(
        { success: false, message: "Missing provider" },
        { status: 400 }
      );

    // Minimal test: ensure credentials present; if provider factory has a test hook, call it
    try {
      const impl = createPaymentProvider(provider, {
        publicKey,
        secretKey,
        webhookSecret,
        isTestMode,
      });
      if (impl && typeof (impl as any).testConnection === "function") {
        const res = await (impl as any).testConnection();
        return NextResponse.json({
          success: true,
          message: res?.message || "Connection successful",
        });
      }
    } catch (err) {
      console.warn("Payment provider test failed:", err);
      return NextResponse.json(
        { success: false, message: String(err) },
        { status: 400 }
      );
    }

    // Fallback basic validation
    if (publicKey && secretKey)
      return NextResponse.json({
        success: true,
        message: "Credentials look valid",
      });

    return NextResponse.json(
      { success: false, message: "Missing credentials" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/settings/payment-provider/test error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to test provider" },
      { status: 500 }
    );
  }
}
