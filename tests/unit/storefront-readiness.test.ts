import { expect } from "chai";
import { checkStorefrontReadiness } from "@/lib/storefront-readiness";

describe("storefront readiness checks", () => {
  it("counts testimonials correctly and marks missing when zero", () => {
    const data = {
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

    const readiness = checkStorefrontReadiness(data as any);

    expect(readiness.counts.testimonials).to.equal(0);
    expect(readiness.counts.customers).to.equal(0);
    expect(readiness.missing.customers).to.be.true;
    expect(readiness.missing.testimonials).to.be.true;
    expect(readiness.warnings).to.include(
      "No customer testimonials. Social proof is crucial."
    );
  });

  it("awards points when testimonials are present", () => {
    const data = {
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

    const readiness = checkStorefrontReadiness(data as any);

    expect(readiness.counts.testimonials).to.equal(4);
    expect(readiness.counts.customers).to.equal(10);
    expect(readiness.missing.customers).to.be.false;
    expect(readiness.missing.testimonials).to.be.false;
    // the score should be increased due to testimonial points
    expect(readiness.score).to.be.greaterThan(0);
  });
});
