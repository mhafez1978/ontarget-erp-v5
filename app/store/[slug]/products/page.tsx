"use client";

import {
  ShoppingCart,
  Search,
  Filter,
  Grid3x3,
  List,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { defaultThemes } from "@/lib/storefront-themes";

interface ProductImage {
  id: string;
  url: string;
  isFeatured: boolean;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: ProductImage[];
  category: string | null;
  inventory: number | null;
  isFeatured: boolean;
  isPublished: boolean;
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
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  slug: string;
  storeMetadata: StoreMetadata | null;
  storeTheme?: string | null;
  aiStorefrontEnabled?: boolean;
  aiStorefrontMeta?: {
    layoutStyle: "hero-left" | "hero-split" | "magazine" | "one-page";
    tone: "playful" | "serious" | "luxury" | "minimal";
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor?: string;
    textColor?: string;
  } | null;
}

export default function ProductsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [themeId, setThemeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetchStoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    filterAndSortProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchQuery, selectedCategory, sortBy]);

  const fetchStoreData = async () => {
    try {
      // Fetch store info
      const storeResponse = await fetch(`/api/store/${slug}`);
      if (!storeResponse.ok) throw new Error("Store not found");
      const storeData = await storeResponse.json();
      const store = (storeData && storeData.store) || storeData;
      setCompany(store);
      setThemeId(store.storeTheme ?? null);

      // Fetch products
      const productsResponse = await fetch(`/api/store/${slug}/products`);
      if (!productsResponse.ok) throw new Error("Failed to fetch products");
      const productsData = await productsResponse.json();
      const fetchedProducts = Array.isArray(productsData)
        ? productsData
        : productsData.products || [];
      setProducts(fetchedProducts);

      // If no products exist, redirect to services if services are available (avoid empty page)
      if (Array.isArray(fetchedProducts) && fetchedProducts.length === 0) {
        try {
          const servicesResp = await fetch(`/api/store/${slug}/services`);
          if (servicesResp.ok) {
            const servicesData = await servicesResp.json();
            const servicesArray = Array.isArray(servicesData)
              ? servicesData
              : servicesData.services || [];
            if (servicesArray.length > 0) {
              // Redirect to services page
              window.location.href = `/store/${slug}/services`;
              return;
            }
          }
        } catch (e) {
          // ignore and continue to show empty state
        }
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = Array.isArray(products) ? [...products] : [];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "featured":
          return a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1;
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const addToCart = async (productId: string) => {
    try {
      if (!company?.id) {
        throw new Error("Missing company context for cart");
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          productId,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to cart");

      toast.success("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(
      Array.isArray(products)
        ? products.map((p) => p.category).filter(Boolean)
        : []
    )
  ) as string[];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  const aiMeta =
    company?.aiStorefrontEnabled && company.aiStorefrontMeta
      ? company.aiStorefrontMeta
      : null;

  const headerLogo =
    (company?.logo as string | null) ||
    (company?.logoLight as string | null) ||
    (company?.logoDark as string | null) ||
    null;

  const selectedTheme =
    defaultThemes.find((t) => t.id === themeId) || defaultThemes[0];
  const isBlackFriday = selectedTheme.id === "black-friday-mega-sale";
  const isFitnessBoutique = selectedTheme.id === "fitness-boutique";
  const isDigitalCampus = selectedTheme.id === "education-digital-campus";

  const isAiThemed = !!aiMeta;

  const headerClass = isAiThemed
    ? "border-b sticky top-0 z-50"
    : isBlackFriday
    ? "border-b sticky top-0 bg-black/90 text-white backdrop-blur supports-backdrop-filter:bg-black/80 z-50 border-red-600"
    : isFitnessBoutique
    ? "border-b sticky top-0 bg-[#0B0F1A]/95 text-[#F9FAFB] backdrop-blur supports-backdrop-filter:bg-[#0B0F1A]/85 z-50 border-orange-500"
    : isDigitalCampus
    ? "border-b sticky top-0 bg-[#2563EB] text-white backdrop-blur supports-backdrop-filter:bg-[#2563EB]/95 z-50 border-[#1D4ED8]"
    : "border-b sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50";

  const linkClass = isAiThemed
    ? "text-sm font-medium hover:underline"
    : isBlackFriday
    ? "text-sm font-medium hover:text-red-500 transition"
    : isFitnessBoutique
    ? "text-sm font-medium text-slate-100 hover:text-orange-400 transition"
    : isDigitalCampus
    ? "text-sm font-medium text-white hover:text-[#F59E0B] transition"
    : "text-sm font-medium hover:underline";

  const pageBgClass = isAiThemed
    ? "bg-background"
    : isBlackFriday
    ? "bg-black text-white"
    : isFitnessBoutique
    ? "bg-[#0B0F1A] text-[#F9FAFB]"
    : isDigitalCampus
    ? "bg-[#F8FAFC] text-[#0F172A]"
    : "bg-background";

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredProducts.slice(startIndex, endIndex);

  return (
    <div
      className={`min-h-screen ${pageBgClass}`}
      style={
        isAiThemed
          ? {
              backgroundColor: aiMeta?.backgroundColor || undefined,
              color: aiMeta?.textColor || undefined,
            }
          : undefined
      }
    >
      {/* Header */}
      <header
        className={headerClass}
        style={
          isAiThemed
            ? {
                backgroundColor: aiMeta?.primaryColor || undefined,
                color: aiMeta?.textColor || undefined,
                borderColor: aiMeta?.accentColor || aiMeta?.secondaryColor,
              }
            : undefined
        }
      >
        {isAiThemed ? (
          <div className="container mx-auto h-16 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headerLogo ? (
                <div className="relative h-14 w-[330px] flex justify-start items-center">
                  <Image
                    src={headerLogo}
                    alt={company?.name || "Store"}
                    width={230}
                    height={67}
                  />
                </div>
              ) : (
                <h1 className="text-white text-2xl font-bold">
                  {company?.name}
                </h1>
              )}
            </div>
            <nav className="hidden md:flex items-center gap-6 text-white">
              <Link
                href={`/store/${slug}`}
                className="text-sm font-medium hover:underline"
              >
                Home
              </Link>
              <Link
                href={`/store/${slug}/products`}
                className="text-sm font-medium hover:underline underline"
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
              <Button
                size="sm"
                variant="outline"
                asChild
                style={
                  aiMeta
                    ? {
                        borderColor:
                          aiMeta.accentColor || aiMeta.secondaryColor,
                        color: aiMeta.textColor || "#111827",
                      }
                    : undefined
                }
              >
                <Link href={`/store/${slug}/register`}>Register</Link>
              </Button>
              <Button
                size="sm"
                asChild
                style={
                  aiMeta
                    ? {
                        backgroundColor:
                          aiMeta.accentColor || aiMeta.primaryColor,
                        color: aiMeta.textColor || "#ffffff",
                      }
                    : undefined
                }
              >
                <Link href={`/store/${slug}/cart`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Link>
              </Button>
            </nav>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {headerLogo ? (
                  <div className="relative h-8 w-[330px]">
                    <Image
                      src={headerLogo}
                      alt={company?.name || "Store"}
                      fill
                      className="object-contain"
                      sizes="330px"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold">{company?.name}</h1>
                )}
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <Link href={`/store/${slug}`} className={linkClass}>
                  Home
                </Link>
                <Link
                  href={`/store/${slug}/products`}
                  className={`${linkClass} underline`}
                >
                  Products
                </Link>
                <Link href={`/store/${slug}/services`} className={linkClass}>
                  Services
                </Link>
                <Link href={`/store/${slug}/login`} className={linkClass}>
                  Login
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className={
                    isBlackFriday
                      ? "border-red-600 text-black hover:text-white hover:bg-red-600/10"
                      : undefined
                  }
                >
                  <Link href={`/store/${slug}/register`}>Register</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className={
                    isBlackFriday
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : undefined
                  }
                >
                  <Link href={`/store/${slug}/cart`}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cart
                  </Link>
                </Button>
              </nav>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/store/${slug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isBlackFriday
              ? "All Black Friday Deals"
              : isFitnessBoutique
              ? "Programs & Memberships"
              : isDigitalCampus
              ? "Programs & Courses"
              : "Products"}
          </h1>
          <p
            className={
              isBlackFriday || isFitnessBoutique
                ? "text-gray-300"
                : isDigitalCampus
                ? "text-slate-600"
                : "dark:text-gray-200"
            }
          >
            Browse our collection of {products.length} products
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 dark:text-gray-200" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-low">Price (Low to High)</SelectItem>
              <SelectItem value="price-high">Price (High to Low)</SelectItem>
              <SelectItem value="featured">Featured First</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p
              className={
                isBlackFriday || isFitnessBoutique
                  ? "text-gray-400 text-lg"
                  : isDigitalCampus
                  ? "text-slate-500 text-lg"
                  : "dark:text-gray-200 text-lg"
              }
            >
              No products found
            </p>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {pageItems.map((product) => (
                <Card
                  key={product.id}
                  className={`${viewMode === "list" ? "flex" : ""} ${
                    isBlackFriday
                      ? "bg-zinc-950 text-white border border-red-500/60"
                      : isFitnessBoutique
                      ? "bg-slate-900 text-slate-50 border border-orange-500/60"
                      : isDigitalCampus
                      ? "bg-white text-[#0F172A] border border-[#E0ECFF] shadow-sm"
                      : ""
                  }`}
                >
                  {product.images &&
                    product.images.length > 0 &&
                    product.images[0].url && (
                      <div
                        className={
                          viewMode === "list"
                            ? "relative w-48 shrink-0 aspect-square"
                            : "relative aspect-square overflow-hidden bg-muted"
                        }
                      >
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                          sizes={
                            viewMode === "list"
                              ? "192px"
                              : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          }
                        />
                      </div>
                    )}
                  <div className="flex-1 flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-1">
                          {product.name}
                        </CardTitle>
                        {product.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      {product.category && (
                        <Badge variant="outline" className="w-fit">
                          {product.category}
                        </Badge>
                      )}
                      <CardDescription
                        className={
                          viewMode === "list" ? "line-clamp-2" : "line-clamp-3"
                        }
                      >
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p
                        className={`text-2xl font-bold ${
                          isAiThemed
                            ? ""
                            : isBlackFriday
                            ? "text-yellow-400"
                            : isFitnessBoutique
                            ? "text-orange-400"
                            : isDigitalCampus
                            ? "text-[#2563EB]"
                            : ""
                        }`}
                        style={
                          isAiThemed
                            ? {
                                color:
                                  aiMeta?.accentColor || aiMeta?.primaryColor,
                              }
                            : undefined
                        }
                      >
                        ${Number(product.price).toFixed(2)}
                      </p>
                      {product.inventory !== null && product.inventory < 10 && (
                        <p
                          className={`text-sm mt-2 ${
                            isBlackFriday || isFitnessBoutique
                              ? "text-orange-400"
                              : isDigitalCampus
                              ? "text-[#B45309]"
                              : "text-orange-600"
                          }`}
                        >
                          Only {product.inventory} left in stock!
                        </p>
                      )}
                      {product.inventory === 0 && (
                        <p
                          className={`text-sm mt-2 ${
                            isBlackFriday || isFitnessBoutique
                              ? "text-red-400"
                              : isDigitalCampus
                              ? "text-red-600"
                              : "text-red-600"
                          }`}
                        >
                          Out of stock
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        className={`w-full ${
                          !isAiThemed
                            ? isBlackFriday
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : isFitnessBoutique
                              ? "bg-orange-500 hover:bg-orange-600 text-black"
                              : isDigitalCampus
                              ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                              : ""
                            : ""
                        }`}
                        style={
                          isAiThemed
                            ? {
                                backgroundColor:
                                  aiMeta?.primaryColor || undefined,
                                color: aiMeta?.textColor || "#ffffff",
                              }
                            : undefined
                        }
                        onClick={() => addToCart(product.id)}
                        disabled={product.inventory === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.inventory === 0
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between text-sm">
                <p
                  className={
                    isBlackFriday ? "text-gray-300" : "dark:text-gray-200"
                  }
                >
                  Showing{" "}
                  <span className="font-semibold">
                    {startIndex + 1}-
                    {Math.min(endIndex, filteredProducts.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredProducts.length}
                  </span>{" "}
                  products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                  >
                    Previous
                  </Button>
                  <span
                    className={
                      isBlackFriday ? "dark:text-gray-200" : "text-foreground"
                    }
                  >
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
