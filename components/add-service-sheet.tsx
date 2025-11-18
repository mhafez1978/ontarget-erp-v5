"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Briefcase, X, Upload, Star } from "lucide-react";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import { z } from "zod";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";

const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be less than 200 characters"),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
  duration: z.string().optional(),
  category: z.string().optional(),
  companyId: z.string().min(1, "Company selection is required"),
});

interface AddServiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies?: Array<{ id: string; name: string }>;
  selectedCompanyId?: string;
  onSuccess?: () => void;
}

interface ImageFile {
  url: string;
  isFeatured: boolean;
  order: number;
}

export function AddServiceSheet({
  open,
  onOpenChange,
  companies = [],
  selectedCompanyId,
  onSuccess,
}: AddServiceSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialFormData = {
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    companyId: selectedCompanyId || "",
  };

  const initialAddressData: AddressData = {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [addressData, setAddressData] =
    useState<AddressData>(initialAddressData);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  // Track if form is dirty
  const isFormDirty = useFormDirty(initialFormData, formData);

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;

    const newImage: ImageFile = {
      url: imageUrl.trim(),
      isFeatured: images.length === 0, // First image is featured by default
      order: images.length,
    };

    setImages([...images, newImage]);
    setImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    // Re-index order
    const reindexed = updatedImages.map((img, i) => ({ ...img, order: i }));
    // If removed image was featured, make first image featured
    if (images[index].isFeatured && reindexed.length > 0) {
      reindexed[0].isFeatured = true;
    }
    setImages(reindexed);
  };

  const handleToggleFeatured = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isFeatured: i === index,
    }));
    setImages(updatedImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate with Zod
    const result = serviceSchema.safeParse(formData);

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/catalog/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          description: result.data.description || null,
          price: result.data.price,
          duration: result.data.duration || null,
          category: result.data.category || null,
          companyId: result.data.companyId,
          address: addressData,
          images,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create service");
      }

      // Reset form and close sheet
      setFormData(initialFormData);
      setAddressData(initialAddressData);
      setImages([]);
      setImageUrl("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create service:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Add New Service
          </SheetTitle>
          <SheetDescription>
            Create a new service for your company catalog.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) =>
                setFormData({ ...formData, companyId: value })
              }
              required
            >
              <SelectTrigger id="company">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Web Development"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your service..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="text"
                placeholder="e.g., 1 hour, 2 days"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              placeholder="e.g., Consulting, Development"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </div>

          {/* Address Autocomplete */}
          <div className="space-y-2">
            <AddressAutocomplete
              label="Service Location (Optional)"
              value={addressData}
              onChange={setAddressData}
            />
          </div>

          {/* Image Management */}
          <div className="space-y-2">
            <Label>Service Images</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Enter image URL"
                  value={imageUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setImageUrl(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddImage}
                  disabled={!imageUrl.trim()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg overflow-hidden"
                    >
                      <div className="relative aspect-video bg-muted">
                        <Image
                          src={image.url}
                          alt={`Service ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 300px"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={image.isFeatured ? "default" : "secondary"}
                          className="h-7 w-7 p-0"
                          onClick={() => handleToggleFeatured(index)}
                        >
                          <Star
                            className={`h-3 w-3 ${
                              image.isFeatured ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-7 w-7 p-0"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {image.isFeatured && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                          Featured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Add image URLs. Click the star to set a featured image.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${getPulsateClassName(isFormDirty)}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Create Service
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
