import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import {
  generateAiStorefront,
  type AiStorefrontInput,
} from "@/lib/ai/ai-storefront-service";
import type { AiProviderConfig, AiProviderType } from "@/lib/ai/model-client";
import { Prisma, SubscriptionPlan } from "@prisma/client";
import { decrypt } from "@/lib/crypto";
import type {
  ProductSummary,
  ServiceSummary,
  TestimonialSummary,
} from "@/lib/ai/ai-storefront-service";
import { canUseAiStorefront } from "@/lib/billing/plan-gating";
import { getAiStorefrontMonthlyLimit } from "@/lib/ai/ai-limits";

const BANNED_PROMPT_KEYWORDS = [
  "porn",
  "pornographic",
  "xxx",
  "sex",
  "escort",
  "gambling",
  "casino",
  "betting",
  "illegal drugs",
  "cocaine",
  "heroin",
  "meth",
  "weapons",
  "firearms",
];

const generateSchema = z.object({
  companyId: z.string(),
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(2000, "Prompt is too long"),
  goal: z.enum(["sell-products", "sell-services", "lead-gen", "bookings"]),
  tone: z.enum(["playful", "serious", "luxury", "minimal"]),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  heroLayout: z.enum(["left", "center"]).optional(),
  showLocation: z.boolean().optional(),
  showTeam: z.boolean().optional(),
  showTestimonials: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const {
      companyId,
      prompt,
      goal,
      tone,
      primaryColor,
      secondaryColor,
      accentColor,
      heroLayout,
      showLocation,
      showTeam,
      showTestimonials,
    } = parsed.data;
    const userId = validation.user.id;
    const userPlan = validation.user.plan as SubscriptionPlan | null;
    const userRole = validation.user.role;

    // Enforce plan gating: AI storefront reserved for Growth/Enterprise plans.
    if (userRole !== "SUPER_ADMIN" && !canUseAiStorefront(userPlan)) {
      return NextResponse.json(
        {
          error:
            "AI storefront is only available for Growth and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    // Enforce monthly AI generation limits per plan (except SUPER_ADMIN / unlimited)
    const planLimit = getAiStorefrontMonthlyLimit(userPlan);
    if (userRole !== "SUPER_ADMIN" && planLimit !== "unlimited") {
      if (typeof planLimit === "number" && planLimit >= 0) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const usedThisMonth = await db.aiStorefrontGenerationLog.count({
          where: {
            userId,
            plan: userPlan ?? undefined,
            createdAt: { gte: monthStart },
          },
        });

        if (usedThisMonth >= planLimit) {
          return NextResponse.json(
            {
              error:
                "You have reached your AI storefront generation limit for this month for your plan.",
            },
            { status: 429 }
          );
        }
      }
    }

    // Input-side safety: basic prompt checks
    const normalizedPrompt = prompt.toLowerCase();
    const bannedHits = BANNED_PROMPT_KEYWORDS.filter((keyword) =>
      normalizedPrompt.includes(keyword)
    );
    if (bannedHits.length > 0) {
      return NextResponse.json(
        {
          error:
            "Prompt contains disallowed topics. Please keep it professional and safe.",
        },
        { status: 400 }
      );
    }

    // Verify the user has access to this company (owner, admin, manager)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          where: { id: companyId },
          select: { id: true },
        },
        companyMemberships: {
          where: { companyId },
          select: { companyId: true, role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = user.ownedCompanies.length > 0;
    const isMember = user.companyMemberships.length > 0;
    const isAdminOrManager = user.companyMemberships.some(
      (m) => m.role === "ADMIN" || m.role === "MANAGER"
    );

    const hasAccess =
      userRole === "SUPER_ADMIN" || isOwner || (isMember && isAdminOrManager);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slogan: true,
        description: true,
        industry: true,
        isRoot: true,
        storeBlogEnabled: true,
        email: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        storeMetadata: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Load product/service/testimonial summaries
    const productsRaw = await db.product.findMany({
      where: {
        companyId,
        isActive: true,
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const servicesRaw = await db.service.findMany({
      where: {
        companyId,
        isActive: true,
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        duration: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const testimonialsRaw = await db.testimonial.findMany({
      where: {
        companyId,
        status: "APPROVED",
      },
      select: {
        id: true,
        customerName: true,
        customerTitle: true,
        testimonial: true,
        rating: true,
      },
      take: 20,
      orderBy: [
        { isFeatured: "desc" },
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    const products: ProductSummary[] = productsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      category: p.category,
    }));

    const services: ServiceSummary[] = servicesRaw.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price),
      category: s.category,
      duration: s.duration !== null ? Number(s.duration) : null,
    }));

    const testimonials: TestimonialSummary[] = testimonialsRaw.map((t) => ({
      id: t.id,
      customerName: t.customerName,
      customerTitle: t.customerTitle,
      testimonial: t.testimonial,
      rating: t.rating ?? 5,
    }));

    const blogEnabled = !!company.storeBlogEnabled;
    const blogPostCount = blogEnabled
      ? await db.storefrontPost.count({
          where: { companyId, status: "PUBLISHED" },
        })
      : 0;

    const storeMetadata = company.storeMetadata as {
      title?: string;
      description?: string;
      keywords?: string[];
      contactEmail?: string;
      contactPhone?: string;
    } | null;

    const fullAddressParts = [
      company.addressLine1,
      company.addressLine2,
      company.city,
      company.state,
      company.country,
      company.postalCode,
    ].filter(Boolean);
    const fullAddress =
      fullAddressParts.length > 0 ? fullAddressParts.join(", ") : null;

    const input: AiStorefrontInput = {
      company: {
        id: company.id,
        name: company.name,
        slogan: company.slogan,
        description: company.description,
        industry: company.isRoot
          ? "ERP SaaS platform for small businesses"
          : company.industry ?? null,
      },
      products,
      services,
      testimonials,
      brandColors: {
        primary: primaryColor || undefined,
        secondary: secondaryColor || undefined,
        accent: accentColor || undefined,
      },
      heroLayout: heroLayout || "left",
      showLocation: showLocation ?? true,
      showTeam: showTeam ?? true,
      showTestimonials: showTestimonials ?? true,
      blogEnabled,
      blogHasPosts: blogPostCount > 0,
      contact: {
        email: storeMetadata?.contactEmail || company.email || null,
        phone: storeMetadata?.contactPhone || company.phone || null,
        address: fullAddress,
      },
      seo: {
        title: storeMetadata?.title || null,
        description: storeMetadata?.description || null,
        keywords: storeMetadata?.keywords || null,
      },
      prompt,
      goal,
      tone,
    };

    // Load global AI provider config, if any
    let providerConfig: AiProviderConfig | undefined;

    const aiProviderClient: any = (db as any).aiProviderSetting;
    if (!aiProviderClient || typeof aiProviderClient.findFirst !== "function") {
      console.error(
        "[AI Storefront] Prisma client is missing AiProviderSetting model. Run `npx prisma generate` and restart the dev server."
      );
      providerConfig = undefined;
    } else {
      const aiProvider = await aiProviderClient.findFirst({
        where: { scope: "GLOBAL", isActive: true },
      });

      providerConfig =
        aiProvider && aiProvider.apiKey
          ? {
              provider:
                (aiProvider.provider as AiProviderType | undefined) || "openai",
              apiKey: decrypt(aiProvider.apiKey),
              model: aiProvider.model || undefined,
              apiBase: aiProvider.apiBase || undefined,
            }
          : undefined;
    }

    const result = await generateAiStorefront(input, providerConfig);

    if (result.safety.blocked) {
      return NextResponse.json(
        {
          error:
            "AI storefront content was blocked by safety filters. Please adjust your prompt.",
          reasons: result.safety.reasons,
        },
        { status: 400 }
      );
    }

    // Persist AI storefront spec and enable AI rendering for this company
    await db.company.update({
      where: { id: companyId },
      data: {
        aiStorefrontEnabled: true,
        aiStorefrontSpec:
          (result.spec as unknown as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Log usage for this generation (except SUPER_ADMIN)
    if (userRole !== "SUPER_ADMIN") {
      await db.aiStorefrontGenerationLog.create({
        data: {
          companyId,
          userId,
          plan: userPlan ?? "GUEST",
        },
      });
    }

    return NextResponse.json({ spec: result.spec, enabled: true });
  } catch (error) {
    console.error("[AI Storefront] Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI storefront" },
      { status: 500 }
    );
  }
}
