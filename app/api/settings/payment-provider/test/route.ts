import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createPaymentProvider } from "@/lib/payment-providers";
import type { PaymentProviderConfig } from "@/lib/payment-providers";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    interface TestBody {
      provider?: string;
      publicKey?: string;
      secretKey?: string;
      webhookSecret?: string;
      isTestMode?: boolean;
    }

    const body = (await request.json()) as TestBody;
    const { provider, publicKey, secretKey, webhookSecret, isTestMode } = body;

    if (!provider)
      return NextResponse.json(
        { success: false, message: "Missing provider" },
        { status: 400 }
      );

    // Minimal test: ensure credentials present; if provider factory has a test hook, call it
    try {
      // Ensure the config satisfies PaymentProviderConfig (secretKey is required)
      // We'll provide empty string for secretKey if missing so the provider can validate it explicitly
      const config: PaymentProviderConfig = {
        publicKey,
        secretKey: secretKey ?? "",
        webhookSecret,
        isTestMode: isTestMode ?? true,
      };

      const impl = createPaymentProvider(provider, config);
      type ProviderImpl = {
        testConnection?: () => Promise<{ message?: string } | void>;
      };
      const implTyped = impl as ProviderImpl;
      if (implTyped && typeof implTyped.testConnection === "function") {
        const res = await implTyped.testConnection();
        return NextResponse.json({
          success: true,
          message: res?.message || "Connection successful",
        });
      }
    } catch (err) {
      console.error("Payment provider test failed:", err);
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
