import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type {
  GenerateRequest,
  Variant,
  Asset,
  ConductorEventPayloads,
  SessionUser,
  GeneratedSection,
  GenerationJob,
} from "../../../../../../lib/frontstore/v5-types";

import { randomUUID } from "crypto";
import type { SectionKind, Prisma } from "@prisma/client";

// Simple keyword-based persona detector (stub)
function detectPersona(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("restaurant") || p.includes("menu") || p.includes("chef"))
    return "restaurant";
  if (p.includes("barber") || p.includes("hair") || p.includes("barbershop"))
    return "barber";
  if (p.includes("law") || p.includes("attorney") || p.includes("lawyer"))
    return "legal";
  if (p.includes("music") || p.includes("album") || p.includes("gig"))
    return "music";
  if (p.includes("store") || p.includes("shop") || p.includes("product"))
    return "retail";
  return "general";
}

import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) return validation.response;
  const user =
    validation.user as import("@/lib/frontstore/v5-types").SessionUser;

  try {
    const body =
      (await req.json()) as import("@/lib/frontstore/v5-types").GenerateRequest;
    const { pageId, prompt, kind, personaId, layoutHints } = body;

    // Determine company context from session
    const firstCompany = user.ownedCompanies?.[0];
    const companyId = user.companyId || firstCompany?.id;
    const companyName = user.companyName || firstCompany?.name || companyId;
    if (!companyId) {
      console.warn("No company id found on user for generation");
      return new Response(JSON.stringify({ error: "No company context" }), {
        status: 400,
      });
    }

    // Decide on section kind and subKind (menu ambiguity handling)
    function detectSectionKind(kindIn?: string, promptIn?: string) {
      const allowedKinds = [
        "HERO",
        "ABOUT",
        "FOOD_MENU",
        "LOGGED_IN_TOP_NAVBAR",
        "LOGGED_OUT_TOP_NAVBAR",
        "LOGGED_IN_SIDE_NAVBAR",
        "LOGGED_OUT_SIDE_NAVBAR",
        "LOGGED_IN_MOBILE_NAVBAR",
        "LOGGED_OUT_MOBILE_NAVBAR",
        "TESTIMONIAL",
        "CTA",
        "GALLERY",
        "SERVICES",
        "FEEDBACK",
        "CUSTOM",
      ];

      const promptText = (promptIn || "").toLowerCase();
      let k = String(kindIn || "CUSTOM").toUpperCase();

      // helper to set auth + position
      function mapNav(
        auth: "LOGGED_IN" | "LOGGED_OUT",
        position: "TOP" | "SIDE" | "MOBILE"
      ) {
        return `${auth}_${position}_NAVBAR`;
      }

      // Normalize common shorthand inputs
      // e.g., 'menu', 'menu-food' -> FOOD_MENU; 'menu-nav' / 'navbar' -> top/mobile/side variants
      if (
        k === "MENU" ||
        k === "MENU-FOOD" ||
        k === "MENU_FOOD" ||
        k === "MENU.FOOD" ||
        k === "FOOD_MENU"
      ) {
        k = "FOOD_MENU";
        return { dbKind: k, meta: { type: "food_menu" } };
      }

      // Explicit nav variants passed in (accept a few formats for robustness)
      if (
        [
          "LOGGED-IN-TOP-NAVBAR",
          "LOGGED_IN_TOP_NAVBAR",
          "LOGGED-IN-NAV",
          "LOGGED_IN_NAV",
          "TOP_NAVBAR",
          "TOPNAV",
          "NAVBAR",
        ].includes(k)
      ) {
        // try to infer auth from prompt or the provided kind string
        const kindLower = String(kindIn || "").toLowerCase();
        const auth: "LOGGED_IN" | "LOGGED_OUT" =
          kindLower.includes("logged in") ||
          kindLower.includes("logged-in") ||
          promptText.includes("logged in") ||
          promptText.includes("signed in") ||
          promptText.includes("account") ||
          promptText.includes("my profile") ||
          promptText.includes("user menu")
            ? "LOGGED_IN"
            : "LOGGED_OUT";
        k = mapNav(auth, "TOP");
        return { dbKind: k, meta: { position: "top", auth } };
      }

      if (
        [
          "LOGGED-IN-SIDE-NAVBAR",
          "LOGGED_IN_SIDE_NAVBAR",
          "SIDE_NAVBAR",
          "SIDENAV",
          "SIDEBAR",
          "SIDE_NAV",
        ].includes(k)
      ) {
        const kindLower = String(kindIn || "").toLowerCase();
        const auth: "LOGGED_IN" | "LOGGED_OUT" =
          kindLower.includes("logged in") ||
          kindLower.includes("logged-in") ||
          promptText.includes("logged in") ||
          promptText.includes("signed in") ||
          promptText.includes("account")
            ? "LOGGED_IN"
            : "LOGGED_OUT";
        k = mapNav(auth, "SIDE");
        return { dbKind: k, meta: { position: "side", auth } };
      }

      if (
        [
          "LOGGED-IN-MOBILE-NAVBAR",
          "LOGGED_IN_MOBILE_NAVBAR",
          "MOBILE_NAVBAR",
          "MOBILE_NAV",
          "HAMBURGER",
          "DRAWER",
        ].includes(k)
      ) {
        const kindLower = String(kindIn || "").toLowerCase();
        const auth: "LOGGED_IN" | "LOGGED_OUT" =
          kindLower.includes("logged in") ||
          kindLower.includes("logged-in") ||
          promptText.includes("logged in") ||
          promptText.includes("signed in") ||
          promptText.includes("account")
            ? "LOGGED_IN"
            : "LOGGED_OUT";
        k = mapNav(auth, "MOBILE");
        return { dbKind: k, meta: { position: "mobile", auth } };
      }

      // Additional flexible handling: inputs like 'Navbar Logged out' or 'Navbar - logged out'
      if (
        k.includes("NAV") ||
        k.includes("NAVBAR") ||
        promptText.includes("navbar")
      ) {
        const kindLower = String(kindIn || "").toLowerCase();
        const auth: "LOGGED_IN" | "LOGGED_OUT" =
          kindLower.includes("logged in") ||
          kindLower.includes("logged-in") ||
          kindLower.includes("login") ||
          promptText.includes("logged in")
            ? "LOGGED_IN"
            : "LOGGED_OUT";
        // default to TOP unless specified otherwise
        const position: "TOP" | "SIDE" | "MOBILE" =
          kindLower.includes("side") ||
          kindLower.includes("sidebar") ||
          promptText.includes("side")
            ? "SIDE"
            : kindLower.includes("mobile") ||
              kindLower.includes("hamburger") ||
              promptText.includes("mobile")
            ? "MOBILE"
            : "TOP";
        k = mapNav(auth, position);
        return { dbKind: k, meta: { position: position.toLowerCase(), auth } };
      }

      // If user passed AUTO or unknown, try heuristics from prompt
      if (k === "AUTO") {
        // detect food menus
        if (
          promptText.includes("restaurant") ||
          promptText.includes("chef") ||
          promptText.includes("dish") ||
          promptText.includes("food") ||
          promptText.includes("menu items") ||
          promptText.includes("entrees")
        ) {
          k = "FOOD_MENU";
          return { dbKind: k, meta: { type: "food_menu" } };
        }

        // detect navbars (top/side/mobile)
        if (
          promptText.includes("nav") ||
          promptText.includes("navbar") ||
          promptText.includes("navigation") ||
          promptText.includes("logo") ||
          promptText.includes("branding") ||
          promptText.includes("fixed top") ||
          promptText.includes("top nav") ||
          promptText.includes("header")
        ) {
          const auth: "LOGGED_IN" | "LOGGED_OUT" =
            promptText.includes("logged in") ||
            promptText.includes("signed in") ||
            promptText.includes("account")
              ? "LOGGED_IN"
              : "LOGGED_OUT";
          const pos: "TOP" | "SIDE" | "MOBILE" =
            promptText.includes("side") ||
            promptText.includes("sidebar") ||
            promptText.includes("sidenav")
              ? "SIDE"
              : promptText.includes("mobile") ||
                promptText.includes("hamburger") ||
                promptText.includes("drawer")
              ? "MOBILE"
              : "TOP";
          k = mapNav(auth, pos);
          return { dbKind: k, meta: { position: pos.toLowerCase(), auth } };
        }

        // default fallback
        k = "CUSTOM";
        return { dbKind: k, meta: {} };
      }

      // Unknown/unsupported kinds -> CUSTOM
      if (!allowedKinds.includes(k)) k = "CUSTOM";

      return { dbKind: k, meta: {} };
    }

    // Determine the final dbKind and subKind before creating DB records
    const detected = detectSectionKind(kind, prompt);

    // Create job record
    const job = (await db.generationJob.create({
      data: {
        companyId: companyId,
        sectionKind: detected.dbKind as SectionKind,
        personaId: personaId || undefined,
        inputPrompt: prompt || "",
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    })) as GenerationJob;

    // Create initial GeneratedSection placeholder
    const section = (await db.generatedSection.create({
      data: {
        companyId: companyId,
        pageId: pageId || undefined,
        personaId: personaId || undefined,
        kind: (detected.dbKind as SectionKind) || "CUSTOM",
        schema: { meta: detected.meta || {} },
        variants: [],
        status: "PENDING",
      },
    })) as unknown as GeneratedSection;

    // Build a ReadableStream that emits SSE events
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent<K extends ConductorEventPayloads["event"]>(
          name: K,
          payload: Extract<ConductorEventPayloads, { event: K }>["data"]
        ) {
          const data = `event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }

        // Resolve final URL and validate image
        async function resolveImageUrl(url: string) {
          console.debug("[conductor] resolveImageUrl trying", url);
          try {
            const r = await fetch(url, { method: "GET", redirect: "follow" });
            console.debug(
              "[conductor] resolveImageUrl fetched",
              url,
              "status",
              r.status,
              "content-type",
              r.headers.get("content-type"),
              "finalUrl",
              r.url
            );
            try {
              sendEvent("debug", {
                topic: "resolveImageUrl",
                url,
                status: r.status,
                contentType: r.headers.get("content-type"),
                finalUrl: r.url,
              });
            } catch (e) {
              // best-effort debug event failed; log and continue
              console.warn(
                "[conductor] sendEvent(debug resolveImageUrl) failed:",
                e
              );
            }
            if (!r.ok) {
              try {
                sendEvent("debug", {
                  topic: "resolveImageUrlNotOk",
                  url,
                  status: r.status,
                });
              } catch (e) {
                // best-effort debug event failed; log and continue
                console.warn(
                  "[conductor] sendEvent(debug resolveImageUrlNotOk) failed:",
                  e
                );
              }
              return null;
            }
            const ct = (r.headers.get("content-type") || "").toLowerCase();
            if (!ct.startsWith("image/")) {
              try {
                sendEvent("debug", {
                  topic: "resolveImageUrlNotImage",
                  url,
                  contentType: ct,
                  finalUrl: r.url,
                });
              } catch (e) {
                // best-effort debug event failed; log and continue
                console.warn(
                  "[conductor] sendEvent(debug resolveImageUrlNotImage) failed:",
                  e
                );
              }
              return null;
            }
            return r.url || url;
          } catch (e) {
            console.debug("[conductor] resolveImageUrl error", String(e));
            try {
              sendEvent("debug", {
                topic: "resolveImageUrlError",
                url,
                error: String(e),
              });
            } catch (err) {
              console.warn(
                "Failed to generate section variants via model, falling back to stub:",
                err
              );
            }
            return null;
          }
        }

        // Try licensed providers first (Unsplash / Pexels) when API keys are configured
        async function findLicensedImage(query: string): Promise<{
          url: string;
          provider: "unsplash" | "pexels";
          attribution: {
            userName?: string | null;
            userUrl?: string | null;
            imagePage?: string | null;
          } | null;
        } | null> {
          console.debug("[conductor] findLicensedImage query", query);
          const qs = encodeURIComponent(query);
          const us = process.env.UNSPLASH_ACCESS_KEY;
          if (us) {
            try {
              const r = await fetch(
                `https://api.unsplash.com/search/photos?query=${qs}&per_page=1`,
                {
                  headers: { Authorization: `Client-ID ${us}` },
                }
              );
              console.debug(
                "[conductor] findLicensedImage unsplash response",
                r.status
              );
              if (r.ok) {
                const j = await r.json();
                if (j.results && j.results.length > 0) {
                  const photo = j.results[0];
                  console.debug(
                    "[conductor] findLicensedImage unsplash found",
                    photo.urls.raw
                  );
                  return {
                    url: photo.urls.raw,
                    provider: "unsplash",
                    attribution: {
                      userName: photo.user?.name || null,
                      userUrl: photo.user?.links?.html || null,
                      imagePage: photo.links?.html || null,
                    },
                  };
                }
              }
            } catch (e) {
              console.debug(
                "[conductor] findLicensedImage unsplash error",
                String(e)
              );
            }
          }
          const p = process.env.PEXELS_API_KEY;
          if (p) {
            try {
              const r = await fetch(
                `https://api.pexels.com/v1/search?query=${qs}&per_page=1`,
                { headers: { Authorization: p } }
              );
              console.debug(
                "[conductor] findLicensedImage pexels response",
                r.status
              );
              if (r.ok) {
                const j = await r.json();
                if (j.photos && j.photos.length > 0) {
                  const photo = j.photos[0];
                  console.debug(
                    "[conductor] findLicensedImage pexels found",
                    photo.src.original
                  );
                  return {
                    url: photo.src.original,
                    provider: "pexels",
                    attribution: {
                      userName: photo.photographer || null,
                      userUrl: photo.photographer_url || null,
                      imagePage: photo.url || null,
                    },
                  };
                }
              }
            } catch (e) {
              console.debug(
                "[conductor] findLicensedImage pexels error",
                String(e)
              );
            }
          }
          console.debug("[conductor] findLicensedImage none found");
          return null;
        }

        // Helper: generate or validate assets for a variant (resolves redirects and validates content-type)
        async function generateAssetsForVariant(
          variant: Variant,
          kind?: string,
          meta?: Record<string, unknown> & {
            type?: string;
            position?: string;
            auth?: string;
          },
          promptText?: string
        ): Promise<Variant["assets"]> {
          console.debug(
            "[conductor] generateAssetsForVariant start",
            variant.variantId,
            kind,
            meta,
            "initialAssets",
            variant.assets,
            "prompt",
            promptText
          );
          variant.assets = variant.assets || [];

          // If assets exist, resolve and validate them
          if (Array.isArray(variant.assets) && variant.assets.length > 0) {
            const resolved: Asset[] = [];
            for (const a of variant.assets) {
              const src = typeof a === "string" ? a : a.url || "";
              if (!src) continue;
              const final = await resolveImageUrl(src);
              if (final)
                resolved.push({
                  url: final,
                  alt:
                    typeof a === "string"
                      ? ""
                      : a.alt || (a as { title?: string }).title || "",
                  provider:
                    typeof a === "string"
                      ? "ai-provided"
                      : a.provider || null || "ai-provided",
                  attribution:
                    typeof a === "string"
                      ? null
                      : a.attribution || null || null,
                });
            }
            variant.assets = resolved;
            console.debug(
              "[conductor] generateAssetsForVariant resolvedExisting",
              variant.variantId,
              variant.assets
            );
            return variant.assets;
          }

          const schema = variant.schema || {};
          const title = String(schema.title || "").toLowerCase();
          const desc = String(schema.description || "").toLowerCase();

          const keywordSeeds: string[] = [];
          if (meta && typeof meta === "object") {
            if (meta.type) keywordSeeds.push(String(meta.type));
            if (meta.position) keywordSeeds.push(String(meta.position));
            if (meta.auth) keywordSeeds.push(String(meta.auth));
          }
          if (kind) keywordSeeds.push(kind.toLowerCase());
          if (promptText)
            keywordSeeds.push(
              ...String(promptText).toLowerCase().split(/\s+/).slice(0, 8)
            );
          if (title) keywordSeeds.push(...title.split(/\s+/).slice(0, 6));
          if (desc) keywordSeeds.push(...desc.split(/\s+/).slice(0, 6));

          const stop = new Set([
            "the",
            "and",
            "for",
            "with",
            "from",
            "that",
            "this",
            "a",
            "an",
            "of",
            "in",
            "to",
          ]);
          const words = Array.from(
            new Set(
              keywordSeeds
                .join(" ")
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .map((w) => w.trim())
                .filter((w) => w && !stop.has(w) && w.length > 2)
                .slice(0, 8)
            )
          );
          const query = words.length ? words.join(",") : "abstract";

          // Prefer licensed provider if available
          const lic = await findLicensedImage(query);
          console.debug(
            "[conductor] generateAssetsForVariant findLicensedImage result",
            lic
          );
          if (lic) {
            const final = await resolveImageUrl(lic.url);
            if (final) {
              variant.assets = [
                {
                  url: final,
                  alt: `${query} image`,
                  provider: lic.provider,
                  attribution: lic.attribution ?? null,
                },
              ];
              console.debug(
                "[conductor] generateAssetsForVariant set licensed",
                variant.variantId,
                variant.assets
              );
              return variant.assets;
            }
          }

          // Fallback to Unsplash Source
          const url = `https://source.unsplash.com/1200x800/?${encodeURIComponent(
            query
          )}`;
          const final = await resolveImageUrl(url);
          console.debug(
            "[conductor] generateAssetsForVariant unsplashSource result",
            final
          );
          try {
            sendEvent("debug", {
              topic: "unsplashFallback",
              url,
              final,
              query,
            });
          } catch (err) {
            console.warn(
              "Failed to generate section variants via model, falling back to stub:",
              err
            );
          }
          if (final) {
            variant.assets = [
              {
                url: final,
                alt: `${query} image`,
                provider: "unsplash-source",
              },
            ];
            try {
              sendEvent("debug", {
                topic: "setAssets",
                variantId: variant.variantId,
                assets: variant.assets,
              });
            } catch (err) {
              console.warn(
                "Failed to generate section variants via model, falling back to stub:",
                err
              );
            }
          } else {
            // Last-resort placeholder so UI has an image to show in dev/test
            const placeholderUrl = `https://placehold.co/1200x800?text=${encodeURIComponent(
              query
            )}`;
            variant.assets = [
              {
                url: placeholderUrl,
                alt: `${query} placeholder`,
                provider: "placeholder",
              },
            ];
            try {
              sendEvent("debug", {
                topic: "setAssets",
                variantId: variant.variantId,
                assets: variant.assets,
                fallback: true,
              });
            } catch (err) {
              console.warn(
                "Failed to generate section variants via model, falling back to stub:",
                err
              );
            }
          }
          console.debug(
            "[conductor] generateAssetsForVariant finalAssets",
            variant.variantId,
            variant.assets
          );
          return variant.assets;
        }

        try {
          // Persona selection
          let chosenPersonaSlug = personaId || detectPersona(prompt || "");

          // If personaId provided, try to fetch the persona slug
          if (personaId) {
            const p = await db.persona.findUnique({ where: { id: personaId } });
            if (p) chosenPersonaSlug = p.slug;
          }

          sendEvent("personaSelected", {
            persona: chosenPersonaSlug,
            confidence: 0.9,
          });

          // Re-use outer detection result (no-op here) - 'detected' determined earlier
          // (inner duplicate removed to keep logic consistent)

          // Try to use the AI storefront service to generate variants
          let variants: import("@/lib/frontstore/v5-types").Variant[] = [];
          try {
            const { pathToFileURL } = await import("url");
            // Narrow the module type to what we actually consume to avoid `any`
            let aiModule:
              | {
                  aiStorefrontService?: {
                    generateSectionVariants?: (
                      company: { id: string; name: string },
                      kind: string,
                      prompt: string,
                      persona?: string
                    ) => Promise<Variant[]>;
                  };
                  generateSectionVariants?: (
                    company: { id: string; name: string },
                    kind: string,
                    prompt: string,
                    persona?: string
                  ) => Promise<Variant[]>;
                }
              | undefined;
            try {
              aiModule = await import(
                pathToFileURL(
                  `${process.cwd()}/lib/ai/ai-storefront-service.ts`
                ).href
              );
            } catch (err) {
              // Fallback: try a relative import (useful in the test runner environment)
              console.warn(err);
              try {
                aiModule = await import(
                  "../../../../../../lib/ai/ai-storefront-service.ts"
                );
              } catch (error) {
                // If both imports fail, rethrow the original import error so outer try can handle
                console.warn(error);
                throw error;
              }
            }
            // Prefer the wrapper object for test-time stubbing, but fallback to direct export
            const generateSectionVariants:
              | ((
                  company: { id: string; name: string },
                  kind: string,
                  prompt: string,
                  persona?: string
                ) => Promise<import("@/lib/frontstore/v5-types").Variant[]>)
              | undefined =
              aiModule?.aiStorefrontService?.generateSectionVariants ||
              aiModule?.generateSectionVariants;

            const companySummary = { id: companyId, name: String(companyName) };
            if (generateSectionVariants) {
              const aiPrompt = `Note: Section kinds have been updated. Use kinds like FOOD_MENU, LOGGED_IN_TOP_NAVBAR, LOGGED_OUT_TOP_NAVBAR, LOGGED_IN_SIDE_NAVBAR, LOGGED_OUT_SIDE_NAVBAR, LOGGED_IN_MOBILE_NAVBAR, LOGGED_OUT_MOBILE_NAVBAR when relevant. When useful, include an assets array with image URLs or keyword hints (example: assets: [{ url: "https://...", alt: "..." }]). Target kind: ${
                detected.dbKind
              }.\n\n${String(prompt || "")}`;

              const generated = await generateSectionVariants(
                companySummary,
                detected.dbKind || "section",
                aiPrompt,
                chosenPersonaSlug
              );

              // If model returned variants, ensure they include assets when appropriate
              if (generated && generated.length > 0) {
                for (const v of generated) {
                  v.schema = v.schema || {};
                  v.schema.meta = v.schema.meta || {};
                  // Merge detected meta if available
                  if (detected.meta && typeof detected.meta === "object") {
                    v.schema.meta = {
                      ...(v.schema.meta as Record<string, unknown>),
                      ...(detected.meta as Record<string, unknown>),
                    };
                  }
                  // Ensure we have at least one relevant asset for visual sections
                  try {
                    await generateAssetsForVariant(
                      v,
                      detected.dbKind,
                      detected.meta,
                      prompt
                    );
                  } catch (err) {
                    // ignore augmentation failures
                    console.warn(
                      "Failed to generate section variants via model, falling back to stub:",
                      err
                    );
                  }
                }
              }

              if (generated && generated.length > 0) {
                variants = generated;
              }
            }
          } catch (err) {
            console.warn(
              "Failed to generate section variants via model, falling back to stub:",
              err
            );
          }

          // Fallback to stub variants if model not available or returned none
          if (!variants || variants.length === 0) {
            const variantLayouts = ["IMAGE_LEFT", "SPLIT", "MEDIA_COVER"];
            for (let i = 0; i < 3; i++) {
              const vId = randomUUID();
              const layout =
                (layoutHints && layoutHints[i]) ||
                variantLayouts[i] ||
                "TEXT_ONLY";

              const variantTitleSuffix =
                detected.meta && Object.keys(detected.meta).length
                  ? ` (${Object.values(detected.meta).join(", ")})`
                  : "";

              const baseSchema: Record<string, unknown> = {
                title: `${String(
                  detected.dbKind || "Section"
                )}${variantTitleSuffix} Variant ${i + 1}`,
                description: `Generated variant ${i + 1} for ${
                  detected.dbKind || "section"
                } - prompt summary: ${String(prompt).slice(0, 120)}`,
                meta: detected.meta || {},
              };

              // If it's a navbar, include helpful nav items so the UI shows text
              if (
                String(detected.dbKind).includes("NAVBAR") ||
                String(detected.dbKind).includes("NAV")
              ) {
                baseSchema.nav = {
                  items: [
                    { text: "Home", url: "/" },
                    { text: "About", url: "/about" },
                    { text: "Products", url: "/products" },
                    { text: "Contact", url: "/contact" },
                  ],
                  branding: {
                    text: String(companyName) || "Your Brand",
                  },
                };
              } else {
                baseSchema.cta = [{ text: "Learn more", url: "/" }];
              }

              const variant = {
                variantId: vId,
                layout,
                schema: baseSchema,
                assets: [],
                meta: { score: 0.85 - i * 0.05 },
              };
              variants.push(variant);

              // Augment stub variant with fallback asset(s)
              try {
                await generateAssetsForVariant(
                  variant,
                  detected.dbKind,
                  detected.meta,
                  prompt
                );
              } catch (err) {
                console.warn(
                  "Failed to generate section variants via model, falling back to stub:",
                  err
                );
              }
            }
          }

          // Ensure variants include detected meta
          for (const variant of variants) {
            variant.schema = variant.schema || {};
            variant.schema.meta = variant.schema.meta || {};
            // merge any detected meta (e.g., type, position, auth)
            if (detected.meta && typeof detected.meta === "object") {
              variant.schema.meta = {
                ...(variant.schema.meta as Record<string, unknown>),
                ...(detected.meta as Record<string, unknown>),
              };
            }
          }

          // Persist and stream all variants
          for (const variant of variants) {
            // Augment variant with fallback assets if none provided
            try {
              await generateAssetsForVariant(
                variant,

                detected.dbKind,
                detected.meta,
                prompt
              );
            } catch (err) {
              // ignore augmentation errors
              console.warn(
                "Failed to generate section variants via model, falling back to stub:",
                err
              );
            }

            // Append to DB
            const currentSection = await db.generatedSection.findUnique({
              where: { id: section.id },
            });
            const current = Array.isArray(currentSection?.variants)
              ? (currentSection!
                  .variants as unknown as import("@/lib/frontstore/v5-types").Variant[])
              : [];
            current.push(
              variant as import("@/lib/frontstore/v5-types").Variant
            );
            await db.generatedSection.update({
              where: { id: section.id },
              data: { variants: current as unknown as Prisma.InputJsonValue },
            });
            // Stream variant
            sendEvent("variant", { variant });

            // small delay so client can render progressively
            await new Promise((r) => setTimeout(r, 150));
          }

          // Mark section generated and job completed
          await db.generatedSection.update({
            where: { id: section.id },
            data: {
              status: "GENERATED",
              schema: {
                title: `${detected.dbKind || "Section"} (generated)`,
                meta: detected.meta || {},
              },
              generatedAt: new Date(),
            },
          });
          await db.generationJob.update({
            where: { id: job.id },
            data: { status: "COMPLETED", finishedAt: new Date() },
          });

          sendEvent("done", { sectionId: section.id, jobId: job.id });
          controller.close();
        } catch (err) {
          console.error("Conductor stream error:", err);
          sendEvent("error", { message: String(err) });
          await db.generationJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              finishedAt: new Date(),
              logs: { error: String(err) },
            },
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Conductor generate error:", error);
    return new Response(
      JSON.stringify({
        error: String(error),
        stack: error instanceof Error ? error.stack : null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
