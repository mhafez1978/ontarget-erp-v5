import { expect } from "chai";
import { db } from "@/lib/db";

describe("Storefront v2 models", () => {
  it("can create conversation, message, and spec version", async () => {
    // Create a temporary user
    const user = await db.user.create({
      data: {
        name: "v2-test",
        email: `v2-test-${Date.now()}@example.com`,
        role: "SUPER_ADMIN",
      },
    });

    // Create a temporary company
    const company = await db.company.create({
      data: { name: `v2-co-${Date.now()}`, ownerId: user.id },
    });

    // Create a conversation
    const conv = await db.storefrontConversation.create({
      data: { companyId: company.id, createdBy: user.id },
    });
    expect(conv).to.have.property("id");

    // Create a message
    const msg = await db.storefrontMessage.create({
      data: { conversationId: conv.id, role: "user", content: "Hello AI" },
    });
    expect(msg).to.have.property("id");

    // Create spec version
    const specVersion = await db.storefrontSpecVersion.create({
      data: {
        companyId: company.id,
        spec: {
          version: 1,
          meta: {
            layoutStyle: "hero-left",
            tone: "serious",
            primaryColor: "#000",
            secondaryColor: "#fff",
            accentColor: "#0f0",
          },
          sections: [],
        },
        createdBy: user.id,
      },
    });
    expect(specVersion).to.have.property("id");

    // Link message to spec version
    const updatedMsg = await db.storefrontMessage.update({
      where: { id: msg.id },
      data: { specVersionId: specVersion.id },
    });
    expect(updatedMsg.specVersionId).to.equal(specVersion.id);
  }).timeout(10000);
});
