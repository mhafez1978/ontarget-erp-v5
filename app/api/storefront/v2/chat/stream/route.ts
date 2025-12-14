import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { generateAiStorefront } from "@/lib/ai/ai-storefront-service";

// Simple server-side SSE-style streaming over a readable stream. This is a
// pragmatic MVP: we call the non-streaming model and then stream the response
// back to the client in chunks so the UI can feel live.

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
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
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        plan: true,
        ownedCompanies: { where: { id: companyId }, select: { id: true } },
      },
    });
    const isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
    const ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;
    if (!isSuperAdmin && !ownsCompany)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

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
    const userMessage = await db.storefrontMessage.create({
      data: { conversationId: conversation.id, role: "user", content: message },
    });

    // Prepare small dataset
    const products = await db.product.findMany({
      where: { companyId, isPublished: true },
      take: 6,
      select: { id: true, name: true, description: true, price: true },
    });
    const testimonials = await db.testimonial.findMany({
      where: { companyId, status: "APPROVED" },
      take: 6,
      select: { id: true, customerName: true, testimonial: true, rating: true },
    });

    const aiInput = {
      company: {
        id: company.id,
        name: company.name,
        slogan: null,
        description: null,
        industry: null,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        price: Number((p as any).price ?? 0),
        category: null,
      })),
      services: [],
      testimonials: testimonials.map((t) => ({
        id: t.id,
        customerName: t.customerName,
        customerTitle: null,
        testimonial: t.testimonial,
        rating: t.rating,
      })),
      prompt: message,
      goal: "lead-gen",
      tone: "serious",
    };

    // Call AI (non-streaming) and then stream result back as SSE events
    const result = await generateAiStorefront(aiInput as any);

    // Create a preview spec version
    const specVersion = await db.storefrontSpecVersion.create({
      data: { companyId, spec: result.spec as any, createdBy: user.id },
    });
    const aiMessage = await db.storefrontMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ai",
        content: "AI generated preview",
        specVersionId: specVersion.id,
        isPreviewOnly: true,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        // Helper to push SSE events
        const pushEvent = (event: string, data: string) => {
          const payload = `event: ${event}\n` + `data: ${data}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        };

        // Simulate streaming AI textual rationale in chunks (word-by-word)
        const aiText =
          "AI generated a storefront preview. Review and apply if happy.";
        const words = aiText.split(/\s+/);
        let accumulated = "";
        for (const w of words) {
          accumulated += (accumulated ? " " : "") + w;
          pushEvent("ai.chunk", JSON.stringify({ text: accumulated }));
        }

        // Send the final spec as a JSON payload
        pushEvent("spec", JSON.stringify(result.spec));

        // Send version id
        pushEvent(
          "version",
          JSON.stringify({
            versionId: specVersion.id,
            conversationId: conversation.id,
          })
        );

        // Done
        pushEvent("done", JSON.stringify({}));
        controller.close();
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
