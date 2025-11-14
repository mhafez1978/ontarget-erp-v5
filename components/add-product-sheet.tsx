"use client";

import { useState } from "react";
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
import { Loader2, Package, X, Upload, Star } from "lucide-react";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";

const productSchema = z.object({
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
  sku: z.string().optional(),
  category: z.string().optional(),
  companyId: z.string().min(1, "Company selection is required"),
  quantity: z
    .string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: "Quantity must be a non-negative number",
    }),
  lowStockAlert: z.string().optional(),
  trackInventory: z.boolean(),
});

interface AddProductSheetProps {
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

export function AddProductSheet({
  open,
  onOpenChange,
  companies = [],
  selectedCompanyId,
  onSuccess,
}: AddProductSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialFormData = {
    name: "",
    description: "",
    price: "",
    sku: "",
    category: "",
    companyId: selectedCompanyId || "",
    quantity: "0",
    lowStockAlert: "10",
    trackInventory: true,
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
    const result = productSchema.safeParse(formData);

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          description: result.data.description || null,
          price: result.data.price,
          sku: result.data.sku || null,
          category: result.data.category || null,
          companyId: result.data.companyId,
          quantity: parseInt(result.data.quantity),
          lowStockAlert: result.data.lowStockAlert
            ? parseInt(result.data.lowStockAlert)
            : 10,
          trackInventory: result.data.trackInventory,
          address: addressData,
          images,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create product");
      }

      // Reset form and close sheet
      setFormData(initialFormData);
      setAddressData(initialAddressData);
      setImages([]);
      setImageUrl("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create product:", err);
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
            <Package className="h-5 w-5" />
            Add New Product
          </SheetTitle>
          <SheetDescription>
            Create a new product for your company catalog.
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
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Premium Widget"
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
              placeholder="Describe your product..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
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
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                type="text"
                placeholder="e.g., PROD-001"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              placeholder="e.g., Electronics, Furniture"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </div>

          {/* Inventory Fields */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="trackInventory"
                className="text-base font-semibold"
              >
                Track Inventory
              </Label>
              <Switch
                id="trackInventory"
                checked={formData.trackInventory}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, trackInventory: checked })
                }
              />
            </div>

            {formData.trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Current Stock *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={formData.lowStockAlert}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockAlert: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Get notified when stock falls below this number
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Address Autocomplete */}
          <div className="space-y-2">
            <AddressAutocomplete
              label="Product Location (Optional)"
              value={addressData}
              onChange={setAddressData}
            />
          </div>

          {/* Image Management */}
          <div className="space-y-2">
            <Label>Product Images</Label>
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
                      <div className="aspect-video bg-muted relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
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
                  <Package className="mr-2 h-4 w-4" />
                  Create Product
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
