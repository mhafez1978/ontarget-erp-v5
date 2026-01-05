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
      companyFiles,
      locations,
      teams,
      emailSettings,
      storageSettings,
      geoSettings,
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
                  phone: true,
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
              phone: true,
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
          phone: true,
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
          assignee: {
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

      // Files metadata (not the actual files)
      db.companyFile.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          path: true,
          size: true,
          mimeType: true,
          uploadedBy: true,
          createdAt: true,
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

      // Email settings
      db.emailProviderSetting.findFirst({
        where: { companyId },
        select: {
          id: true,
          provider: true,
          isConfigured: true,
          fromEmail: true,
          fromName: true,
        },
      }),

      // Storage settings
      db.storageProvider.findFirst({
        where: { companyId },
        select: {
          id: true,
          provider: true,
          isConfigured: true,
          bucketName: true,
        },
      }),

      // Geo tracking settings
      db.geoTrackingProvider.findFirst({
        where: { companyId },
        select: {
          id: true,
          provider: true,
          isEnabled: true,
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
        members: company.members.map((m) => ({
          role: m.role,
          user: m.user,
        })),
      },
      staff: staff.map((s) => ({
        userId: s.userId,
        userName: s.user.name,
        userEmail: s.user.email,
        userPhone: s.user.phone,
        role: s.role,
        jobTitle: s.jobTitle,
        department: s.department,
        employmentType: s.employmentType,
        status: s.status,
        hireDate: s.hireDate,
        terminationDate: s.terminationDate,
        salary: s.salary,
        hourlyRate: s.hourlyRate,
        city: s.city,
        state: s.state,
        country: s.country,
        countryCode: s.countryCode,
      })),
      customers,
      products: products.map((p) => ({
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        category: p.category,
        tags: p.tags,
        isActive: p.isActive,
        images: p.images,
        weight: p.weight,
        dimensions: p.dimensions,
        createdAt: p.createdAt,
      })),
      services: services.map((s) => ({
        name: s.name,
        description: s.description,
        price: s.price,
        duration: s.duration,
        category: s.category,
        isActive: s.isActive,
        createdAt: s.createdAt,
      })),
      projects: projects.map((p) => ({
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        startDate: p.startDate,
        endDate: p.endDate,
        budget: p.budget,
        teamId: p.teamId,
        teamName: p.team?.name,
        createdAt: p.createdAt,
      })),
      tasks: tasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        projectName: t.project.name,
        assigneeEmail: t.assignee?.user.email,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        createdAt: t.createdAt,
      })),
      orders: storefrontOrders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        customerEmail: o.customerEmail,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        shippingAddress: o.shippingAddress,
        billingAddress: o.billingAddress,
        paymentMethod: o.paymentMethod,
        customerNotes: o.customerNotes,
        items: o.items.map((i) => ({
          productName: i.product.name,
          productSku: i.product.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        createdAt: o.createdAt,
      })),
      files: companyFiles,
      locations: locations.map((l) => ({
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
      teams: teams.map((t) => ({
        name: t.name,
        description: t.description,
        members: t.members.map((m) => ({
          staffEmail: m.staff.user.email,
          staffName: m.staff.user.name,
        })),
      })),
      settings: {
        email: emailSettings,
        storage: storageSettings,
        geoTracking: geoSettings,
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
            files: companyFiles.length,
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
