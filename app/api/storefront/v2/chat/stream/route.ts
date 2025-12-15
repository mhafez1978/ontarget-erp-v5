import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { generateAiStorefront } from "@/lib/ai/ai-storefront-service";
import { streamStorefrontModel } from "@/lib/ai/model-client";
import type { AiProviderConfig, AiProviderType } from "@/lib/ai/model-client";
import { decrypt } from "@/lib/crypto";
import { canUseAiStorefrontV2 } from "@/lib/billing/plan-gating";
import { SubscriptionPlan } from "@prisma/client";

// Simple server-side SSE-style streaming over a readable stream. This is a
// pragmatic MVP: we call the non-streaming model and then stream the response
// back to the client in chunks so the UI can feel live.

export async function POST(request: NextRequest) {
  try {
    // Public mode allows bypassing auth for testing. Enable by setting
    // FRONTSTORE_V2_PUBLIC=true in your environment (dev only).
    const isPublic = process.env.FRONTSTORE_V2_PUBLIC === "true";
    let user: { id: string; role: string; plan: string | null };

    if (isPublic) {
      console.warn(
        "[AI Storefront V2] FRONTSTORE_V2_PUBLIC enabled — bypassing auth for testing"
      );
      user = { id: "public", role: "SUPER_ADMIN", plan: "SUPER_USER" };
    } else {
      const validation = await validateSessionForAPI(request);
      if (!validation.valid) {
        return validation.response;
      }

      user = validation.user;

      // Check V2 access based on plan (SUPER_ADMIN always has access)
      const isSuperAdmin = user.role === "SUPER_ADMIN";
      if (
        !isSuperAdmin &&
        !canUseAiStorefrontV2(user.plan as SubscriptionPlan)
      ) {
        return NextResponse.json(
          {
            error:
              "AI Storefront V2 is only available for Growth, Enterprise, or Super Admin plans. Please upgrade your plan or use V1.",
          },
          { status: 403 }
        );
      }
    }
    const body = await request.json();
    const { companyId, message } = body as {
      companyId?: string;
      message?: string;
    };
    if (!companyId || !message)
      return NextResponse.json(
        { error: "companyId and message required" },
        { status: 400 }
      );

    // Basic permission/plan checks (reuse chat route logic)
    let isSuperAdmin = false;
    let ownsCompany = false;
    let userPlan: string | undefined;

    if (!isPublic) {
      const userWithCompanies = await db.user.findUnique({
        where: { id: user.id },
        select: {
          role: true,
          plan: true,
          ownedCompanies: { where: { id: companyId }, select: { id: true } },
        },
      });
      isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
      ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;
      userPlan = userWithCompanies?.plan;

      if (
        !isSuperAdmin &&
        !canUseAiStorefrontV2(userPlan as SubscriptionPlan)
      ) {
        return NextResponse.json(
          {
            error:
              "AI Storefront V2 is only available for Growth, Enterprise, or Super Admin plans",
          },
          { status: 403 }
        );
      }

      if (!isSuperAdmin && !ownsCompany) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      // Public mode: allow testing by assuming company ownership
      isSuperAdmin = false;
      ownsCompany = true;
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, storeBlogEnabled: true },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Create conversation and user message
    const conversation = await db.storefrontConversation.create({
      data: { companyId, createdBy: user.id },
    });
    await db.storefrontMessage.create({
      data: { conversationId: conversation.id, role: "user", content: message },
    });

    // Fetch comprehensive company data for context
    const companyData = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slogan: true,
        description: true,
        industry: true,
        logo: true,
        logoLight: true,
        logoDark: true,
        email: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        website: true,
      },
    });

    const products = await db.product.findMany({
      where: {
        companyId,
        isPublished: true,
        isFeatured: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        images: {
          select: {
            id: true,
            url: true,
            isFeatured: true,
          },
        },
      },
    });

    // Filter out massive base64 data URLs from images - only keep http(s) URLs or short paths
    const cleanProducts = products.map((p) => ({
      ...p,
      images: p.images
        .filter((img) => {
          const url = img.url || "";
          // Only keep URLs that are actual HTTP(S) URLs or short file paths (< 500 chars)
          return (
            (url.startsWith("http://") ||
              url.startsWith("https://") ||
              url.startsWith("/")) &&
            url.length < 500
          );
        })
        .slice(0, 3), // Max 3 images per product
    }));

    const services = await db.service.findMany({
      where: {
        companyId,
        isPublished: true,
        isFeatured: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
      },
    });

    const testimonials = await db.testimonial.findMany({
      where: { companyId, status: "APPROVED" },
      take: 15,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        customerTitle: true,
        testimonial: true,
        rating: true,
      },
    });

    // Staff and Post models don't exist yet in schema
    const teamMembers: Array<{
      user: { name: string | null; email: string; image: string | null };
      role: string;
      bio: string | null;
    }> = [];

    const posts: Array<{
      id: string;
      title: string;
      excerpt: string | null;
    }> = [];

    // Fetch previous conversation messages for context
    const previousMessages = await db.storefrontMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { role: true, content: true },
    });

    // Extract design preferences from user message
    const lowerMessage = message.toLowerCase();
    let inferredGoal:
      | "sell-products"
      | "sell-services"
      | "lead-gen"
      | "bookings" = "lead-gen";
    let inferredTone: "playful" | "serious" | "luxury" | "minimal" = "serious";

    if (
      lowerMessage.includes("product") ||
      lowerMessage.includes("shop") ||
      lowerMessage.includes("buy")
    ) {
      inferredGoal = "sell-products";
    } else if (
      lowerMessage.includes("service") ||
      lowerMessage.includes("booking") ||
      lowerMessage.includes("appointment")
    ) {
      inferredGoal =
        services.length > products.length ? "sell-services" : "bookings";
    }

    if (
      lowerMessage.includes("fun") ||
      lowerMessage.includes("playful") ||
      lowerMessage.includes("colorful")
    ) {
      inferredTone = "playful";
    } else if (
      lowerMessage.includes("luxury") ||
      lowerMessage.includes("elegant") ||
      lowerMessage.includes("premium")
    ) {
      inferredTone = "luxury";
    } else if (
      lowerMessage.includes("minimal") ||
      lowerMessage.includes("simple") ||
      lowerMessage.includes("clean")
    ) {
      inferredTone = "minimal";
    }

    const aiInput = {
      company: {
        id: companyData?.id || company.id,
        name: companyData?.name || company.name,
        slogan: companyData?.slogan,
        description: companyData?.description,
        industry: companyData?.industry,
        logo: companyData?.logo,
        email: companyData?.email,
        phone: companyData?.phone,
        address: companyData?.addressLine1 || null,
        city: companyData?.city,
        state: companyData?.state,
        country: companyData?.country,
        website: companyData?.website,
      },
      products: cleanProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        price: Number(p.price ?? 0),
        category: p.category ?? null,
        images: p.images.map((img) => img.url), // Just pass the clean URLs
      })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? null,
        price: 0,
        duration: null,
        category: s.category ?? null,
      })),
      testimonials: testimonials.map((t) => ({
        id: t.id,
        customerName: t.customerName,
        customerTitle: t.customerTitle,
        customerCompany: null,
        testimonial: t.testimonial,
        rating: t.rating,
      })),
      team: teamMembers.map((m) => ({
        name: m.user.name,
        role: m.role,
        bio: m.bio,
        image: m.user.image,
      })),
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        excerpt: p.excerpt,
      })),
      blogEnabled: company.storeBlogEnabled,
      blogHasPosts: posts.length > 0,
      prompt: message,
      goal: inferredGoal,
      tone: inferredTone,
      conversationHistory: previousMessages
        .filter((m) => m.role !== "system" && m.content !== null)
        .map((m) => ({
          role: m.role,
          content: m.content as string,
        })),
    };

    // Call AI (non-streaming) and then stream result back as SSE events
    const enableProviderStreaming =
      process.env.AI_STOREFRONT_ENABLE_STREAMING === "true";

    // Load global AI provider config, if any (so admin settings apply)
    let providerConfig: AiProviderConfig | undefined;
    const aiProviderClient = (db as unknown as Record<string, unknown>)[
      "aiProviderSetting"
    ] as
      | { findFirst?: (opts?: unknown) => Promise<unknown | null> }
      | undefined;
    if (aiProviderClient && typeof aiProviderClient.findFirst === "function") {
      try {
        const aiProvider = (await aiProviderClient.findFirst({
          where: { scope: "GLOBAL", isActive: true },
        })) as Record<string, unknown> | null;
        if (aiProvider) {
          if (typeof aiProvider.apiKey === "string" && aiProvider.apiKey) {
            try {
              providerConfig = {
                provider: (aiProvider.provider as AiProviderType) || "openai",
                apiKey: decrypt(aiProvider.apiKey as string),
                model:
                  typeof aiProvider.model === "string"
                    ? (aiProvider.model as string)
                    : undefined,
                apiBase:
                  typeof aiProvider.apiBase === "string"
                    ? (aiProvider.apiBase as string)
                    : undefined,
              };
            } catch (dErr) {
              console.warn(
                "[AI Storefront] Failed to decrypt stored AI provider key; ensure ENCRYPTION_KEY matches the value used when saving the provider",
                dErr
              );
            }
          } else {
            console.warn(
              "[AI Storefront] AI provider record found but apiKey is empty — re-enter the API key in Settings > AI Provider and toggle active."
            );
          }
        }
      } catch (e) {
        console.warn("Failed to load AI provider settings:", e);
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        // Helper to push SSE events
        const pushEvent = (event: string, data: string) => {
          const payload = `event: ${event}\n` + `data: ${data}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        };

        try {
          if (enableProviderStreaming) {
            // Attempt provider-level streaming (OpenAI compatible)
            let accumulated = "";
            const final = await streamStorefrontModel(
              [
                {
                  role: "system",
                  content: "You must return a single JSON object only.",
                },
                { role: "user", content: JSON.stringify(aiInput, null, 2) },
              ],
              (token) => {
                accumulated += token;
                pushEvent("ai.chunk", JSON.stringify({ text: accumulated }));
              },
              providerConfig
            );

            // Try to parse final text as JSON spec
            let parsedSpec: unknown = null;
            try {
              parsedSpec = JSON.parse(final);
            } catch {
              console.warn(
                "Provider stream produced non-JSON output; falling back to non-stream generation"
              );
            }
            // If the parsed result asks a question, return it as assistant message
            const spec = parsedSpec as {
              shouldAsk?: boolean;
              assistantMessage?: string;
              spec?: unknown;
            };
            if (
              parsedSpec &&
              typeof parsedSpec === "object" &&
              spec.shouldAsk &&
              spec.assistantMessage
            ) {
              await db.storefrontMessage.create({
                data: {
                  conversationId: conversation.id,
                  role: "ai",
                  content: spec.assistantMessage,
                  isPreviewOnly: true,
                },
              });
              pushEvent(
                "assistant",
                JSON.stringify({ text: spec.assistantMessage })
              );
              pushEvent(
                "version",
                JSON.stringify({
                  versionId: null,
                  conversationId: conversation.id,
                  providerUsed: !!providerConfig,
                  modelUsed: true,
                })
              );
              pushEvent("done", JSON.stringify({}));
              controller.close();
              return;
            }

            // If parsedSpec not valid, call synchronous generator as fallback
            let resultSpec = parsedSpec;
            if (!resultSpec) {
              const gen = await generateAiStorefront(aiInput, providerConfig);
              // If generator wants to ask a question, stream assistant message
              if (gen.shouldAsk && gen.assistantMessage) {
                await db.storefrontMessage.create({
                  data: {
                    conversationId: conversation.id,
                    role: "ai",
                    content: gen.assistantMessage,
                    isPreviewOnly: true,
                  },
                });
                pushEvent(
                  "assistant",
                  JSON.stringify({ text: gen.assistantMessage })
                );
                pushEvent(
                  "version",
                  JSON.stringify({
                    versionId: null,
                    conversationId: conversation.id,
                    providerUsed: !!providerConfig,
                    modelUsed: !!gen.usedModel,
                  })
                );
                pushEvent("done", JSON.stringify({}));
                controller.close();
                return;
              }

              resultSpec = gen.spec;
            }

            const specVersion = await db.storefrontSpecVersion.create({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: {
                companyId,
                spec: (resultSpec || {}) as any,
                createdBy: user.id,
              },
            });
            await db.storefrontMessage.create({
              data: {
                conversationId: conversation.id,
                role: "ai",
                content: "AI generated preview",
                specVersionId: specVersion.id,
                isPreviewOnly: true,
              },
            });

            // send final spec & version (include debug flags)
            pushEvent("spec", JSON.stringify(resultSpec));
            pushEvent(
              "version",
              JSON.stringify({
                versionId: specVersion.id,
                conversationId: conversation.id,
                providerUsed: !!providerConfig,
                modelUsed: parsedSpec ? true : !!resultSpec,
              })
            );
            pushEvent("done", JSON.stringify({}));
            controller.close();
            return;
          }

          // Fallback: synchronous generation then simulated streaming
          const result = await generateAiStorefront(aiInput, providerConfig);

          // If AI wants to ask a question, stream it as assistant message
          if (result.shouldAsk && result.assistantMessage) {
            await db.storefrontMessage.create({
              data: {
                conversationId: conversation.id,
                role: "ai",
                content: result.assistantMessage,
                isPreviewOnly: true,
              },
            });

            // Stream the question word by word
            const words = result.assistantMessage.split(/\s+/);
            let accumulated = "";
            for (const w of words) {
              accumulated += (accumulated ? " " : "") + w;
              pushEvent("ai.chunk", JSON.stringify({ text: accumulated }));
            }

            pushEvent(
              "version",
              JSON.stringify({
                versionId: null,
                conversationId: conversation.id,
                providerUsed: !!providerConfig,
                modelUsed: !!result.usedModel,
              })
            );
            pushEvent("done", JSON.stringify({}));
            controller.close();
            return;
          }

          const specVersion = await db.storefrontSpecVersion.create({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: {
              companyId,
              spec: (result.spec || {}) as any,
              createdBy: user.id,
            },
          });

          // Use AI's explanation if available, otherwise fallback message
          const aiText =
            result.assistantMessage ||
            "AI generated a storefront preview. Review and apply if happy.";

          await db.storefrontMessage.create({
            data: {
              conversationId: conversation.id,
              role: "ai",
              content: aiText,
              specVersionId: specVersion.id,
              isPreviewOnly: true,
            },
          });

          // Simulate streaming AI textual rationale in chunks (word-by-word)
          const words = aiText.split(/\s+/);
          let accumulated = "";
          for (const w of words) {
            accumulated += (accumulated ? " " : "") + w;
            pushEvent("ai.chunk", JSON.stringify({ text: accumulated }));
          }

          // Send the final spec as a JSON payload
          pushEvent("spec", JSON.stringify(result.spec));

          // Send version id with debug flags
          pushEvent(
            "version",
            JSON.stringify({
              versionId: specVersion.id,
              conversationId: conversation.id,
              providerUsed: !!providerConfig,
              modelUsed: !!result.usedModel,
            })
          );

          // Done
          pushEvent("done", JSON.stringify({}));
          controller.close();
        } catch (error) {
          console.error("Stream generation error:", error);
          pushEvent("error", JSON.stringify({ error: "Failed to generate" }));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Stream chat error:", error);
    return NextResponse.json(
      { error: "Failed to stream chat" },
      { status: 500 }
    );
  }
}
