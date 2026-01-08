import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { hash } from "bcryptjs";

/**
 * POST /api/company/import
 *
 * Restore company data from a backup file.
 * This endpoint handles importing previously exported company data.
 *
 * Use cases:
 * 1. Restore after re-signup (customer comes back)
 * 2. Migration between environments
 * 3. Data recovery
 *
 * Security:
 * - Only company owner can import
 * - Validates backup format and version
 * - Creates new IDs to avoid conflicts
 * - Maps relationships correctly
 *
 * Note: File uploads must be less than 50MB
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;
    const userId = user.id;

    // Rate limiting: 2 imports per day per user
    const rateLimit = checkRateLimit(userId, {
      endpoint: "company-import",
      maxRequests: 2,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many import attempts. Please try again tomorrow.",
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

    // Parse JSON body (backup data)
    const body = await request.json();
    const { companyId, backupData } = body;

    if (!companyId || !backupData) {
      return NextResponse.json(
        { error: "Company ID and backup data are required" },
        { status: 400 }
      );
    }

    // Validate backup format
    if (!backupData.version || !backupData.company) {
      return NextResponse.json(
        { error: "Invalid backup format" },
        { status: 400 }
      );
    }

    // Verify user owns the target company
    const targetCompany = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        isRoot: true,
      },
    });

    if (!targetCompany) {
      return NextResponse.json(
        { error: "Target company not found" },
        { status: 404 }
      );
    }

    if (targetCompany.ownerId !== userId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only the company owner can import data" },
        { status: 403 }
      );
    }

    // Import data in transaction to maintain consistency
    const result = await db.$transaction(async (tx) => {
      const stats = {
        staff: 0,
        customers: 0,
        products: 0,
        services: 0,
        projects: 0,
        tasks: 0,
        orders: 0,
        locations: 0,
        teams: 0,
        skipped: [] as string[],
      };

      // Map old user emails to new user IDs
      const emailToUserId = new Map<string, string>();

      // Update company details (without changing ownership)
      await tx.company.update({
        where: { id: companyId },
        data: {
          description: backupData.company.description,
          website: backupData.company.website,
          industry: backupData.company.industry,
          phone: backupData.company.phone,
          email: backupData.company.email,
          addressLine1: backupData.company.addressLine1,
          addressLine2: backupData.company.addressLine2,
          city: backupData.company.city,
          state: backupData.company.state,
          country: backupData.company.country,
          postalCode: backupData.company.postalCode,
          facebookUrl: backupData.company.facebookUrl,
          twitterUrl: backupData.company.twitterUrl,
          instagramUrl: backupData.company.instagramUrl,
          linkedinUrl: backupData.company.linkedinUrl,
          youtubeUrl: backupData.company.youtubeUrl,
        },
      });

      // Import staff members
      if (backupData.staff && Array.isArray(backupData.staff)) {
        for (const staffMember of backupData.staff) {
          try {
            // Check if user already exists
            let existingUser = await tx.user.findUnique({
              where: { email: staffMember.userEmail },
            });

            if (!existingUser) {
              // Create new user account for staff
              const tempPassword = await hash(Math.random().toString(36), 10);
              existingUser = await tx.user.create({
                data: {
                  email: staffMember.userEmail,
                  name: staffMember.userName,
                  password: tempPassword,
                  role: "ERP_CUSTOMER", // Default role, can be upgraded
                },
              });
              stats.skipped.push(
                `Created new user account for staff: ${staffMember.userEmail}`
              );
            }

            emailToUserId.set(staffMember.userEmail, existingUser.id);

            // Check if staff record already exists
            const existingStaff = await tx.companyStaff.findFirst({
              where: {
                companyId,
                userId: existingUser.id,
              },
            });

            if (!existingStaff) {
              await tx.companyStaff.create({
                data: {
                  companyId,
                  userId: existingUser.id,
                  role: staffMember.role || "EMPLOYEE_ROLE",
                  jobTitle: staffMember.jobTitle || "EMPLOYEE",
                  employmentType: staffMember.employmentType || "FULL_TIME",
                  status: staffMember.status || "ACTIVE",
                  hireDate: staffMember.hireDate
                    ? new Date(staffMember.hireDate)
                    : new Date(),
                  terminationDate: staffMember.terminationDate
                    ? new Date(staffMember.terminationDate)
                    : null,
                  city: staffMember.city,
                  state: staffMember.state,
                  country: staffMember.country,
                  countryCode: staffMember.countryCode,
                },
              });
              stats.staff++;

              // Add as company member if not already
              const existingMember = await tx.companyMember.findFirst({
                where: {
                  companyId,
                  userId: existingUser.id,
                },
              });

              if (!existingMember) {
                await tx.companyMember.create({
                  data: {
                    companyId,
                    userId: existingUser.id,
                    role: "STAFF",
                  },
                });
              }
            }
          } catch (error) {
            console.error(
              `Failed to import staff member ${staffMember.userEmail}:`,
              error
            );
            stats.skipped.push(`Staff: ${staffMember.userEmail}`);
          }
        }
      }

      // Import customers
      if (backupData.customers && Array.isArray(backupData.customers)) {
        for (const customer of backupData.customers) {
          try {
            // Check if customer already exists
            const existingCustomer = await tx.user.findUnique({
              where: { email: customer.email },
            });

            if (!existingCustomer) {
              const tempPassword = await hash(Math.random().toString(36), 10);
              const newCustomer = await tx.user.create({
                data: {
                  email: customer.email,
                  name: customer.name,
                  password: tempPassword,
                  role: "ERP_CUSTOMER",
                  addressLine1: customer.addressLine1,
                  addressLine2: customer.addressLine2,
                  city: customer.city,
                  state: customer.state,
                  country: customer.country,
                  postalCode: customer.postalCode,
                },
              });

              // Add as company member
              await tx.companyMember.create({
                data: {
                  companyId,
                  userId: newCustomer.id,
                  role: "STAFF",
                },
              });

              stats.customers++;
            }
          } catch (error) {
            console.error(
              `Failed to import customer ${customer.email}:`,
              error
            );
            stats.skipped.push(`Customer: ${customer.email}`);
          }
        }
      }

      // Import products
      if (backupData.products && Array.isArray(backupData.products)) {
        for (const product of backupData.products) {
          try {
            await tx.product.create({
              data: {
                companyId,
                name: product.name,
                description: product.description,
                sku: product.sku,
                price: product.price,
                unitCost: product.cost || product.unitCost,
                quantity: product.stockQuantity || product.quantity || 0,
                lowStockAlert:
                  product.lowStockThreshold || product.lowStockAlert,
                category: product.category,
                isActive: product.isActive !== false,
              },
            });
            stats.products++;
          } catch (error) {
            console.error(`Failed to import product ${product.name}:`, error);
            stats.skipped.push(`Product: ${product.name}`);
          }
        }
      }

      // Import services
      if (backupData.services && Array.isArray(backupData.services)) {
        for (const service of backupData.services) {
          try {
            await tx.service.create({
              data: {
                companyId,
                name: service.name,
                description: service.description,
                price: service.price,
                duration: service.duration,
                category: service.category,
                isActive: service.isActive !== false,
              },
            });
            stats.services++;
          } catch (error) {
            console.error(`Failed to import service ${service.name}:`, error);
            stats.skipped.push(`Service: ${service.name}`);
          }
        }
      }

      // Import locations
      if (backupData.locations && Array.isArray(backupData.locations)) {
        for (const location of backupData.locations) {
          try {
            await tx.companyLocation.create({
              data: {
                companyId,
                name: location.name,
                type: location.type || "BRANCH",
                isMain: location.isMain || false,
                addressLine1: location.addressLine1,
                addressLine2: location.addressLine2,
                city: location.city,
                state: location.state,
                country: location.country,
                postalCode: location.postalCode,
                latitude: location.latitude || 0,
                longitude: location.longitude || 0,
                phone: location.phone,
                email: location.email,
              },
            });
            stats.locations++;
          } catch (error) {
            console.error(`Failed to import location ${location.name}:`, error);
            stats.skipped.push(`Location: ${location.name}`);
          }
        }
      }

      // Import teams
      const teamNameToId = new Map<string, string>();
      if (backupData.teams && Array.isArray(backupData.teams)) {
        for (const team of backupData.teams) {
          try {
            const newTeam = await tx.team.create({
              data: {
                companyId,
                name: team.name,
                description: team.description,
              },
            });
            teamNameToId.set(team.name, newTeam.id);
            stats.teams++;

            // Add team members
            if (team.members && Array.isArray(team.members)) {
              for (const member of team.members) {
                const userId = emailToUserId.get(member.staffEmail);
                if (userId) {
                  const staff = await tx.companyStaff.findFirst({
                    where: { companyId, userId },
                  });
                  if (staff) {
                    try {
                      await tx.teamMember.create({
                        data: {
                          teamId: newTeam.id,
                          staffId: staff.id,
                        },
                      });
                    } catch {
                      // Member might already exist, skip
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Failed to import team ${team.name}:`, error);
            stats.skipped.push(`Team: ${team.name}`);
          }
        }
      }

      // Import projects
      const projectNameToId = new Map<string, string>();
      if (backupData.projects && Array.isArray(backupData.projects)) {
        for (const project of backupData.projects) {
          try {
            const teamId = project.teamName
              ? teamNameToId.get(project.teamName)
              : null;
            const newProject = await tx.project.create({
              data: {
                companyId,
                name: project.name,
                description: project.description,
                status: project.status || "PLANNING",
                startDate: project.startDate
                  ? new Date(project.startDate)
                  : null,
                endDate: project.endDate ? new Date(project.endDate) : null,
                teamId,
              },
            });
            projectNameToId.set(project.name, newProject.id);
            stats.projects++;
          } catch (error) {
            console.error(`Failed to import project ${project.name}:`, error);
            stats.skipped.push(`Project: ${project.name}`);
          }
        }
      }

      // Import tasks
      if (backupData.tasks && Array.isArray(backupData.tasks)) {
        for (const task of backupData.tasks) {
          try {
            const projectId = projectNameToId.get(task.projectName);
            if (!projectId) continue;

            const assigneeUserId = task.assigneeEmail
              ? emailToUserId.get(task.assigneeEmail)
              : null;
            const assigneeStaff = assigneeUserId
              ? await tx.companyStaff.findFirst({
                  where: { companyId, userId: assigneeUserId },
                })
              : null;

            await tx.task.create({
              data: {
                projectId,
                title: task.title,
                description: task.description,
                status: task.status || "TODO",
                priority: task.priority || "MEDIUM",
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                assignedToId: assigneeStaff?.id,
                createdById:
                  assigneeStaff?.id ||
                  (
                    await tx.companyStaff.findFirst({ where: { companyId } })
                  )?.id ||
                  "",
              },
            });
            stats.tasks++;
          } catch (error) {
            console.error(`Failed to import task ${task.title}:`, error);
            stats.skipped.push(`Task: ${task.title}`);
          }
        }
      }

      // Import orders (read-only historical data)
      if (backupData.orders && Array.isArray(backupData.orders)) {
        for (const order of backupData.orders) {
          try {
            const newOrder = await tx.storefrontOrder.create({
              data: {
                companyId,
                orderNumber: `RESTORED_${order.orderNumber}`,
                status: order.status || "COMPLETED",
                total: order.totalAmount || order.total,
                subtotal: order.totalAmount || order.total,
                tax: 0,
                shipping: 0,
                discount: 0,
                customerEmail: order.customerEmail,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                shippingAddress: order.shippingAddress,
                billingAddress: order.billingAddress,
                paymentMethod: order.paymentMethod,
                customerNotes: order.customerNotes,
              },
            });

            // Import order items
            if (order.items && Array.isArray(order.items)) {
              for (const item of order.items) {
                const product = await tx.product.findFirst({
                  where: {
                    companyId,
                    sku: item.productSku,
                  },
                });

                if (product) {
                  await tx.storefrontOrderItem.create({
                    data: {
                      orderId: newOrder.id,
                      productId: product.id,
                      itemName: item.productName || product.name,
                      itemSku: item.productSku || product.sku,
                      quantity: item.quantity,
                      price: item.unitPrice || item.price,
                      total: item.subtotal || item.total,
                    },
                  });
                }
              }
            }

            stats.orders++;
          } catch (error) {
            console.error(
              `Failed to import order ${order.orderNumber}:`,
              error
            );
            stats.skipped.push(`Order: ${order.orderNumber}`);
          }
        }
      }

      return stats;
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        companyId,
        action: "IMPORTED",
        entityType: "Company",
        entityId: companyId,
        description: `Company data imported by ${user.name}`,
        metadata: JSON.stringify({
          backupVersion: backupData.version,
          exportedAt: backupData.exportedAt,
          importStats: result,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company data imported successfully",
      stats: result,
    });
  } catch (error) {
    console.error("Error importing company data:", error);
    return NextResponse.json(
      {
        error: "Failed to import company data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
