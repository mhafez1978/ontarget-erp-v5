"use client";

import { useState, useEffect, useCallback, DragEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Upload,
  Building2,
  Pencil,
  Save,
  X,
  Sun,
  Moon,
  Trash2,
  ImageIcon,
  Lock,
  Crown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { removeBackground } from "@imgly/background-removal";

interface UploadedLogo {
  url: string;
  filename: string;
}

interface CompanyBranding {
  id: string;
  name: string;
  slogan: string | null;
  description: string | null;
  logo: string | null;
  logoLight: string | null;
  logoDark: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface SubscriptionInfo {
  plan: string;
  status: string;
  canWhiteLabel: boolean;
}

export function CompanyWhiteLabelSettings() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyBranding | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogos, setUploadingLogos] = useState(false);
  const [uploadedLogos, setUploadedLogos] = useState<UploadedLogo[]>([]);
  const [draggedLogo, setDraggedLogo] = useState<string | null>(null);
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slogan: "",
    description: "",
    email: "",
    phone: "",
    website: "",
  });

  useEffect(() => {
    fetchCompanyBranding();
  }, [fetchCompanyBranding]);

  const fetchCompanyBranding = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/company/white-label");

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          toast.error(data.error || "Access denied");
          return;
        }
        throw new Error("Failed to fetch company branding");
      }

      const data = await response.json();
      setCompany(data.company);
      setSubscription(data.subscription);

      if (data.company) {
        setFormData({
          name: data.company.name || "",
          slogan: data.company.slogan || "",
          description: data.company.description || "",
          email: data.company.email || "",
          phone: data.company.phone || "",
          website: data.company.website || "",
        });

        // Fetch uploaded logos
        if (data.subscription.canWhiteLabel) {
          fetchUploadedLogos(data.company.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch company branding:", error);
      toast.error("Failed to load white-label settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUploadedLogos = async (companyId: string) => {
    try {
      const response = await fetch(`/api/company/${companyId}/logos`);
      if (response.ok) {
        const data = await response.json();
        setUploadedLogos(data.logos || []);
      }
    } catch (error) {
      console.error("Failed to fetch uploaded logos:", error);
    }
  };

  const handleMultipleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !company) return;

    // Validate all files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 2MB limit`);
        return;
      }
    }

    setUploadingLogos(true);

    try {
      const processedFiles: File[] = [];

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (removeBackgroundEnabled) {
          try {
            toast.info(`Removing background from ${file.name}...`, {
              id: `processing-${i}`,
            });

            // Read file as blob
            const imageBlob = await removeBackground(file, {
              output: { format: "image/png", quality: 1 },
            });

            // Convert blob to file
            const processedFile = new File(
              [imageBlob],
              file.name.replace(/\.[^/.]+$/, "") + "-nobg.png",
              { type: "image/png" }
            );

            processedFiles.push(processedFile);
            toast.success(`Background removed from ${file.name}`, {
              id: `processing-${i}`,
            });
          } catch (error) {
            console.error(
              `Failed to remove background from ${file.name}:`,
              error
            );
            toast.error(
              `Failed to remove background from ${file.name}, uploading original`,
              { id: `processing-${i}` }
            );
            processedFiles.push(file);
          }
        } else {
          processedFiles.push(file);
        }
      }

      // Upload all processed files
      const uploadFormData = new FormData();
      processedFiles.forEach((file) => {
        uploadFormData.append("logos", file);
      });

      const response = await fetch(`/api/company/${company.id}/logos`, {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload logos");
      }

      toast.success(`${processedFiles.length} logo(s) uploaded successfully!`);
      fetchUploadedLogos(company.id);
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload logos"
      );
    } finally {
      setUploadingLogos(false);
      e.target.value = "";
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, logoUrl: string) => {
    setDraggedLogo(logoUrl);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnTheme = async (
    e: DragEvent<HTMLDivElement>,
    theme: "light" | "dark"
  ) => {
    e.preventDefault();
    if (!draggedLogo || !company) return;

    try {
      const updateData =
        theme === "light"
          ? { logoLight: draggedLogo }
          : { logoDark: draggedLogo };

      const response = await fetch(`/api/company/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update theme logo");
      }

      const data = await response.json();
      setCompany(data.company);
      toast.success(
        `Logo assigned to ${theme === "light" ? "light" : "dark"} theme!`
      );
    } catch (error) {
      console.error("Failed to assign logo:", error);
      toast.error("Failed to assign logo to theme");
    } finally {
      setDraggedLogo(null);
    }
  };

  const handleDeleteLogo = async (logoUrl: string) => {
    if (!company) return;

    try {
      const response = await fetch(
        `/api/company/${company.id}/logos?url=${encodeURIComponent(logoUrl)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete logo");
      }

      toast.success("Logo deleted successfully");
      fetchUploadedLogos(company.id);

      // Update company if this was assigned
      if (company.logoLight === logoUrl || company.logoDark === logoUrl) {
        fetchCompanyBranding();
      }
    } catch (error) {
      console.error("Failed to delete logo:", error);
      toast.error("Failed to delete logo");
    }
  };

  const handleSave = async () => {
    if (!company) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/company/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update company");
      }

      setCompany(data.company);
      setIsEditing(false);
      toast.success("Company branding updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update branding"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        name: company.name || "",
        slogan: company.slogan || "",
        description: company.description || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !subscription.canWhiteLabel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            White-Label Branding
          </CardTitle>
          <CardDescription>
            Customize your company&apos;s branding with custom logos for light
            and dark themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <Crown className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-900 dark:text-red-100">
              Premium Feature
            </AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-200">
              White-label branding is available for <strong>Growth</strong> and{" "}
              <strong>Enterprise</strong> plans with an active subscription.
              {subscription && (
                <div className="mt-2 text-sm font-medium">
                  Current plan: <strong>{subscription.plan}</strong> | Status:{" "}
                  <strong>{subscription.status}</strong>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No company found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            White-Label Branding
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Info
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Upload logos and assign them to light or dark themes. These will
          appear in the dashboard sidebar when you override global branding.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Theme Logos</Label>
            <div>
              <input
                type="file"
                id="company-logos-upload"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleMultipleLogoUpload}
                disabled={uploadingLogos}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingLogos}
                onClick={() =>
                  document.getElementById("company-logos-upload")?.click()
                }
              >
                {uploadingLogos ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logos
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Background Removal Option */}
          <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
            <Checkbox
              id="remove-bg-company"
              checked={removeBackgroundEnabled}
              onCheckedChange={(checked) =>
                setRemoveBackgroundEnabled(checked as boolean)
              }
              disabled={uploadingLogos}
            />
            <div className="flex-1">
              <label
                htmlFor="remove-bg-company"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Auto-remove background from uploaded images
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                AI will automatically remove backgrounds before upload (runs in
                your browser, 100% free)
              </p>
            </div>
          </div>

          {/* Theme Assignment Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Light Theme Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnTheme(e, "light")}
              className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
                draggedLogo
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <h3 className="font-medium text-sm">Light Theme</h3>
              </div>
              {company.logoLight ? (
                <div className="relative group">
                  <div className="h-24 w-24 relative rounded-lg overflow-hidden border bg-white p-2 mx-auto">
                    <Image
                      src={company.logoLight}
                      alt="Light theme logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                    {company.logoLight.split("/").pop()}
                  </p>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center border-2 border-dashed rounded-lg bg-white dark:bg-gray-900">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Drag here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Theme Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnTheme(e, "dark")}
              className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
                draggedLogo
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4 text-purple-500" />
                <h3 className="font-medium text-sm">Dark Theme</h3>
              </div>
              {company.logoDark ? (
                <div className="relative group">
                  <div className="h-24 w-24 relative rounded-lg overflow-hidden border bg-gray-900 p-2 mx-auto">
                    <Image
                      src={company.logoDark}
                      alt="Dark theme logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                    {company.logoDark.split("/").pop()}
                  </p>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center border-2 border-dashed rounded-lg bg-gray-900">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Drag here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Logos Grid */}
          {uploadedLogos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Uploaded Logos ({uploadedLogos.length})
              </Label>
              <p className="text-xs text-muted-foreground">
                Drag logos to assign them to light or dark theme
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {uploadedLogos.map((logo, index) => (
                  <div
                    key={index}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, logo.url)}
                    className="relative group cursor-grab active:cursor-grabbing aspect-square border-2 rounded-lg overflow-hidden hover:border-primary transition-colors bg-white dark:bg-gray-900 p-1"
                  >
                    <div className="relative w-full h-full select-none">
                      <Image
                        src={logo.url}
                        alt={logo.filename}
                        fill
                        className="object-contain pointer-events-none"
                        draggable={false}
                        unoptimized
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLogo(logo.url);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Delete logo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>💡 Logo Size Tip:</strong> For best display in the
              sidebar, use logos with a 3:1 or 4:1 aspect ratio (e.g., 600x150px
              or 800x200px). Maximum width: 240px in sidebar. PNG with
              transparent background recommended.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Recommended: 200x200px, PNG or JPG, max 2MB per file
          </p>
        </div>

        {/* Company Info Section */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">Company Information</Label>
          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold">{company.name}</h3>
                {company.slogan && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {company.slogan}
                  </p>
                )}
              </div>
              {company.description && (
                <p className="text-sm">{company.description}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {company.email && (
                  <div className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    <a
                      href={`mailto:${company.email}`}
                      className="text-primary hover:underline"
                    >
                      {company.email}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span>{" "}
                    <a
                      href={`tel:${company.phone}`}
                      className="text-primary hover:underline"
                    >
                      {company.phone}
                    </a>
                  </div>
                )}
                {company.website && (
                  <div className="text-sm sm:col-span-2">
                    <span className="font-medium">Website:</span>{" "}
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="slogan">Slogan</Label>
                  <Input
                    id="slogan"
                    value={formData.slogan}
                    onChange={(e) =>
                      setFormData({ ...formData, slogan: e.target.value })
                    }
                    placeholder="Your company tagline"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of your company"
                    className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
