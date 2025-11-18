import { expect } from "chai";
import {
  computeTotals,
  processCheckout,
  type CheckoutDb,
} from "@/app/api/store/[slug]/checkout/route";

type TestCartItem = {
  productId: string | null;
  serviceId: string | null;
  product?: { name?: string | null; sku?: string | null } | null;
  service?: { name?: string | null } | null;
  quantity: number;
  price: number | string;
};

function makeFakeDb(options: {
  storeEnabled?: boolean;
  cartItems?: Array<TestCartItem>;
  useUserCart?: boolean;
}) {
  const { storeEnabled = true, cartItems = [], useUserCart = false } = options;

  type CreatedOrder = {
    id: string;
    orderNumber?: string;
    customerEmail?: string;
    customerName?: string;
    paymentMethod?: string | null;
    subtotal?: number;
    tax?: number;
    shipping?: number;
    discount?: number;
    total?: number;
  } & Record<string, unknown>;

  let createdOrder: CreatedOrder | null = null;
  let clearedCartId: string | null = null;

  const db: CheckoutDb = {
    company: {
      findUnique: async () =>
        storeEnabled ? { id: "c1", isStoreEnabled: true } : null,
    },
    cart: {
      findFirst: async () =>
        useUserCart
          ? { id: "cart-user", companyId: "c1", items: cartItems }
          : null,
      findUnique: async () =>
        !useUserCart
          ? { id: "cart-session", companyId: "c1", items: cartItems }
          : null,
      delete: async (args: unknown) => {
        const { where } = args as { where: { id: string } };
        clearedCartId = where.id;
        return {} as unknown;
      },
    },
    cartItem: {
      deleteMany: async (args: unknown) => {
        const { where } = args as { where: { cartId: string } };
        clearedCartId = where.cartId;
        return {} as unknown;
      },
    },
    storefrontOrder: {
      count: async () => 0,
      create: async (args: unknown) => {
        const { data } = args as { data: Record<string, unknown> };
        createdOrder = { id: "o1", ...data };
        return { id: "o1" } as { id: string };
      },
      findUnique: async () => createdOrder,
    },
    storefrontOrderItem: {
      create: async (_args: unknown) => {
        void _args;
        return {} as unknown;
      },
    },
    $transaction: async <T>(cb: (tx: CheckoutDb) => Promise<T>) => {
      return await cb(db);
    },
  };

  return {
    db,
    getCreatedOrder: () => createdOrder,
    getClearedCartId: () => clearedCartId,
  };
}

describe("store checkout helper", () => {
  it("computes totals correctly", () => {
    const items: Array<TestCartItem> = [
      { productId: "p1", serviceId: null, quantity: 2, price: 10 },
      { productId: "p2", serviceId: null, quantity: 1, price: 5 },
    ];
    const totals = computeTotals(
      items as unknown as Parameters<typeof computeTotals>[0]
    );
    expect(totals.subtotal).to.equal(25);
    expect(totals.tax).to.equal(2.5);
    expect(totals.total).to.equal(27.5);
  });

  it("returns 400 when missing customer info", async () => {
    const { db } = makeFakeDb({ cartItems: [] });
    const res = await processCheckout(
      "acme",
      undefined,
      "sess1",
      { customerEmail: "", customerName: "" },
      db
    );
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("error");
  });

  it("returns 404 when store not found or disabled", async () => {
    const { db } = makeFakeDb({ storeEnabled: false, cartItems: [] });
    const res = await processCheckout(
      "acme",
      undefined,
      "sess1",
      { customerEmail: "a@b.com", customerName: "Alice" },
      db
    );
    expect(res.status).to.equal(404);
  });

  it("returns 400 when cart is empty", async () => {
    const { db } = makeFakeDb({ cartItems: [] });
    const res = await processCheckout(
      "acme",
      undefined,
      "sess1",
      { customerEmail: "a@b.com", customerName: "Alice" },
      db
    );
    expect(res.status).to.equal(400);
    if (typeof res.body === "object" && res.body && "error" in res.body) {
      const body = res.body as { error: string };
      expect(body.error).to.match(/Cart is empty/);
    } else {
      throw new Error("Expected error body");
    }
  });

  it("creates an order for guest cart and signals to clear session cookie", async () => {
    const { db, getCreatedOrder, getClearedCartId } = makeFakeDb({
      cartItems: [
        { productId: "p1", serviceId: null, quantity: 2, price: 10 },
        { productId: null, serviceId: "s1", quantity: 1, price: 5 },
      ],
      useUserCart: false,
    });

    const res = await processCheckout(
      "acme",
      undefined,
      "sess1",
      {
        customerEmail: "a@b.com",
        customerName: "Alice",
        paymentMethod: "card",
      },
      db
    );

    expect(res.status).to.equal(200);
    expect(res.clearGuestSession).to.equal(true);
    if (typeof res.body === "object" && res.body && "success" in res.body) {
      const body = res.body as {
        success: boolean;
        order: unknown;
        message: string;
        totals: {
          subtotal: number;
          tax: number;
          shipping: number;
          discount: number;
          total: number;
        };
      };
      expect(body.success).to.equal(true);
      expect(body.order).to.not.equal(undefined);
      expect(body.totals.total).to.equal(27.5);
    } else {
      throw new Error("Unexpected body shape");
    }

    const created = getCreatedOrder();
    if (!created) throw new Error("No created order");
    expect(created).to.include({
      customerEmail: "a@b.com",
      customerName: "Alice",
      paymentMethod: "card",
    });
    expect(created.orderNumber).to.match(/^ORD-\d{4}-000001$/);
    expect(getClearedCartId()).to.be.oneOf(["cart-session", "cart-user"]);
  });

  it("creates an order for user cart and does not request cookie clear", async () => {
    const { db } = makeFakeDb({
      cartItems: [
        { productId: "p1", serviceId: null, quantity: 1, price: 100 },
      ],
      useUserCart: true,
    });

    const res = await processCheckout(
      "acme",
      "user-123",
      undefined,
      { customerEmail: "u@b.com", customerName: "User" },
      db
    );

    expect(res.status).to.equal(200);
    expect(res.clearGuestSession).to.equal(false);
    if (typeof res.body === "object" && res.body && "totals" in res.body) {
      const body = res.body as {
        totals: { subtotal: number; tax: number; total: number };
      };
      expect(body.totals.subtotal).to.equal(100);
      expect(body.totals.tax).to.equal(10);
      expect(body.totals.total).to.equal(110);
    } else {
      throw new Error("Unexpected body shape");
    }
  });
});
