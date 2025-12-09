import { expect } from "chai";
import { checkStorefrontReadiness } from "@/lib/storefront-readiness";

interface StorefrontData {
  productsCount: number;
  servicesCount: number;
  teamMembersCount: number;
  testimonialsCount: number;
  customersCount?: number;
  hasBanner: boolean;
  hasLogo: boolean;
  hasDescription: boolean;
  hasContactInfo: boolean;
  isStoreEnabled: boolean;
}

describe("storefront readiness checks", () => {
  it("counts testimonials correctly and marks missing when zero", () => {
    const data: StorefrontData = {
      productsCount: 5,
      servicesCount: 2,
      teamMembersCount: 1,
      customersCount: 0,
      testimonialsCount: 0,
      hasBanner: true,
      hasLogo: true,
      hasDescription: true,
      hasContactInfo: true,
      isStoreEnabled: true,
    };

    const readiness = checkStorefrontReadiness(data);

    expect(readiness.counts.testimonials).to.equal(0);
    expect(readiness.counts.customers).to.equal(0);
    expect(readiness.missing.customers).to.be.true; // eslint-disable-line @typescript-eslint/no-unused-expressions
    expect(readiness.missing.testimonials).to.be.true; // eslint-disable-line @typescript-eslint/no-unused-expressions
    expect(readiness.warnings).to.include(
      "No customer testimonials. Social proof is crucial."
    );
  });

  it("awards points when testimonials are present", () => {
    const data: StorefrontData = {
      productsCount: 5,
      servicesCount: 2,
      teamMembersCount: 3,
      customersCount: 10,
      testimonialsCount: 4,
      hasBanner: true,
      hasLogo: true,
      hasDescription: true,
      hasContactInfo: true,
      isStoreEnabled: true,
    };

    const readiness = checkStorefrontReadiness(data);

    expect(readiness.counts.testimonials).to.equal(4);
    expect(readiness.counts.customers).to.equal(10);
    expect(readiness.missing.customers).to.be.false; // eslint-disable-line @typescript-eslint/no-unused-expressions
    expect(readiness.missing.testimonials).to.be.false; // eslint-disable-line @typescript-eslint/no-unused-expressions
    // the score should be increased due to testimonial points
    expect(readiness.score).to.be.greaterThan(0);
  });
});
