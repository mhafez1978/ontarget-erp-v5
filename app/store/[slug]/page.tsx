import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Package,
  Wrench,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: {
    slug: string;
  };
}

interface StoreMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

async function getStoreData(slug: string) {
  const company = await db.company.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logo: true,
      slug: true,
      isStoreEnabled: true,
      storeTheme: true,
      storeBanner: true,
      storeMetadata: true,
    },
  });

  if (!company || !company.isStoreEnabled) {
    return null;
  }

  // Get featured products
  const featuredProducts = await db.product.findMany({
    where: {
      companyId: company.id,
      isPublished: true,
      isActive: true,
      isFeatured: true,
    },
    include: {
      images: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  // Get featured services
  const featuredServices = await db.service.findMany({
    where: {
      companyId: company.id,
      isPublished: true,
      isActive: true,
      isFeatured: true,
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return {
    company,
    featuredProducts,
    featuredServices,
  };
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = params;
  const data = await getStoreData(slug);

  if (!data) {
    notFound();
  }

  const { company, featuredProducts, featuredServices } = data;
  const metadata = company.storeMetadata as StoreMetadata | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {company.logo && (
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <h1 className="text-2xl font-bold">
                {metadata?.title || company.name}
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href={`/store/${slug}`}
                className="text-sm font-medium hover:underline"
              >
                Home
              </Link>
              <Link
                href={`/store/${slug}/products`}
                className="text-sm font-medium hover:underline"
              >
                Products
              </Link>
              <Link
                href={`/store/${slug}/services`}
                className="text-sm font-medium hover:underline"
              >
                Services
              </Link>
              <Link
                href={`/store/${slug}/login`}
                className="text-sm font-medium hover:underline"
              >
                Login
              </Link>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/store/${slug}/register`}>Register</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/store/${slug}/cart`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {company.storeBanner && (
        <section className="relative h-[400px] overflow-hidden">
          <Image
            src={company.storeBanner}
            alt="Store banner"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                {metadata?.title || `Welcome to ${company.name}`}
              </h2>
              {metadata?.description && (
                <p className="text-lg md:text-xl max-w-2xl mx-auto px-4">
                  {metadata.description}
                </p>
              )}
              <div className="flex gap-4 justify-center mt-6">
                <Button size="lg" asChild>
                  <Link href={`/store/${slug}/products`}>
                    <Package className="h-5 w-5 mr-2" />
                    Browse Products
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={`/store/${slug}/services`}>
                    <Wrench className="h-5 w-5 mr-2" />
                    View Services
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Button variant="outline" asChild>
              <Link href={`/store/${slug}/products`}>View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.images && product.images[0] && (
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">
                      {product.name}
                    </CardTitle>
                    {product.isFeatured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${Number(product.price).toFixed(2)}
                  </p>
                  {product.quantity !== null && product.quantity < 10 && (
                    <p className="text-sm text-orange-600 mt-2">
                      Only {product.quantity} left in stock!
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <section className="container mx-auto px-4 py-12 bg-muted/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Featured Services</h2>
            <Button variant="outline" asChild>
              <Link href={`/store/${slug}/services`}>View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">
                      {service.name}
                    </CardTitle>
                    {service.isFeatured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${Number(service.price).toFixed(2)}
                  </p>
                  {service.duration && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Duration: {service.duration} mins
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t mt-12 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4">
                {metadata?.title || company.name}
              </h3>
              {metadata?.description && (
                <p className="text-sm text-muted-foreground">
                  {metadata.description}
                </p>
              )}
            </div>

            {/* Contact Info */}
            {(metadata?.contactEmail || metadata?.contactPhone) && (
              <div>
                <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
                <div className="space-y-2">
                  {metadata?.contactEmail && (
                    <a
                      href={`mailto:${metadata.contactEmail}`}
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {metadata.contactEmail}
                    </a>
                  )}
                  {metadata?.contactPhone && (
                    <a
                      href={`tel:${metadata.contactPhone}`}
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {metadata.contactPhone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Social Links */}
            {metadata?.socialLinks && (
              <div>
                <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {metadata.socialLinks.facebook && (
                    <a
                      href={metadata.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {metadata.socialLinks.twitter && (
                    <a
                      href={metadata.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {metadata.socialLinks.instagram && (
                    <a
                      href={metadata.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {metadata?.title || company.name}.
              All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
