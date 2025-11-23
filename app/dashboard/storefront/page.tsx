"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
} from "lucide-react";
import { ThemeGallery } from "@/components/storefront/theme-gallery";
import { ContentWizard } from "@/components/storefront/content-wizard";
import { StorefrontReadinessWidget } from "@/components/storefront/storefront-readiness-widget";
import { ThemeSection } from "@/lib/storefront-themes";

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
      linkedin?: string;
    };
    contactEmail?: string;
    contactPhone?: string;
  } | null;
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
  slogan: string | null;
  description: string | null;
  email: string | null;
  salesEmail: string | null;
  supportEmail: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}

export default function StorefrontPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  }>({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [themeSections, setThemeSections] = useState<ThemeSection[]>([]);
  const [settings, setSettings] = useState<StorefrontSettings>({
    slug: null,
    subdomain: null,
    customDomain: null,
    isStoreEnabled: false,
    storeTheme: "modern-tech",
    storeBanner: null,
    storeMetadata: null,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
        });
        return true;
      } else {
        // Not authenticated - redirect to login
        router.push("/login");
        return false;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
      return false;
    }
  }, [router]);

  useEffect(() => {
    const init = async () => {
      const authenticated = await fetchUser();
      if (authenticated) {
        await fetchCompanies();
      }
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (selectedCompanyId) {
      const company = companies.find((c) => c.id === selectedCompanyId);
      setSelectedCompany(company || null);
      fetchSettings();
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies/my-owned");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      const data = await response.json();
      const ownedCompanies = data.companies || [];
      setCompanies(ownedCompanies);

      // Auto-select first company if available
      if (ownedCompanies.length > 0) {
        setSelectedCompanyId(ownedCompanies[0].id);
      } else {
        setLoading(false);
        toast.error("No companies found. Please create a company first.");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/company/storefront?companyId=${selectedCompanyId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      // Set default theme if none exists
      if (!data.storeTheme) {
        data.storeTheme = "modern-tech";
      }
      setSettings(data);
    } catch (error) {
      console.error("Error fetching storefront settings:", error);
      toast.error("Failed to load storefront settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/company/storefront?companyId=${selectedCompanyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }
      );

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

  const handleBannerDelete = async () => {
    if (!confirm("Are you sure you want to delete the banner?")) return;

    setUploadingBanner(true);

    try {
      const response = await fetch("/api/company/storefront/banner", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete banner");
      }

      setSettings((prev) => ({ ...prev, storeBanner: null }));
      toast.success("Banner deleted successfully!");
    } catch (error) {
      console.error("Banner delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete banner"
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
      <DashboardLayout user={user}>
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
    <DashboardLayout user={user}>
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

        {/* Company Selector Card - Prominent placement */}
        {companies.length > 1 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Select Company</CardTitle>
              <CardDescription>
                Choose which company's storefront you want to configure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        {company.logo && (
                          <Image
                            src={company.logo}
                            alt={company.name}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                        )}
                        <span>{company.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCompany && (
                <p className="text-sm text-muted-foreground mt-2">
                  Currently configuring: <strong>{selectedCompany.name}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Single company indicator */}
        {companies.length === 1 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {selectedCompany?.logo && (
                  <Image
                    src={selectedCompany.logo}
                    alt={selectedCompany.name}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Configuring storefront for
                  </p>
                  <p className="font-semibold text-lg">
                    {selectedCompany?.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Storefront Readiness Check */}
        {selectedCompanyId && (
          <StorefrontReadinessWidget
            companyId={selectedCompanyId}
            slug={settings.slug}
          />
        )}

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
            <TabsTrigger value="content">Content Wizard</TabsTrigger>
            <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Store URL Configuration</CardTitle>
                    <CardDescription>
                      Choose how customers will access your store
                    </CardDescription>
                  </div>
                  {storeUrl && (
                    <Button variant="outline" asChild>
                      <a
                        href={storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {settings.isStoreEnabled
                          ? "View Store"
                          : "Preview Store"}
                      </a>
                    </Button>
                  )}
                  {!storeUrl && settings.slug && (
                    <Button variant="outline" asChild>
                      <a
                        href={`/store/${settings.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Store
                      </a>
                    </Button>
                  )}
                </div>
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
            <ThemeGallery
              selectedTheme={settings.storeTheme}
              onThemeSelect={(themeId) =>
                setSettings((prev) => ({ ...prev, storeTheme: themeId }))
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Store Banner</CardTitle>
                <CardDescription>
                  Upload a banner image for your store hero section. This will
                  replace the animated background on your storefront homepage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.storeBanner && (
                  <div className="space-y-2">
                    <div className="relative aspect-3/1 w-full overflow-hidden rounded-lg border">
                      <Image
                        src={settings.storeBanner}
                        alt="Store banner"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBannerDelete}
                      disabled={uploadingBanner}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Banner
                    </Button>
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

          {/* Content Wizard Tab */}
          <TabsContent value="content" className="space-y-4">
            <ContentWizard
              themeId={settings.storeTheme}
              companyData={
                selectedCompany
                  ? {
                      name: selectedCompany.name,
                      slogan: selectedCompany.slogan || undefined,
                      description: selectedCompany.description || undefined,
                      logo: selectedCompany.logo || undefined,
                      email: selectedCompany.email || undefined,
                      salesEmail: selectedCompany.salesEmail || undefined,
                      supportEmail: selectedCompany.supportEmail || undefined,
                      phone: selectedCompany.phone || undefined,
                      website: selectedCompany.website || undefined,
                      addressLine1: selectedCompany.addressLine1 || undefined,
                      addressLine2: selectedCompany.addressLine2 || undefined,
                      city: selectedCompany.city || undefined,
                      state: selectedCompany.state || undefined,
                      country: selectedCompany.country || undefined,
                      postalCode: selectedCompany.postalCode || undefined,
                    }
                  : undefined
              }
              onContentChange={(sections) => setThemeSections(sections)}
            />
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

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/company/mystore"
                    value={settings.storeMetadata?.socialLinks?.linkedin || ""}
                    onChange={(e) =>
                      updateSocialLink("linkedin", e.target.value)
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
