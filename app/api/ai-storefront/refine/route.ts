import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
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
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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
    // Try to detect a simple color tweak in refinement notes and coerce it into
    // a CSS hex color we can store in the spec.meta.backgroundColor and
    // per-section styling. This accepts:
    //  - explicit hex (e.g. #ff0000)
    //  - tailwind-like tokens (e.g. sky-200, red-500)
    //  - simple color words (e.g. red, purple)
    const simpleNavbarBgColor = (() => {
      if (!refineNotes) return null;
      const note = refineNotes.toLowerCase();

      // Only consider explicit requests aimed at header/navbar/banner
      const mentionsNavbar =
        /\b(navbar|nav bar|top bar|bar top|header|topbar|cta band|promo banner|banner)\b/.test(
          note
        );
      if (!mentionsNavbar) return null;

      // 1) hex color (3 or 6 digits)
      const hexMatch = note.match(/#([0-9a-f]{3,6})/i);
      if (hexMatch) {
        const hex = hexMatch[0];
        // Normalize 3-digit to 6-digit
        if (/^#[0-9a-f]{3}$/i.test(hex)) {
          return hex
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("#")
            .replace(/^/, "#");
        }
        return hex;
      }

      // 2) tailwind token or explicit shade like "sky-200" or "red-500"
      const tw = note.match(
        /\b([a-z]+)-(50|100|200|300|400|500|600|700|800|900)\b/
      );
      const defaultShade = "500"; // default shade when only a color name is used

      // Basic palette mapping for a few common color families and shades.
      // This is intentionally small — we only need sensible fallbacks for
      // common quick commands. If we see a token we don't know, do not match.
      const palette: Record<string, Record<string, string>> = {
        sky: { "200": "#bae6fd", "500": "#0ea5e9" },
        blue: { "200": "#bfdbfe", "500": "#3b82f6" },
        red: { "200": "#fecaca", "500": "#ef4444" },
        purple: { "200": "#ddd6fe", "500": "#8b5cf6" },
        pink: { "200": "#fbcfe8", "500": "#ec4899" },
        green: { "200": "#bbf7d0", "500": "#10b981" },
        teal: { "200": "#99f6e4", "500": "#14b8a6" },
        slate: { "200": "#e2e8f0", "500": "#64748b" },
        gray: { "200": "#e5e7eb", "500": "#6b7280" },
        amber: { "200": "#fde68a", "500": "#f59e0b" },
        orange: { "200": "#fed7aa", "500": "#fb923c" },
        indigo: { "200": "#c7d2fe", "500": "#6366f1" },
      };

      if (tw) {
        const name = tw[1];
        const shade = tw[2];
        const family = palette[name];
        if (family && (family[shade] || family[defaultShade])) {
          return family[shade] || family[defaultShade];
        }
        return null;
      }

      // 3) plain color name e.g. "make it red" or "change top bar to purple"
      const nameOnly = note.match(
        /\b(red|blue|purple|pink|green|teal|slate|gray|amber|orange|indigo)\b/
      );
      if (nameOnly) {
        const name = nameOnly[1];
        const family = palette[name];
        if (family) return family[defaultShade];
      }

      return null;
    })();

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
      console.error(
        "[AI Storefront Refine] Failed to parse existing spec:",
        error
      );
      return NextResponse.json(
        {
          error:
            "Existing AI storefront spec is invalid or out of date. Please regenerate it first.",
        },
        { status: 500 }
      );
    }

    // Optional model-based refinement of copy using refineNotes
    // Skip model call if we detected a simple navbar background tweak.
    if (refineNotes && refineNotes.trim().length > 0 && !simpleNavbarBgColor) {
      // Load global AI provider config, if any
      let providerConfig: AiProviderConfig | undefined;

      const aiProviderClient = db.aiProviderSetting;
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
        // Use z.any() to accept the model's raw output and perform tolerant
        // normalization here. Previous strict parsing could fail when the LLM
        // returns slightly different structures (string version, nested spec,
        // or arrays), which is what caused the ZodError you saw.
        const raw = await callStorefrontModel<any>(
          messages,
          z.any(),
          providerConfig
        );

        if (raw) {
          // Try to find a candidate spec inside the model output
          const candidate = (() => {
            if (raw && typeof raw === "object") {
              if (Array.isArray(raw)) return raw[0];
              // Common wrapper keys
              for (const key of [
                "spec",
                "aiStorefrontSpec",
                "storefrontSpec",
                "result",
              ]) {
                if (raw[key] && typeof raw[key] === "object") return raw[key];
              }
              return raw;
            }
            return null;
          })();

          if (candidate && typeof candidate === "object") {
            // Coerce some simple issues: version may be string or array
            if (candidate.version && typeof candidate.version !== "number") {
              if (Array.isArray(candidate.version) && candidate.version[0]) {
                candidate.version = Number(candidate.version[0]);
              } else if (typeof candidate.version === "string") {
                const n = Number(candidate.version);
                candidate.version = Number.isFinite(n) ? n : candidate.version;
              }
            }

            // If meta or sections are missing, try to look for them nested in common places
            if (!candidate.meta && candidate.spec && candidate.spec.meta) {
              candidate.meta = candidate.spec.meta;
            }
            if (
              !candidate.sections &&
              candidate.spec &&
              candidate.spec.sections
            ) {
              candidate.sections = candidate.spec.sections;
            }

            try {
              // Validate with the strict schema - if it passes, accept it.
              const validated = aiFrontstoreSpecSchema.parse(candidate);
              const safety = runSafetyChecks(validated);
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

              spec = validated;
            } catch (parseErr) {
              // If schema validation still fails, bubble up to the regenerate
              // fallback below by throwing and letting the outer catch run.
              throw parseErr;
            }
          }
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

          // Get counts for customers and approved testimonials
          const customersCount = await db.companyMember.count({
            where: { companyId, user: { role: "COMPANY_CUSTOMER" } },
          });
          const approvedTestimonialsCount = await db.testimonial.count({
            where: { companyId, status: "APPROVED" },
          });

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
            customersCount,
            approvedTestimonialsCount,
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

    // Simple navbar/top bar background color tweak — prefer a CSS color hex
    // (generated above) instead of a Tailwind class so the renderer can use it
    // directly when previewing and persisting the spec.
    if (simpleNavbarBgColor) {
      spec.meta.backgroundColor = simpleNavbarBgColor;

      // Apply to common top-band sections so the preview header/footer mirrors
      // the wanted change.
      const targetTypes: AiFrontstoreSpec["sections"][number]["type"][] = [
        "cta-band",
        "highlights",
        "hero",
      ];

      spec.sections = spec.sections.map((section) => {
        if (targetTypes.includes(section.type)) {
          return {
            ...section,
            styling: {
              ...(section.styling || {}),
              backgroundColor: simpleNavbarBgColor,
            },
          };
        }
        return section;
      });
    }

    // Hero size tweak
    if (heroSize) {
      spec.meta.heroSize = heroSize;
    }

    // Tone + style tweak
    if (tone) {
      spec.meta.tone = tone;

      // Derive buttonStyle and cornerStyle from tone (matching normalizeModelOutputToSpec)
      let buttonStyle: "solid" | "outline" | "pill" =
        spec.meta.buttonStyle || "solid";
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

      const findAndRemove = (
        type: AiFrontstoreSpec["sections"][number]["type"]
      ) => {
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
