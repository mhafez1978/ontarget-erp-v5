"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { Image as ImageIcon, Copy, Pencil, Trash2, Star } from "lucide-react";

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

interface ProductGridCardProps {
  product: Product;
  onDuplicate: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onTogglePublished: (id: string, currentValue: boolean) => void;
  onToggleFeatured: (id: string, currentValue: boolean) => void;
  onToggleActive: (id: string, currentValue: boolean) => void;
}

export function ProductGridCard({
  product,
  onDuplicate,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
  onToggleActive,
}: ProductGridCardProps) {
  const getFeaturedImage = (): string | null => {
    const featured = product.images.find((img) => img.isFeatured);
    return featured?.url || product.images[0]?.url || null;
  };

  const imageUrl = getFeaturedImage();
  const isBase64 = imageUrl?.startsWith("data:");

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-video bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            unoptimized={isBase64}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-purple-500 hover:bg-purple-600 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-lg"
            onClick={() => onDuplicate(product)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-purple-500 hover:bg-purple-600 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-lg"
              onClick={() => onEdit(product)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 shadow-lg"
              onClick={() => onDelete(product.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </div>
        )}

        {/* Published Badge */}
        {!product.isPublished && (
          <div className="absolute bottom-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium">
            Unpublished
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            ${parseFloat(product.price.toString()).toFixed(2)}
          </span>
          {product.sku && (
            <span className="text-xs text-muted-foreground">
              SKU: {product.sku}
            </span>
          )}
        </div>

        {product.category && (
          <div>
            <span className="text-xs bg-secondary px-2 py-1 rounded">
              {product.category}
            </span>
          </div>
        )}

        {(product.city || product.state) && (
          <div className="text-xs text-muted-foreground">
            {[product.city, product.state].filter(Boolean).join(", ")}
          </div>
        )}

        {/* Toggle Switches */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cursor-pointer">Active</label>
            <Switch
              checked={product.isActive}
              onCheckedChange={() =>
                onToggleActive(product.id, product.isActive)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cursor-pointer">
              Published
            </label>
            <Switch
              checked={product.isPublished}
              onCheckedChange={() =>
                onTogglePublished(product.id, product.isPublished)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cursor-pointer flex items-center gap-1">
              <Star className="h-3 w-3" />
              Featured
            </label>
            <Switch
              checked={product.isFeatured}
              onCheckedChange={() =>
                onToggleFeatured(product.id, product.isFeatured)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
