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
  Sparkles,
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
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";

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
  storeBlogEnabled?: boolean;
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
    storeBlogEnabled: false,
  });

  // AI Storefront builder state
  const [aiConfigLoading, setAiConfigLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSpec, setAiSpec] = useState<any | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGoal, setAiGoal] = useState<"sell-products" | "sell-services" | "lead-gen" | "bookings">(
    "lead-gen"
  );
  const [aiTone, setAiTone] = useState<"playful" | "serious" | "luxury" | "minimal">(
    "serious"
  );
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrimaryColor, setAiPrimaryColor] = useState("");
  const [aiSecondaryColor, setAiSecondaryColor] = useState("");
  const [aiAccentColor, setAiAccentColor] = useState("");
  const [aiShowLocation, setAiShowLocation] = useState(true);
  const [aiShowTeam, setAiShowTeam] = useState(true);
  const [aiShowTestimonials, setAiShowTestimonials] = useState(true);
  const [aiRefineNotes, setAiRefineNotes] = useState("");
  const [aiHeroLayout, setAiHeroLayout] = useState<"left" | "center">("left");

  // AI preview catalog data (for realistic preview)
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);
  const [aiPreviewProducts, setAiPreviewProducts] = useState<any[] | null>(
    null
  );
  const [aiPreviewServices, setAiPreviewServices] = useState<any[] | null>(
    null
  );
  const [aiPreviewTestimonials, setAiPreviewTestimonials] = useState<
    any[] | null
  >(null);
  const [aiPreviewTeam, setAiPreviewTeam] = useState<any[] | null>(null);
  const [aiPreviewContactEmail, setAiPreviewContactEmail] = useState<
    string | null
  >(null);
  const [aiPreviewContactPhone, setAiPreviewContactPhone] = useState<
    string | null
  >(null);

  // Posts management state
  interface StorefrontPostSummary {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    status: string;
    heroImage: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  const [posts, setPosts] = useState<StorefrontPostSummary[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<StorefrontPostSummary | null>(
    null
  );
  const [postForm, setPostForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    heroImage: "",
    status: "DRAFT",
    tags: "",
  });

  const aiMeta =
    aiSpec && typeof aiSpec === "object" ? aiSpec.meta || null : null;

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
      fetchAiConfig();
      fetchAiPreviewData();
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
      setSettings({
        ...data,
        storeBlogEnabled: data.storeBlogEnabled ?? false,
      });
    } catch (error) {
      console.error("Error fetching storefront settings:", error);
      toast.error("Failed to load storefront settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiConfig = async () => {
    if (!selectedCompanyId) return;
    setAiConfigLoading(true);
    try {
      const response = await fetch(
        `/api/ai-storefront/config?companyId=${selectedCompanyId}`
      );
      if (!response.ok) {
        // If config endpoint fails (e.g., plan gating), we silently ignore for now
        return;
      }
      const data = await response.json();
      setAiEnabled(!!data.enabled);
      setAiSpec(data.spec || null);
    } catch (error) {
      console.error("Error fetching AI storefront config:", error);
    } finally {
      setAiConfigLoading(false);
    }
  };

  const fetchAiPreviewData = async () => {
    if (!selectedCompanyId) return;
    setAiPreviewLoading(true);
    try {
      const response = await fetch(
        `/api/storefront/home-preview?companyId=${selectedCompanyId}`
      );
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setAiPreviewProducts(data.featuredProducts || null);
      setAiPreviewServices(data.featuredServices || null);
      setAiPreviewTestimonials(data.testimonials || null);
      setAiPreviewTeam(data.featuredTeamMembers || null);
      setAiPreviewContactEmail(data.contactEmail ?? null);
      setAiPreviewContactPhone(data.contactPhone ?? null);
    } catch (error) {
      console.error("Error fetching AI storefront preview data:", error);
    } finally {
      setAiPreviewLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!selectedCompanyId) return;
    setPostsLoading(true);
    try {
      const response = await fetch(
        `/api/storefront/posts?companyId=${selectedCompanyId}`
      );
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching storefront posts:", error);
    } finally {
      setPostsLoading(false);
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
        <Tabs
          defaultValue="general"
          className="space-y-4"
          onValueChange={(value) => {
            if (value === "posts") {
              fetchPosts();
            }
          }}
        >
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
            {settings.storeBlogEnabled && (
              <TabsTrigger value="posts">Posts</TabsTrigger>
            )}
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Storefront (Beta)
            </TabsTrigger>
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

            <Card>
              <CardHeader>
                <CardTitle>Blog / Posts</CardTitle>
                <CardDescription>
                  Enable a blogroll for your storefront and manage posts under
                  the Posts tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Enable Blogroll</p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    When enabled, your storefront navigation can link to a
                    posts page and you can create posts from the Posts tab.
                  </p>
                </div>
                <Switch
                  checked={!!settings.storeBlogEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      storeBlogEnabled: checked,
                    }))
                  }
                />
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

          {/* Posts Tab */}
          {settings.storeBlogEnabled && (
            <TabsContent value="posts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>
                    Create and manage posts that appear on your storefront
                    blogroll.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="post-title">Title</Label>
                        <Input
                          id="post-title"
                          value={postForm.title}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Post title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="post-slug">Slug (optional)</Label>
                        <Input
                          id="post-slug"
                          value={postForm.slug}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              slug: e.target.value,
                            }))
                          }
                          placeholder="my-first-post"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="post-excerpt">Excerpt</Label>
                        <Textarea
                          id="post-excerpt"
                          rows={3}
                          value={postForm.excerpt}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              excerpt: e.target.value,
                            }))
                          }
                          placeholder="Short summary shown on the blogroll page"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="post-hero">Hero Image URL</Label>
                        <Input
                          id="post-hero"
                          value={postForm.heroImage}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              heroImage: e.target.value,
                            }))
                          }
                          placeholder="/uploads/posts/hero.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="post-tags">
                          Tags (comma-separated)
                        </Label>
                        <Input
                          id="post-tags"
                          value={postForm.tags}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              tags: e.target.value,
                            }))
                          }
                          placeholder="erp, small-business, ai"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="post-status">Status</Label>
                        <Select
                          value={postForm.status}
                          onValueChange={(value) =>
                            setPostForm((prev) => ({
                              ...prev,
                              status: value,
                            }))
                          }
                        >
                          <SelectTrigger id="post-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PUBLISHED">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="post-content">Content</Label>
                        <Textarea
                          id="post-content"
                          rows={12}
                          value={postForm.content}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          placeholder="Write your post content here..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!selectedCompanyId) {
                              toast.error("Please select a company first");
                              return;
                            }
                            if (!postForm.title.trim()) {
                              toast.error("Post title is required");
                              return;
                            }
                            if (!postForm.content.trim()) {
                              toast.error("Post content is required");
                              return;
                            }

                            try {
                              if (editingPost) {
                                const response = await fetch(
                                  `/api/storefront/posts/${editingPost.id}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      title: postForm.title,
                                      slug: postForm.slug || undefined,
                                      excerpt: postForm.excerpt || undefined,
                                      content: postForm.content,
                                      heroImage:
                                        postForm.heroImage || undefined,
                                      status: postForm.status,
                                      tags: postForm.tags
                                        ? postForm.tags
                                            .split(",")
                                            .map((t) => t.trim())
                                            .filter(Boolean)
                                        : [],
                                    }),
                                  }
                                );
                                const data = await response.json();
                                if (!response.ok) {
                                  toast.error(
                                    data.error || "Failed to update post"
                                  );
                                  return;
                                }
                                toast.success("Post updated");
                              } else {
                                const response = await fetch(
                                  "/api/storefront/posts",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      companyId: selectedCompanyId,
                                      title: postForm.title,
                                      slug: postForm.slug || undefined,
                                      excerpt: postForm.excerpt || undefined,
                                      content: postForm.content,
                                      heroImage:
                                        postForm.heroImage || undefined,
                                      status: postForm.status,
                                      tags: postForm.tags
                                        ? postForm.tags
                                            .split(",")
                                            .map((t) => t.trim())
                                            .filter(Boolean)
                                        : [],
                                    }),
                                  }
                                );
                                const data = await response.json();
                                if (!response.ok) {
                                  toast.error(
                                    data.error || "Failed to create post"
                                  );
                                  return;
                                }
                                toast.success("Post created");
                              }
                              setPostForm({
                                title: "",
                                slug: "",
                                excerpt: "",
                                content: "",
                                heroImage: "",
                                status: "DRAFT",
                                tags: "",
                              });
                              setEditingPost(null);
                              fetchPosts();
                            } catch (error) {
                              console.error(
                                "Error saving storefront post:",
                                error
                              );
                              toast.error("Failed to save post");
                            }
                          }}
                        >
                          {editingPost ? "Update Post" : "Create Post"}
                        </Button>
                        {editingPost && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPost(null);
                              setPostForm({
                                title: "",
                                slug: "",
                                excerpt: "",
                                content: "",
                                heroImage: "",
                                status: "DRAFT",
                                tags: "",
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">
                        Existing Posts
                      </h3>
                    </div>
                    {postsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : posts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No posts yet. Create your first post above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {posts.map((post) => (
                          <div
                            key={post.id}
                            className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">
                                {post.title}{" "}
                                <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {post.status}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                /posts/{post.slug}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  setEditingPost(post);
                                  setPostForm({
                                    title: post.title,
                                    slug: post.slug,
                                    excerpt: post.excerpt || "",
                                    content: "", // Load full content via separate fetch if needed
                                    heroImage: post.heroImage || "",
                                    status: post.status,
                                    tags: "",
                                  });
                                }}
                              >
                                ✏️
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Are you sure you want to delete this post?"
                                    )
                                  ) {
                                    return;
                                  }
                                  try {
                                    const response = await fetch(
                                      `/api/storefront/posts/${post.id}`,
                                      {
                                        method: "DELETE",
                                      }
                                    );
                                    const data = await response.json();
                                    if (!response.ok) {
                                      toast.error(
                                        data.error || "Failed to delete post"
                                      );
                                      return;
                                    }
                                    toast.success("Post deleted");
                                    fetchPosts();
                                  } catch (error) {
                                    console.error(
                                      "Error deleting storefront post:",
                                      error
                                    );
                                    toast.error("Failed to delete post");
                                  }
                                }}
                              >
                                🗑
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

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

          {/* AI Storefront Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Storefront Builder
                </CardTitle>
                <CardDescription>
                  Let the resident AI generate a full storefront layout and copy
                  for this company. Requires Growth or Enterprise plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCompany && (
                  <p className="text-sm text-muted-foreground">
                    Select a company above to configure its AI storefront.
                  </p>
                )}

                {selectedCompany && (
                  <>
                    <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                      <p>
                        Company:{" "}
                        <span className="font-medium">
                          {selectedCompany.name}
                        </span>
                      </p>
                      <p>
                        AI Status:{" "}
                        <span className="font-medium">
                          {aiEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        {/* Step 1: Brand & Colors */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Step 1 · Brand & Colors
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="ai-primary-color">
                                Primary color
                              </Label>
                              <Input
                                id="ai-primary-color"
                                placeholder="#2563EB"
                                value={aiPrimaryColor}
                                onChange={(e) =>
                                  setAiPrimaryColor(e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="ai-secondary-color">
                                Secondary color
                              </Label>
                              <Input
                                id="ai-secondary-color"
                                placeholder="#F97316"
                                value={aiSecondaryColor}
                                onChange={(e) =>
                                  setAiSecondaryColor(e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="ai-accent-color">
                                Accent color
                              </Label>
                              <Input
                                id="ai-accent-color"
                                placeholder="#10B981"
                                value={aiAccentColor}
                                onChange={(e) =>
                                  setAiAccentColor(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Leave blank to use defaults. Colors help AI keep
                            the homepage aligned with your brand.
                          </p>
                        </div>

                        {/* Step 2: Layout & Data Toggles */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Step 2 · Sections & Data
                          </p>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center justify-between rounded border px-3 py-2">
                              <span>Highlight location</span>
                              <Switch
                                checked={aiShowLocation}
                                onCheckedChange={setAiShowLocation}
                              />
                            </div>
                            <div className="flex items-center justify-between rounded border px-3 py-2">
                              <span>Show team</span>
                              <Switch
                                checked={aiShowTeam}
                                onCheckedChange={setAiShowTeam}
                              />
                            </div>
                            <div className="flex items-center justify-between rounded border px-3 py-2">
                              <span>Show testimonials</span>
                              <Switch
                                checked={aiShowTestimonials}
                                onCheckedChange={setAiShowTestimonials}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            These control how the AI copy talks about your
                            location, team, and social proof. Actual content
                            still comes from your existing data.
                          </p>
                        </div>

                        {/* Step 3: Prompt & Goal */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Step 3 · Voice & Goal
                          </p>
                          <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                            <div className="space-y-1">
                              <Label htmlFor="ai-hero-layout">Hero layout</Label>
                              <Select
                                value={aiHeroLayout}
                                onValueChange={(value) =>
                                  setAiHeroLayout(
                                    value as "left" | "center"
                                  )
                                }
                              >
                                <SelectTrigger id="ai-hero-layout">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left aligned</SelectItem>
                                  <SelectItem value="center">
                                    Centered hero
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Textarea
                            id="ai-prompt"
                            rows={4}
                            placeholder="Example: A bold, modern website for our web design studio, focusing on portfolio, services, and strong calls to action for discovery calls..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            The AI will combine this with your company data to
                            shape headings, CTAs, and section copy.
                          </p>
                          <div className="space-y-1">
                            <Label htmlFor="ai-refine-notes" className="text-xs">
                              Refinement notes (optional)
                            </Label>
                            <Textarea
                              id="ai-refine-notes"
                              rows={3}
                              placeholder="Example: Make the hero more bold, emphasize our portfolio, and add a stronger call-to-action for booking a call."
                              value={aiRefineNotes}
                              onChange={(e) => setAiRefineNotes(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Use this after previewing a design to nudge the AI
                              (e.g., “Make the hero darker”, “Use more playful
                              language”, “Highlight testimonials more”).
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="ai-goal">Primary Goal</Label>
                            <Select
                              value={aiGoal}
                              onValueChange={(value) =>
                                setAiGoal(
                                  value as
                                    | "sell-products"
                                    | "sell-services"
                                    | "lead-gen"
                                    | "bookings"
                                )
                              }
                            >
                              <SelectTrigger id="ai-goal">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sell-products">
                                  Sell products
                                </SelectItem>
                                <SelectItem value="sell-services">
                                  Sell services
                                </SelectItem>
                                <SelectItem value="lead-gen">
                                  Generate leads
                                </SelectItem>
                                <SelectItem value="bookings">
                                  Drive bookings/appointments
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ai-tone">Tone</Label>
                            <Select
                              value={aiTone}
                              onValueChange={(value) =>
                                setAiTone(
                                  value as
                                    | "playful"
                                    | "serious"
                                    | "luxury"
                                    | "minimal"
                                )
                              }
                            >
                              <SelectTrigger id="ai-tone">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="playful">
                                  Playful / fun
                                </SelectItem>
                                <SelectItem value="serious">
                                  Serious / professional
                                </SelectItem>
                                <SelectItem value="luxury">
                                  Premium / luxury
                                </SelectItem>
                                <SelectItem value="minimal">
                                  Minimal / clean
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (!selectedCompanyId) {
                                toast.error("Please select a company first");
                                return;
                              }
                              const basePrompt = aiPrompt.trim();
                              const refine = aiRefineNotes.trim();
                              if (!basePrompt && !refine) {
                                toast.error(
                                  "Please enter a prompt or refinement notes"
                                );
                                return;
                              }
                              setAiGenerating(true);
                              try {
                                const fullPrompt =
                                  basePrompt.length > 0
                                    ? refine.length > 0
                                      ? `${basePrompt}\n\nRefinement notes:\n${refine}`
                                      : basePrompt
                                    : `Refine the existing AI storefront layout for this company.\n\nRefinement notes:\n${refine}`;
                                const response = await fetch(
                                  "/api/ai-storefront/generate",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      companyId: selectedCompanyId,
                                      prompt: fullPrompt,
                                      goal: aiGoal,
                                      tone: aiTone,
                                      primaryColor: aiPrimaryColor || undefined,
                                      secondaryColor:
                                        aiSecondaryColor || undefined,
                                      accentColor: aiAccentColor || undefined,
                                      heroLayout: aiHeroLayout,
                                      showLocation: aiShowLocation,
                                      showTeam: aiShowTeam,
                                      showTestimonials: aiShowTestimonials,
                                    }),
                                  }
                                );
                                const data = await response.json();

                                if (!response.ok) {
                                  toast.error(
                                    data.error ||
                                      "Failed to generate AI storefront"
                                  );
                                  return;
                                }

                                setAiSpec(data.spec);
                                setAiEnabled(true);
                                toast.success(
                                  "AI storefront generated and enabled"
                                );
                              } catch (error) {
                                console.error(
                                  "AI storefront generation error:",
                                  error
                                );
                                toast.error(
                                  "Failed to generate AI storefront"
                                );
                              } finally {
                                setAiGenerating(false);
                              }
                            }}
                            disabled={aiGenerating || !selectedCompanyId}
                          >
                            {aiGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate & Enable AI Storefront
                              </>
                            )}
                          </Button>

                          {aiEnabled && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!selectedCompanyId) return;
                                try {
                                  const response = await fetch(
                                    "/api/ai-storefront/disable",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        companyId: selectedCompanyId,
                                      }),
                                    }
                                  );
                                  const data = await response.json();
                                  if (!response.ok) {
                                    toast.error(
                                      data.error ||
                                        "Failed to disable AI storefront"
                                    );
                                    return;
                                  }
                                  setAiEnabled(false);
                                  toast.success(
                                    "AI storefront disabled for this company"
                                  );
                                } catch (error) {
                                  console.error(
                                    "AI storefront disable error:",
                                    error
                                  );
                                  toast.error(
                                    "Failed to disable AI storefront"
                                  );
                                }
                              }}
                            >
                              Disable AI Storefront
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Live Preview</Label>
                        <div className="rounded-lg border bg-muted/30 p-3 min-h-[300px]">
                          {(aiConfigLoading || aiPreviewLoading) && (
                            <div className="flex items-center justify-center h-40">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {!aiConfigLoading && !aiPreviewLoading && !aiSpec && (
                            <p className="text-sm text-muted-foreground">
                              No AI storefront generated yet. Enter a prompt and
                              click{" "}
                              <span className="font-medium">
                                Generate &amp; Enable AI Storefront
                              </span>
                              .
                            </p>
                          )}
                          {!aiConfigLoading &&
                            !aiPreviewLoading &&
                            aiSpec &&
                            settings.slug &&
                            selectedCompany && (
                              <div className="border rounded-lg overflow-hidden bg-background">
                                {/* Inline storefront header to mirror live store */}
                                <header
                                  className="border-b bg-background/95"
                                  style={
                                    aiMeta
                                      ? {
                                          backgroundColor:
                                            aiMeta.primaryColor || undefined,
                                          color: aiMeta.textColor || undefined,
                                          borderColor:
                                            aiMeta.accentColor ||
                                            aiMeta.secondaryColor,
                                        }
                                      : undefined
                                  }
                                >
                                  <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {selectedCompany.logo && (
                                        <Image
                                          src={selectedCompany.logo}
                                          alt={selectedCompany.name}
                                          width={32}
                                          height={32}
                                          className="object-contain rounded"
                                        />
                                      )}
                                      <h2 className="text-base font-semibold truncate">
                                        {selectedCompany.name}
                                      </h2>
                                    </div>
                                    <nav className="hidden md:flex items-center gap-4 text-xs font-medium">
                                      <span className="opacity-80">Home</span>
                                      <span className="opacity-80">
                                        Products
                                      </span>
                                      <span className="opacity-80">
                                        Services
                                      </span>
                                      <span className="opacity-80">Login</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled
                                        style={
                                          aiMeta
                                            ? {
                                                borderColor:
                                                  aiMeta.accentColor ||
                                                  aiMeta.secondaryColor,
                                                color:
                                                  aiMeta.textColor ||
                                                  "#111827",
                                              }
                                            : undefined
                                        }
                                      >
                                        Register
                                      </Button>
                                      <Button
                                        size="sm"
                                        disabled
                                        style={
                                          aiMeta
                                            ? {
                                                backgroundColor:
                                                  aiMeta.accentColor ||
                                                  aiMeta.primaryColor,
                                                color:
                                                  aiMeta.textColor ||
                                                  "#ffffff",
                                              }
                                            : undefined
                                        }
                                      >
                                        Cart
                                      </Button>
                                    </nav>
                                  </div>
                                </header>
                                <AiStorefrontRenderer
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  spec={aiSpec as any}
                                  slug={settings.slug}
                                  companyName={selectedCompany.name}
                                  enableCart={false}
                                  featuredProducts={aiPreviewProducts || undefined}
                                  featuredServices={aiPreviewServices || undefined}
                                  featuredTeamMembers={aiPreviewTeam || undefined}
                                  testimonials={aiPreviewTestimonials || undefined}
                                  contactEmail={aiPreviewContactEmail || undefined}
                                  contactPhone={aiPreviewContactPhone || undefined}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
