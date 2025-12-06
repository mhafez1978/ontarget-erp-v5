import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import {
  generateAiStorefront,
  type AiStorefrontInput,
} from "@/lib/ai/ai-storefront-service";
import { z as zod } from "zod";
import { callStorefrontModel } from "@/lib/ai/model-client";
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
  heroSize: z.enum(["compact", "full"]).optional(),
  showLocation: z.boolean().optional(),
  showTeam: z.boolean().optional(),
  showTestimonials: z.boolean().optional(),
  includeProducts: z.boolean().optional(),
  includeServices: z.boolean().optional(),
  includePosts: z.boolean().optional(),
  includeStats: z.boolean().optional(),
  includeFaq: z.boolean().optional(),
  includeCta: z.boolean().optional(),
  includeContact: z.boolean().optional(),
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
      heroSize,
      primaryColor,
      secondaryColor,
      accentColor,
      heroLayout,
      showLocation,
      showTeam,
      showTestimonials,
      includeProducts,
      includeServices,
      includePosts,
      includeStats,
      includeFaq,
      includeCta,
      includeContact,
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

    // Derive customers and approved testimonial counts
    const customersCount = await db.companyMember.count({
      where: { companyId, user: { role: "COMPANY_CUSTOMER" } },
    });
    const approvedTestimonialsCount = await db.testimonial.count({
      where: { companyId, status: "APPROVED" },
    });

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
      customersCount,
      approvedTestimonialsCount,
      brandColors: {
        primary: primaryColor || undefined,
        secondary: secondaryColor || undefined,
        accent: accentColor || undefined,
      },
      heroLayout: heroLayout || "left",
      showLocation: showLocation ?? true,
      showTeam: showTeam ?? true,
      showTestimonials: showTestimonials ?? true,
      includeProducts: includeProducts !== undefined ? includeProducts : true,
      includeServices: includeServices !== undefined ? includeServices : true,
      includePosts: includePosts !== undefined ? includePosts : true,
      includeStats: includeStats !== undefined ? includeStats : true,
      includeFaq: includeFaq !== undefined ? includeFaq : true,
      includeCta: includeCta !== undefined ? includeCta : true,
      includeContact: includeContact !== undefined ? includeContact : true,
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

    // If the caller provided a heroSize preference, enforce it on the persisted spec
    try {
      if (heroSize && result.spec && typeof result.spec === "object") {
        (result.spec as any).meta = {
          ...(result.spec as any).meta,
          heroSize,
        };
      }
    } catch (e) {
      // swallow - not critical, but ensure we don't crash
      console.warn("Failed to force heroSize on generated spec", e);
    }

    // Ensure whether posts should be included by default
    const shouldIncludePosts = includePosts !== undefined ? includePosts : true;

    // Persist AI storefront spec and enable AI rendering for this company
    // Track whether we create an autogenerated post (so the fallback doesn't duplicate)
    let createdAutoPost = false;

    // Persist spec / enable AI storefront
    await db.company.update({
      where: { id: companyId },
      data: {
        aiStorefrontEnabled: true,
        aiStorefrontSpec:
          (result.spec as unknown as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // If we should create a starter blog post, try the model-based path first
    if (blogEnabled && blogPostCount === 0 && shouldIncludePosts) {
      // Attempt to generate a richer starter post using the AI provider
      try {
        // Define a small schema for the generator output
        const postSchema = zod.object({
          title: zod.string().min(5),
          slug: zod.string().optional(),
          excerpt: zod.string().optional(),
          contentHtml: zod.string().min(20),
        });

        const systemPrompt =
          "You are an experienced SEO content writer. Produce a short, high-quality blog post in HTML focusing on the company's core offering and helpful insights. Return ONLY JSON matching this shape: { title, slug (optional), excerpt (brief plain text), contentHtml (HTML string). Use a descriptive slug friendly for URLs. Keep it professional and SEO-friendly. Do not include unrelated or unsafe content.";

        const userContext = {
          company: {
            id: company.id,
            name: company.name,
            description: company.description,
          },
          prompt: prompt || undefined,
          goal,
          tone,
          blogHint: "starter post",
        } as any;

        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userContext, null, 2) },
        ] as any;

        // Use model to generate a JSON post if an API key is configured
        const generated = await callStorefrontModel(
          messages,
          postSchema,
          providerConfig
        );

        if (generated && generated.title && generated.contentHtml) {
          const slugFromModel =
            (generated.slug && String(generated.slug).trim()) ||
            generated.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

          // Ensure unique slug
          let finalSlug = slugFromModel;
          let suffix = 1;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const existing = await db.storefrontPost.findFirst({
              where: { companyId: company.id, slug: finalSlug },
              select: { id: true },
            });
            if (!existing) break;
            suffix += 1;
            finalSlug = `${slugFromModel}-${suffix}`;
          }

          await db.storefrontPost.create({
            data: {
              companyId: company.id,
              authorId: userId,
              title: generated.title,
              slug: finalSlug,
              excerpt: generated.excerpt || null,
              content: generated.contentHtml,
              status: "PUBLISHED",
              publishedAt: new Date(),
            },
          });
          // mark that we successfully created an auto post so fallback doesn't duplicate
          createdAutoPost = true;
        } else {
          // fallback to simple sample content below
          throw new Error("Model returned no generated post");
        }
      } catch (err) {
        // If model call fails, we'll fall back to a simple placeholder later
        console.warn("AI sample post generation failed, falling back:", err);
      }

      // If the model did not generate a starter post, create a simple fallback
      if (!createdAutoPost) {
        try {
          if (blogEnabled && blogPostCount === 0 && shouldIncludePosts) {
            const sampleTitle = `Welcome to ${company.name} — Latest News`;
            const sampleSlug = `welcome-to-${company.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}`;
            const sampleExcerpt = `A quick introduction to ${company.name} and what to expect from our blog.`;
            const sampleContent = `<h2>Welcome to ${company.name}</h2><p>${
              company.description ||
              "We're excited to share news, updates, and insights right here."
            }</p><p>${prompt ? `Admin note: ${prompt}` : ""}</p>`;

            // Ensure unique slug (append suffix if necessary)
            let finalSlug = sampleSlug;
            let suffix = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const existing = await db.storefrontPost.findFirst({
                where: { companyId: company.id, slug: finalSlug },
                select: { id: true },
              });
              if (!existing) break;
              suffix += 1;
              finalSlug = `${sampleSlug}-${suffix}`;
            }

            await db.storefrontPost.create({
              data: {
                companyId: company.id,
                authorId: userId,
                title: sampleTitle,
                slug: finalSlug,
                excerpt: sampleExcerpt,
                content: sampleContent,
                status: "PUBLISHED",
                publishedAt: new Date(),
              },
            });
          }
        } catch (err) {
          console.warn("Failed to create sample storefront post:", err);
        }
      }
    }

    // Persist the current AI wizard draft into storeMetadata so the admin's
    // inputs (placeholders and toggles) are saved for later editing.
    try {
      const draft = {
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        accentColor: accentColor || undefined,
        showLocation: showLocation ?? true,
        showTeam: showTeam ?? true,
        showTestimonials: showTestimonials ?? true,
        includeProducts: includeProducts !== undefined ? includeProducts : true,
        includeServices: includeServices !== undefined ? includeServices : true,
        includePosts: includePosts !== undefined ? includePosts : true,
        includeStats: includeStats !== undefined ? includeStats : true,
        includeFaq: includeFaq !== undefined ? includeFaq : true,
        includeCta: includeCta !== undefined ? includeCta : true,
        includeContact: includeContact !== undefined ? includeContact : true,
        heroLayout: heroLayout || undefined,
        heroSize: heroSize || undefined,
        goal,
        tone,
        prompt: prompt || undefined,
        refineNotes: undefined,
        emphasis: undefined,
      } as any;

      // Merge into existing storeMetadata without clobbering other keys
      const prev = (await db.company.findUnique({
        where: { id: companyId },
        select: { storeMetadata: true },
      })) as any;
      const existing = prev?.storeMetadata || {};

      await db.company.update({
        where: { id: companyId },
        data: {
          storeMetadata: {
            ...(existing || {}),
            aiWizardDraft: draft,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      console.warn("Failed to persist aiWizardDraft", err);
    }

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
