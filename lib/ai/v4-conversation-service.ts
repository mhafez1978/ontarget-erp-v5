/**
 * V4 Conversation Service
 *
 * Manages interactive design conversations with users
 * Guides through preferences while ensuring accessibility & SEO
 */

import { z } from "zod";
import { callStorefrontModel } from "./model-client";
import type {
  V4Conversation,
  V4Message,
  V4ConversationPhase,
} from "./v4-conversation-types";
import type { V4CompanyContext } from "./v4-types";
import type { AiProviderConfig } from "./model-client";

const CONVERSATION_SYSTEM_PROMPT = `You are an expert web designer having a friendly conversation with a client to understand their website needs.

Your goals:
1. Learn about their design preferences through natural conversation
2. Guide them through key decisions (hero style, colors, fonts, sections)
3. Ensure the final design will be WCAG 2.1 AA accessible
4. Optimize for SEO with proper structure and content
5. Make the process fun and engaging

Use the company data provided to make informed suggestions. For example:
- "I see you have X products - should we feature your best sellers on the homepage?"
- "Your team would look great in an 'About Us' section. Want to include that?"
- "You have great reviews! Let's make testimonials prominent for social proof."

Conversation Flow:
1. GREETING: Welcome them, acknowledge their company data
2. UNDERSTANDING: Ask about their goals (leads, sales, awareness)
3. DESIGN STYLE: Discuss their industry and design preferences
4. HERO: Discuss hero section style (full-screen, above-fold, compact, split-screen)
5. COLORS: Present color scheme options or let them choose custom
6. TYPOGRAPHY: Present font pairings that match their style
7. LAYOUT: Discuss sections to include based on their data
8. CONFIRMATION: Summarize choices and confirm

Keep responses conversational, not robotic. Ask one question at a time. Use emojis sparingly but appropriately.

Always consider:
- Accessibility: Color contrast, semantic HTML, keyboard navigation
- SEO: Proper heading hierarchy, meta descriptions, structured data
- Performance: Optimized images, lazy loading
- Mobile-First: Design for mobile, scale up to desktop

When presenting options, explain the benefits clearly. Help them make informed decisions.`;

