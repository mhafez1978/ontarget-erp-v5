import type { NextRequest } from "next/server";
import type { GeneratedSection, VideoGenerationJob } from "@prisma/client";

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

    // Build 4 variants: 2 video and 2 image
    const now = Date.now();

    const imageVariants: Record<string, unknown>[] = [];
    for (const i of [1, 2]) {
      const id = `img-${now}-${i}`;
      const title = `Hero Image ${i}`;
      // Build an image prompt from section if available
      const schema = section?.schema as unknown as
        | Record<string, unknown>
        | undefined;
      const schemaTitle =
        schema && typeof schema === "object" && "title" in schema
          ? (schema.title as string)
          : null;
      const prompt = schemaTitle
        ? `Hero image: ${schemaTitle} — cinematic, high quality, 16:9, no text`
        : `Hero image — cinematic, high quality, 16:9, no text`;
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
          meta: { generatedAt: new Date().toISOString() },
        });
      } catch (err) {
        console.error("Image generation failed for variant", id, err);
        imageVariants.push({
          id,
          title,
          type: "image",
          assets: [],
          meta: { generatedAt: new Date().toISOString(), error: String(err) },
        });
      }
    }

    const videoVariants: Record<string, unknown>[] = [];
    for (const i of [1, 2]) {
      const vidId = `vid-${now}-${i}`;
      const title = `Hero Video ${i}`;
      const schema2 = section?.schema as unknown as
        | Record<string, unknown>
        | undefined;
      const schemaTitle2 =
        schema2 && typeof schema2 === "object" && "title" in schema2
          ? (schema2.title as string)
          : null;
      const prompt = schemaTitle2
        ? `Cinematic hero background video based on: ${schemaTitle2} — 4 second loop, smooth camera move, cinematic color grading, no text, moody lighting`
        : `Cinematic hero background video — 4 second loop, smooth camera move, cinematic color grading, no text, moody lighting`;
      videoVariants.push({
        id: vidId,
        title,
        type: "video",
        assets: [],
        meta: { generatedAt: new Date().toISOString(), prompt },
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
