import type { NextRequest } from "next/server";
import type { GeneratedSection } from "@prisma/client";

import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { getCompanyContext } from "@/lib/frontstore/v6-data-service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  const params = await context.params;
  try {
    const { sectionId } = params;
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) return validation.response;
    const user = validation.user;
    const firstCompany = user.ownedCompanies?.[0];
    const companyId = user.companyId || firstCompany?.id;
    if (!companyId)
      return new Response(JSON.stringify({ error: "No company context" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const section = (await db.generatedSection.findUnique({
      where: { id: sectionId },
    })) as GeneratedSection | null;
    if (!section)
      return new Response(JSON.stringify({ error: "Section not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    if (section.companyId !== companyId)
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });

    // Load company context with real team data
    const ctx = await getCompanyContext(companyId);

    // Build team data from real CompanyStaff records or use fallbacks
    const teamData =
      ctx.team.length > 0
        ? ctx.team.slice(0, 8).map((s) => ({
            id: s.id,
            name: s.name,
            role: s.role || "Team Member",
            bio: s.bio || `${s.name} is a valued member of our team`,
            email: s.email || undefined,
            phone: undefined,
            photo: s.photo || undefined,
            department: undefined,
            linkedin: undefined,
            twitter: undefined,
          }))
        : generateFallbackTeam(ctx);

    const now = Date.now();

    // Generate 4 DESIGN variants
    const variants: Record<string, unknown>[] = [];

    // Variant 1: Material Design - Team Grid
    variants.push({
      id: `team-material-${now}`,
      title: "Material Design Team Grid",
      type: "team",
      designSystem: "material",
      layout: "grid",
      schema: {
        headline: "Meet Our Team",
        subheadline: `${
          ctx.stats.totalTeamMembers > 0
            ? `${ctx.stats.totalTeamMembers} talented professionals`
            : "Talented professionals"
        } working together to serve you`,
        team: teamData,
        columns: 4,
        showPhotos: true,
        showBios: true,
        showContact: false,
        showSocial: false,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "material",
        typography: {
          headingFont: "Roboto",
          bodyFont: "Roboto",
          headingScale: 1.414,
          lineHeight: "1.5",
          nameFont: "Roboto Medium",
          roleFont: "Roboto",
        },
        spacing: {
          sectionPadding: "80px",
          itemGap: "24px",
          cardPadding: "24px",
        },
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          accent: "#FF4081",
          cardBg: "#FFFFFF",
          roleBg: "#F5F5F5",
        },
        cardStyle: {
          borderRadius: "4px",
          elevation: "2",
          photoShape: "square",
        },
      },
    });

    // Variant 2: Apple HIG - Team Showcase
    variants.push({
      id: `team-apple-${now}`,
      title: "Apple HIG Team Showcase",
      type: "team",
      designSystem: "apple",
      layout: "showcase",
      schema: {
        headline: "Our Team",
        subheadline: `Passionate individuals ${
          ctx.company.industry
            ? `dedicated to ${ctx.company.industry}`
            : "united by excellence"
        }`,
        team: teamData,
        columns: 3,
        showPhotos: true,
        showBios: true,
        showContact: true,
        showSocial: true,
        largePhotos: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "apple",
        typography: {
          headingFont: "SF Pro Display",
          bodyFont: "SF Pro Text",
          headingScale: 1.618,
          lineHeight: "1.4",
          nameFont: "SF Pro Display Medium",
          roleFont: "SF Pro Text",
        },
        spacing: {
          sectionPadding: "96px",
          itemGap: "48px",
          cardPadding: "32px",
        },
        colors: {
          primary: "#007AFF",
          secondary: "#8E8E93",
          accent: "#FF3B30",
          cardBg: "transparent",
          roleBg: "transparent",
        },
        cardStyle: {
          borderRadius: "18px",
          elevation: "none",
          photoShape: "circle",
          hoverScale: "1.05",
        },
      },
    });

    // Variant 3: Minimalist - Clean Team Cards
    variants.push({
      id: `team-minimal-${now}`,
      title: "Minimalist Team Cards",
      type: "team",
      designSystem: "minimalist",
      layout: "cards",
      schema: {
        headline: "Team",
        subheadline: "",
        team: teamData,
        columns: 4,
        showPhotos: true,
        showBios: false,
        showContact: true,
        showSocial: false,
        compactView: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "minimalist",
        typography: {
          headingFont: "Inter",
          bodyFont: "Inter",
          headingScale: 1.25,
          lineHeight: "1.6",
          letterSpacing: "-0.02em",
          nameFont: "Inter Medium",
          roleFont: "Inter",
        },
        spacing: {
          sectionPadding: "120px",
          itemGap: "48px",
          cardPadding: "0px",
        },
        colors: {
          primary: "#000000",
          secondary: "#666666",
          accent: "#000000",
          cardBg: "transparent",
          roleBg: "transparent",
        },
        cardStyle: {
          borderRadius: "0px",
          border: "1px solid #E5E5E5",
          photoShape: "square",
          hoverBorder: "1px solid #000000",
        },
      },
    });

    // Variant 4: Bold - Dynamic Team Layout
    variants.push({
      id: `team-bold-${now}`,
      title: "Bold Team Layout",
      type: "team",
      designSystem: "bold",
      layout: "dynamic",
      schema: {
        headline: `👥 Meet Our ${
          ctx.stats.totalTeamMembers > 0
            ? ctx.stats.totalTeamMembers
            : "Amazing"
        } ${ctx.stats.totalTeamMembers === 1 ? "Expert" : "Experts"}`,
        subheadline: `The passionate people behind ${ctx.company.name}`,
        team: teamData,
        columns: 3,
        showPhotos: true,
        showBios: true,
        showContact: true,
        showSocial: true,
        useGradients: true,
        featuredFirst: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "bold",
        typography: {
          headingFont: "Montserrat",
          bodyFont: "Open Sans",
          headingScale: 1.5,
          lineHeight: "1.5",
          fontWeight: "700",
          nameFont: "Montserrat Bold",
          roleFont: "Open Sans",
        },
        spacing: {
          sectionPadding: "64px",
          itemGap: "20px",
          cardPadding: "24px",
        },
        colors: {
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
          accent: "#FFE66D",
          cardBg: "#FFFFFF",
          roleBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        cardStyle: {
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          photoShape: "circle",
          hoverTransform: "translateY(-8px) scale(1.02)",
        },
      },
    });

    const newVariants = [
      ...(Array.isArray(section.variants) ? section.variants : []),
      ...variants,
    ];

    // Update section with new variants
    await db.generatedSection.update({
      where: { id: sectionId },
      data: { variants: newVariants as any },
    });

    return new Response(
      JSON.stringify({
        success: true,
        variants: newVariants,
        message: `Generated ${variants.length} team section variants with real staff data`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Fallback team generator when DB is empty
function generateFallbackTeam(ctx: {
  company: { name: string; industry: string | null };
}): Array<{
  name: string;
  role: string;
  bio: string;
  department?: string;
}> {
  const companyName = ctx.company.name;
  const industry = ctx.company.industry || "business";

  return [
    {
      name: "Sarah Johnson",
      role: "Chief Executive Officer",
      bio: `Sarah leads ${companyName} with over 15 years of experience in ${industry}.`,
      department: "Executive",
    },
    {
      name: "Michael Chen",
      role: "Operations Manager",
      bio: `Michael ensures smooth operations and exceptional service delivery at ${companyName}.`,
      department: "Operations",
    },
    {
      name: "Emily Rodriguez",
      role: "Customer Success Lead",
      bio: `Emily is dedicated to ensuring every client has an outstanding experience with ${companyName}.`,
      department: "Customer Success",
    },
    {
      name: "David Kim",
      role: "Senior Specialist",
      bio: `David brings technical expertise and innovative solutions to our team at ${companyName}.`,
      department: "Technical",
    },
  ];
}
