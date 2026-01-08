import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import type { V4Website } from "@/lib/ai/v4-types";

/**
 * API endpoint for inline editing of V4 website sections
 * Allows updating specific content within a section without regenerating entire site
 */
export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }
    const userId = validation.user.id;

    const body = await req.json();
    const {
      websiteId,
      pageSlug = "home", // Default to home page
      componentIndex,
      updates, // Object containing the fields to update (e.g., { heading: "New Title", description: "..." })
    } = body;

    if (!websiteId || componentIndex === undefined || !updates) {
      return NextResponse.json(
        {
          error: "Missing required fields: websiteId, componentIndex, updates",
        },
        { status: 400 }
      );
    }

    // Fetch the website and verify ownership
    const website = await db.v4Website.findUnique({
      where: { id: websiteId },
      include: { company: true },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Verify user has access: either they created the website OR they have companyUser access
    const isOwner = website.userId === userId;
    const hasCompanyAccess = await db.companyMember.findFirst({
      where: {
        userId,
        companyId: website.companyId,
      },
    });

    if (!isOwner && !hasCompanyAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse current website data
    const websiteData = website.websiteData as unknown as V4Website;

    if (!websiteData?.pages) {
      return NextResponse.json(
        { error: "Invalid website data structure" },
        { status: 400 }
      );
    }

    // Find the page to update
    const pageIndex = websiteData.pages.findIndex((p) => p.slug === pageSlug);

    if (pageIndex === -1) {
      return NextResponse.json(
        { error: `Page "${pageSlug}" not found` },
        { status: 404 }
      );
    }

    const page = websiteData.pages[pageIndex];

    if (
      !page.components ||
      componentIndex < 0 ||
      componentIndex >= page.components.length
    ) {
      return NextResponse.json(
        { error: "Invalid component index" },
        { status: 400 }
      );
    }

    // Get the component to update
    const component = page.components[componentIndex];

    // Update the component's HTML with the new values
    // This requires parsing and updating the HTML intelligently
    let updatedHtml = component.componentCode || "";

    // Apply updates to the HTML
    // For each field in updates, we need to find and replace content
    for (const [field, value] of Object.entries(updates)) {
      if (typeof value !== "string") continue;

      // Based on common patterns in our V4 generation:
      switch (field) {
        case "heading":
        case "title":
          // Update h1, h2 tags
          updatedHtml = updatedHtml.replace(
            /<h([12])[^>]*>.*?<\/h\1>/i,
            (match) => {
              const tagMatch = match.match(/<h([12])[^>]*>/);
              return tagMatch
                ? `${tagMatch[0]}${value}</h${tagMatch[1]}>`
                : match;
            }
          );
          break;

        case "subheading":
        case "subtitle":
          // Update p tags near headings or specific subtitle patterns
          updatedHtml = updatedHtml.replace(
            /<p class="[^"]*(?:subtitle|subheading|lead)[^"]*"[^>]*>.*?<\/p>/i,
            (match) => {
              const openTag = match.match(/<p[^>]*>/);
              return openTag ? `${openTag[0]}${value}</p>` : match;
            }
          );
          break;

        case "description":
        case "content":
          // Update main content paragraphs (but not CTA buttons)
          updatedHtml = updatedHtml.replace(
            /<p(?![^>]*(?:button|cta))[^>]*>.*?<\/p>/i,
            (match) => {
              if (match.includes("button") || match.includes("cta"))
                return match;
              const openTag = match.match(/<p[^>]*>/);
              return openTag ? `${openTag[0]}${value}</p>` : match;
            }
          );
          break;

        case "ctaText":
        case "buttonText":
          // Update button/link text
          updatedHtml = updatedHtml.replace(
            /<(?:button|a)[^>]*class="[^"]*(?:button|btn|cta)[^"]*"[^>]*>.*?<\/(?:button|a)>/i,
            (match) => {
              const tagMatch = match.match(/<(button|a)([^>]*)>/);
              if (tagMatch) {
                const tag = tagMatch[1];
                const attrs = tagMatch[2];
                return `<${tag}${attrs}>${value}</${tag}>`;
              }
              return match;
            }
          );
          break;

        case "ctaLink":
          // Update button/link href
          updatedHtml = updatedHtml.replace(
            /(<a[^>]*href=")[^"]*("[^>]*class="[^"]*(?:button|btn|cta)[^"]*"[^>]*>)/i,
            `$1${value}$2`
          );
          break;

        default:
          // For custom fields, try to find and update by data attribute
          const dataAttr = `data-field="${field}"`;
          const regex = new RegExp(`<[^>]*${dataAttr}[^>]*>.*?</[^>]+>`, "i");
          updatedHtml = updatedHtml.replace(regex, (match) => {
            const openTag = match.match(/<[^>]+>/);
            const closeTag = match.match(/<\/[^>]+>$/);
            if (openTag && closeTag) {
              return `${openTag[0]}${value}${closeTag[0]}`;
            }
            return match;
          });
      }
    }

    // Update the component in the page
    page.components[componentIndex] = {
      ...component,
      componentCode: updatedHtml,
    };

    // Update the page in the website
    websiteData.pages[pageIndex] = page;

    // Save the updated website back to the database
    await db.v4Website.update({
      where: { id: websiteId },
      data: {
        websiteData: JSON.parse(JSON.stringify(websiteData)),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Section updated successfully",
      updatedComponent: page.components[componentIndex],
    });
  } catch (error) {
    console.error("[V4 Update Section] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to update section",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
