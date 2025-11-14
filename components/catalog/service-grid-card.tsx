"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Image as ImageIcon,
  Copy,
  Pencil,
  Trash2,
  Star,
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

interface ServiceGridCardProps {
  service: Service;
  onDuplicate: (service: Service) => void;
  onEdit?: (service: Service) => void;
  onDelete?: (id: string) => void;
  onTogglePublished: (id: string, currentValue: boolean) => void;
  onToggleFeatured: (id: string, currentValue: boolean) => void;
  onToggleActive: (id: string, currentValue: boolean) => void;
}

export function ServiceGridCard({
  service,
  onDuplicate,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
  onToggleActive,
}: ServiceGridCardProps) {
  const getFeaturedImage = (): string | null => {
    const featured = service.images.find((img) => img.isFeatured);
    return featured?.url || service.images[0]?.url || null;
  };

  return (
    <Card className="overflow-hidden group">
      <div className="aspect-video bg-muted relative">
        {getFeaturedImage() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getFeaturedImage()!}
            alt={service.name}
            className="w-full h-full object-cover"
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
            onClick={() => onDuplicate(service)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-purple-500 hover:bg-purple-600 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-lg"
              onClick={() => onEdit(service)}
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
              onClick={() => onDelete(service.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Featured Badge */}
        {service.isFeatured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </div>
        )}

        {/* Published Badge */}
        {!service.isPublished && (
          <div className="absolute bottom-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium">
            Unpublished
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold mb-1">{service.name}</h3>
          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            ${parseFloat(service.price.toString()).toFixed(2)}
          </span>
          {service.duration && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.duration}
            </span>
          )}
        </div>

        {service.category && (
          <div>
            <span className="text-xs bg-secondary px-2 py-1 rounded">
              {service.category}
            </span>
          </div>
        )}

        {(service.city || service.state) && (
          <div className="text-xs text-muted-foreground">
            {[service.city, service.state].filter(Boolean).join(", ")}
          </div>
        )}

        {/* Toggle Switches */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cursor-pointer">Active</label>
            <Switch
              checked={service.isActive}
              onCheckedChange={() =>
                onToggleActive(service.id, service.isActive)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cursor-pointer">
              Published
            </label>
            <Switch
              checked={service.isPublished}
              onCheckedChange={() =>
                onTogglePublished(service.id, service.isPublished)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cursor-pointer flex items-center gap-1">
              <Star className="h-3 w-3" />
              Featured
            </label>
            <Switch
              checked={service.isFeatured}
              onCheckedChange={() =>
                onToggleFeatured(service.id, service.isFeatured)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
