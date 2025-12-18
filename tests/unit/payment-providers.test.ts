import { expect } from "chai";
import {
  createPaymentProvider,
  getSupportedProviders,
} from "@/lib/payment-providers";
import { StripeProvider } from "@/lib/payment-providers/stripe";
import { PayPalProvider } from "@/lib/payment-providers/paypal";

describe("payment providers factory", () => {
  it("returns concrete providers and errors for unsupported", () => {
    const stripe = createPaymentProvider("stripe", {
      secretKey: "sk_test_123",
      isTestMode: true,
    });
    const paypal = createPaymentProvider("paypal", {
      secretKey: "secret",
      isTestMode: true,
    });
    expect(stripe).to.be.instanceOf(StripeProvider);
    expect(paypal).to.be.instanceOf(PayPalProvider);
    expect(() =>
      createPaymentProvider("square", { secretKey: "x", isTestMode: true })
    ).to.throw("not yet implemented");
    expect(() =>
      createPaymentProvider("unknown", { secretKey: "x", isTestMode: true })
    ).to.throw(/Failed to create provider.*unsupported/i);
  });

  it("lists supported providers", () => {
    const list = getSupportedProviders();
    expect(list.map((p) => p.id)).to.include.members(["stripe", "paypal"]);
  });
});

// Intentionally not patching Stripe internals in unit tests to keep TS types strict and tests hermetic.
// Note: We avoid patching Stripe internals in unit tests to keep TS types strict and tests hermetic.
