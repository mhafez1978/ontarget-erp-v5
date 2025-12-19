import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/admin/company-users
// Returns all users associated with the admin's companies (for password management)
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const adminUser = validation.user;

    // Only ADMIN can access this endpoint (SUPER_ADMIN uses /api/admin/users)
    if (adminUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Unauthorized. Only company admins can access this resource.",
        },
        { status: 403 }
      );
    }

    // Find all companies where the user is a member (admin/manager) or owner
    const userCompanies = await db.company.findMany({
      where: {
        OR: [
          { ownerId: adminUser.id },
          {
            members: {
              some: {
                userId: adminUser.id,
                role: { in: ["ADMIN", "MANAGER"] },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            plan: true,
            authMethod: true,
            password: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                plan: true,
                authMethod: true,
                password: true,
              },
            },
          },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                plan: true,
                authMethod: true,
                password: true,
              },
            },
          },
        },
      },
    });

    // Collect all unique users from owner, members, and staff
    const userMap = new Map<
      string,
      {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        role: string;
        plan: string;
        authMethod: string | null;
        hasPassword: boolean;
      }
    >();

    // Add users from all companies
    for (const company of userCompanies) {
      // Add owner
      if (company.owner) {
        userMap.set(company.owner.id, {
          id: company.owner.id,
          name: company.owner.name,
          email: company.owner.email,
          image: company.owner.image,
          role: company.owner.role,
          plan: company.owner.plan,
          authMethod: company.owner.authMethod,
          hasPassword: !!company.owner.password,
        });
      }

      // Add members
      for (const member of company.members) {
        userMap.set(member.user.id, {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
          role: member.user.role,
          plan: member.user.plan,
          authMethod: member.user.authMethod,
          hasPassword: !!member.user.password,
        });
      }

      // Add staff
      for (const staff of company.staff) {
        userMap.set(staff.user.id, {
          id: staff.user.id,
          name: staff.user.name,
          email: staff.user.email,
          image: staff.user.image,
          role: staff.user.role,
          plan: staff.user.plan,
          authMethod: staff.user.authMethod,
          hasPassword: !!staff.user.password,
        });
      }
    }

    // Convert map to array and remove password hashes
    const users = Array.from(userMap.values()).sort((a, b) => {
      // Sort by role (SUPER_ADMIN first, then ADMIN, etc.) then by name
      const roleOrder: { [key: string]: number } = {
        SUPER_ADMIN: 0,
        ADMIN: 1,
        MANAGER: 2,
        STAFF: 3,
        ERP_CUSTOMER: 4,
        GUEST: 5,
      };
      const roleCompare = (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
      if (roleCompare !== 0) return roleCompare;
      return (a.name || "").localeCompare(b.name || "");
    });

    return NextResponse.json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Error fetching company users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
