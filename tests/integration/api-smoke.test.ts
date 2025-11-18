import { expect } from "chai";
import { startNext, stopNext, baseUrl } from "./server";

describe("Integration: API smoke", function () {
  this.timeout(60000);

  before(async () => {
    await startNext();
  });

  after(async () => {
    await stopNext();
  });

  it("unauthenticated POST /api/plaid/create-link-token -> 401", async () => {
    const res = await fetch(`${baseUrl}/api/plaid/create-link-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companyId: "fake" }),
    });
    expect(res.status).to.equal(401);
  });

  it("unauthenticated GET /api/company/payment-gateways -> 401", async () => {
    const res = await fetch(`${baseUrl}/api/company/payment-gateways`);
    expect(res.status).to.be.oneOf([401, 403]);
  });

  it("public GET /api/get-location -> 200", async () => {
    const res = await fetch(`${baseUrl}/api/get-location`);
    expect(res.status).to.equal(200);
    const body = await res.json();
    expect(body).to.have.property("ip");
  });
});
