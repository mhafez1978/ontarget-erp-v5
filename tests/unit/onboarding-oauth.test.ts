import { expect } from "chai";
import sinon from "sinon";

import * as dbModule from "@/lib/db";
import * as audit from "@/lib/audit-log";
import * as sessionManager from "@/lib/session-manager";

// Import route handlers
import * as verifyRoute from "@/app/api/onboarding/verify-oauth-token/route";
import * as completeRoute from "@/app/api/onboarding/complete-oauth/route";

describe("OAuth Onboarding API", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("returns 404 for invalid token on verify", async () => {
    // Stub DB to return null by replacing the `db` export with a fake client
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(null) },
    } as any);

    const req = new Request(
      "http://localhost/api/onboarding/verify-oauth-token?token=bad"
    );
    const res = await verifyRoute.GET(req as any);

    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body.error).to.equal("Invalid onboarding token");
  });

  it("returns expired for a token past expiry", async () => {
    const fake = {
      token: "t",
      expiresAt: new Date(Date.now() - 1000),
      user: { id: "u1", name: "Test", email: "a@b.c" },
      isUsed: false,
      requestedPlan: null,
    } as any;

    // Replace db with a fake that resolves to the expired record
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(fake) },
    } as any);
    sandbox.stub(audit, "createAuditLog").resolves(null as any);

    const req = new Request(
      "http://localhost/api/onboarding/verify-oauth-token?token=t"
    );
    const res = await verifyRoute.GET(req as any);

    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.error).to.equal("Onboarding token expired");
    expect(body.expired).to.equal(true);
  });

  it("verifies a valid token and returns user info", async () => {
    const now = new Date(Date.now() + 1000 * 60 * 60);
    const fake = {
      token: "t2",
      expiresAt: now,
      isUsed: false,
      requestedPlan: "ESSENTIAL",
      user: { id: "u2", name: "UserTwo", email: "two@example.com" },
    } as any;

    // Replace db with a fake that resolves to the valid record
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(fake) },
    } as any);
    sandbox.stub(audit, "createAuditLog").resolves(null as any);

    const req = new Request(
      "http://localhost/api/onboarding/verify-oauth-token?token=t2"
    );
    const res = await verifyRoute.GET(req as any);

    expect(res.status).to.equal(200);
    const body = await res.json();
    expect(body.valid).to.equal(true);
    expect(body.user.email).to.equal("two@example.com");
    expect(body.requestedPlan).to.equal("ESSENTIAL");
    // No company for root OAuth onboarding; ensure requestedPlan present
    expect(body.requestedPlan).to.equal("ESSENTIAL");
  });

  it("completes onboarding, persists payment provider and sets session cookie", async () => {
    // Arrange
    const token = "complete123";
    const onboardingRecord = {
      id: "on1",
      token,
      userId: "u3",
      isUsed: false,
      context: "root",
      user: { id: "u3", email: "three@ex.com", name: "Three" },
    } as any;

    // Replace the db export with one that has findUnique and $transaction
    const txStub = {
      user: {
        update: sinon
          .stub()
          .resolves({ id: "u3", email: "three@ex.com", plan: "ESSENTIAL" }),
      },
      customerPaymentProvider: {
        create: sinon.stub().resolves({ id: "cpp1" }),
      },
      oAuthOnboarding: {
        update: sinon.stub().resolves(true),
      },
    } as any;

    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(onboardingRecord) },
      $transaction: sinon.stub().callsFake(async (fn: any) => fn(txStub)),
    } as any);

    // Stub audit and session creation
    sandbox.stub(audit, "createAuditLog").resolves(null as any);
    sandbox
      .stub(sessionManager, "createSession")
      .resolves({ sessionToken: "session-xyz" } as any);

    const body = {
      token,
      plan: "ESSENTIAL",
      billingCycle: "MONTHLY",
      paymentMethodId: "pm_123",
      stripeCustomerId: "cus_abc",
    };

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const res = await completeRoute.POST(req as any);

    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json.success).to.equal(true);

    // check that tx created a customerPaymentProvider with externalId
    sinon.assert.calledWith(
      txStub.customerPaymentProvider.create as sinon.SinonStub,
      sinon.match({
        data: sinon.match({ provider: "STRIPE", externalId: "cus_abc" }),
      })
    );

    // Cookie should be set
    const setCookie =
      res.headers.get("set-cookie") || res.headers.get("Set-Cookie");
    expect(setCookie).to.not.be.null;
    expect((setCookie as string).includes("sessionToken")).to.be.true;
  });

  it("verify: returns alreadyCompleted when token used", async () => {
    const used = {
      token: "used",
      user: { id: "u4", email: "used@ex.com" },
      isUsed: true,
    } as any;
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(used) },
    } as any);
    const req = new Request(
      "http://localhost/api/onboarding/verify-oauth-token?token=used"
    );
    const res = await verifyRoute.GET(req as any);
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.alreadyCompleted).to.equal(true);
  });

  it("complete: returns 404 for invalid token", async () => {
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(null) },
    } as any);
    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify({
        token: "nope",
        plan: "ESSENTIAL",
        paymentMethodId: "pm_x",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await completeRoute.POST(req as any);
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body.error).to.equal("Invalid onboarding token");
  });

  it("complete: token expired triggers audit log and returns 400", async () => {
    const expired = {
      token: "e1",
      expiresAt: new Date(Date.now() - 1000),
      userId: "u5",
      user: { id: "u5", email: "e5@ex.com" },
    } as any;
    const auditStub = sandbox
      .stub(audit, "createAuditLog")
      .resolves(null as any);
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(expired) },
    } as any);

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify({
        token: "e1",
        plan: "ESSENTIAL",
        paymentMethodId: "pm_x",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await completeRoute.POST(req as any);
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.error).to.equal("Onboarding token expired");

    sinon.assert.calledWithMatch(
      auditStub,
      sinon.match({
        action: sinon.match.string,
        userId: "u5",
        metadata: sinon.match.has("token", "e1"),
      })
    );
  });

  it("complete: validation fails when paymentMethodId missing", async () => {
    const rec = {
      token: "v1",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      userId: "u6",
      user: { id: "u6", email: "v6@ex.com" },
      context: "root",
    } as any;
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(rec) },
    } as any);

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify({ token: "v1", plan: "ESSENTIAL" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await completeRoute.POST(req as any);
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.error).to.equal("Validation failed");
  });

  it("complete: already used returns 400", async () => {
    const rec = {
      token: "u-used",
      isUsed: true,
      userId: "u7",
      user: { id: "u7", email: "u7@ex.com" },
    } as any;
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(rec) },
    } as any);

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify({
        token: "u-used",
        plan: "ESSENTIAL",
        paymentMethodId: "pm_x",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await completeRoute.POST(req as any);
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.error).to.equal("Onboarding already completed");
  });

  it("verify: logs token view on valid token", async () => {
    const now = new Date(Date.now() + 1000 * 60 * 60);
    const fake = {
      token: "t-view",
      expiresAt: now,
      isUsed: false,
      requestedPlan: "ESSENTIAL",
      userId: "u8",
      user: { id: "u8", email: "u8@ex.com" },
    } as any;
    const auditStub = sandbox
      .stub(audit, "createAuditLog")
      .resolves(null as any);
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(fake) },
    } as any);

    const req = new Request(
      "http://localhost/api/onboarding/verify-oauth-token?token=t-view"
    );
    const res = await verifyRoute.GET(req as any);

    expect(res.status).to.equal(200);
    sinon.assert.calledWithMatch(
      auditStub,
      sinon.match({
        action: sinon.match.string,
        userId: "u8",
        metadata: sinon.match.has("token", "t-view"),
      })
    );
  });

  it("verify: returns 400 when token missing", async () => {
    const req = new Request(
      "http://localhost/api/onboarding/verify-oauth-token"
    );
    const res = await verifyRoute.GET(req as any);

    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.error).to.equal("Token is required");
  });

  it("complete: invalid context returns 400", async () => {
    const rec = {
      token: "ctx1",
      context: "company",
      expiresAt: new Date(Date.now() + 1000 * 60),
      userId: "u9",
      user: { id: "u9", email: "u9@ex.com" },
    } as any;
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(rec) },
    } as any);

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify({
        token: "ctx1",
        plan: "ESSENTIAL",
        paymentMethodId: "pm_x",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await completeRoute.POST(req as any);
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.error).to.equal("Invalid onboarding context");
  });

  it("complete: audit logged on success", async () => {
    const token = "complete123";
    const onboardingRecord = {
      id: "on1",
      token,
      userId: "u3",
      isUsed: false,
      context: "root",
      user: { id: "u3", email: "three@ex.com", name: "Three" },
    } as any;

    const txStub = {
      user: {
        update: sinon
          .stub()
          .resolves({ id: "u3", email: "three@ex.com", plan: "ESSENTIAL" }),
      },
      customerPaymentProvider: {
        create: sinon.stub().resolves({ id: "cpp1" }),
      },
      oAuthOnboarding: {
        update: sinon.stub().resolves(true),
      },
    } as any;

    const auditStub = sandbox
      .stub(audit, "createAuditLog")
      .resolves(null as any);

    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(onboardingRecord) },
      $transaction: sinon.stub().callsFake(async (fn: any) => fn(txStub)),
    } as any);

    sandbox
      .stub(sessionManager, "createSession")
      .resolves({ sessionToken: "session-xyz" } as any);

    const body = {
      token,
      plan: "ESSENTIAL",
      billingCycle: "MONTHLY",
      paymentMethodId: "pm_123",
      stripeCustomerId: "cus_abc",
    };

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const res = await completeRoute.POST(req as any);

    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json.success).to.equal(true);

    sinon.assert.calledWithMatch(
      auditStub,
      sinon.match({
        userId: "u3",
        metadata: sinon.match({ token: token, plan: "ESSENTIAL" }),
      })
    );

    const setCookie =
      res.headers.get("set-cookie") || res.headers.get("Set-Cookie");
    expect(setCookie).to.not.be.null;
    expect((setCookie as string).includes("sessionToken")).to.be.true;
  });

  it("complete: still succeeds when persisting payment provider fails", async () => {
    const token = "complete-fail-pay-provider";
    const onboardingRecord = {
      id: "on2",
      token,
      userId: "u10",
      isUsed: false,
      context: "root",
      user: { id: "u10", email: "ten@ex.com", name: "Ten" },
    } as any;

    const txStub = {
      user: {
        update: sinon
          .stub()
          .resolves({ id: "u10", email: "ten@ex.com", plan: "ESSENTIAL" }),
      },
      customerPaymentProvider: {
        create: sinon.stub().throws(new Error("db fail")),
      },
      oAuthOnboarding: {
        update: sinon.stub().resolves(true),
      },
    } as any;

    const auditStub = sandbox
      .stub(audit, "createAuditLog")
      .resolves(null as any);

    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(onboardingRecord) },
      $transaction: sinon.stub().callsFake(async (fn: any) => fn(txStub)),
    } as any);

    sandbox
      .stub(sessionManager, "createSession")
      .resolves({ sessionToken: "session-abc" } as any);

    const body = {
      token,
      plan: "ESSENTIAL",
      billingCycle: "MONTHLY",
      paymentMethodId: "pm_456",
      stripeCustomerId: "cus_def",
    };

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const res = await completeRoute.POST(req as any);

    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json.success).to.equal(true);

    // ensure we attempted to create the payment provider and it threw
    sinon.assert.called(
      txStub.customerPaymentProvider.create as sinon.SinonStub
    );

    sinon.assert.calledWithMatch(
      auditStub,
      sinon.match({
        userId: "u10",
        metadata: sinon.match({ token: token, plan: "ESSENTIAL" }),
      })
    );

    const setCookie =
      res.headers.get("set-cookie") || res.headers.get("Set-Cookie");
    expect(setCookie).to.exist;
    expect((setCookie as string).includes("sessionToken")).to.be.true;
  });

  it("complete: billing address validation fails for invalid address", async () => {
    const rec = {
      token: "bad-addr",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      userId: "u11",
      user: { id: "u11", email: "u11@ex.com" },
      context: "root",
    } as any;
    sandbox.stub(dbModule, "db").value({
      oAuthOnboarding: { findUnique: sinon.stub().resolves(rec) },
    } as any);

    // Missing city in billing address should cause validation error
    const body = {
      token: "bad-addr",
      plan: "ESSENTIAL",
      paymentMethodId: "pm_x",
      billingAddress: {
        addressLine1: "1 A St",
        country: "USA",
        countryCode: "US",
        state: "CA",
        postalCode: "90001",
      },
    };

    const req = new Request("http://localhost/api/onboarding/complete-oauth", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await completeRoute.POST(req as any);

    expect(res.status).to.equal(400);
    const json = await res.json();
    expect(json.error).to.equal("Validation failed");
  });
});
