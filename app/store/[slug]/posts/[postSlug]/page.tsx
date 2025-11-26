import { notFound } from "next/navigation";
import { db } from "@/lib/db";

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
      storeBlogEnabled: true,
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

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <article className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {company.name}
            </p>
            <h1 className="text-3xl font-bold">{post.title}</h1>
            {post.publishedAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString()}
              </p>
            )}
          </header>

          {post.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.heroImage}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg border"
            />
          )}

          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            {/* For now, render content as plain text/HTML. If storing markdown, you can add a markdown renderer later. */}
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </div>
    </main>
  );
}

