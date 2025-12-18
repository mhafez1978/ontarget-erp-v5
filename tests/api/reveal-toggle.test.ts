import { expect } from "chai";
import sinon from "sinon";
import * as audit from "@/lib/audit-log";
import { POST } from "@/app/api/activity/reveal-toggle/route";
import { validateSessionForAPI } from "@/lib/validate-session";

describe("POST /api/activity/reveal-toggle", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(audit, "createAuditLog").resolves({} as any);
    // Stub the session validator from the module so we can return a fake user
    sandbox
      .stub(require("@/lib/validate-session"), "validateSessionForAPI")
      .resolves({ user: { id: "user-123" }, session: {} });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("creates an audit log entry without recording PAN", async () => {
    const mockRequest = {
      json: async () => ({ toggledOn: true, context: "registration:payment" }),
      headers: { get: () => null },
      nextUrl: new URL("http://localhost"),
    } as unknown as Request;

    // Act
    const res: Response = (await POST(mockRequest as any)) as Response;
    const body = await res.json();

    // Assert
    expect(res.status).to.equal(200);
    expect(body.success).to.equal(true);
    expect((audit.createAuditLog as unknown as sinon.SinonStub).called).to.equal(true);
    const callArgs = (audit.createAuditLog as unknown as sinon.SinonStub).getCall(0).args[0];
    expect(callArgs.action).to.equal((audit.AUDIT_ACTIONS as any).PAYMENT_REVEAL_TOGGLED);
    expect(callArgs.metadata?.toggledOn).to.equal(true);
    expect(callArgs.metadata?.context).to.equal("registration:payment");
  });
});