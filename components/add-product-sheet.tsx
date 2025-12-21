"use client";


import { Loader2, Package, X, Upload, Star } from "lucide-react";
import { useState, useRef } from "react";
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




;
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
  // url is either a remote URL or a local object URL for file previews
  url: string;
  isFeatured: boolean;
  order: number;
  // optional file object when the image originates from a local upload
  file?: File | null;
  // local id to correlate uploads -> responses
  localId?: string;
  // upload state
  progress?: number; // 0-100
  error?: string | null;
  uploadedId?: string | null;
  uploadedUrl?: string | null;
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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Track if form is dirty
  const isFormDirty = useFormDirty(initialFormData, formData);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Create initial entries with preview URLs
    const newEntries: ImageFile[] = fileArray.map((f, i) => ({
      url: URL.createObjectURL(f),
      file: f,
      isFeatured: images.length === 0 && i === 0,
      order: images.length + i,
      localId: `local-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      progress: 0, // Start at 0%, will update as upload progresses
      error: null,
      uploadedId: null,
      uploadedUrl: null,
    }));

    // if there are existing images and none are featured, mark first new as featured
    if (!images.some((img) => img.isFeatured) && newEntries.length > 0) {
      newEntries[0].isFeatured = true;
    }

    setImages((prev) => [...prev, ...newEntries]);

    // Upload images immediately
    if (!formData.companyId) {
      // Can't upload without company ID
      return;
    }

    // Upload each file separately to show per-file progress
    for (const entry of newEntries) {
      if (!entry.file) continue;

      const fd = new FormData();
      fd.append("images", entry.file, entry.file.name);
      fd.append("companyId", formData.companyId);
      fd.append("type", "product");

      try {
        const xhrUpload = () =>
          new Promise<{
            success: boolean;
            images: Array<{ tempId: string; url: string }>;
          }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/catalog/temp-images");

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const pct = Math.round((event.loaded / event.total) * 100);
                setImages((prev) =>
                  prev.map((p) =>
                    p.localId === entry.localId ? { ...p, progress: pct } : p
                  )
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const res = JSON.parse(xhr.responseText);
                  resolve(res);
                } catch {
                  resolve({ success: true, images: [] });
                }
              } else {
                reject(new Error(`Upload failed (${xhr.status})`));
              }
            };

            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send(fd);
          });

        const result = await xhrUpload();
        const uploaded = Array.isArray(result.images) ? result.images[0] : null;

        if (uploaded) {
          // Update the entry with uploaded info
          setImages((prev) =>
            prev.map((p) =>
              p.localId === entry.localId
                ? {
                    ...p,
                    progress: 100,
                    uploadedId: uploaded.tempId,
                    uploadedUrl: uploaded.url,
                    url: uploaded.url, // Use uploaded URL for display
                    file: null, // Clear file object
                  }
                : p
            )
          );

          // Revoke the blob URL since we now have the uploaded URL
          URL.revokeObjectURL(entry.url);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setImages((prev) =>
          prev.map((p) =>
            p.localId === entry.localId
              ? { ...p, error: msg, progress: undefined }
              : p
          )
        );
      }
    }
  };
  // Adds an image from a typed URL into the images list (preserves order and featured logic)
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
    const removed = images[index];
    // Revoke object URL if it was a local file preview
    if (removed?.file && removed.url?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(removed.url);
      } catch {}
    }

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

    // Check if any images are still uploading
    const stillUploading = images.some(
      (img) => typeof img.progress === "number" && img.progress < 100
    );
    if (stillUploading) {
      setError("Please wait for all images to finish uploading");
      return;
    }

    setIsSubmitting(true);

    try {
      // All images are already uploaded (either URLs or uploaded files)
      // Map them to the format expected by the API
      const allImages = images.map((img) => ({
        url: img.url,
        isFeatured: img.isFeatured || false,
        order: img.order,
      }));

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
          images: allImages, // Use already-uploaded images
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create product");
      }

      // Product created successfully with all images
      const createData = await response.json();

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
              <div className="flex gap-2 items-center">
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
                {/* file upload input */}
                <label
                  // clickable drag/drop area that triggers file selection or accepts drops
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer?.files || null;
                    handleFilesSelected(files);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-2 ml-2 cursor-pointer border-dashed border-2 border-muted rounded-md px-3 py-2 hover:bg-muted/50"
                >
                  <input
                    ref={(el) => {
                      fileInputRef.current = el;
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Upload files</span>
                    <span className="text-xs text-muted-foreground">
                      (click or drag & drop — multiple allowed)
                    </span>
                  </div>
                </label>
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
                          alt={`Product ${index + 1}`}
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
                      {/* upload progress / error overlay */}
                      {typeof image.progress === "number" &&
                        image.progress < 100 && (
                          <div className="absolute inset-0 flex items-end">
                            <div className="w-full bg-black/30 p-2">
                              <div className="w-full bg-muted h-2 rounded overflow-hidden">
                                <div
                                  style={{ width: `${image.progress}%` }}
                                  className="h-2 bg-primary"
                                />
                              </div>
                              <div className="text-xs text-white mt-1 text-right">
                                {image.progress}%
                              </div>
                            </div>
                          </div>
                        )}
                      {image.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-700/70 text-white p-2 text-xs">
                          {image.error}
                        </div>
                      )}
                      {image.uploadedUrl && (
                        <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                          Uploaded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Add image URLs or upload image files. Click the star to set a
                featured image.
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
              disabled={isSubmitting || isUploadingFiles}
            >
              {isUploadingFiles ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading images...
                </>
              ) : isSubmitting ? (
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
