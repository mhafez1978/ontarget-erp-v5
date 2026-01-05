import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/company/export
 *
 * Export all company data for backup/migration purposes.
 * Only company owner (ADMIN) can export their company data.
 *
 * Returns a comprehensive JSON export including:
 * - Company details
 * - Staff members
 * - Customers
 * - Products
 * - Services
 * - Orders
 * - Projects
 * - Tasks
 * - Files metadata
 * - Settings
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const userId = user.id;

    // Rate limiting: 3 exports per hour per user
    const rateLimit = checkRateLimit(userId, {
      endpoint: "company-export",
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many export attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    // Get company ID from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const companyMembership = await db.companyMember.findFirst({
      where: {
        companyId,
        userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!companyMembership) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 404 }
      );
    }

    // Only owner can export
    if (
      companyMembership.company.ownerId !== userId &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Only the company owner can export data" },
        { status: 403 }
      );
    }

    // Fetch all company data
    const [
      company,
      staff,
      customers,
      products,
      services,
      projects,
      tasks,
      storefrontOrders,
      locations,
      teams,
      storageSettings,
    ] = await Promise.all([
      // Company details
      db.company.findUnique({
        where: { id: companyId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),

      // Staff
      db.companyStaff.findMany({
        where: { companyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),

      // Customers (ERP customers)
      db.user.findMany({
        where: {
          role: "ERP_CUSTOMER",
          companyMemberships: {
            some: {
              companyId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          createdAt: true,
        },
      }),

      // Products
      db.product.findMany({
        where: { companyId },
      }),

      // Services
      db.service.findMany({
        where: { companyId },
      }),

      // Projects
      db.project.findMany({
        where: { companyId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Tasks
      db.task.findMany({
        where: {
          project: {
            companyId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),

      // Storefront orders
      db.storefrontOrder.findMany({
        where: { companyId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),

      // Locations
      db.companyLocation.findMany({
        where: { companyId },
      }),

      // Teams
      db.team.findMany({
        where: { companyId },
        include: {
          members: {
            include: {
              staff: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build export data structure
    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      company: {
        name: company.name,
        description: company.description,
        website: company.website,
        industry: company.industry,
        size: company.size,
        phone: company.phone,
        email: company.email,
        addressLine1: company.addressLine1,
        addressLine2: company.addressLine2,
        city: company.city,
        state: company.state,
        country: company.country,
        postalCode: company.postalCode,
        timezone: company.timezone,
        currency: company.currency,
        logo: company.logo,
        facebookUrl: company.facebookUrl,
        twitterUrl: company.twitterUrl,
        instagramUrl: company.instagramUrl,
        linkedinUrl: company.linkedinUrl,
        youtubeUrl: company.youtubeUrl,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor,
        accentColor: company.accentColor,
        owner: company.owner,
        members: company.members.map(
          (m: {
            role: string;
            user: {
              id: string;
              name: string | null;
              email: string | null;
              role: string;
            };
          }) => ({
            role: m.role,
            user: m.user,
          })
        ),
      },
      staff: staff.map((s: (typeof staff)[0]) => ({
        userId: s.userId,
        userName: s.user.name,
        userEmail: s.user.email,
        role: s.role,
        jobTitle: s.jobTitle,
        employmentType: s.employmentType,
        status: s.status,
        hireDate: s.hireDate,
        terminationDate: s.terminationDate,
        city: s.city,
        state: s.state,
        country: s.country,
        countryCode: s.countryCode,
      })),
      customers,
      products: products.map((p: (typeof products)[0]) => ({
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        unitCost: p.unitCost,
        quantity: p.quantity,
        lowStockAlert: p.lowStockAlert,
        category: p.category,
        isActive: p.isActive,
        createdAt: p.createdAt,
      })),
      services: services.map((s: (typeof services)[0]) => ({
        name: s.name,
        description: s.description,
        price: s.price,
        duration: s.duration,
        category: s.category,
        isActive: s.isActive,
        createdAt: s.createdAt,
      })),
      projects: projects.map((p: (typeof projects)[0]) => ({
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        budget: p.budget,
        teamId: p.teamId,
        teamName: p.team?.name,
        createdAt: p.createdAt,
      })),
      tasks: tasks.map((t: (typeof tasks)[0]) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        projectName: t.project.name,
        assigneeEmail: t.assignedTo?.user.email,
        createdAt: t.createdAt,
      })),
      orders: storefrontOrders.map((o: (typeof storefrontOrders)[0]) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        customerEmail: o.customerEmail,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        shippingAddress: o.shippingAddress,
        billingAddress: o.billingAddress,
        paymentMethod: o.paymentMethod,
        customerNotes: o.customerNotes,
        items: o.items.map((i: (typeof o.items)[0]) => ({
          itemName: i.itemName,
          itemSku: i.itemSku,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        })),
        createdAt: o.createdAt,
      })),
      locations: locations.map((l: (typeof locations)[0]) => ({
        name: l.name,
        type: l.type,
        isMain: l.isMain,
        addressLine1: l.addressLine1,
        addressLine2: l.addressLine2,
        city: l.city,
        state: l.state,
        country: l.country,
        postalCode: l.postalCode,
        phone: l.phone,
        email: l.email,
      })),
      teams: teams.map((t: (typeof teams)[0]) => ({
        name: t.name,
        description: t.description,
        members: t.members.map((m: (typeof t.members)[0]) => ({
          staffEmail: m.staff.user.email,
          staffName: m.staff.user.name,
        })),
      })),
      settings: {
        storage: storageSettings,
      },
    };

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        companyId,
        action: "EXPORTED",
        entityType: "Company",
        entityId: companyId,
        description: `Company data exported by ${user.name}`,
        metadata: JSON.stringify({
          itemCounts: {
            staff: staff.length,
            customers: customers.length,
            products: products.length,
            services: services.length,
            projects: projects.length,
            tasks: tasks.length,
            orders: storefrontOrders.length,
          },
        }),
      },
    });

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${company.name.replace(
          /[^a-z0-9]/gi,
          "_"
        )}_backup_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting company data:", error);
    return NextResponse.json(
      { error: "Failed to export company data" },
      { status: 500 }
    );
  }
}
