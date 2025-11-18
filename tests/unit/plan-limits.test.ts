import { expect } from "chai";
import {
  PLAN_LIMITS,
  hasReachedLimit,
  getRemainingCount,
  type PlanType,
} from "@/lib/plan-limits";

describe("plan limits", () => {
  it("detects reaching finite limits", () => {
    const plan: PlanType = "ESSENTIAL";
    const limit = PLAN_LIMITS[plan].companies; // 1
    expect(hasReachedLimit(limit - 1, plan, "companies")).to.equal(false);
    expect(hasReachedLimit(limit, plan, "companies")).to.equal(true);
  });

  it("treats Infinity as unlimited", () => {
    const plan: PlanType = "ENTERPRISE";
    expect(hasReachedLimit(10_000, plan, "companies")).to.equal(false);
    expect(getRemainingCount(10_000, plan, "companies")).to.equal("unlimited");
  });

  it("computes remaining count and never negative", () => {
    const plan: PlanType = "GROWTH";
    const limit = PLAN_LIMITS[plan].customers; // 300
    expect(getRemainingCount(0, plan, "customers")).to.equal(limit);
    expect(getRemainingCount(limit + 5, plan, "customers")).to.equal(0);
  });
});
