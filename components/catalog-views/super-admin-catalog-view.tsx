"use client";


import { Package, Briefcase, Loader2, Search, Grid3x3, List } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";





;
import { AddProductSheet } from "@/components/add-product-sheet";
import { AddServiceSheet } from "@/components/add-service-sheet";
import { EditProductSheet } from "@/components/edit-product-sheet";
import { EditServiceSheet } from "@/components/edit-service-sheet";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductGridCard } from "@/components/catalog/product-grid-card";
import { ProductTableRow } from "@/components/catalog/product-table-row";
import { ServiceGridCard } from "@/components/catalog/service-grid-card";
import { ServiceTableRow } from "@/components/catalog/service-table-row";
import { toast } from "sonner";

interface SuperAdminCatalogViewProps {
  userName?: string | null;
}

interface Company {
  id: string;
  name: string;
}

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
  sku: string | null;
  category: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  quantity: number;
  lowStockAlert: number | null;
  trackInventory: boolean;
  addressLine1: string | null;
  addressLine2?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images: ProductImage[];
  company: {
    id: string;
    name: string;
  };
  companyId?: string;
  createdAt: string;
}

interface ServiceImage {
  id: string;
  url: string;
  isFeatured: boolean;
  order: number;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
  category: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  addressLine1: string | null;
  addressLine2?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images: ServiceImage[];
  company: {
    id: string;
    name: string;
  };
  companyId?: string;
  createdAt: string;
}

