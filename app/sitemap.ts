import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/select-plan`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Fetch all public storefronts
  try {
    const companies = await db.company.findMany({
      where: {
        status: "ACTIVE",
        slug: {
          not: null,
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const storeRoutes: MetadataRoute.Sitemap = companies.flatMap((company) => [
      {
        url: `${baseUrl}/store/${company.slug}`,
        lastModified: company.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/store/${company.slug}/products`,
        lastModified: company.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/store/${company.slug}/services`,
        lastModified: company.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      },
    ]);

    return [...staticRoutes, ...storeRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return static routes if database query fails
    return staticRoutes;
  }
}
