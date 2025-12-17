import { notFound } from "next/navigation";
import StorefrontLayout from "@/components/storefront/storefront-layout";
import { db } from "@/lib/db";
import { defaultThemes } from "@/lib/storefront-themes";

interface PageProps {
  params: Promise<{
    slug: string;
    postSlug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorePostDetailPage({ params }: PageProps) {
  const { slug, postSlug } = await params;

  const company = await db.company.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logo: true,
      logoLight: true,
      logoDark: true,
      slug: true,
      isStoreEnabled: true,
      storeTheme: true,
      storeBlogEnabled: true,
      storeBanner: true,
      storeMetadata: true,
      aiStorefrontEnabled: true,
      aiStorefrontSpec: true,
    },
  });

  if (!company || !company.storeBlogEnabled) {
    notFound();
  }

  const post = await db.storefrontPost.findFirst({
    where: {
      companyId: company.id,
      slug: postSlug,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      content: true,
      heroImage: true,
      publishedAt: true,
    },
  });

  if (!post) {
    notFound();
  }

  // Determine AI spec or theme meta for styling the header + hero
  const aiSpecRaw = company.aiStorefrontSpec || null;
  let aiSpec: Record<string, unknown> | null = null;
  let aiMeta: Record<string, unknown> | null = null;
  if (company.aiStorefrontEnabled && aiSpecRaw) {
    try {
      aiSpec =
        typeof aiSpecRaw === "string" ? JSON.parse(aiSpecRaw) : aiSpecRaw;
      aiMeta = (aiSpec?.meta as Record<string, unknown>) ?? null;
    } catch {
      // swallow parse errors — treat as not present
      aiSpec = null;
      aiMeta = null;
    }
  }

  // Theme fallback — pick header classes similar to storefront page
  const themeId = company.storeTheme || "modern-tech";
  const selectedTheme =
    defaultThemes.find((t) => t.id === themeId) || defaultThemes[0];
  const isBlackFriday = selectedTheme.id === "black-friday-mega-sale";
  const isPrecisionCare = selectedTheme.id === "healthcare-precision-care";
  const isFitnessBoutique = selectedTheme.id === "fitness-boutique";
  const isDigitalCampus = selectedTheme.id === "education-digital-campus";
  const isBoutiqueStay = selectedTheme.id === "hospitality-boutique-stay";
  const isBuildCraft = selectedTheme.id === "construction-buildcraft";
  const headerClass = isBlackFriday
    ? "bg-black/90 text-white border-b border-red-600"
    : isPrecisionCare
    ? "bg-white/90 text-gray-900 border-b border-gray-200"
    : isFitnessBoutique
    ? "bg-[#f6eee5] text-[#3a2c20] border-b-4 border-[#d36c3b]"
    : isDigitalCampus
    ? "bg-[#1d75ff] text-white border-b-4 border-[#ffdd33]"
    : isBoutiqueStay
    ? "bg-white/70 text-[#3a2a2a] border-b shadow-sm"
    : isBuildCraft
    ? "bg-[#ff6b00] text-black border-b-4 border-black shadow-lg"
    : "border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60";

  return (
    <StorefrontLayout
      slug={slug}
      companyName={company.name}
      logo={company.logo}
      logoLight={company.logoLight}
      logoDark={company.logoDark}
      storeBanner={company.storeBanner}
      storeMetadata={company.storeMetadata as unknown as any}
      aiMeta={aiMeta}
      isStoreEnabled={company.isStoreEnabled}
      storeBlogEnabled={company.storeBlogEnabled}
      renderHero
      useThemeClass={headerClass}
      heroProps={{ title: post.title, publishedAt: post.publishedAt }}
    >
      {/* Store Disabled Banner (still allowed inside the layout children) */}
      {!company.isStoreEnabled && (
        <div className="bg-yellow-500 text-yellow-950 px-4 py-3 text-center font-medium">
          ⚠️ This store is currently disabled and only visible in preview mode
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <article className="space-y-6">
          {post.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.heroImage}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg border"
            />
          )}

          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </main>
    </StorefrontLayout>
  );
}
