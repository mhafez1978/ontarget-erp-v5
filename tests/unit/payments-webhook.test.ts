import { expect } from "chai";
import sinon from "sinon";

import * as webhookRoute from "@/app/api/payments/webhook/route";
import paymentsService from "@/lib/payments/service";
import { db } from "@/lib/db";

describe("Payments webhook handler", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("handles invoice.payment_succeeded and upserts invoice + payment + subscription update", async () => {
    const fakeGateway = { id: "gw_1", companyId: "company_root" } as any;

    const invoiceEvent = {
      id: "evt_inv_paid",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_1",
          number: "0001",
          subscription: "sub_1",
          amount_paid: 5000,
          currency: "usd",
          paid: true,
          subtotal: 5000,
          total: 5000,
          lines: {
            data: [{ description: "Plan charge", amount: 5000, quantity: 1 }],
          },
          customer_email: "cust@example.com",
          hosted_invoice_url: "https://stripe.example/in_1",
          created: Math.floor(Date.now() / 1000),
        },
      },
    } as any;

    const provider = {
      verifyWebhook: sandbox
        .stub()
        .resolves({ isValid: true, event: invoiceEvent }),
    } as any;

    // getRootGateway stub will be set after company lookup to include correct companyId

    // Ensure clean state and create required DB records
    await db.paymentWebhook.deleteMany({ where: { eventId: invoiceEvent.id } });
    await db.payment.deleteMany({
      where: { gatewayReference: invoiceEvent.data.object.id },
    });
    await db.invoice.deleteMany({
      where: { externalInvoiceId: invoiceEvent.data.object.id },
    });

    // Find an existing company and create a subscription to be updated by webhook
    const existingCompany =
      (await db.company.findFirst({ where: { isRoot: true } })) ||
      (await db.company.findFirst());
    const companyId = existingCompany?.id as string;

    // Ensure no conflicting subscriptions exist for this company pair
    await db.subscription.deleteMany({
      where: { rootCompanyId: companyId, subscriberCompanyId: companyId },
    });

    await db.subscription.create({
      data: {
        rootCompanyId: companyId,
        subscriberCompanyId: companyId,
        status: "TRIAL",
        plan: "ESSENTIAL",
        externalSubscriptionId: "sub_1",
      },
    });

    // Ensure a payment gateway exists for the gateway id that the webhook will reference
    await db.paymentGateway.deleteMany({ where: { id: "gw_1" } });
    await db.paymentGateway.create({
      data: {
        id: "gw_1",
        companyId,
        provider: "stripe",
        isEnabled: true,
        isTestMode: true,
      },
    });

    const getRootStub = sandbox
      .stub(paymentsService, "getRootGateway")
      .resolves({ id: "gw_1", companyId } as any);
    const instantiateStub = sandbox
      .stub(paymentsService, "instantiateStripeProviderFromGateway")
      .returns(provider);

    const mockReq: any = {
      text: async () => JSON.stringify(invoiceEvent),
      headers: {
        get: (h: string) => (h === "stripe-signature" ? "sig" : "127.0.0.1"),
      },
    };

    const res = await webhookRoute.POST(mockReq as any);

    // Ensure service/provider hooks were invoked
    expect(getRootStub.calledOnce).to.equal(true);
    expect((provider.verifyWebhook as sinon.SinonStub).calledOnce).to.equal(
      true
    );

    // Check DB state: webhook recorded, invoice created, payment created, subscription updated
    const webhook = await db.paymentWebhook.findUnique({
      where: { eventId: invoiceEvent.id },
    });
    const invoice = await db.invoice.findFirst({
      where: { externalInvoiceId: invoiceEvent.data.object.id },
    });
    const payment = await db.payment.findFirst({
      where: {
        gatewayReference:
          invoiceEvent.data.object.payment_intent ||
          invoiceEvent.data.object.id,
      },
    });
    const subscription = await db.subscription.findFirst({
      where: { externalSubscriptionId: invoiceEvent.data.object.subscription },
    });

    expect(webhook).to.exist;
    expect(invoice).to.exist;
    expect(payment).to.exist;
    expect(String(subscription?.status)).to.equal("ACTIVE");
    expect((res as any).status).to.not.equal(500);
    // Replaying the same event should be idempotent (no duplicate payments created)
    const beforePayments = await db.payment.count({
      where: {
        gatewayReference:
          invoiceEvent.data.object.payment_intent ||
          invoiceEvent.data.object.id,
      },
    });
    await webhookRoute.POST(mockReq as any);
    const afterPayments = await db.payment.count({
      where: {
        gatewayReference:
          invoiceEvent.data.object.payment_intent ||
          invoiceEvent.data.object.id,
      },
    });
    expect(afterPayments).to.equal(beforePayments);
  });

  it("handles payment_intent.succeeded and creates Payment and links invoice if present", async () => {
    const fakeGateway = { id: "gw_1", companyId: "company_root" } as any;

    const piEvent = {
      id: "evt_pi",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_1",
          amount_received: 2000,
          currency: "usd",
          receipt_email: "payer@example.com",
          invoice: "in_1",
          metadata: { subscription_id: "sub_1" },
        },
      },
    } as any;

    const provider = {
      verifyWebhook: sandbox.stub().resolves({ isValid: true, event: piEvent }),
    } as any;

    // getRootGateway stub will be set after company lookup to include correct companyId

    await db.paymentWebhook.deleteMany({ where: { eventId: piEvent.id } });
    await db.payment.deleteMany({
      where: { gatewayReference: piEvent.data.object.id },
    });
    await db.invoice.deleteMany({
      where: { externalInvoiceId: piEvent.data.object.invoice },
    });
    await db.subscription.deleteMany({
      where: {
        externalSubscriptionId: piEvent.data.object.metadata?.subscription_id,
      },
    });

    const existingCompany =
      (await db.company.findFirst({ where: { isRoot: true } })) ||
      (await db.company.findFirst());
    const companyId = existingCompany?.id as string;
    // Ensure no conflicting subscriptions exist for this company pair
    await db.subscription.deleteMany({
      where: { rootCompanyId: companyId, subscriberCompanyId: companyId },
    });

    await db.invoice.create({
      data: {
        invoiceNumber: `STRIPE-${piEvent.data.object.invoice}`,
        companyId,
        type: "SUBSCRIPTION",
        status: "SENT",
        amount: piEvent.data.object.amount_received / 100,
        tax: 0,
        discount: 0,
        total: piEvent.data.object.amount_received / 100,
        items: [],
        issueDate: new Date(),
        dueDate: new Date(),
        externalInvoiceId: piEvent.data.object.invoice,
      },
    });

    await db.subscription.create({
      data: {
        rootCompanyId: companyId,
        subscriberCompanyId: companyId,
        status: "TRIAL",
        plan: "ESSENTIAL",
        externalSubscriptionId: "sub_1",
      },
    });

    const getRootStub = sandbox
      .stub(paymentsService, "getRootGateway")
      .resolves({ id: "gw_1", companyId } as any);
    const instantiateStub = sandbox
      .stub(paymentsService, "instantiateStripeProviderFromGateway")
      .returns(provider);

    const mockReq: any = {
      text: async () => JSON.stringify(piEvent),
      headers: {
        get: (h: string) => (h === "stripe-signature" ? "sig" : "127.0.0.1"),
      },
    };

    const res = await webhookRoute.POST(mockReq as any);

    // Ensure service/provider hooks were invoked
    expect(getRootStub.calledOnce).to.equal(true);
    expect((provider.verifyWebhook as sinon.SinonStub).calledOnce).to.equal(
      true
    );

    const payment = await db.payment.findFirst({
      where: { gatewayReference: piEvent.data.object.id },
    });
    const subscription = await db.subscription.findFirst({
      where: {
        externalSubscriptionId: piEvent.data.object.metadata.subscription_id,
      },
    });

    expect(payment).to.exist;
    expect(String(subscription?.status)).to.equal("ACTIVE");
    expect((res as any).status).to.not.equal(500);
  });

  it("handles charge.refunded and updates Payment refund info", async () => {
    const fakeGateway = { id: "gw_1", companyId: "company_root" } as any;

    const chEvent = {
      id: "evt_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_1",
          payment_intent: "pi_1",
          amount_refunded: 1500,
          refunds: { data: [{ id: "re_1" }] },
        },
      },
    } as any;

    const provider = {
      verifyWebhook: sandbox.stub().resolves({ isValid: true, event: chEvent }),
    } as any;

    await db.paymentWebhook.deleteMany({ where: { eventId: chEvent.id } });
    await db.payment.deleteMany({
      where: { gatewayReference: chEvent.data.object.payment_intent },
    });

    const existingCompany =
      (await db.company.findFirst({ where: { isRoot: true } })) ||
      (await db.company.findFirst());
    const companyId = existingCompany?.id as string;

    await db.paymentGateway.deleteMany({ where: { id: "gw_1" } });
    await db.paymentGateway.create({
      data: {
        id: "gw_1",
        companyId,
        provider: "stripe",
        isEnabled: true,
        isTestMode: true,
      },
    });

    await db.payment.create({
      data: {
        id: "pay_3",
        companyId,
        amount: 15,
        currency: "USD",
        status: "SUCCEEDED",
        gatewayReference: chEvent.data.object.payment_intent,
      },
    });

    const getRootStub = sandbox
      .stub(paymentsService, "getRootGateway")
      .resolves({ id: "gw_1", companyId } as any);
    const instantiateStub = sandbox
      .stub(paymentsService, "instantiateStripeProviderFromGateway")
      .returns(provider);

    const mockReq: any = {
      text: async () => JSON.stringify(chEvent),
      headers: {
        get: (h: string) => (h === "stripe-signature" ? "sig" : "127.0.0.1"),
      },
    };

    const res = await webhookRoute.POST(mockReq as any);

    // Ensure service/provider hooks were invoked
    expect(getRootStub.calledOnce).to.equal(true);
    expect((provider.verifyWebhook as sinon.SinonStub).calledOnce).to.equal(
      true
    );

    const updated = await db.payment.findUnique({ where: { id: "pay_3" } });
    expect(updated?.refundedAt).to.exist;
    expect(updated?.refundAmount?.toString()).to.equal(
      ((chEvent.data.object.amount_refunded || 0) / 100).toString()
    );
    expect((res as any).status).to.not.equal(500);
  });

  it("handles invoice.payment_failed and marks subscription PAST_DUE with audit log", async () => {
    const fakeGateway = { id: "gw_1", companyId: "company_root" } as any;

    const invFailEvent = {
      id: "evt_inv_fail",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_2",
          subscription: "sub_2",
        },
      },
    } as any;

    const provider = {
      verifyWebhook: sandbox
        .stub()
        .resolves({ isValid: true, event: invFailEvent }),
    } as any;

    // getRootGateway stub will be set after company lookup to include correct companyId

    await db.paymentWebhook.deleteMany({ where: { eventId: invFailEvent.id } });
    await db.subscription.deleteMany({
      where: { externalSubscriptionId: invFailEvent.data.object.subscription },
    });
    const existingCompany =
      (await db.company.findFirst({ where: { isRoot: true } })) ||
      (await db.company.findFirst());
    const companyId = existingCompany?.id as string;
    // Ensure no conflicting subscriptions exist for this company pair
    await db.subscription.deleteMany({
      where: { rootCompanyId: companyId, subscriberCompanyId: companyId },
    });

    await db.subscription.create({
      data: {
        rootCompanyId: companyId,
        subscriberCompanyId: companyId,
        status: "ACTIVE",
        plan: "ESSENTIAL",
        externalSubscriptionId: "sub_2",
      },
    });

    // Ensure a payment gateway exists for the gateway id that the webhook will reference
    await db.paymentGateway.deleteMany({ where: { id: "gw_1" } });
    await db.paymentGateway.create({
      data: {
        id: "gw_1",
        companyId,
        provider: "stripe",
        isEnabled: true,
        isTestMode: true,
      },
    });

    const getRootStub = sandbox
      .stub(paymentsService, "getRootGateway")
      .resolves({ id: "gw_1", companyId } as any);
    const instantiateStub = sandbox
      .stub(paymentsService, "instantiateStripeProviderFromGateway")
      .returns(provider);

    const mockReq: any = {
      text: async () => JSON.stringify(invFailEvent),
      headers: {
        get: (h: string) => (h === "stripe-signature" ? "sig" : "127.0.0.1"),
      },
    };

    const res = await webhookRoute.POST(mockReq as any);

    // Ensure service/provider hooks were invoked
    expect(getRootStub.calledOnce).to.equal(true);
    expect((provider.verifyWebhook as sinon.SinonStub).calledOnce).to.equal(
      true
    );

    const subscription = await db.subscription.findFirst({
      where: { externalSubscriptionId: invFailEvent.data.object.subscription },
    });
    const audit = await db.auditLog.findFirst({
      where: {
        action: "INVOICE_UPDATED",
        entityId: invFailEvent.data.object.subscription,
      },
    });

    expect(String(subscription?.status)).to.equal("PAST_DUE");
    expect(audit).to.exist;
    expect((res as any).status).to.not.equal(500);
  });

  it("is idempotent when the same webhook event is replayed (duplicate event / P2002)", async () => {
    const evt = {
      id: "evt_dup",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_dup",
          number: "DUP",
          subscription: "sub_dup",
          amount_paid: 1000,
          currency: "usd",
          paid: true,
          subtotal: 1000,
          total: 1000,
          lines: { data: [] },
          customer_email: "dup@example.com",
          hosted_invoice_url: "https://stripe.example/in_dup",
          created: Math.floor(Date.now() / 1000),
        },
      },
    } as any;

    const provider = {
      verifyWebhook: sandbox.stub().resolves({ isValid: true, event: evt }),
    } as any;

    // create gateway & subscription and an existing webhook record to simulate a previously-seen event
    const existingCompany =
      (await db.company.findFirst({ where: { isRoot: true } })) ||
      (await db.company.findFirst());
    const companyId = existingCompany?.id as string;
    await db.paymentGateway.deleteMany({ where: { id: "gw_dup" } });
    await db.paymentGateway.create({
      data: {
        id: "gw_dup",
        companyId,
        provider: "stripe",
        isEnabled: true,
        isTestMode: true,
      },
    });
    // Ensure no existing subscription for the same company pair
    await db.subscription.deleteMany({
      where: { rootCompanyId: companyId, subscriberCompanyId: companyId },
    });
    await db.subscription.create({
      data: {
        rootCompanyId: companyId,
        subscriberCompanyId: companyId,
        status: "TRIAL",
        plan: "ESSENTIAL",
        externalSubscriptionId: "sub_dup",
      },
    });

    // cleanup any existing payments/invoices for this invoice id to avoid flakiness
    await db.payment.deleteMany({
      where: { gatewayReference: evt.data.object.id },
    });
    await db.invoice.deleteMany({
      where: { externalInvoiceId: evt.data.object.id },
    });

    // pre-create webhook record (simulate earlier delivery) - cleanup first
    await db.paymentWebhook.deleteMany({ where: { eventId: evt.id } });
    await db.paymentWebhook.create({
      data: {
        provider: "stripe",
        eventType: evt.type,
        eventId: evt.id,
        payload: evt,
        signature: "sig",
      },
    });

    const getRootStub = sandbox
      .stub(paymentsService, "getRootGateway")
      .resolves({ id: "gw_dup", companyId } as any);
    sandbox
      .stub(paymentsService, "instantiateStripeProviderFromGateway")
      .returns(provider);

    const mockReq: any = {
      text: async () => JSON.stringify(evt),
      headers: {
        get: (h: string) => (h === "stripe-signature" ? "sig" : "127.0.0.1"),
      },
    };

    // call handler twice; should not create duplicate webhook records or duplicate payments
    const beforeWebhookCount = await db.paymentWebhook.count({
      where: { eventId: evt.id },
    });
    const beforePaymentCount = await db.payment.count({
      where: { gatewayReference: evt.data.object.id },
    });

    const res1 = await webhookRoute.POST(mockReq as any);
    const res2 = await webhookRoute.POST(mockReq as any);

    const afterWebhookCount = await db.paymentWebhook.count({
      where: { eventId: evt.id },
    });
    const afterPaymentCount = await db.payment.count({
      where: { gatewayReference: evt.data.object.id },
    });

    expect((res1 as any).status).to.not.equal(500);
    expect((res2 as any).status).to.not.equal(500);
    expect(afterWebhookCount).to.equal(beforeWebhookCount);
    expect(afterPaymentCount).to.equal(beforePaymentCount + 1); // one payment created overall
  });

  it("returns 400 and logs when no root gateway is configured", async () => {
    const evt = {
      id: "evt_no_gw",
      type: "invoice.payment_failed",
      data: { object: { id: "in_no_gw", subscription: "sub_x" } },
    } as any;
    // ensure getRootGateway returns null
    const getRootStub = sandbox
      .stub(paymentsService, "getRootGateway")
      .resolves(null as any);
    const warnStub = sandbox.stub(console, "warn");

    const mockReq: any = {
      text: async () => JSON.stringify(evt),
      headers: {
        get: (h: string) => (h === "stripe-signature" ? "sig" : "127.0.0.1"),
      },
    };
    const res = await webhookRoute.POST(mockReq as any);

    expect((res as any).status).to.equal(400);
    expect(
      warnStub.calledWith("No root payment gateway configured for webhooks")
    ).to.equal(true);
    warnStub.restore();
  });
});
