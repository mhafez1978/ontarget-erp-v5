import { computeSectionDiffs } from "@/lib/storefront/section-diffs";
import { expect } from "chai";

describe("computeSectionDiffs", () => {
  it("detects added sections", () => {
    const oldSections: any[] = [];
    const newSections: any[] = [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: { title: "Hello" },
      },
    ];
    const changes = computeSectionDiffs(oldSections, newSections);
    expect(changes).to.have.length(1);
    expect(changes[0].action).to.equal("added");
  });

  it("detects removed sections", () => {
    const oldSections: any[] = [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: { title: "Hello" },
      },
    ];
    const newSections: any[] = [];
    const changes = computeSectionDiffs(oldSections, newSections);
    expect(changes).to.have.length(1);
    expect(changes[0].action).to.equal("removed");
  });

  it("detects modified sections", () => {
    const oldSections: any[] = [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: { title: "Hello" },
      },
    ];
    const newSections: any[] = [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: { title: "Hello there" },
      },
    ];
    const changes = computeSectionDiffs(oldSections, newSections);
    expect(changes).to.have.length(1);
    expect(changes[0].action).to.equal("modified");
  });
});
