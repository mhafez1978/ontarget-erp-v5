import { expect } from "chai";
import { getPriceIdForPlan } from "@/lib/payments/service";

describe("payments service helpers", () => {
  it("returns priceId from gateway config mapping", () => {
    const gateway = {
      config: {
        prices: {
          GROWTH: { priceId: "price_abc" },
          ESSENTIAL: { priceId: "price_xyz" },
        },
      },
    } as any;

    expect(getPriceIdForPlan(gateway, "GROWTH")).to.equal("price_abc");
    expect(getPriceIdForPlan(gateway, "ESSENTIAL")).to.equal("price_xyz");
    expect(getPriceIdForPlan(gateway, "UNKNOWN")).to.equal(null);
  });

  it("maps priceId back to plan", () => {
    const gateway = {
      config: {
        prices: {
          GROWTH: { priceId: "price_abc" },
          ESSENTIAL: { priceId: "price_xyz" },
        },
      },
    } as any;

    expect(getPriceIdForPlan(gateway, "GROWTH")).to.equal("price_abc");
    expect(
      (require("@/lib/payments/service").getPlanFromPriceId as any)(
        gateway,
        "price_abc"
      )
    ).to.equal("GROWTH");
    expect(
      (require("@/lib/payments/service").getPlanFromPriceId as any)(
        gateway,
        "unknown"
      )
    ).to.equal(null);
  });
});
