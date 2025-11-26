import { notFound } from "next/navigation";
import { db } from "@/lib/db";

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
      storeBlogEnabled: true,
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
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
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
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">
          Latest from {company.name}
        </h1>
        {posts.length === 0 ? (
          <p className="text-muted-foreground">
            No published posts yet. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/store/${slug}/posts/${post.slug}`}
                className="block rounded-lg border bg-card hover:bg-accent transition-colors overflow-hidden"
              >
                {post.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.heroImage}
                    alt={post.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-semibold">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

