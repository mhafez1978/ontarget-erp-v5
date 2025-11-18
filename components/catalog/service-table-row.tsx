"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import {
  Copy,
  Pencil,
  Trash2,
  Star,
  Image as ImageIcon,
  Clock,
} from "lucide-react";

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

interface ServiceTableRowProps {
  service: Service;
  onDuplicate: (service: Service) => void;
  onEdit?: (service: Service) => void;
  onDelete?: (id: string) => void;
  onTogglePublished: (id: string, currentValue: boolean) => void;
  onToggleFeatured: (id: string, currentValue: boolean) => void;
  onToggleActive: (id: string, currentValue: boolean) => void;
}

export function ServiceTableRow({
  service,
  onDuplicate,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
  onToggleActive,
}: ServiceTableRowProps) {
  const getFeaturedImage = (): string | null => {
    const featured = service.images.find((img) => img.isFeatured);
    return featured?.url || service.images[0]?.url || null;
  };

  return (
    <TableRow>
      <TableCell>
        <div className="relative w-16 h-16 bg-muted rounded overflow-hidden">
          {getFeaturedImage() ? (
            <Image
              src={getFeaturedImage()!}
              alt={service.name}
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
          <div className="font-medium">{service.name}</div>
          {service.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {service.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">
        ${parseFloat(service.price.toString()).toFixed(2)}
      </TableCell>
      <TableCell className="text-sm">
        {service.duration ? (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {service.duration}
          </div>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-sm">{service.category || "-"}</TableCell>
      <TableCell className="text-sm">
        {[service.city, service.state].filter(Boolean).join(", ") || "-"}
      </TableCell>
      <TableCell>
        <Switch
          checked={service.isActive}
          onCheckedChange={() => onToggleActive(service.id, service.isActive)}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={service.isPublished}
          onCheckedChange={() =>
            onTogglePublished(service.id, service.isPublished)
          }
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={service.isFeatured}
            onCheckedChange={() =>
              onToggleFeatured(service.id, service.isFeatured)
            }
          />
          {service.isFeatured && (
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
            onClick={() => onDuplicate(service)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-950"
              onClick={() => onEdit(service)}
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
              onClick={() => onDelete(service.id)}
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
