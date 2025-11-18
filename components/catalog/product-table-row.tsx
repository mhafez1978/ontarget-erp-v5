"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { Copy, Pencil, Trash2, Star, Image as ImageIcon } from "lucide-react";

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

interface ProductTableRowProps {
  product: Product;
  onDuplicate: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onTogglePublished: (id: string, currentValue: boolean) => void;
  onToggleFeatured: (id: string, currentValue: boolean) => void;
  onToggleActive: (id: string, currentValue: boolean) => void;
}

export function ProductTableRow({
  product,
  onDuplicate,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
  onToggleActive,
}: ProductTableRowProps) {
  const getFeaturedImage = (): string | null => {
    const featured = product.images.find((img) => img.isFeatured);
    return featured?.url || product.images[0]?.url || null;
  };

  return (
    <TableRow>
      <TableCell>
        <div className="relative w-16 h-16 bg-muted rounded overflow-hidden">
          {getFeaturedImage() ? (
            <Image
              src={getFeaturedImage()!}
              alt={product.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{product.name}</div>
          {product.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {product.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">
        ${parseFloat(product.price.toString()).toFixed(2)}
      </TableCell>
      <TableCell className="text-sm">{product.sku || "-"}</TableCell>
      <TableCell className="text-sm">{product.category || "-"}</TableCell>
      <TableCell className="text-sm">
        {[product.city, product.state].filter(Boolean).join(", ") || "-"}
      </TableCell>
      <TableCell>
        <Switch
          checked={product.isActive}
          onCheckedChange={() => onToggleActive(product.id, product.isActive)}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={product.isPublished}
          onCheckedChange={() =>
            onTogglePublished(product.id, product.isPublished)
          }
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={product.isFeatured}
            onCheckedChange={() =>
              onToggleFeatured(product.id, product.isFeatured)
            }
          />
          {product.isFeatured && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-950"
            onClick={() => onDuplicate(product)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-950"
              onClick={() => onEdit(product)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-100 dark:hover:bg-red-950"
              onClick={() => onDelete(product.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
