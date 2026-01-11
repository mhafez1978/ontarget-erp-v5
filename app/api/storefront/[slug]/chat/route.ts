import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { callStorefrontModel } from "@/lib/ai/model-client";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Find company by slug
    const company = await db.company.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          take: 20,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
          },
        },
        services: {
          where: { isActive: true },
          take: 20,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
          },
        },
        staff: {
          where: { status: "ACTIVE" },
          take: 10,
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
            jobTitle: true,
          },
        },
        testimonials: {
          where: { status: "APPROVED" },
          take: 10,
          select: {
            customerName: true,
            testimonial: true,
            rating: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get global AI provider config
    const aiProvider = await db.aiProviderSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (!aiProvider || !aiProvider.apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const providerConfig = {
      provider: aiProvider.provider as
        | "openai"
        | "anthropic"
        | "xai"
        | "deepseek"
        | "openai-compatible",
      apiKey: decrypt(aiProvider.apiKey),
      model: aiProvider.model || undefined,
      apiBase: aiProvider.apiBase || undefined,
    };

    // Build company context for AI
    const companyContext = `
You are an AI assistant for ${company.name}, a ${
      company.industry || "business"
    }.

Company Information:
- Name: ${company.name}
- Industry: ${company.industry || "Not specified"}
- Description: ${company.description || ""}
- Contact Email: ${company.email || ""}
- Contact Phone: ${company.phone || ""}

Products (${company.products?.length || 0}):
${(company.products || [])
  .map(
    (p: { name: string; description: string | null; price: Decimal | null }) =>
      `- ${p.name}: ${p.description || ""} ${
        p.price ? `($${p.price.toNumber()})` : ""
      }`
  )
  .join("\n")}

Services (${company.services?.length || 0}):
${(company.services || [])
  .map(
    (s: { name: string; description: string | null; price: Decimal | null }) =>
      `- ${s.name}: ${s.description || ""} ${
        s.price ? `($${s.price.toNumber()})` : ""
      }`
  )
  .join("\n")}

Team (${company.staff?.length || 0} members):
${(company.staff || [])
  .map(
    (t: { user: { name: string | null }; jobTitle: string | null }) =>
      `- ${t.user.name || "Team Member"} (${t.jobTitle || "Staff"})`
  )
  .join("\n")}

Customer Reviews (${company.testimonials?.length || 0} testimonials):
${(company.testimonials || [])
  .slice(0, 5)
  .map(
    (t: { customerName: string | null; rating: number; testimonial: string }) =>
      `- ${t.customerName || "Customer"} (${t.rating}★): "${t.testimonial}"`
  )
  .join("\n")}

Your Role:
- Answer questions about products, services, pricing, and the company
- Be helpful, professional, and enthusiastic about ${company.name}
- If asked about booking/quotes, encourage them to use the contact form or provide contact details
- Capture lead information when appropriate (name, email, phone, inquiry details)
- If you don't know something, admit it and offer to connect them with the team

Important:
- Use ONLY the information provided above
- Don't make up products, services, or prices
- Be concise but informative
- Always end with a helpful next step or call-to-action
`;

    // Build conversation messages
    const messages = [
      { role: "system" as const, content: companyContext },
      ...(conversationHistory || []).map(
        (msg: { role: string; content: string }) => ({
          role:
            msg.role === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        })
      ),
      { role: "user" as const, content: message },
    ];

    // Call AI
    const response = await callStorefrontModel(
      messages,
      z.object({
        response: z.string().describe("The assistant's response to the user"),
      }),
      providerConfig,
      1 // Low temperature for consistent responses
    );

    // Extract text response
    const aiResponse =
      typeof response === "string"
        ? response
        : (response as { response?: string; content?: string })?.response ||
          (response as { response?: string; content?: string })?.content ||
          "I'm sorry, I couldn't process that. Please try again.";

    // TODO: Save conversation to database for lead tracking
    // Check if message contains lead information (email, phone, booking request)
    const isLead =
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(message) ||
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(message) ||
      /(quote|book|schedule|appointment|contact me|call me)/i.test(message);

    if (isLead) {
      // Save potential lead (store in DB and trigger webhooks if configured)
      console.log(
        `[Chat Widget] Potential lead detected for ${company.name}:`,
        message
      );

      try {
        const lead = await (db as any).lead.create({
          data: {
            companyId: company.id,
            name: undefined,
            email: undefined,
            phone: undefined,
            source: "chat",
            message,
            data: {},
          },
        });

        // Trigger webhooks for company
        const webhooks = await (db as any).webhookConfig.findMany({
          where: { companyId: company.id, isActive: true },
        });

        const payload = {
          type: "lead.created",
          lead: { id: lead.id, companyId: company.id, message },
        };

        for (const wh of webhooks || []) {
          const delivery = await (db as any).webhookDelivery.create({
            data: { webhookId: wh.id, payload, status: "PENDING" },
          });

          // Immediate send with retries (best-effort)
          (async () => {
            const body = JSON.stringify(payload);
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (wh.secret) {
              try {
                const crypto = await import("crypto");
                const sig = crypto
                  .createHmac("sha256", wh.secret)
                  .update(body)
                  .digest("hex");
                headers["X-Signature"] = `sha256=${sig}`;
              } catch (e) {
                console.warn("Failed to sign webhook payload", e);
              }
            }

            let attempts = 0;
            let success = false;
            while (attempts < 3 && !success) {
              attempts++;
              try {
                const res = await fetch(wh.url, {
                  method: "POST",
                  headers,
                  body,
                });
                const text = await res.text().catch(() => "");
                if (res.ok) {
                  await (db as any).webhookDelivery.update({
                    where: { id: delivery.id },
                    data: {
                      status: "SUCCESS",
                      responseCode: res.status,
                      responseBody: text,
                      attempts,
                    },
                  });
                  success = true;
                } else {
                  await (db as any).webhookDelivery.update({
                    where: { id: delivery.id },
                    data: {
                      attempts,
                      responseCode: res.status,
                      responseBody: text,
                      lastAttemptAt: new Date(),
                    },
                  });
                }
              } catch (err) {
                await (db as any).webhookDelivery.update({
                  where: { id: delivery.id },
                  data: {
                    attempts,
                    responseBody: String(err),
                    lastAttemptAt: new Date(),
                  },
                });
              }
            }

            if (!success) {
              await (db as any).webhookDelivery.update({
                where: { id: delivery.id },
                data: { status: "FAILED" },
              });
            }
          })();
        }
      } catch (err) {
        console.error("Failed to persist lead or dispatch webhooks", err);
      }
    }

    return NextResponse.json({
      response: aiResponse,
      isLead,
    });
  } catch (error) {
    console.error("[Chat Widget] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
