import { expect } from "chai";
import { checkSequentialUpload } from "@/lib/onboarding";

describe("Onboarding sequential upload helper", () => {
  it("allows first required doc (SSN_CARD) when no docs uploaded", () => {
    const res = checkSequentialUpload("SSN_CARD", []);
    expect(res.ok).to.equal(true);
  });

  it("allows DRIVERS_LICENSE if SSN_CARD uploaded", () => {
    const res = checkSequentialUpload("DRIVERS_LICENSE", ["SSN_CARD"]);
    expect(res.ok).to.equal(true);
  });

  it("rejects W4_TAX_FORM when DRIVERS_LICENSE missing", () => {
    const res = checkSequentialUpload("W4_TAX_FORM", ["SSN_CARD"]);
    expect(res.ok).to.equal(false);
    expect(res.missingPrereqs).to.eql(["DRIVERS_LICENSE"]);
  });

  it("allows I9_FORM when earlier steps are uploaded", () => {
    const res = checkSequentialUpload("I9_FORM", ["SSN_CARD", "DRIVERS_LICENSE", "W4_TAX_FORM"]);
    expect(res.ok).to.equal(true);
  });

  it("allows optional docs at any time", () => {
    const res = checkSequentialUpload("WORK_AUTHORIZATION", []);
    expect(res.ok).to.equal(true);
  });
});
