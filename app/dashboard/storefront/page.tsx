"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Store,
  Globe,
  Palette,
  Save,
  Loader2,
  ExternalLink,
  Eye,
  Upload,
} from "lucide-react";

interface StorefrontSettings {
  slug: string | null;
  subdomain: string | null;
  customDomain: string | null;
  isStoreEnabled: boolean;
  storeTheme: string;
  storeBanner: string | null;
  storeMetadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
    contactEmail?: string;
    contactPhone?: string;
  } | null;
}

export default function StorefrontPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [settings, setSettings] = useState<StorefrontSettings>({
    slug: null,
    subdomain: null,
    customDomain: null,
    isStoreEnabled: false,
    storeTheme: "default",
    storeBanner: null,
    storeMetadata: null,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/company/storefront");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching storefront settings:", error);
      toast.error("Failed to load storefront settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/company/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Storefront settings saved successfully!");
    } catch (error) {
      console.error("Error saving storefront settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("banner", file);

      const response = await fetch("/api/company/storefront/banner", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload banner");
      }

      setSettings((prev) => ({ ...prev, storeBanner: data.bannerUrl }));
      toast.success("Banner uploaded successfully!");
    } catch (error) {
      console.error("Banner upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload banner"
      );
    } finally {
      setUploadingBanner(false);
    }
  };

  const updateMetadata = (
    key: string,
    value: string | boolean | null | string[]
  ) => {
    setSettings((prev) => ({
      ...prev,
      storeMetadata: {
        ...prev.storeMetadata,
        [key]: value,
      },
    }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setSettings((prev) => ({
      ...prev,
      storeMetadata: {
        ...prev.storeMetadata,
        socialLinks: {
          ...(prev.storeMetadata?.socialLinks || {}),
          [platform]: url,
        },
      },
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const storeUrl = settings.customDomain
    ? `https://${settings.customDomain}`
    : settings.subdomain
    ? `https://${settings.subdomain}.ontarget-erp.com`
    : settings.slug
    ? `${window.location.origin}/store/${settings.slug}`
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Store className="h-8 w-8" />
              Storefront Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your public-facing online store
            </p>
          </div>
          <div className="flex gap-2">
            {storeUrl && settings.isStoreEnabled && (
              <Button variant="outline" asChild>
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Store
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Store Status Banner */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Store Status</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.isStoreEnabled
                    ? "Your store is live and accepting orders"
                    : "Your store is currently disabled"}
                </p>
              </div>
              <Switch
                checked={settings.isStoreEnabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, isStoreEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              Theme & Branding
            </TabsTrigger>
            <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store URL Configuration</CardTitle>
                <CardDescription>
                  Choose how customers will access your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Store Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      placeholder="my-store"
                      value={settings.slug || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        }))
                      }
                    />
                  </div>
                  {settings.slug && (
                    <p className="text-sm text-muted-foreground">
                      Your store will be accessible at:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded">
                        {window.location.origin}/store/{settings.slug}
                      </code>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="subdomain"
                      placeholder="mystore"
                      value={settings.subdomain || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          subdomain: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        }))
                      }
                    />
                    <span className="text-muted-foreground whitespace-nowrap">
                      .ontarget-erp.com
                    </span>
                  </div>
                  {settings.subdomain && (
                    <p className="text-sm text-muted-foreground">
                      Your store will be accessible at:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded">
                        https://{settings.subdomain}.ontarget-erp.com
                      </code>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                  <Input
                    id="customDomain"
                    placeholder="shop.mycompany.com"
                    value={settings.customDomain || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        customDomain: e.target.value.toLowerCase(),
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll need to configure DNS settings to point your
                    domain to our servers
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme & Branding Tab */}
          <TabsContent value="theme" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Theme</CardTitle>
                <CardDescription>
                  Choose a theme for your storefront
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.storeTheme}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, storeTheme: value }))
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store Banner</CardTitle>
                <CardDescription>
                  Upload a banner image for your store homepage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.storeBanner && (
                  <div className="relative aspect-3/1 w-full overflow-hidden rounded-lg border">
                    <Image
                      src={settings.storeBanner}
                      alt="Store banner"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="banner-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("banner-upload")?.click()
                    }
                    disabled={uploadingBanner}
                  >
                    {uploadingBanner ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Banner
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended size: 1920x640px, max 5MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO & Metadata Tab */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimize your store for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Store Title</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Store"
                    value={settings.storeMetadata?.title || ""}
                    onChange={(e) => updateMetadata("title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Store Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your store..."
                    rows={3}
                    value={settings.storeMetadata?.description || ""}
                    onChange={(e) =>
                      updateMetadata("description", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="products, services, online store"
                    value={settings.storeMetadata?.keywords?.join(", ") || ""}
                    onChange={(e) =>
                      updateMetadata(
                        "keywords",
                        e.target.value.split(",").map((k) => k.trim())
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Display contact info on your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@mystore.com"
                    value={settings.storeMetadata?.contactEmail || ""}
                    onChange={(e) =>
                      updateMetadata("contactEmail", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={settings.storeMetadata?.contactPhone || ""}
                    onChange={(e) =>
                      updateMetadata("contactPhone", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>
                  Connect your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/mystore"
                    value={settings.storeMetadata?.socialLinks?.facebook || ""}
                    onChange={(e) =>
                      updateSocialLink("facebook", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter / X</Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/mystore"
                    value={settings.storeMetadata?.socialLinks?.twitter || ""}
                    onChange={(e) =>
                      updateSocialLink("twitter", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/mystore"
                    value={settings.storeMetadata?.socialLinks?.instagram || ""}
                    onChange={(e) =>
                      updateSocialLink("instagram", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
