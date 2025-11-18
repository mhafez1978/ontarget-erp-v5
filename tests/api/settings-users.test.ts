import { expect } from "chai";
import { getUsersForSettings } from "@/app/api/settings/users/route";

type FakeUser = {
  id: string;
  role: string;
  isActive?: boolean;
  createdAt?: Date;
};

type FindUniqueArgs = { where: { id: string } };
type FindManyUserArgs = { where?: { id?: { in: string[] } } };
type CompanyFindManyArgs = {
  where?: {
    OR?: Array<{ ownerId?: string; members?: { some: { userId: string } } }>;
    id?: { in: string[] };
  };
  select?: { id: boolean };
};
type CompanyIdList = Array<{ id: string; ownerId?: string }>;

type DbClient = {
  user: {
    findUnique(args: unknown): Promise<FakeUser | null>;
    findMany(args: unknown): Promise<FakeUser[]>;
  };
  company: {
    findMany(args: unknown): Promise<CompanyIdList>;
  };
  companyStaff: {
    findMany(args: unknown): Promise<Array<{ userId: string }>>;
  };
  companyMember: {
    findMany(args: unknown): Promise<Array<{ userId: string }>>;
  };
};

function makeDb(overrides: Partial<DbClient> = {}): DbClient {
  const users: FakeUser[] = [
    { id: "u1", role: "SUPER_ADMIN", isActive: true, createdAt: new Date() },
    { id: "u2", role: "ADMIN", isActive: true, createdAt: new Date() },
    { id: "u3", role: "USER", isActive: false, createdAt: new Date() },
  ];

  const base: DbClient = {
    user: {
      findUnique: async (args: unknown) => {
        const id = (args as FindUniqueArgs).where.id;
        return users.find((u) => u.id === id) || null;
      },
      findMany: async (args: unknown) => {
        const where = (args as FindManyUserArgs | undefined)?.where;
        if (!where?.id?.in) return users;
        const set = new Set(where.id.in as string[]);
        return users.filter((u) => set.has(u.id));
      },
    },
    company: {
      findMany: async (args: unknown) => {
        const where = (args as CompanyFindManyArgs | undefined)?.where;
        if (where?.id?.in)
          return where.id.in.map((cid) => ({ id: cid, ownerId: "u2" }));
        // Return two companies for the admin
        const ownerId = where?.OR?.[0]?.ownerId;
        if (ownerId) return [{ id: "c1" }, { id: "c2" }];
        return [];
      },
    },
    companyStaff: {
      findMany: async (args: unknown) => {
        const ids = (args as { where: { companyId: { in: string[] } } }).where
          .companyId.in;
        // Staff users for these companies
        if (ids.includes("c1")) return [{ userId: "u3" }];
        return [];
      },
    },
    companyMember: {
      findMany: async (args: unknown) => {
        const ids = (args as { where: { companyId: { in: string[] } } }).where
          .companyId.in;
        // Member users for these companies
        if (ids.includes("c2")) return [{ userId: "u2" }];
        return [];
      },
    },
  };

  // Deep-merge overrides for nested objects so we can override specific methods
  const merged: DbClient = {
    ...base,
    ...overrides,
    user: { ...base.user, ...(overrides.user || {}) },
    company: { ...base.company, ...(overrides.company || {}) },
    companyStaff: { ...base.companyStaff, ...(overrides.companyStaff || {}) },
    companyMember: {
      ...base.companyMember,
      ...(overrides.companyMember || {}),
    },
  } as DbClient;

  return merged;
}

describe("settings/users GET helper", () => {
  it("returns 401 when no userId provided", async () => {
    const res = await getUsersForSettings(undefined, makeDb());
    expect(res.status).to.equal(401);
    expect(res.body).to.deep.equal({ error: "Unauthorized" });
  });

  it("returns 404 when user not found", async () => {
    const db = makeDb({
      user: { findUnique: async () => null } as unknown as DbClient["user"],
    });
    const res = await getUsersForSettings("missing", db);
    expect(res.status).to.equal(404);
  });

  it("returns 403 when user lacks required role", async () => {
    const db = makeDb({
      user: {
        findUnique: async () => ({ id: "uX", role: "USER" }),
      } as unknown as DbClient["user"],
    });
    const res = await getUsersForSettings("uX", db);
    expect(res.status).to.equal(403);
  });

  it("SUPER_ADMIN sees all users", async () => {
    const db = makeDb({
      user: {
        findUnique: async () => ({ id: "u1", role: "SUPER_ADMIN" }),
      } as unknown as DbClient["user"],
    });
    const res = await getUsersForSettings("u1", db);
    expect(res.status).to.equal(200);
    const body = res.body as { success: boolean; count: number } & {
      users: Array<{ id: string }>;
    };
    expect(body.success).to.equal(true);
    expect(body.count).to.equal(3);
  });

  it("ADMIN sees users from owned/member companies", async () => {
    const db = makeDb({
      user: {
        findUnique: async () => ({ id: "u2", role: "ADMIN" }),
      } as unknown as DbClient["user"],
    });
    const res = await getUsersForSettings("u2", db);
    expect(res.status).to.equal(200);
    const body = res.body as { users: Array<{ id: string }>; count: number };
    expect(body.count).to.be.greaterThan(0);
    // Should include u2 (owner/member) and u3 (staff)
    const ids = body.users.map((u) => u.id);
    expect(ids).to.include.members(["u2", "u3"]);
  });
});
