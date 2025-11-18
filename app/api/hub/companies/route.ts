import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    interface CompanyResult {
      id: string;
      name: string;
      email: string | null;
      isRoot: boolean;
      isOwned: boolean;
      isSubscriber: boolean;
    }

    let companies: CompanyResult[] = [];

    if (user.role === "SUPER_ADMIN") {
      // Super admin sees owned companies and subscriber companies
      const ownedCompanies = await db.company.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          isRoot: true,
        },
      });

      // Get subscriber companies (companies that subscribe to owned companies)
      const subscriberCompanies = await db.subscription.findMany({
        where: {
          rootCompany: {
            ownerId: user.id,
          },
          status: {
            in: ["ACTIVE", "TRIAL"],
          },
        },
        include: {
          subscriberCompany: {
            select: {
              id: true,
              name: true,
              email: true,
              isRoot: true,
            },
          },
        },
      });

      const allCompanies = [
        ...ownedCompanies.map(
          (c: {
            id: string;
            name: string;
            email: string | null;
            isRoot: boolean;
          }) => ({
            ...c,
            isOwned: true,
            isSubscriber: false,
          })
        ),
        ...subscriberCompanies.map(
          (s: {
            subscriberCompany: {
              id: string;
              name: string;
              email: string | null;
              isRoot: boolean;
            };
          }) => ({
            ...s.subscriberCompany,
            isOwned: false,
            isSubscriber: true,
          })
        ),
      ];

      // Deduplicate companies by ID (prioritize owned over subscriber)
      const companyMap = new Map<string, CompanyResult>();
      for (const company of allCompanies) {
        const existing = companyMap.get(company.id);
        if (!existing || (company.isOwned && !existing.isOwned)) {
          companyMap.set(company.id, company);
        }
      }
      companies = Array.from(companyMap.values());
    } else if (user.role === "ADMIN") {
      // Admin sees only their own company
      const adminCompanies = await db.company.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          isRoot: true,
        },
      });

      companies = adminCompanies.map(
        (c: {
          id: string;
          name: string;
          email: string | null;
          isRoot: boolean;
        }) => ({
          ...c,
          isOwned: true,
          isSubscriber: false,
        })
      );
    } else {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
