import type { NextRequest } from "next/server";
import type { GeneratedSection, VideoGenerationJob } from "@/generated/prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  const params = await context.params;
  try {
    const { sectionId } = params;
    const { pathToFileURL } = await import("url");
    const vs = await import(
      pathToFileURL(`${process.cwd()}/lib/validate-session.ts`).href
    );
    const validation = await vs.validateSessionForAPI(req);
    if (!validation.valid) return validation.response;
    const user = validation.user;
    const firstCompany = user.ownedCompanies?.[0];
    const companyId = user.companyId || firstCompany?.id;
    if (!companyId)
      return new Response(JSON.stringify({ error: "No company context" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const dbModule = await import(
      pathToFileURL(`${process.cwd()}/lib/db.ts`).href
    );
    const db = dbModule.db;

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

    // Build 4 variants: 2 video and 2 image with REAL company data
    const now = Date.now();

    // Load company context for personalized prompts
    const {
      getCompanyContext,
      generateFallbackHeroContent,
      detectStorefrontMode,
    } = await import("@/lib/frontstore/v6-data-service");
    const context = await getCompanyContext(companyId);
    const fallback = generateFallbackHeroContent(context);
    const storefrontMode = detectStorefrontMode(context);

    // Build intelligent prompts using real data
    const companyName = context.company.name;
    const industry = context.company.industry || "business";
    const hasProducts = context.stats.totalProducts > 0;
    const hasServices = context.stats.totalServices > 0;

    // Extract key offerings for better prompts
    const topProduct = context.products[0]?.name;
    const topService = context.services[0]?.name;

    const imageVariants: Record<string, unknown>[] = [];
    for (const i of [1, 2]) {
      const id = `img-${now}-${i}`;
      const title = `Hero Image ${i}`;

      // Build context-aware prompt
      let prompt = `Hero image for ${companyName}, a ${industry} business — `;
      if (hasProducts && topProduct) {
        prompt += `showcasing ${topProduct} — `;
      } else if (hasServices && topService) {
        prompt += `representing ${topService} — `;
      }
      prompt += `cinematic, professional, high quality, 16:9, no text, ${storefrontMode.mode} style`;

      // Variant-specific styling
      if (i === 1) {
        prompt += ", dramatic lighting, bold composition";
      } else {
        prompt += ", clean minimal aesthetic, soft lighting";
      }
      // Generate image and store
      try {
        const { generateHeroImage } = await import(
          "@/lib/frontstore/v6-image-service"
        );
        const res = await generateHeroImage({
          companyId,
          sectionId: section.id,
          variantId: id,
          prompt,
        });
        imageVariants.push({
          id,
          title,
          type: "image",
          assets: [{ url: res.url, type: "image", provider: res.provider }],
          meta: {
            generatedAt: new Date().toISOString(),
            companyName,
            industry,
            storefrontMode: storefrontMode.mode,
            headline: fallback.headline,
            subheadline: fallback.subheadline,
            ctaText: fallback.ctaText,
          },
        });
      } catch (err) {
        console.error("Image generation failed for variant", id, err);
        imageVariants.push({
          id,
          title,
          type: "image",
          assets: [],
          meta: {
            generatedAt: new Date().toISOString(),
            error: String(err),
            headline: fallback.headline,
            subheadline: fallback.subheadline,
            ctaText: fallback.ctaText,
          },
        });
      }
    }

    const videoVariants: Record<string, unknown>[] = [];
    for (const i of [1, 2]) {
      const vidId = `vid-${now}-${i}`;
      const title = `Hero Video ${i}`;

      // Build context-aware video prompt
      let prompt = `Cinematic hero background video for ${companyName}, ${industry} company — `;
      if (hasProducts && topProduct) {
        prompt += `suggesting ${topProduct} concept — `;
      } else if (hasServices && topService) {
        prompt += `evoking ${topService} atmosphere — `;
      }
      prompt += `4 second loop, smooth camera move, cinematic color grading, no text, ${storefrontMode.mode} aesthetic`;

      // Variant-specific mood
      if (i === 1) {
        prompt += ", moody dramatic lighting, premium feel";
      } else {
        prompt += ", bright inviting atmosphere, modern clean look";
      }

      videoVariants.push({
        id: vidId,
        title,
        type: "video",
        assets: [],
        meta: {
          generatedAt: new Date().toISOString(),
          prompt,
          companyName,
          industry,
          storefrontMode: storefrontMode.mode,
          headline: fallback.headline,
          subheadline: fallback.subheadline,
          ctaText: fallback.ctaText,
        },
      });
    }

    const newVariants = [
      ...(Array.isArray(section.variants) ? section.variants : []),
      ...imageVariants,
      ...videoVariants,
    ];

    // Update section with new variants
    await db.generatedSection.update({
      where: { id: sectionId },
      data: { variants: newVariants },
    });

    // Enqueue video generation jobs for each video variant
    const createdJobs: VideoGenerationJob[] = [];
    for (const v of videoVariants) {
      const vRecord = v as Record<string, unknown>;
      const jobPrompt =
        vRecord?.meta && (vRecord.meta as Record<string, unknown>)?.prompt
          ? ((vRecord.meta as Record<string, unknown>)?.prompt as string)
          : `Hero background cinematic video for ${
              user.companyId || "company"
            }`;
      const job = (await db.videoGenerationJob.create({
        data: {
          companyId,
          sectionId: section.id,
          variantId: v.id,
          prompt: jobPrompt,
          duration: 4,
          resolution: "1920x1080",
          status: "QUEUED",
        },
      })) as VideoGenerationJob;
      createdJobs.push(job);
    }

    return new Response(
      JSON.stringify({
        success: true,
        variants: newVariants,
        jobs: createdJobs,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
