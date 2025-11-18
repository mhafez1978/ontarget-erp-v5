import { expect } from "chai";
import { listOrdersForUser, type OrdersDb } from "@/app/api/orders/route";
import {
  getOrderForUser,
  updateOrderForUser,
  type OrdersDetailDb,
} from "@/app/api/orders/[orderId]/route";

type User = {
  id: string;
  role: string;
  companyMemberships: Array<{ companyId: string; role: string }>;
};

function makeDb(
  overrides: Partial<OrdersDb & OrdersDetailDb> = {}
): OrdersDb & OrdersDetailDb {
  const userById: Record<string, User | undefined> = {
    u1: {
      id: "u1",
      role: "SUPER_ADMIN",
      companyMemberships: [{ companyId: "c1", role: "ADMIN" }],
    },
    u2: {
      id: "u2",
      role: "MANAGER",
      companyMemberships: [{ companyId: "c1", role: "MANAGER" }],
    },
    u3: {
      id: "u3",
      role: "USER",
      companyMemberships: [{ companyId: "c1", role: "STAFF" }],
    },
    uNoCompany: { id: "uNoCompany", role: "ADMIN", companyMemberships: [] },
  };

  const orders = [
    {
      id: "o1",
      companyId: "c1",
      orderNumber: "1001",
      customerName: "Alice",
      customerEmail: "a@ex.com",
      status: "NEW",
      paymentStatus: "PENDING",
    },
    {
      id: "o2",
      companyId: "c1",
      orderNumber: "1002",
      customerName: "Bob",
      customerEmail: "b@ex.com",
      status: "SHIPPED",
      paymentStatus: "PAID",
    },
    {
      id: "o3",
      companyId: "c2",
      orderNumber: "2001",
      customerName: "Carol",
      customerEmail: "c@ex.com",
      status: "NEW",
      paymentStatus: "PENDING",
    },
  ];

  const base: OrdersDb & OrdersDetailDb = {
    user: {
      findUnique: async (args: unknown) => {
        const id = (args as { where: { id: string } }).where.id;
        return userById[id] || null;
      },
    },
    storefrontOrder: {
      findMany: async (args: unknown) =>
        orders.filter((o) => {
          const where = (args as { where: Record<string, unknown> }).where;
          if (where.companyId && o.companyId !== where.companyId) return false;
          if (where.status && o.status !== where.status) return false;
          if (
            where.paymentStatus &&
            (o as unknown as { paymentStatus?: string }).paymentStatus !==
              where.paymentStatus
          )
            return false;
          if (where.OR) {
            const q = (
              where.OR as Array<Record<string, { contains: string }>>
            ).some((cond) => {
              if (cond.orderNumber?.contains)
                return o.orderNumber.includes(cond.orderNumber.contains);
              if (cond.customerName?.contains)
                return o.customerName.includes(cond.customerName.contains);
              if (cond.customerEmail?.contains)
                return o.customerEmail.includes(cond.customerEmail.contains);
              return false;
            });
            if (!q) return false;
          }
          return true;
        }),
      findUnique: async (args: unknown) => {
        const id = (args as { where: { id: string } }).where.id;
        return orders.find((o) => o.id === id) || null;
      },
      update: async (args: unknown) => {
        const {
          where: { id },
          data,
        } = args as { where: { id: string }; data: Record<string, unknown> };
        const idx = orders.findIndex((o) => o.id === id);
        if (idx === -1) throw new Error("not found");
        orders[idx] = { ...orders[idx], ...data };
        return orders[idx];
      },
    },
  };

  const merged = {
    ...base,
    ...overrides,
    user: { ...base.user, ...(overrides.user || {}) },
    storefrontOrder: {
      ...base.storefrontOrder,
      ...(overrides.storefrontOrder || {}),
    },
  } as OrdersDb & OrdersDetailDb;

  return merged;
}

describe("Orders: list", () => {
  it("401 when no userId", async () => {
    const res = await listOrdersForUser(
      undefined,
      new URLSearchParams(),
      makeDb()
    );
    expect(res.status).to.equal(401);
  });

  it("403 when user has no company", async () => {
    const res = await listOrdersForUser(
      "uNoCompany",
      new URLSearchParams(),
      makeDb()
    );
    expect(res.status).to.equal(403);
  });

  it("403 when role cannot view orders", async () => {
    const res = await listOrdersForUser("u3", new URLSearchParams(), makeDb());
    expect(res.status).to.equal(403);
  });

  it("200 returns orders for company with filters", async () => {
    const db = makeDb();
    const params = new URLSearchParams([["status", "SHIPPED"]]);
    const res = await listOrdersForUser("u2", params, db);
    expect(res.status).to.equal(200);
    const body = res.body as { orders: Array<{ id: string; status: string }> };
    expect(body.orders.every((o) => o.status === "SHIPPED")).to.equal(true);
  });
});

describe("Orders: detail", () => {
  it("401 when no userId", async () => {
    const res = await getOrderForUser(undefined, "o1", makeDb());
    expect(res.status).to.equal(401);
  });

  it("404 when order not in user's company", async () => {
    const res = await getOrderForUser("u2", "o3", makeDb());
    expect(res.status).to.equal(404);
  });

  it("200 returns order when accessible", async () => {
    const res = await getOrderForUser("u2", "o1", makeDb());
    expect(res.status).to.equal(200);
    const body = res.body as { order: { id: string } };
    expect(body.order.id).to.equal("o1");
  });
});

describe("Orders: update", () => {
  it("403 when role cannot update", async () => {
    const res = await updateOrderForUser(
      "u3",
      "o1",
      { status: "CANCELED" },
      makeDb()
    );
    expect(res.status).to.equal(403);
  });

  it("sets canceledAt when canceling", async () => {
    const db = makeDb();
    const res = await updateOrderForUser(
      "u2",
      "o1",
      { status: "CANCELED" },
      db
    );
    expect(res.status).to.equal(200);
    const body = res.body as { order: Record<string, unknown> };
    expect(body.order).to.have.property("status", "CANCELED");
    expect(body.order).to.have.property("canceledAt");
  });

  it("autofills status to SHIPPED when shippedAt set", async () => {
    const db = makeDb();
    const res = await updateOrderForUser(
      "u2",
      "o2",
      { shippedAt: new Date().toISOString() },
      db
    );
    expect(res.status).to.equal(200);
    const body = res.body as { order: Record<string, unknown> };
    expect(body.order).to.have.property("status", "SHIPPED");
    expect(body.order).to.have.property("shippedAt");
  });
});
