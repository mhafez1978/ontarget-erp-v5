"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Search, Filter, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
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

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  duration: number | null;
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
  name: string;
  logo: string | null;
  slug: string;
  storeMetadata: StoreMetadata | null;
}

export default function ServicesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    fetchStoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    filterAndSortServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, searchQuery, selectedCategory, sortBy]);

  const fetchStoreData = async () => {
    try {
      // Fetch store info
      const storeResponse = await fetch(`/api/store/${slug}`);
      if (!storeResponse.ok) throw new Error("Store not found");
      const storeData = await storeResponse.json();
      setCompany(storeData);

      // Fetch services
      const servicesResponse = await fetch(`/api/store/${slug}/services`);
      if (!servicesResponse.ok) throw new Error("Failed to fetch services");
      const servicesData = await servicesResponse.json();
      setServices(servicesData);
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortServices = () => {
    let filtered = [...services];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory
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
        case "duration":
          return (a.duration || 0) - (b.duration || 0);
        case "featured":
          return a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1;
        default:
          return 0;
      }
    });

    setFilteredServices(filtered);
  };

  const addToCart = async (serviceId: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company?.slug, // This should be company ID, but we'll use slug for now
          itemType: "SERVICE",
          itemId: serviceId,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to cart");

      toast.success("Service added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {company?.logo && (
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <h1 className="text-2xl font-bold">{company?.name}</h1>
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
                className="text-sm font-medium underline"
              >
                Services
              </Link>
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
          <h1 className="text-4xl font-bold mb-2">Services</h1>
          <p className="text-muted-foreground">
            Browse our collection of {services.length} services
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
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
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="featured">Featured First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Services List */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No services found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <Card key={service.id} className="flex flex-col md:flex-row">
                <div className="flex-1">
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-2">
                        <CardTitle className="text-2xl">
                          {service.name}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          {service.category && (
                            <Badge variant="outline">{service.category}</Badge>
                          )}
                          {service.isFeatured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                          {service.duration && (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration} mins
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">
                          ${Number(service.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <CardDescription className="text-base mt-4">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button onClick={() => addToCart(service.id)}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
