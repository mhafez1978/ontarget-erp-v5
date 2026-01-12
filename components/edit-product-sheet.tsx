"use client";

import { Loader2, Pencil, Upload, Star, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
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

import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { removeBackground } from "@imgly/background-removal";

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
  quantity: z
    .string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: "Quantity must be a non-negative number",
    }),
  lowStockAlert: z.string().optional(),
  trackInventory: z.boolean(),
});

interface ProductImage {
  id?: string;
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
  companyId?: string;
}

interface EditProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function EditProductSheet({
  open,
  onOpenChange,
  product,
  onSuccess,
}: EditProductSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(false);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [resizePreset, setResizePreset] = useState<string>("post");

  const initialFormData = {
    name: "",
    description: "",
    price: "",
    sku: "",
    category: "",
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
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Track if form is dirty
  const isFormDirty = useFormDirty(initialFormData, formData);

  // Load product data when sheet opens
  useEffect(() => {
    if (open && product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        sku: product.sku || "",
        category: product.category || "",
        quantity: product.quantity.toString(),
        lowStockAlert: product.lowStockAlert?.toString() || "10",
        trackInventory: product.trackInventory,
      });

      setAddressData({
        addressLine1: product.addressLine1 || "",
        addressLine2: product.addressLine2 || "",
        city: product.city || "",
        state: product.state || "",
        country: product.country || "",
        countryCode: product.countryCode || "",
        postalCode: product.postalCode || "",
        latitude: product.latitude ?? undefined,
        longitude: product.longitude ?? undefined,
      });

      setImages(product.images || []);
    }
  }, [open, product]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUploadImages = async () => {
    if (!selectedFiles || !product) return;

    setIsUploadingImages(true);
    setError(null);

    try {
      const formData = new FormData();

      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        if (removeBackgroundEnabled) {
          // Process with background removal
          try {
            const imageBlob = await removeBackground(file);
            const processedFile = new File(
              [imageBlob],
              file.name.replace(/\.[^/.]+$/, "-no-bg.png"),
              { type: "image/png" }
            );
            formData.append("images", processedFile);
          } catch (bgError) {
            console.error("Background removal failed for", file.name, bgError);
            // Fallback to original file if background removal fails
            formData.append("images", file);
          }
        } else {
          // No background removal, append original file
          formData.append("images", file);
        }
      }

      // Add resize parameters
      if (resizeEnabled && resizePreset) {
        formData.append("resize", "true");
        formData.append("resizePreset", resizePreset);
      }

      const response = await fetch(
        `/api/catalog/products/${product.id}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload images");
      }

      const data = await response.json();

      // Add uploaded images to the list
      const newImages = data.images.map(
        (img: { id: string; url: string }, index: number) => ({
          id: img.id,
          url: img.url,
          isFeatured: images.length === 0 && index === 0,
          order: images.length + index,
        })
      );

      setImages([...images, ...newImages]);
      setSelectedFiles(null);

      // Reset file input
      const fileInput = document.getElementById(
        "image-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Failed to upload images:", err);
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = async (
    imageId: string | undefined,
    index: number
  ) => {
    if (!product) return;

    // Optimistically update UI
    const updatedImages = images.filter((_, i) => i !== index);
    const reindexed = updatedImages.map((img, i) => ({ ...img, order: i }));

    // If removed image was featured, make first image featured
    if (images[index].isFeatured && reindexed.length > 0) {
      reindexed[0].isFeatured = true;
    }

    setImages(reindexed);

    // If image has an ID, delete from server
    if (imageId) {
      try {
        await fetch(`/api/catalog/products/${product.id}/images/${imageId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete image:", err);
        // Reload images on error
        setImages(product.images);
      }
    }
  };

  const handleToggleFeatured = async (index: number) => {
    if (!product) return;

    const imageToFeature = images[index];
    if (!imageToFeature.id) return;

    // Optimistically update UI
    const updatedImages = images.map((img, i) => ({
      ...img,
      isFeatured: i === index,
    }));
    setImages(updatedImages);

    // Persist to database
    try {
      const response = await fetch(
        `/api/catalog/products/${product.id}/images/${imageToFeature.id}/feature`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update featured image");
      }
    } catch (error) {
      console.error("Error updating featured image:", error);
      // Revert on error
      setImages(images);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!product) return;

    // Validate with Zod
    const result = productSchema.safeParse(formData);

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/catalog/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          description: result.data.description || null,
          price: result.data.price,
          sku: result.data.sku || null,
          category: result.data.category || null,
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
        throw new Error(data.error || "Failed to update product");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update product:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Product
          </SheetTitle>
          <SheetDescription>
            Update product information and manage images.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

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
                  <p className="text-xs dark:text-gray-200">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Product Images</Label>
              <span className="text-sm dark:text-gray-200">
                {images.length} image{images.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Existing Images Table */}
            {images.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Preview</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="w-24 text-center">
                        Featured
                      </TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {images.map((image, index) => (
                      <TableRow key={image.id || index}>
                        <TableCell>
                          <div className="relative w-14 h-14 rounded overflow-hidden bg-muted">
                            <Image
                              src={image.url}
                              alt={`Product ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-xs">
                          {image.url}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={image.isFeatured ? "default" : "outline"}
                            className="h-7 w-7 p-0"
                            onClick={() => handleToggleFeatured(index)}
                          >
                            <Star
                              className={`h-3 w-3 ${
                                image.isFeatured ? "fill-current" : ""
                              }`}
                            />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveImage(image.id, index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Upload New Images */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label htmlFor="image-upload">Upload New Images</Label>

              <div className="flex items-center gap-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUploadImages}
                  disabled={!selectedFiles || isUploadingImages}
                >
                  {isUploadingImages ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="removeBackground"
                  checked={removeBackgroundEnabled}
                  onCheckedChange={(checked) =>
                    setRemoveBackgroundEnabled(checked as boolean)
                  }
                />
                <Label
                  htmlFor="removeBackground"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remove background from images before upload (AI-powered, may
                  take a few seconds per image)
                </Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="resizeImages"
                    checked={resizeEnabled}
                    onCheckedChange={(checked) =>
                      setResizeEnabled(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="resizeImages"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Resize images to standard dimensions
                  </Label>
                </div>

                {resizeEnabled && (
                  <div className="ml-6 space-y-1">
                    <Label htmlFor="resizePreset" className="text-xs">
                      Select size preset:
                    </Label>
                    <Select
                      value={resizePreset}
                      onValueChange={setResizePreset}
                    >
                      <SelectTrigger id="resizePreset" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile">
                          Mobile (480 x 480 px) - Square for mobile displays
                        </SelectItem>
                        <SelectItem value="thumbnail">
                          Thumbnail (300 x 300 px) - Small preview images
                        </SelectItem>
                        <SelectItem value="post">
                          Post (800 x 600 px) - Standard social media post
                        </SelectItem>
                        <SelectItem value="banner">
                          Banner (1200 x 400 px) - Wide banner format
                        </SelectItem>
                        <SelectItem value="large">
                          Large (1920 x 1080 px) - Full HD display
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <p className="text-xs dark:text-gray-200">
                Images will be automatically optimized with Sharp after upload.
                Select multiple files to upload in batch. Click the star icon in
                the table to set the featured image.
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
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