export async function startConversation(
  companyId: string,
  userId: string,
  context: V4CompanyContext,
  providerConfig?: AiProviderConfig
): Promise<V4Conversation> {
  // Determine which sections to enable based on available data
  // Always enable: hero, about, contact, footer (required)
  // Enable if data exists: products, services, team, testimonials, blog
  const sections = {
    hero: true, // Always
    features: context.services.length > 0 || context.products.length > 0,
    products: context.products.length > 0,
    services: context.services.length > 0,
    team: context.team.length > 0,
    testimonials: context.testimonials.length > 0,
    gallery: false, // User can request during conversation
    blog: context.blogPosts.length > 0,
    faq: false, // User can request during conversation
    contact: true, // Always
  };

  console.log("[V4 Start] Company data loaded:", {
    products: context.products.length,
    services: context.services.length,
    team: context.team.length,
    testimonials: context.testimonials.length,
    blogPosts: context.blogPosts.length,
    locations: context.locations.length,
  });

  console.log("[V4 Start] Initial sections enabled:", sections);

  const conversation: V4Conversation = {
    id: generateId(),
    companyId,
    userId,
    phase: "greeting",
    messages: [],
    preferences: {
      sections,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Generate greeting message using AI
  const greetingPrompt = buildPromptForPhase("greeting", context, conversation);
  const greetingMessage = await generateAIResponse(
    greetingPrompt,
    context,
    conversation,
    providerConfig
  );

  conversation.messages.push(greetingMessage);

  return conversation;
}

export async function continueConversation(
  conversation: V4Conversation,
  userMessage: string,
  context: V4CompanyContext,
  providerConfig: AiProviderConfig
): Promise<V4Conversation> {
  // Add user message
  const userMsg: V4Message = {
    id: generateId(),
    role: "user",
    content: userMessage,
    timestamp: new Date(),
    phase: conversation.phase,
  };
  conversation.messages.push(userMsg);

  // Update preferences based on user input
  updatePreferencesFromMessage(conversation, userMessage);

  // Determine next phase
  const nextPhase = determineNextPhase(conversation);
  conversation.phase = nextPhase;

  // Generate AI response
  const prompt = buildPromptForPhase(nextPhase, context, conversation);
  const aiMessage = await generateAIResponse(
    prompt,
    context,
    conversation,
    providerConfig
  );

  conversation.messages.push(aiMessage);
  conversation.updatedAt = new Date();

  return conversation;
}

function buildPromptForPhase(
  phase: V4ConversationPhase,
  context: V4CompanyContext,
  conversation: V4Conversation
): string {
  const companyName = context.company.name;
  const industry = context.company.industry || "business";
  const productsCount = context.products.length;
  const servicesCount = context.services.length;
  const teamCount = context.team.length;
  const testimonialsCount = context.testimonials.length;

  let phasePrompt = "";

  switch (phase) {
    case "greeting":
      phasePrompt = `Start the conversation warmly. Acknowledge you have access to ${companyName}'s company data and understand their business. Ask what they want to achieve with their new website (generate leads, sell products, build awareness, etc.). Keep it conversational and friendly.`;
      break;

    case "understanding-business":
      phasePrompt = `Based on their goal, ask about their target audience and what makes them unique in the ${industry} industry. Reference relevant products/services from their data to show you understand their business.`;
      break;

    case "design-style":
      phasePrompt = `Discuss design style preferences. Based on ${industry}, suggest styles: professional & trustworthy, creative & bold, minimal & modern, or warm & inviting. Ask what resonates with their brand.`;
      break;

    case "hero-preferences":
      phasePrompt = `Discuss hero section. Present options: 1) Full-Screen (bold, immersive), 2) Above-Fold (balanced, modern), 3) Compact (professional, fast), 4) Split-Screen (visual storytelling). Ask which feels right for their brand.`;
      break;

    case "color-selection":
      phasePrompt = `Present color scheme options based on ${industry}: Professional Blue, Creative Purple, Natural Green, Luxury Gold, Energetic Orange, Minimal Black, or Custom. Mention WCAG AA color contrast compliance.`;
      break;

    case "typography":
      phasePrompt = `Present font pairing options: Modern & Clean (Inter), Classic Elegance (Playfair), Playful (Poppins), Minimal Swiss, Bold (Montserrat), Tech (Space Grotesk). All are web-safe and optimized. Ask which matches their brand.`;
      break;

    case "layout-preferences":
      phasePrompt = `Based on their data, suggest sections: ${
        productsCount > 0 ? `Products (${productsCount})` : ""
      } ${servicesCount > 0 ? `Services (${servicesCount})` : ""} ${
        teamCount > 0 ? `Team (${teamCount})` : ""
      } ${
        testimonialsCount > 0 ? `Testimonials (${testimonialsCount})` : ""
      }. Ask if they want to include/exclude any. Mention SEO benefits.`;
      break;

    case "final-confirmation":
      phasePrompt = `Summarize all their choices: Hero style, Colors, Fonts, Sections. Confirm you'll create a unique, accessible (WCAG AA), SEO-optimized website for ${companyName}. Ask if they're ready to proceed.`;
      break;

    default:
      phasePrompt = "Continue the conversation naturally.";
  }

  return phasePrompt;
}

async function generateAIResponse(
  prompt: string,
  context: V4CompanyContext,
  conversation: V4Conversation,
  providerConfig?: AiProviderConfig
): Promise<V4Message> {
  try {
    console.log("[V4 AI] Generating response for phase:", conversation.phase);

    // Build company context
    const detailedContext = buildDetailedContextSummary(context);

    // Build full conversational prompt
    let fullPrompt = `${CONVERSATION_SYSTEM_PROMPT}

COMPANY DATA:
${detailedContext}

Current Phase: ${conversation.phase}
Task: ${prompt}
`;

    // Add conversation history
    if (conversation.messages.length > 0) {
      fullPrompt += `\nConversation history:\n`;
      conversation.messages.forEach((msg) => {
        const role = msg.role === "user" ? "Client" : "Designer";
        fullPrompt += `${role}: ${msg.content}\n`;
      });
    }

    fullPrompt += `\nGenerate your next response as a friendly web designer. 

CRITICAL: Return ONLY raw JSON without any markdown code blocks or formatting. Do NOT wrap in \`\`\`json or \`\`\`.
Just return pure JSON: {"message": "your conversational response here"}`;

    console.log("[V4 AI] Calling AI model");

    const response = await callStorefrontModel(
      [{ role: "user", content: fullPrompt }],
      z.object({ message: z.string() }),
      providerConfig
    );

    console.log("[V4 AI] Got response:", response ? "Success" : "Empty");

    // Determine if this message expects input
    const expectsInput = determineExpectedInput(conversation.phase);

    const content = response?.message || "";

    if (!content || content.trim().length === 0) {
      console.error("[V4 AI] Empty response received from AI");
      throw new Error("AI returned empty response");
    }

    return {
      id: generateId(),
      role: "assistant",
      content: content.trim(),
      timestamp: new Date(),
      phase: conversation.phase,
      expectsInput,
    };
  } catch (error) {
    console.error("[V4 AI] Failed to generate AI response:", error);
    return {
      id: generateId(),
      role: "assistant",
      content:
        "I apologize, but I encountered an error generating a response. Could you please try again?",
      timestamp: new Date(),
      phase: conversation.phase,
    };
  }
}

function updatePreferencesFromMessage(
  conversation: V4Conversation,
  userMessage: string
): void {
  const msg = userMessage.toLowerCase();
  const prefs = conversation.preferences;

  // Extract hero style preference
  if (msg.includes("full screen") || msg.includes("full-screen")) {
    prefs.heroStyle = "full-screen";
  } else if (msg.includes("above fold") || msg.includes("above-fold")) {
    prefs.heroStyle = "above-fold";
  } else if (msg.includes("compact")) {
    prefs.heroStyle = "compact";
  } else if (msg.includes("split") || msg.includes("side by side")) {
    prefs.heroStyle = "split-screen";
  }

  // Extract color preferences
  if (msg.includes("blue") || msg.includes("professional")) {
    prefs.primaryColor = "#2563EB";
    prefs.secondaryColor = "#64748B";
    prefs.accentColor = "#F59E0B";
  } else if (msg.includes("purple") || msg.includes("creative")) {
    prefs.primaryColor = "#9333EA";
    prefs.secondaryColor = "#EC4899";
    prefs.accentColor = "#F59E0B";
  } else if (msg.includes("green") || msg.includes("natural")) {
    prefs.primaryColor = "#059669";
    prefs.secondaryColor = "#0D9488";
    prefs.accentColor = "#F59E0B";
  }

  // Extract font preferences
  if (msg.includes("modern") || msg.includes("inter")) {
    prefs.fontPairing = "modern";
    prefs.headingFont = "Inter";
    prefs.bodyFont = "Inter";
  } else if (msg.includes("classic") || msg.includes("elegant")) {
    prefs.fontPairing = "classic";
    prefs.headingFont = "Playfair Display";
    prefs.bodyFont = "Source Sans Pro";
  } else if (msg.includes("playful") || msg.includes("fun")) {
    prefs.fontPairing = "playful";
    prefs.headingFont = "Poppins";
    prefs.bodyFont = "Poppins";
  }

  // Extract animation preferences
  if (msg.includes("no animation") || msg.includes("none")) {
    prefs.animations = "none";
  } else if (msg.includes("subtle")) {
    prefs.animations = "subtle";
  } else if (msg.includes("dynamic") || msg.includes("animated")) {
    prefs.animations = "dynamic";
  }
}

function determineNextPhase(conversation: V4Conversation): V4ConversationPhase {
  const phases: V4ConversationPhase[] = [
    "greeting",
    "understanding-business",
    "design-style",
    "hero-preferences",
    "color-selection",
    "typography",
    "layout-preferences",
    "final-confirmation",
    "generating",
  ];

  const currentIndex = phases.indexOf(conversation.phase);

  // Special case: Don't auto-advance from final-confirmation to generating
  // User must explicitly confirm with "yes", "proceed", "generate", etc.
  if (conversation.phase === "final-confirmation") {
    const lastUserMessage =
      conversation.messages
        .filter((m) => m.role === "user")
        .pop()
        ?.content.toLowerCase() || "";

    const confirmWords = [
      "yes",
      "proceed",
      "generate",
      "go ahead",
      "let's do it",
      "sounds good",
      "perfect",
      "correct",
      "that's right",
    ];
    const hasConfirmation = confirmWords.some((word) =>
      lastUserMessage.includes(word)
    );

    if (hasConfirmation) {
      return "generating";
    }
    // Stay in final-confirmation if no clear confirmation
    return "final-confirmation";
  }

  return currentIndex < phases.length - 1
    ? phases[currentIndex + 1]
    : "complete";
}

function determineExpectedInput(
  phase: V4ConversationPhase
): V4Message["expectsInput"] {
  switch (phase) {
    case "hero-preferences":
      return {
        type: "choice",
        choices: [
          {
            id: "full-screen",
            label: "Full Screen",
            description: "Bold, immersive first impression",
          },
          {
            id: "above-fold",
            label: "Above the Fold",
            description: "Balanced, modern, popular choice",
          },
          {
            id: "compact",
            label: "Compact",
            description: "Professional, content-focused",
          },
          {
            id: "split-screen",
            label: "Split Screen",
            description: "Visual storytelling",
          },
        ],
      };

    case "color-selection":
      return {
        type: "choice",
        choices: [
          { id: "professional", label: "Professional Blue" },
          { id: "creative", label: "Creative Purple" },
          { id: "organic", label: "Natural Green" },
          { id: "luxury", label: "Luxury Gold" },
          { id: "energetic", label: "Energetic Orange" },
          { id: "minimal", label: "Minimal Black" },
          { id: "custom", label: "Custom Colors" },
        ],
      };

    case "typography":
      return {
        type: "choice",
        choices: [
          { id: "modern", label: "Modern & Clean" },
          { id: "classic", label: "Classic Elegance" },
          { id: "playful", label: "Playful & Fun" },
          { id: "minimal", label: "Minimal Swiss" },
          { id: "bold", label: "Bold Statement" },
          { id: "tech", label: "Tech & Startup" },
        ],
      };

    default:
      return { type: "text" };
  }
}

function generateId(): string {
  return `v4_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Build detailed context summary with actual company data
 * This gives the AI real information to make informed suggestions
 */
function buildDetailedContextSummary(context: V4CompanyContext): string {
  const sections: string[] = [];

  // Company overview
  sections.push(`## COMPANY OVERVIEW
Name: ${context.company.name}
Industry: ${context.company.industry || "Not specified"}
${
  context.company.description
    ? `Description: ${context.company.description}`
    : ""
}
${context.company.slogan ? `Slogan: "${context.company.slogan}"` : ""}
${context.company.foundedYear ? `Founded: ${context.company.foundedYear}` : ""}
${
  context.company.employeeCount
    ? `Employees: ${context.company.employeeCount}`
    : ""
}
Locations: ${context.locations.length} (${context.locations
    .map((l) => l.address.city)
    .join(", ")})`);

  // Social proof
  if (
    context.socialProof.instagramFollowers ||
    context.socialProof.facebookLikes ||
    context.socialProof.linkedinFollowers ||
    context.socialProof.youtubeSubscribers ||
    context.socialProof.trustpilotRating ||
    context.socialProof.googleRating
  ) {
    sections.push(`## SOCIAL PROOF
${
  context.socialProof.instagramFollowers
    ? `Instagram: ${context.socialProof.instagramFollowers.toLocaleString()} followers`
    : ""
}
${
  context.socialProof.facebookLikes
    ? `Facebook: ${context.socialProof.facebookLikes.toLocaleString()} likes`
    : ""
}
${
  context.socialProof.linkedinFollowers
    ? `LinkedIn: ${context.socialProof.linkedinFollowers.toLocaleString()} followers`
    : ""
}
${
  context.socialProof.youtubeSubscribers
    ? `YouTube: ${context.socialProof.youtubeSubscribers.toLocaleString()} subscribers`
    : ""
}
${
  context.socialProof.trustpilotRating
    ? `Trustpilot: ${context.socialProof.trustpilotRating}/5 stars`
    : ""
}
${
  context.socialProof.googleRating
    ? `Google: ${context.socialProof.googleRating}/5 stars`
    : ""
}`);
  }

  // Products (show top 5 featured or first 5)
  if (context.products.length > 0) {
    const topProducts = context.products.filter((p) => p.featured).slice(0, 5);
    const displayProducts =
      topProducts.length > 0 ? topProducts : context.products.slice(0, 5);

    sections.push(`## PRODUCTS (${context.products.length} total)
${displayProducts
  .map(
    (p) =>
      `- ${p.name}${p.price ? ` ($${p.price})` : ""}${
        p.category ? ` [${p.category}]` : ""
      }
  ${p.description ? p.description.substring(0, 100) : ""}`
  )
  .join("\n")}`);
  }

  // Services (show top 5 featured or first 5)
  if (context.services.length > 0) {
    const topServices = context.services.filter((s) => s.featured).slice(0, 5);
    const displayServices =
      topServices.length > 0 ? topServices : context.services.slice(0, 5);

    sections.push(`## SERVICES (${context.services.length} total)
${displayServices
  .map(
    (s) =>
      `- ${s.name}${s.price ? ` ($${s.price})` : ""}${
        s.duration ? ` [${s.duration}]` : ""
      }
  ${s.description ? s.description.substring(0, 100) : ""}`
  )
  .join("\n")}`);
  }

  // Team (show first 5)
  if (context.team.length > 0) {
    const displayTeam = context.team.slice(0, 5);
    sections.push(`## TEAM (${context.team.length} total)
${displayTeam
  .map(
    (t) =>
      `- ${t.name} - ${t.role}${
        t.bio ? `\n  ${t.bio.substring(0, 80)}...` : ""
      }`
  )
  .join("\n")}`);
  }

  // Testimonials (show top 3 featured or highest rated)
  if (context.testimonials.length > 0) {
    const topTestimonials = context.testimonials
      .filter((t) => t.featured)
      .slice(0, 3);
    const displayTestimonials =
      topTestimonials.length > 0
        ? topTestimonials
        : context.testimonials
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);

    sections.push(`## TESTIMONIALS (${context.testimonials.length} total)
${displayTestimonials
  .map(
    (t) =>
      `- ${t.customerName}${t.customerRole ? ` (${t.customerRole})` : ""}${
        t.rating ? ` - ${t.rating}★` : ""
      }
  "${t.content.substring(0, 150)}..."`
  )
  .join("\n")}`);
  }

  // Customer insights
  if (context.customerInsights.totalCustomers > 0) {
    sections.push(`## CUSTOMER INSIGHTS
Total Customers: ${context.customerInsights.totalCustomers}
${
  context.customerInsights.averageRating
    ? `Average Rating: ${context.customerInsights.averageRating.toFixed(1)}★`
    : ""
}
${
  context.customerInsights.topIndustries.length > 0
    ? `Top Industries: ${context.customerInsights.topIndustries
        .map((i) => `${i.industry} (${i.count})`)
        .join(", ")}`
    : ""
}`);
  }

  // Business metrics
  if (
    context.metrics.certifications.length > 0 ||
    context.metrics.awards.length > 0
  ) {
    sections.push(`## CREDENTIALS
${
  context.metrics.certifications.length > 0
    ? `Certifications: ${context.metrics.certifications.join(", ")}`
    : ""
}
${
  context.metrics.awards.length > 0
    ? `Awards: ${context.metrics.awards.join(", ")}`
    : ""
}`);
  }

  // Blog posts
  if (context.blogPosts.length > 0) {
    sections.push(`## BLOG POSTS (${context.blogPosts.length} total)
Recent: ${context.blogPosts
      .slice(0, 3)
      .map((p) => p.title)
      .join(", ")}`);
  }

  return sections.join("\n\n");
}
