import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";
import { canUseAiStorefront } from "@/lib/billing/plan-gating";
import { decrypt } from "@/lib/crypto";
import {
  aiFrontstoreSpecSchema,
  type AiFrontstoreSpec,
} from "@/lib/ai/ai-storefront-types";
import {
  runSafetyChecks,
  generateAiStorefront,
  type AiStorefrontInput,
} from "@/lib/ai/ai-storefront-service";
import {
  callStorefrontModel,
  type AiProviderConfig,
  type AiProviderType,
  type ChatMessage,
} from "@/lib/ai/model-client";
import { Prisma, SubscriptionPlan } from "@prisma/client";

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

const refineSchema = z.object({
  companyId: z.string(),
  refineNotes: z.string().max(2000, "Refinement notes are too long").optional(),
  heroSize: z.enum(["compact", "full"]).optional(),
  tone: z.enum(["playful", "serious", "luxury", "minimal"]).optional(),
  emphasis: z
    .enum(["balanced", "products", "services", "testimonials"])
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = refineSchema.safeParse(body);

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

    const { companyId, refineNotes, heroSize, tone, emphasis } = parsed.data;

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const userPlan = validation.user.plan as SubscriptionPlan | null;

    // Enforce plan gating for AI storefront refine, except for SUPER_ADMIN.
    if (userRole !== "SUPER_ADMIN" && !canUseAiStorefront(userPlan)) {
      return NextResponse.json(
        {
          error:
            "AI storefront is only available for Growth and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    // Input-side safety: basic refinement-notes checks
    if (refineNotes && refineNotes.trim().length > 0) {
      const normalized = refineNotes.toLowerCase();
      const bannedHits = BANNED_PROMPT_KEYWORDS.filter((keyword) =>
        normalized.includes(keyword)
      );
      if (bannedHits.length > 0) {
        return NextResponse.json(
          {
            error:
              "Refinement notes contain disallowed topics. Please keep them professional and safe.",
          },
          { status: 400 }
        );
      }
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
        aiStorefrontEnabled: true,
        aiStorefrontSpec: true,
      },
    });

    if (!company || !company.aiStorefrontSpec) {
      return NextResponse.json(
        {
          error:
            "AI storefront has not been generated yet for this company. Generate it first, then refine.",
        },
        { status: 400 }
      );
    }

    let spec: AiFrontstoreSpec;
    try {
      spec = aiFrontstoreSpecSchema.parse(company.aiStorefrontSpec);
    } catch (error) {
      console.error("[AI Storefront Refine] Failed to parse existing spec:", error);
      return NextResponse.json(
        {
          error:
            "Existing AI storefront spec is invalid or out of date. Please regenerate it first.",
        },
        { status: 500 }
      );
    }

    // Optional model-based refinement of copy using refineNotes
    if (refineNotes && refineNotes.trim().length > 0) {
      // Load global AI provider config, if any
      let providerConfig: AiProviderConfig | undefined;

      const aiProviderClient: any = (db as any).aiProviderSetting;
      if (
        !aiProviderClient ||
        typeof aiProviderClient.findFirst !== "function"
      ) {
        console.error(
          "[AI Storefront Refine] Prisma client is missing AiProviderSetting model. Run `npx prisma generate` and restart the dev server."
        );
      } else {
        const aiProvider = await aiProviderClient.findFirst({
          where: { scope: "GLOBAL", isActive: true },
        });

        providerConfig =
          aiProvider && aiProvider.apiKey
            ? {
                provider:
                  (aiProvider.provider as AiProviderType | undefined) ||
                  "openai",
                apiKey: decrypt(aiProvider.apiKey),
                model: aiProvider.model || undefined,
                apiBase: aiProvider.apiBase || undefined,
              }
            : undefined;
      }

      const desiredTone =
        tone && ["playful", "serious", "luxury", "minimal"].includes(tone)
          ? tone
          : spec.meta.tone;

      const messages: ChatMessage[] = [
        {
          role: "system",
          content:
            "You are a senior UX and storefront designer. " +
            "You receive an existing AiFrontstoreSpec JSON and refinement notes from an admin. " +
            "You may adjust ANY aspect of the spec — meta (colors, layoutStyle, heroSize, tone), sections (types, order, count), and content — " +
            "as long as the result is a valid AiFrontstoreSpec and stays professional and safe. " +
            "Use the refinement notes as natural language instructions that can request small tweaks or a complete redesign. " +
            "You may reuse parts of the existing spec where it still fits, or replace them entirely if needed. " +
            "Never include adult, pornographic, gambling, weapons, illegal drugs, or any other unsafe/illegal content. " +
            "Respond ONLY with a valid AiFrontstoreSpec JSON object.",
        },
        {
          role: "user",
          content:
            "Current AiFrontstoreSpec, desired tone, and refinement notes:\n\n" +
            JSON.stringify(
              {
                desiredTone,
                refineNotes,
                spec,
              },
              null,
              2
            ),
        },
      ];

      try {
        const updatedSpec = await callStorefrontModel(
          messages,
          aiFrontstoreSpecSchema,
          providerConfig
        );

        if (updatedSpec) {
          const safety = runSafetyChecks(updatedSpec);
          if (safety.blocked) {
            return NextResponse.json(
              {
                error:
                  "Refined AI storefront content was blocked by safety filters. Please adjust your refinement notes.",
                reasons: safety.reasons,
              },
              { status: 400 }
            );
          }

          spec = updatedSpec;
        }
      } catch (error) {
        console.error(
          "[AI Storefront Refine] Model-based refinement failed, falling back to full regenerate:",
          error
        );

        // If the model didn't return a valid spec, fall back to a full
        // regenerate using refinement notes as the new prompt.
        try {
          const companyDetails = await db.company.findUnique({
            where: { id: companyId },
            select: {
              id: true,
              name: true,
              slogan: true,
              description: true,
              industry: true,
              isRoot: true,
              storeBlogEnabled: true,
            },
          });

          if (!companyDetails) {
            return NextResponse.json(
              { error: "Company not found for regenerate" },
              { status: 404 }
            );
          }

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

          const products = productsRaw.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: Number(p.price),
            category: p.category,
          }));

          const services = servicesRaw.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: Number(s.price),
            category: s.category,
            duration: s.duration !== null ? Number(s.duration) : null,
          }));

          const testimonials = testimonialsRaw.map((t) => ({
            id: t.id,
            customerName: t.customerName,
            customerTitle: t.customerTitle,
            testimonial: t.testimonial,
            rating: t.rating ?? 5,
          }));

          const blogEnabled = !!companyDetails.storeBlogEnabled;
          const blogPostCount = blogEnabled
            ? await db.storefrontPost.count({
                where: { companyId, status: "PUBLISHED" },
              })
            : 0;

          const hasProducts = products.length > 0;
          const hasServices = services.length > 0;

          // Derive a reasonable goal if not explicitly provided
          const derivedGoal =
            hasProducts && !hasServices
              ? "sell-products"
              : hasServices && !hasProducts
              ? "sell-services"
              : hasProducts && hasServices
              ? "sell-products"
              : "lead-gen";

          const input: AiStorefrontInput = {
            company: {
              id: companyDetails.id,
              name: companyDetails.name,
              slogan: companyDetails.slogan,
              description: companyDetails.description,
              industry: companyDetails.isRoot
                ? "ERP SaaS platform for small businesses"
                : companyDetails.industry ?? null,
            },
            products,
            services,
            testimonials,
            brandColors: {
              primary: spec.meta.primaryColor,
              secondary: spec.meta.secondaryColor,
              accent: spec.meta.accentColor,
            },
            heroLayout:
              spec.meta.layoutStyle === "magazine" ||
              spec.meta.layoutStyle === "one-page"
                ? "center"
                : "left",
            showLocation: true,
            showTeam: true,
            showTestimonials: true,
            blogEnabled,
            blogHasPosts: blogPostCount > 0,
            // Use refinement notes as the new prompt so the model
            // can redesign freely based on what the admin requested.
            prompt:
              refineNotes && refineNotes.trim().length > 0
                ? refineNotes
                : "Refine and improve the existing storefront design for this company.",
            goal: derivedGoal,
            tone: desiredTone,
          };

          const result = await generateAiStorefront(input, providerConfig);

          if (result.safety.blocked) {
            return NextResponse.json(
              {
                error:
                  "Regenerated AI storefront content was blocked by safety filters. Please adjust your refinement notes.",
                reasons: result.safety.reasons,
              },
              { status: 400 }
            );
          }

          spec = result.spec;
        } catch (regenError) {
          console.error(
            "[AI Storefront Refine] Full regenerate fallback failed:",
            regenError
          );
        }
      }
    }

    // Apply structured tweaks to the spec in-place

    // Hero size tweak
    if (heroSize) {
      spec.meta.heroSize = heroSize;
    }

    // Tone + style tweak
    if (tone) {
      spec.meta.tone = tone;

      // Derive buttonStyle and cornerStyle from tone (matching normalizeModelOutputToSpec)
      let buttonStyle: "solid" | "outline" | "pill" = spec.meta.buttonStyle || "solid";
      let cornerStyle: "rounded" | "soft" | "sharp" =
        spec.meta.cornerStyle || "soft";

      switch (tone) {
        case "playful":
          buttonStyle = "pill";
          cornerStyle = "rounded";
          break;
        case "luxury":
          buttonStyle = "solid";
          cornerStyle = "soft";
          break;
        case "minimal":
          buttonStyle = "outline";
          cornerStyle = "sharp";
          break;
        case "serious":
        default:
          buttonStyle = "solid";
          cornerStyle = "sharp";
          break;
      }

      spec.meta.buttonStyle = buttonStyle;
      spec.meta.cornerStyle = cornerStyle;
    }

    // Emphasis tweak: lightweight reordering of sections
    if (emphasis && emphasis !== "balanced") {
      const sections = [...spec.sections];

      const findAndRemove = (type: AiFrontstoreSpec["sections"][number]["type"]) => {
        const idx = sections.findIndex((s) => s.type === type);
        if (idx === -1) return undefined;
        const [removed] = sections.splice(idx, 1);
        return removed;
      };

      const heroSection = findAndRemove("hero");
      const productGrid = findAndRemove("product-grid");
      const serviceGrid = findAndRemove("service-grid");
      const testimonialsSection = findAndRemove("testimonials");

      const remaining = sections; // all other sections (posts, contact, etc.)

      const reordered: typeof spec.sections = [];
      if (heroSection) reordered.push(heroSection);

      if (emphasis === "products") {
        if (productGrid) reordered.push(productGrid);
        if (serviceGrid) reordered.push(serviceGrid);
        if (testimonialsSection) reordered.push(testimonialsSection);
      } else if (emphasis === "services") {
        if (serviceGrid) reordered.push(serviceGrid);
        if (productGrid) reordered.push(productGrid);
        if (testimonialsSection) reordered.push(testimonialsSection);
      } else if (emphasis === "testimonials") {
        if (testimonialsSection) reordered.push(testimonialsSection);
        if (productGrid) reordered.push(productGrid);
        if (serviceGrid) reordered.push(serviceGrid);
      }

      // Append the remaining sections preserving their relative order
      reordered.push(...remaining);

      // Reassign ordering indices
      spec.sections = reordered.map((section, index) => ({
        ...section,
        order: index,
      }));
    }

    // Persist refined spec
    await db.company.update({
      where: { id: companyId },
      data: {
        aiStorefrontSpec: spec as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ spec });
  } catch (error) {
    console.error("[AI Storefront] Refine error:", error);
    return NextResponse.json(
      { error: "Failed to refine AI storefront" },
      { status: 500 }
    );
  }
}