export function SuperAdminCatalogView({
  userName,
}: SuperAdminCatalogViewProps) {
  const [activeTab, setActiveTab] = useState("products");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch owned companies for super admin (can only add catalog items to owned companies)
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies/my-owned");
        const data = await response.json();

        if (response.ok) {
          setCompanies(data.companies || []);
          if (data.companies && data.companies.length > 0) {
            setSelectedCompanyId(data.companies[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch products when company changes
  useEffect(() => {
    if (!selectedCompanyId) return;

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/catalog/products?companyId=${selectedCompanyId}`
        );
        const data = await response.json();

        if (response.ok) {
          setProducts(data.products || []);
        } else {
          setError(data.error || "Failed to fetch products");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to fetch products");
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === "products") {
      fetchProducts();
    }
  }, [selectedCompanyId, activeTab]);

  // Fetch services when company changes
  useEffect(() => {
    if (!selectedCompanyId) return;

    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/catalog/services?companyId=${selectedCompanyId}`
        );
        const data = await response.json();

        if (response.ok) {
          setServices(data.services || []);
        } else {
          setError(data.error || "Failed to fetch services");
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to fetch services");
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === "services") {
      fetchServices();
    }
  }, [selectedCompanyId, activeTab]);

  const handleProductAdded = () => {
    // Refresh products list
    if (selectedCompanyId && activeTab === "products") {
      fetch(`/api/catalog/products?companyId=${selectedCompanyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProducts(data.products || []);
          }
        })
        .catch((err) => console.error("Error refreshing products:", err));
    }
  };

  const handleServiceAdded = () => {
    // Refresh services list
    if (selectedCompanyId && activeTab === "services") {
      fetch(`/api/catalog/services?companyId=${selectedCompanyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setServices(data.services || []);
          }
        })
        .catch((err) => console.error("Error refreshing services:", err));
    }
  };

  const handleEditProduct = (product: Product) => {
    // Ensure companyId is set from company.id if not present
    const productWithCompanyId = {
      ...product,
      companyId: product.companyId || product.company?.id,
    };
    setSelectedProduct(productWithCompanyId);
    setIsEditingProduct(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsEditingService(true);
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const response = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${product.name} (Copy)`,
          description: product.description,
          price: product.price,
          sku: product.sku ? `${product.sku}-COPY` : null,
          category: product.category,
          companyId: product.company.id,
          addressLine1: product.addressLine1,
          city: product.city,
          state: product.state,
          country: product.country,
          images: product.images.map((img) => ({
            url: img.url,
            isFeatured: img.isFeatured,
            order: img.order,
          })),
        }),
      });

      if (response.ok) {
        handleProductAdded();
      }
    } catch (error) {
      console.error("Error duplicating product:", error);
    }
  };

  const handleDuplicateService = async (service: Service) => {
    try {
      const response = await fetch("/api/catalog/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${service.name} (Copy)`,
          description: service.description,
          price: service.price,
          duration: service.duration,
          category: service.category,
          companyId: service.company.id,
          addressLine1: service.addressLine1,
          city: service.city,
          state: service.state,
          country: service.country,
          images: service.images.map((img) => ({
            url: img.url,
            isFeatured: img.isFeatured,
            order: img.order,
          })),
        }),
      });

      if (response.ok) {
        handleServiceAdded();
      }
    } catch (error) {
      console.error("Error duplicating service:", error);
    }
  };

  const handleTogglePublished = async (
    id: string,
    currentValue: boolean,
    type: "product" | "service"
  ) => {
    try {
      const endpoint =
        type === "product"
          ? `/api/catalog/products/${id}`
          : `/api/catalog/services/${id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentValue }),
      });

      if (response.ok) {
        if (type === "product") {
          handleProductAdded();
        } else {
          handleServiceAdded();
        }
      }
    } catch (error) {
      console.error(`Error toggling ${type} published status:`, error);
    }
  };

  const handleToggleFeatured = async (
    id: string,
    currentValue: boolean,
    type: "product" | "service"
  ) => {
    try {
      const endpoint =
        type === "product"
          ? `/api/catalog/products/${id}`
          : `/api/catalog/services/${id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentValue }),
      });

      if (response.ok) {
        if (type === "product") {
          handleProductAdded();
        } else {
          handleServiceAdded();
        }
      }
    } catch (error) {
      console.error(`Error toggling ${type} featured status:`, error);
    }
  };

  const handleToggleActive = async (
    id: string,
    currentValue: boolean,
    type: "product" | "service"
  ) => {
    try {
      const endpoint =
        type === "product"
          ? `/api/catalog/products/${id}`
          : `/api/catalog/services/${id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentValue }),
      });

      if (response.ok) {
        if (type === "product") {
          handleProductAdded();
        } else {
          handleServiceAdded();
        }
      }
    } catch (error) {
      console.error(`Error toggling ${type} active status:`, error);
    }
  };

  const handleDelete = async (id: string, type: "product" | "service") => {
    toast(`Are you sure you want to delete this ${type}?`, {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const endpoint =
              type === "product"
                ? `/api/catalog/products/${id}`
                : `/api/catalog/services/${id}`;

            const response = await fetch(endpoint, {
              method: "DELETE",
            });

            if (response.ok) {
              toast.success(
                `${
                  type.charAt(0).toUpperCase() + type.slice(1)
                } deleted successfully`
              );
              if (type === "product") {
                handleProductAdded();
              } else {
                handleServiceAdded();
              }
            } else {
              toast.error(`Failed to delete ${type}`);
            }
          } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            toast.error(`Error deleting ${type}`);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  // Filter products based on search term
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.addressLine1?.toLowerCase().includes(term) ||
      product.city?.toLowerCase().includes(term) ||
      product.state?.toLowerCase().includes(term) ||
      product.country?.toLowerCase().includes(term)
    );
  });

  // Filter services based on search term
  const filteredServices = services.filter((service) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      service.name.toLowerCase().includes(term) ||
      service.description?.toLowerCase().includes(term) ||
      service.category?.toLowerCase().includes(term) ||
      service.duration?.toLowerCase().includes(term) ||
      service.addressLine1?.toLowerCase().includes(term) ||
      service.city?.toLowerCase().includes(term) ||
      service.state?.toLowerCase().includes(term) ||
      service.country?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Catalog</h1>
          <p className="text-muted-foreground">Welcome {userName || "Guest"}</p>
        </div>
        {activeTab === "products" && (
          <Button onClick={() => setIsAddingProduct(true)} className="shrink-0">
            <Package className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
        {activeTab === "services" && (
          <Button onClick={() => setIsAddingService(true)} className="shrink-0">
            <Briefcase className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger className="w-full max-w-[300px]">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Products and Services */}
      {selectedCompanyId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="services">
              <Briefcase className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Products ({filteredProducts.length}
                    {searchTerm &&
                      products.length !== filteredProducts.length &&
                      ` of ${products.length}`}
                    )
                  </CardTitle>
                  <div className="flex gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      title="Grid view"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      title="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No products yet. Add your first product to get started.
                    </p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No products match your search.
                    </p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductGridCard
                        key={product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onDuplicate={handleDuplicateProduct}
                        onDelete={(id) => handleDelete(id, "product")}
                        onTogglePublished={(id, current) =>
                          handleTogglePublished(id, current, "product")
                        }
                        onToggleFeatured={(id, current) =>
                          handleToggleFeatured(id, current, "product")
                        }
                        onToggleActive={(id, current) =>
                          handleToggleActive(id, current, "product")
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <ProductTableRow
                            key={product.id}
                            product={product}
                            onEdit={handleEditProduct}
                            onDuplicate={handleDuplicateProduct}
                            onDelete={(id) => handleDelete(id, "product")}
                            onTogglePublished={(id, current) =>
                              handleTogglePublished(id, current, "product")
                            }
                            onToggleFeatured={(id, current) =>
                              handleToggleFeatured(id, current, "product")
                            }
                            onToggleActive={(id, current) =>
                              handleToggleActive(id, current, "product")
                            }
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Services ({filteredServices.length}
                    {searchTerm &&
                      services.length !== filteredServices.length &&
                      ` of ${services.length}`}
                    )
                  </CardTitle>
                  <div className="flex gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      title="Grid view"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      title="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No services yet. Add your first service to get started.
                    </p>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No services match your search.
                    </p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredServices.map((service) => (
                      <ServiceGridCard
                        key={service.id}
                        service={service}
                        onEdit={handleEditService}
                        onDuplicate={handleDuplicateService}
                        onDelete={(id) => handleDelete(id, "service")}
                        onTogglePublished={(id, current) =>
                          handleTogglePublished(id, current, "service")
                        }
                        onToggleFeatured={(id, current) =>
                          handleToggleFeatured(id, current, "service")
                        }
                        onToggleActive={(id, current) =>
                          handleToggleActive(id, current, "service")
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServices.map((service) => (
                          <ServiceTableRow
                            key={service.id}
                            service={service}
                            onEdit={handleEditService}
                            onDuplicate={handleDuplicateService}
                            onDelete={(id) => handleDelete(id, "service")}
                            onTogglePublished={(id, current) =>
                              handleTogglePublished(id, current, "service")
                            }
                            onToggleFeatured={(id, current) =>
                              handleToggleFeatured(id, current, "service")
                            }
                            onToggleActive={(id, current) =>
                              handleToggleActive(id, current, "service")
                            }
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <AddProductSheet
        open={isAddingProduct}
        onOpenChange={setIsAddingProduct}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSuccess={handleProductAdded}
      />

      <AddServiceSheet
        open={isAddingService}
        onOpenChange={setIsAddingService}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSuccess={handleServiceAdded}
      />

      <EditProductSheet
        open={isEditingProduct}
        onOpenChange={setIsEditingProduct}
        product={selectedProduct}
        onSuccess={() => {
          setIsEditingProduct(false);
          setSelectedProduct(null);
          if (activeTab === "products" && selectedCompanyId) {
            fetch(`/api/catalog/products?companyId=${selectedCompanyId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  setProducts(data.products || []);
                }
              })
              .catch((err) => console.error("Error refreshing products:", err));
          }
        }}
      />

      <EditServiceSheet
        open={isEditingService}
        onOpenChange={setIsEditingService}
        service={selectedService}
        onSuccess={() => {
          setIsEditingService(false);
          setSelectedService(null);
          if (activeTab === "services" && selectedCompanyId) {
            fetch(`/api/catalog/services?companyId=${selectedCompanyId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  setServices(data.services || []);
                }
              })
              .catch((err) => console.error("Error refreshing services:", err));
          }
        }}
      />
    </div>
  );
}
