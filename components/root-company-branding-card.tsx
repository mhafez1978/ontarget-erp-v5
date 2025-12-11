"use client";

import { useState, useEffect, useCallback, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { removeBackground } from "@imgly/background-removal";

interface UploadedLogo {
  url: string;
  filename: string;
}

interface RootCompany {
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

export function RootCompanyBrandingCard() {
  const [loading, setLoading] = useState(true);
  const [rootCompany, setRootCompany] = useState<RootCompany | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogos, setUploadingLogos] = useState(false);
  const [uploadedLogos, setUploadedLogos] = useState<UploadedLogo[]>([]);
  const [draggedLogo, setDraggedLogo] = useState<string | null>(null);
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(false);

  // Track temporary logo assignments before saving
  const [tempLogoLight, setTempLogoLight] = useState<string | null>(null);
  const [tempLogoDark, setTempLogoDark] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slogan: "",
    description: "",
    email: "",
    phone: "",
    website: "",
  });

  const fetchUploadedLogos = useCallback(async (companyId: string) => {
    try {
      const response = await fetch(`/api/company/${companyId}/logos`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched uploaded logos:", data.logos);
        setUploadedLogos(data.logos || []);
      } else {
        console.error("Failed to fetch logos, status:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch uploaded logos:", error);
    }
  }, []);

  const fetchRootCompany = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/company/root");

      if (!response.ok) {
        throw new Error("Failed to fetch root company");
      }

      const data = await response.json();
      setRootCompany(data.company);

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
        fetchUploadedLogos(data.company.id);
      }
    } catch (error) {
      console.error("Failed to fetch root company:", error);
      toast.error("Failed to load system branding");
    } finally {
      setLoading(false);
    }
  }, [fetchUploadedLogos]);

  useEffect(() => {
    fetchRootCompany();
  }, [fetchRootCompany]);

  const handleMultipleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !rootCompany) return;

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

      console.log(
        `[Upload] Uploading ${processedFiles.length} files to /api/company/${rootCompany.id}/logos`
      );

      const response = await fetch(`/api/company/${rootCompany.id}/logos`, {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();
      console.log("[Upload] Response status:", response.status);
      console.log("[Upload] Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload logos");
      }

      toast.success(`${processedFiles.length} logo(s) uploaded successfully!`);

      // Refresh the uploaded logos list
      console.log("[Upload] Fetching updated logos list...");
      await fetchUploadedLogos(rootCompany.id);
      console.log("[Upload] Logos list updated, count:", uploadedLogos.length);
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload logos"
      );
    } finally {
      setUploadingLogos(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, logoUrl: string) => {
    e.stopPropagation();
    setDraggedLogo(logoUrl);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", logoUrl);
    console.log("Drag started:", logoUrl);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnTheme = (
    e: DragEvent<HTMLDivElement>,
    theme: "light" | "dark"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Drop detected on theme:", theme, "Logo:", draggedLogo);

    if (!draggedLogo || !rootCompany) {
      console.log("Drop cancelled - no dragged logo or company");
      return;
    }

    // In edit mode, just update temporary state
    if (isEditing) {
      if (theme === "light") {
        setTempLogoLight(draggedLogo);
      } else {
        setTempLogoDark(draggedLogo);
      }
      toast.success(
        `Logo assigned to ${
          theme === "light" ? "light" : "dark"
        } theme (not saved yet)`
      );
    }

    setDraggedLogo(null);
  };

  const handleDeleteLogo = async (logoUrl: string) => {
    if (!rootCompany) return;

    try {
      const response = await fetch(
        `/api/company/${rootCompany.id}/logos?url=${encodeURIComponent(
          logoUrl
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to delete logo"
        );
      }

      toast.success("Logo deleted successfully");
      fetchUploadedLogos(rootCompany.id);

      // Update root company if this was assigned
      if (
        rootCompany.logoLight === logoUrl ||
        rootCompany.logoDark === logoUrl
      ) {
        fetchRootCompany();
      }
    } catch (error) {
      console.error("Failed to delete logo:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete logo";
      toast.error(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!rootCompany) return;

    setIsSaving(true);

    try {
      // Prepare update data with form fields and logo assignments
      const updateData = {
        ...formData,
        ...(tempLogoLight !== null && { logoLight: tempLogoLight }),
        ...(tempLogoDark !== null && { logoDark: tempLogoDark }),
        // Set fallback logo if not already set
        ...(!rootCompany.logo &&
          (tempLogoLight || tempLogoDark) && {
            logo: tempLogoLight || tempLogoDark,
          }),
      };

      const response = await fetch(`/api/company/${rootCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update company");
      }

      setRootCompany(data.company);
      setIsEditing(false);
      // Reset temp logo states
      setTempLogoLight(null);
      setTempLogoDark(null);
      toast.success("System branding updated successfully!");

      // Force refresh the branding in dashboard
      window.dispatchEvent(new Event("branding-updated"));
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
    if (rootCompany) {
      setFormData({
        name: rootCompany.name || "",
        slogan: rootCompany.slogan || "",
        description: rootCompany.description || "",
        email: rootCompany.email || "",
        phone: rootCompany.phone || "",
        website: rootCompany.website || "",
      });
    }
    // Reset temporary logo assignments
    setTempLogoLight(null);
    setTempLogoDark(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rootCompany) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            System Branding (Root Company)
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(true);
                // Initialize temp logo states with current values
                setTempLogoLight(rootCompany?.logoLight || null);
                setTempLogoDark(rootCompany?.logoDark || null);
              }}
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
          appear in the dashboard sidebar.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Theme Logos Display (View Mode) */}
        {!isEditing && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Current Theme Logos
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Light Theme */}
              <div className="border-2 rounded-lg p-4 bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="h-4 w-4 text-yellow-600" />
                  <h3 className="font-medium text-sm">Light Theme Logo</h3>
                </div>
                {rootCompany.logoLight ? (
                  <div className="relative group">
                    <div className="h-32 w-full relative rounded-lg overflow-hidden border-2 border-yellow-200 bg-white p-3">
                      <Image
                        src={rootCompany.logoLight}
                        alt="Light theme logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-yellow-300 rounded-lg bg-white/50">
                    <p className="text-xs text-muted-foreground">
                      No logo assigned
                    </p>
                  </div>
                )}
              </div>

              {/* Dark Theme */}
              <div className="border-2 rounded-lg p-4 bg-linear-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <Moon className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-sm">Dark Theme Logo</h3>
                </div>
                {rootCompany.logoDark ? (
                  <div className="relative group">
                    <div className="h-32 w-full relative rounded-lg overflow-hidden border-2 border-purple-200 bg-gray-900 p-3">
                      <Image
                        src={rootCompany.logoDark}
                        alt="Dark theme logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-purple-300 rounded-lg bg-gray-900/50">
                    <p className="text-xs text-muted-foreground">
                      No logo assigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Logo Upload and Management Section (Edit Mode Only) */}
        {isEditing && (
          <div className="space-y-4 p-4 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">
                  Logo Management
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload logos, then drag them to Light or Dark theme zones
                  below
                </p>
              </div>
              <div>
                <input
                  type="file"
                  id="logos-upload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleMultipleLogoUpload}
                  disabled={uploadingLogos}
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={uploadingLogos}
                  onClick={() =>
                    document.getElementById("logos-upload")?.click()
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
            <div className="flex items-center space-x-2 p-3 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-700 rounded-lg">
              <Checkbox
                id="remove-bg"
                checked={removeBackgroundEnabled}
                onCheckedChange={(checked) =>
                  setRemoveBackgroundEnabled(checked as boolean)
                }
                disabled={uploadingLogos}
              />
              <div className="flex-1">
                <label
                  htmlFor="remove-bg"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Auto-remove background from uploaded images
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will automatically remove backgrounds before upload (runs
                  in your browser, 100% free)
                </p>
              </div>
            </div>

            {/* Uploaded Logos Grid - Always visible in edit mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Available Logos ({uploadedLogos.length})
                </Label>
                {uploadedLogos.length > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    👆 Drag logos below to assign them to themes
                  </p>
                )}
              </div>

              {uploadedLogos.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No logos uploaded yet. Click &quot;Upload Logos&quot; to get
                    started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                  {uploadedLogos.map((logo, index) => (
                    <div
                      key={index}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, logo.url)}
                      className="relative group cursor-grab active:cursor-grabbing aspect-square border-2 rounded-lg hover:border-primary hover:shadow-xl transition-all bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2 hover:scale-105"
                      title={`Drag to assign: ${logo.filename}`}
                    >
                      <div className="relative w-full h-full select-none overflow-hidden rounded">
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
                          if (
                            confirm(
                              "Are you sure you want to delete this logo?"
                            )
                          ) {
                            handleDeleteLogo(logo.url);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                        title="Delete logo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Assignment Drop Zones */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Theme Assignment</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light Theme Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnTheme(e, "light")}
                  className={`border-3 border-dashed rounded-xl p-4 transition-all ${
                    draggedLogo
                      ? "border-yellow-500 bg-yellow-100 dark:bg-yellow-950/50 shadow-lg scale-105"
                      : "border-yellow-300 dark:border-yellow-700 bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-sm">Light Theme Logo</h3>
                  </div>
                  {tempLogoLight || rootCompany.logoLight ? (
                    <div className="relative group">
                      <div className="h-32 w-full relative rounded-lg overflow-hidden border-2 border-yellow-300 bg-white p-3">
                        <Image
                          src={tempLogoLight || rootCompany.logoLight || ""}
                          alt="Light theme logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      {tempLogoLight && (
                        <p className="text-xs text-center mt-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ New logo assigned (save to apply)
                        </p>
                      )}
                      {!tempLogoLight && (
                        <p className="text-xs text-center mt-2 text-muted-foreground">
                          Current logo • Drag a new one to replace
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-yellow-400 rounded-lg bg-white/50">
                      <div className="text-center text-yellow-700 dark:text-yellow-400">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-70" />
                        <p className="text-sm font-medium">Drop logo here</p>
                        <p className="text-xs mt-1">For light theme</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dark Theme Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnTheme(e, "dark")}
                  className={`border-3 border-dashed rounded-xl p-4 transition-all ${
                    draggedLogo
                      ? "border-purple-500 bg-purple-100 dark:bg-purple-950/50 shadow-lg scale-105"
                      : "border-purple-300 dark:border-purple-700 bg-linear-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-sm">Dark Theme Logo</h3>
                  </div>
                  {tempLogoDark || rootCompany.logoDark ? (
                    <div className="relative group">
                      <div className="h-32 w-full relative rounded-lg overflow-hidden border-2 border-purple-300 bg-gray-900 p-3">
                        <Image
                          src={tempLogoDark || rootCompany.logoDark || ""}
                          alt="Dark theme logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      {tempLogoDark && (
                        <p className="text-xs text-center mt-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ New logo assigned (save to apply)
                        </p>
                      )}
                      {!tempLogoDark && (
                        <p className="text-xs text-center mt-2 text-muted-foreground">
                          Current logo • Drag a new one to replace
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-purple-400 rounded-lg bg-gray-900/50">
                      <div className="text-center text-purple-400">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-70" />
                        <p className="text-sm font-medium">Drop logo here</p>
                        <p className="text-xs mt-1">For dark theme</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-100 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>💡 Quick Tips:</strong> Upload multiple logos → Drag
                them to Light/Dark zones → Click Save to apply changes globally
                to dashboard and homepage
              </p>
            </div>
          </div>
        )}

        {/* Company Info Section */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">Company Information</Label>
          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold">{rootCompany.name}</h3>
                {rootCompany.slogan && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {rootCompany.slogan}
                  </p>
                )}
              </div>
              {rootCompany.description && (
                <p className="text-sm">{rootCompany.description}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rootCompany.email && (
                  <div className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    <a
                      href={`mailto:${rootCompany.email}`}
                      className="text-primary hover:underline"
                    >
                      {rootCompany.email}
                    </a>
                  </div>
                )}
                {rootCompany.phone && (
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span>{" "}
                    <a
                      href={`tel:${rootCompany.phone}`}
                      className="text-primary hover:underline"
                    >
                      {rootCompany.phone}
                    </a>
                  </div>
                )}
                {rootCompany.website && (
                  <div className="text-sm sm:col-span-2">
                    <span className="font-medium">Website:</span>{" "}
                    <a
                      href={rootCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {rootCompany.website}
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
                    placeholder="OnTarget ERP"
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
                    placeholder="People Driven & AI Insight"
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
