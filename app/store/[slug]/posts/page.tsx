import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import StorefrontLayout from "@/components/storefront/storefront-layout";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorePostsPage({ params }: PageProps) {
  const { slug } = await params;

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

  const posts = await db.storefrontPost.findMany({
    where: {
      companyId: company.id,
      status: "PUBLISHED",
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      heroImage: true,
      publishedAt: true,
    },
  });

  return (
    <StorefrontLayout
      slug={slug}
      companyName={company.name}
      logo={company.logo}
      logoLight={company.logoLight}
      logoDark={company.logoDark}
      storeBanner={company.storeBanner}
      storeMetadata={company.storeMetadata as unknown as any}
      aiMeta={
        company.aiStorefrontEnabled && company.aiStorefrontSpec
          ? typeof company.aiStorefrontSpec === "string"
            ? JSON.parse(company.aiStorefrontSpec as string).meta
            : (company.aiStorefrontSpec as Record<string, unknown>)?.meta
          : null
      }
      isStoreEnabled={company.isStoreEnabled}
      storeBlogEnabled={company.storeBlogEnabled}
      renderHero
      heroProps={{ title: `Latest from ${company.name}` }}
    >
      <main className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <p className="dark:text-gray-200">
            No published posts yet. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/store/${slug}/posts/${post.slug}`}
                className="group block rounded-lg border bg-card p-4 hover:shadow"
              >
                {post.heroImage && (
                  <div className="mb-3 h-40 w-full overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.heroImage}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <h2 className="text-lg font-semibold">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-sm dark:text-gray-200">{post.excerpt}</p>
                )}
                {post.publishedAt && (
                  <p className="text-xs dark:text-gray-200">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
    </StorefrontLayout>
  );
}
