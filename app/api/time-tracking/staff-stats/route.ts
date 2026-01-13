import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get staff record
    const staff = await db.companyStaff.findFirst({
      where: {
        userId: user.id,
        companyId,
      },
      include: {
        company: {
          include: {
            subscriberSubscriptions: {
              where: {
                subscriberCompanyId: companyId,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });

    // If no staff record, check if user is the company owner
    if (!staff) {
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          ownerId: user.id,
        },
        include: {
          subscriberSubscriptions: {
            where: {
              subscriberCompanyId: companyId,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "You are not a staff member of this company" },
          { status: 403 }
        );
      }

      const subscription = company.subscriberSubscriptions[0];

      console.log("[Staff Stats] Company Owner - Company:", company.name);
      console.log(
        "[Staff Stats] Subscriptions found:",
        company.subscriberSubscriptions.length
      );
      console.log("[Staff Stats] Subscription:", subscription);

      // Return stats for company owner (no staff-specific data)
      return NextResponse.json({
        success: true,
        stats: {
          weeklyHours: 0,
          weekStart: "N/A",
          weekEnd: "N/A",
          hireDate: "Company Owner",
          daysEmployed: 0,
          jobTitle: "Company Owner",
          role: "Admin",
          plan: subscription
            ? subscription.plan
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())
            : "Free Plan",
          payRate: null,
        },
      });
    }

    // Get current week's start (Monday) and end (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get time entries for current week
    const weekEntries = await db.timeEntry.findMany({
      where: {
        staffId: staff.id,
        companyId,
        clockIn: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: "CLOCKED_OUT", // Only count completed entries
      },
    });

    // Calculate total hours for the week
    const weeklyHours = weekEntries.reduce((total, entry) => {
      return (
        total + (entry.totalHours ? parseFloat(entry.totalHours.toString()) : 0)
      );
    }, 0);

    // Format dates
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    // Get role label
    const roleLabels: Record<string, string> = {
      ADMIN: "Admin",
      MANAGER: "Manager",
      STAFF: "Staff",
      CONTRACTOR: "Contractor",
    };

    // Get plan name
    const planNames: Record<string, string> = {
      FREE: "Free Plan",
      BASIC: "Basic Plan",
      PREMIUM: "Premium Plan",
      ENTERPRISE: "Enterprise Plan",
    };

    // Calculate days employed
    const hireDate = new Date(staff.hireDate);
    const daysDiff = Math.floor(
      (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Format pay rate with currency
    const formatPayRate = () => {
      if (!staff.payRate) return null;

      const currency = staff.currency || "USD";
      const amount = parseFloat(staff.payRate.toString());

      try {
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);

        const frequency = staff.payFrequency === "HOURLY" ? "/hr" : "/yr";
        return `${formatted}${frequency}`;
      } catch {
        return `${amount} ${currency}`;
      }
    };

    const stats = {
      weeklyHours: Math.round(weeklyHours * 10) / 10, // Round to 1 decimal
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
      hireDate: new Date(staff.hireDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      daysEmployed: daysDiff,
      jobTitle: roleLabels[staff.role] || staff.role,
      role: roleLabels[staff.role] || staff.role,
      plan: staff.company.subscriberSubscriptions[0]
        ? planNames[staff.company.subscriberSubscriptions[0].plan] ||
          staff.company.subscriberSubscriptions[0].plan
        : "Free Plan",
      payRate: formatPayRate(),
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Staff stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff stats" },
      { status: 500 }
    );
  }
}
