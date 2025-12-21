"use client";


import { Sparkles, Store, Globe, Palette, Save, Loader2, ExternalLink, Upload, Trash2, Building, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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










;
import { ThemeGallery } from "@/components/storefront/theme-gallery";
import { ContentWizard } from "@/components/storefront/content-wizard";
import { StorefrontReadinessWidget } from "@/components/storefront/storefront-readiness-widget";
import { ThemeSection, defaultThemes } from "@/lib/storefront-themes";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import type {
  AiFrontstoreSpec,
  AiFrontstoreSection,
  StorefrontTestimonial,
  FeaturedTeamMember,
  FeaturedProduct,
} from "@/lib/ai/ai-storefront-types";

// Extend FeaturedService type to include price
type FeaturedService = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
};

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
    // Optional persisted layout/content overrides for ThemeRenderer
    sections?: ThemeSection[];
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
  createdAt?: string;
}

export default function StorefrontPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    plan?: string | null;
  }>({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
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
  const [aiSpec, setAiSpec] = useState<AiFrontstoreSpec | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGoal, setAiGoal] = useState<
    "sell-products" | "sell-services" | "lead-gen" | "bookings"
  >("lead-gen");
  const [aiTone, setAiTone] = useState<
    "playful" | "serious" | "luxury" | "minimal"
  >("serious");
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
  const [aiPreviewProducts, setAiPreviewProducts] = useState<unknown[] | null>(
    null
  );
  const [aiPreviewServices, setAiPreviewServices] = useState<unknown[] | null>(
    null
  );
  const [aiPreviewTestimonials, setAiPreviewTestimonials] = useState<
    unknown[] | null
  >(null);
  const [aiPreviewTeam, setAiPreviewTeam] = useState<unknown[] | null>(null);
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

  const [aiUsageLimit, setAiUsageLimit] = useState<number | "unlimited" | null>(
    null
  );
  const [aiUsageUsed, setAiUsageUsed] = useState<number | null>(null);
  const [aiHeroSize, setAiHeroSize] = useState<"inherit" | "compact" | "full">(
    "inherit"
  );
  const [aiEmphasis, setAiEmphasis] = useState<
    "balanced" | "products" | "services" | "testimonials"
  >("balanced");
  const [aiRefining, setAiRefining] = useState(false);

  const planAllowsAiStorefront =
    user.role === "SUPER_ADMIN" ||
    ["SUPER_USER", "GROWTH", "ENTERPRISE"].includes(user.plan || "");

  const [activeTab, setActiveTab] = useState<string>("general");

  // Handle URL parameters for tab and company selection
  useEffect(() => {
    const tab = searchParams.get("tab");
    const company = searchParams.get("company");

    if (tab) {
      setActiveTab(tab);
    }

    if (company && companies.some((c) => c.id === company)) {
      setSelectedCompanyId(company);
    }
  }, [searchParams, companies]);

  const mapAiSpecToThemeSections = (
    spec: AiFrontstoreSpec,
    themeId: string
  ): ThemeSection[] | null => {
    const theme = defaultThemes.find((t) => t.id === themeId);
    if (!theme) return null;

    const cloneSections: ThemeSection[] = theme.sections.map((section) => ({
      ...section,
      content: { ...section.content },
    }));

    const findAiSection = (type: AiFrontstoreSection["type"]) =>
      spec.sections.find((s) => s.type === type);

    const aiHero = findAiSection("hero");
    if (aiHero) {
      const heroThemeSection = cloneSections.find((s) => s.type === "hero");
      if (heroThemeSection) {
        const heroContent = aiHero.content as Record<string, unknown>;
        heroThemeSection.content = {
          ...heroThemeSection.content,
          heading:
            (heroContent.title as string) ||
            (heroThemeSection.content.heading as string),
          subheading:
            (heroContent.subtitle as string) ||
            (heroThemeSection.content.subheading as string),
          description:
            (heroContent.description as string) ||
            (heroThemeSection.content.description as string),
          ctaText:
            (heroContent.primaryCTA as string) ||
            (heroThemeSection.content.ctaText as string),
          secondaryCtaText:
            (heroContent.secondaryCTA as string) ||
            (heroThemeSection.content.secondaryCtaText as string),
        };
      }
    }

    const aiProducts = findAiSection("product-grid");
    if (aiProducts) {
      const productsThemeSection = cloneSections.find(
        (s) => s.type === "featured-products"
      );
      if (productsThemeSection) {
        const productContent = aiProducts.content as Record<string, unknown>;
        productsThemeSection.content = {
          ...productsThemeSection.content,
          heading:
            (productContent.heading as string) ||
            (productsThemeSection.content.heading as string),
          description:
            (productContent.subheading as string) ||
            (productsThemeSection.content.description as string),
        };
      }
    }

    const aiServices = findAiSection("service-grid");
    if (aiServices) {
      const servicesThemeSection = cloneSections.find(
        (s) => s.type === "featured-services"
      );
      if (servicesThemeSection) {
        const serviceContent = aiServices.content as Record<string, unknown>;
        servicesThemeSection.content = {
          ...servicesThemeSection.content,
          heading:
            (serviceContent.heading as string) ||
            (servicesThemeSection.content.heading as string),
          description:
            (serviceContent.subheading as string) ||
            (servicesThemeSection.content.description as string),
        };
      }
    }

    const aiTestimonials = findAiSection("testimonials");
    if (aiTestimonials) {
      const socialProofSection = cloneSections.find(
        (s) => s.type === "social-proof"
      );
      if (socialProofSection) {
        const testimonialContent = aiTestimonials.content as Record<
          string,
          unknown
        >;
        socialProofSection.content = {
          ...socialProofSection.content,
          heading:
            (testimonialContent.heading as string) ||
            (socialProofSection.content.heading as string),
          description:
            (testimonialContent.subheading as string) ||
            (socialProofSection.content.description as string),
        };
      }
    }

    const aiContact = findAiSection("contact");
    if (aiContact) {
      const contactSection = cloneSections.find((s) => s.type === "contact");
      if (contactSection) {
        const contactContent = aiContact.content as Record<string, unknown>;
        contactSection.content = {
          ...contactSection.content,
          heading:
            (contactContent.heading as string) ||
            (contactSection.content.heading as string),
          description:
            (contactContent.description as string) ||
            (contactSection.content.description as string),
        };
      }
    }

    const aiFaq = findAiSection("faq");
    if (aiFaq) {
      const aboutSection = cloneSections.find((s) => s.type === "about");
      if (aboutSection) {
        const faqContent = aiFaq.content as Record<string, unknown>;
        const faqItemsRaw = (faqContent.items ??
          (faqContent.faqItems as unknown)) as
          | Array<Record<string, unknown>>
          | undefined;
        aboutSection.content = {
          ...aboutSection.content,
          heading:
            (faqContent.heading as string) ||
            (aboutSection.content.heading as string),
          description:
            (faqContent.subheading as string) ||
            (aboutSection.content.description as string),
          faqItems:
            Array.isArray(faqItemsRaw) && faqItemsRaw.length > 0
              ? faqItemsRaw
              : aboutSection.content.faqItems,
        };
      }
    }

    const aiCta = findAiSection("cta-band");
    if (aiCta) {
      const promoSection = cloneSections.find((s) => s.type === "promo-banner");
      if (promoSection) {
        const ctaContent = aiCta.content as Record<string, unknown>;
        const heading = ctaContent.heading as string | undefined;
        const subheading = ctaContent.subheading as string | undefined;
        const buttonLabel = ctaContent.buttonLabel as string | undefined;

        promoSection.content = {
          ...promoSection.content,
          text:
            heading ||
            subheading ||
            (promoSection.content.text as string) ||
            (promoSection.content.heading as string),
          linkText:
            buttonLabel ||
            (promoSection.content.linkText as string) ||
            (promoSection.content.ctaText as string),
        };
      }
    }

    return cloneSections;
  };

  // 1. Define fetchUser
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
          plan: data.user.plan,
        });

        // Check V1 access: Essential, Growth, Enterprise, or SUPER_ADMIN
        const allowedPlans = [
          "ESSENTIAL",
          "GROWTH",
          "ENTERPRISE",
          "SUPER_USER",
        ];
        const isSuperAdmin = data.user.role === "SUPER_ADMIN";
        const hasV1Access =
          isSuperAdmin || allowedPlans.includes(data.user.plan);

        if (!hasV1Access) {
          setAuthError(
            "AI Storefront V1 requires at least an Essential plan. Please upgrade your plan."
          );
          setAuthChecking(false);
          return false;
        }

        setAuthChecking(false);
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

  // 2. Define fetchCompanies (Moved up before usage)
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/companies/my-owned");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      const data = await response.json();
      const ownedCompanies: Company[] = (data.companies || []).slice();

      // Order by oldest company first (createdAt ascending)
      ownedCompanies.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });

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
  }, []);

  // 3. Define fetchSettings
  const fetchSettings = useCallback(async () => {
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

      // Load any previously saved content sections from storeMetadata
      if (data.storeMetadata && Array.isArray(data.storeMetadata.sections)) {
        setThemeSections(data.storeMetadata.sections as ThemeSection[]);
      } else {
        setThemeSections([]);
      }
    } catch (error) {
      console.error("Error fetching storefront settings:", error);
      toast.error("Failed to load storefront settings");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  // 4. Define fetchAiConfig
  const fetchAiConfig = useCallback(async () => {
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
      if (data.spec && typeof data.spec === "object" && data.spec.meta) {
        const meta = data.spec.meta as {
          tone?: "playful" | "serious" | "luxury" | "minimal";
          heroSize?: "compact" | "full";
        };
        if (meta.tone) {
          setAiTone(meta.tone);
        }
        if (meta.heroSize === "compact" || meta.heroSize === "full") {
          setAiHeroSize(meta.heroSize);
        } else {
          setAiHeroSize("inherit");
        }
      }
      if (data.usage) {
        setAiUsageLimit(data.usage.limit ?? null);
        setAiUsageUsed(
          typeof data.usage.used === "number" ? data.usage.used : null
        );
      } else {
        setAiUsageLimit(null);
        setAiUsageUsed(null);
      }
    } catch (error) {
      console.error("Error fetching AI storefront config:", error);
    } finally {
      setAiConfigLoading(false);
    }
  }, [selectedCompanyId]);

  // 5. Define fetchAiPreviewData
  const fetchAiPreviewData = useCallback(async () => {
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
  }, [selectedCompanyId]);

  // 6. Define fetchPosts
  const fetchPosts = useCallback(async () => {
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
  }, [selectedCompanyId]);

  // Effects
  useEffect(() => {
    const init = async () => {
      const authenticated = await fetchUser();
      if (authenticated) {
        await fetchCompanies();
      }
    };
    init();
  }, [fetchUser, fetchCompanies]);

  useEffect(() => {
    if (selectedCompanyId) {
      const company = companies.find((c) => c.id === selectedCompanyId);
      setSelectedCompany(company || null);
      fetchSettings();
      fetchAiConfig();
      fetchAiPreviewData();
    }
  }, [
    selectedCompanyId,
    companies,
    fetchSettings,
    fetchAiConfig,
    fetchAiPreviewData,
  ]);

  const handleSave = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first");
      return;
    }

    setSaving(true);
    try {
      const payload: StorefrontSettings = {
        ...settings,
        storeMetadata: {
          ...(settings.storeMetadata || {}),
          // Persist the current content wizard sections into storeMetadata
          sections: themeSections,
        },
      };

      const response = await fetch(
        `/api/company/storefront?companyId=${selectedCompanyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

  // Show loading state while checking auth
  if (authChecking) {
    return (
      <DashboardLayout user={user}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if user doesn't have access
  if (authError) {
    return (
      <DashboardLayout user={user}>
        <div className="h-screen flex items-center justify-center">
          <Card className="max-w-md p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground mb-4">{authError}</p>
              <Button onClick={() => (window.location.href = "/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
                Choose which company&apos;s storefront you want to configure
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
                        <Building className="h-4 w-4" />
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
          value={activeTab}
          className="space-y-4"
          onValueChange={(value) => {
            setActiveTab(value);
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
              AI Storefront V1
            </TabsTrigger>
            {(user.role === "SUPER_ADMIN" ||
              ["GROWTH", "ENTERPRISE", "SUPER_USER"].includes(
                user.plan?.toUpperCase() || ""
              )) && (
              <TabsTrigger value="ai-v2">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Storefront V2
              </TabsTrigger>
            )}
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
                <div className="space-y-2">
                  <p className="text-sm font-medium">Enable Blogroll</p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    When enabled, your storefront navigation can link to a posts
                    page and you can create posts from the Posts tab.
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
              initialSections={
                themeSections && themeSections.length > 0
                  ? themeSections
                  : undefined
              }
              onContentChange={(sections) => setThemeSections(sections)}
              onSave={handleSave}
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
                      <h3 className="font-semibold text-sm">Existing Posts</h3>
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
                {/* Plan gating in UI */}
                {!planAllowsAiStorefront && (
                  <div className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                    <p className="font-medium mb-1">
                      AI Storefront is available on Growth and Enterprise plans.
                    </p>
                    <p>
                      Upgrade your subscription to let the resident AI design
                      and maintain your storefront automatically.
                    </p>
                  </div>
                )}

                {!selectedCompany && (
                  <p className="text-sm text-muted-foreground">
                    Select a company above to configure its AI storefront.
                  </p>
                )}

                {selectedCompany && planAllowsAiStorefront && (
                  <>
                    <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
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
                      {aiUsageLimit && (
                        <p>
                          AI generations this month:{" "}
                          <span className="font-medium">
                            {aiUsageUsed ?? 0}
                          </span>{" "}
                          {aiUsageLimit === "unlimited" ? (
                            <span className="font-medium">/ unlimited</span>
                          ) : (
                            <>
                              /{" "}
                              <span className="font-medium">
                                {aiUsageLimit}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        {/* Step 1: Brand & Colors */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">
                            Step 1 · Brand & Colors
                          </h3>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
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
                            <div className="space-y-2">
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
                            <div className="space-y-2">
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
                            Leave blank to use defaults. Colors help AI keep the
                            homepage aligned with your brand.
                          </p>
                        </div>

                        {/* Step 2: Layout & Data Toggles */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">
                            Step 2 · Sections & Data
                          </h3>
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
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">
                            Step 3 · Voice & Goal
                          </h3>
                          <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                            <div className="space-y-2">
                              <Label htmlFor="ai-hero-layout">
                                Hero layout
                              </Label>
                              <Select
                                value={aiHeroLayout}
                                onValueChange={(value) =>
                                  setAiHeroLayout(value as "left" | "center")
                                }
                              >
                                <SelectTrigger id="ai-hero-layout">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">
                                    Left aligned
                                  </SelectItem>
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
                          <div className="space-y-2">
                            <Label
                              htmlFor="ai-refine-notes"
                              className="text-xs"
                            >
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

                        {/* Apply Quick Tweaks – refinement endpoint (no full rebuild) */}
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!selectedCompanyId) {
                                toast.error("Please select a company first");
                                return;
                              }
                              if (!aiSpec) {
                                toast.error(
                                  "Generate an AI storefront first, then apply refinements."
                                );
                                return;
                              }
                              setAiRefining(true);
                              try {
                                const response = await fetch(
                                  "/api/ai-storefront/refine",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      companyId: selectedCompanyId,
                                      refineNotes:
                                        aiRefineNotes.trim().length > 0
                                          ? aiRefineNotes.trim()
                                          : undefined,
                                      heroSize:
                                        aiHeroSize === "compact" ||
                                        aiHeroSize === "full"
                                          ? aiHeroSize
                                          : undefined,
                                      tone: aiTone,
                                      emphasis: aiEmphasis,
                                    }),
                                  }
                                );
                                const data = await response.json();

                                if (!response.ok) {
                                  toast.error(
                                    data.error ||
                                      "Failed to refine AI storefront"
                                  );
                                  return;
                                }

                                setAiSpec(data.spec);
                                toast.success(
                                  "AI storefront refined successfully"
                                );
                              } catch (error) {
                                console.error(
                                  "AI storefront refine error:",
                                  error
                                );
                                toast.error("Failed to refine AI storefront");
                              } finally {
                                setAiRefining(false);
                              }
                            }}
                            disabled={
                              aiRefining || !selectedCompanyId || !aiSpec
                            }
                          >
                            {aiRefining ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Applying tweaks...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Apply Quick Tweaks
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="space-y-2 pt-3 mt-4">
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

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-2">
                              <Label htmlFor="ai-hero-size">Hero size</Label>
                              <Select
                                value={aiHeroSize}
                                onValueChange={(value) =>
                                  setAiHeroSize(
                                    value as "inherit" | "compact" | "full"
                                  )
                                }
                              >
                                <SelectTrigger id="ai-hero-size">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">
                                    Use current size
                                  </SelectItem>
                                  <SelectItem value="compact">
                                    Compact hero
                                  </SelectItem>
                                  <SelectItem value="full">
                                    Full-height hero
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ai-emphasis">
                                Section emphasis
                              </Label>
                              <Select
                                value={aiEmphasis}
                                onValueChange={(value) =>
                                  setAiEmphasis(
                                    value as
                                      | "balanced"
                                      | "products"
                                      | "services"
                                      | "testimonials"
                                  )
                                }
                              >
                                <SelectTrigger id="ai-emphasis">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="balanced">
                                    Balanced
                                  </SelectItem>
                                  <SelectItem value="products">
                                    Emphasize products
                                  </SelectItem>
                                  <SelectItem value="services">
                                    Emphasize services
                                  </SelectItem>
                                  <SelectItem value="testimonials">
                                    Emphasize testimonials
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-6">
                          <Button
                            className="text-white font-semibold py-4 px-10"
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
                                toast.error("Failed to generate AI storefront");
                              } finally {
                                setAiGenerating(false);
                              }
                            }}
                            disabled={
                              aiGenerating ||
                              !selectedCompanyId ||
                              (user.role !== "SUPER_ADMIN" &&
                                typeof aiUsageLimit === "number" &&
                                aiUsageUsed !== null &&
                                aiUsageUsed >= aiUsageLimit)
                            }
                          >
                            {aiGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating your AI Storefront...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate & Enable Ai Storefront
                              </>
                            )}
                          </Button>

                          {aiSpec && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!aiSpec) {
                                  toast.error(
                                    "Generate an AI storefront first, then export."
                                  );
                                  return;
                                }
                                const mapped = mapAiSpecToThemeSections(
                                  aiSpec as AiFrontstoreSpec,
                                  settings.storeTheme
                                );
                                if (!mapped) {
                                  toast.error(
                                    "Unable to export AI content for this theme."
                                  );
                                  return;
                                }
                                setThemeSections(mapped);
                                setActiveTab("content");
                                toast.success(
                                  "AI content exported to Content Wizard. You can now edit it there."
                                );
                              }}
                            >
                              Export to Content Wizard
                            </Button>
                          )}

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
                                            aiMeta.backgroundColor ||
                                            aiMeta.primaryColor ||
                                            undefined,
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
                                                  aiMeta.textColor || "#111827",
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
                                                  aiMeta.textColor || "#ffffff",
                                              }
                                            : undefined
                                        }
                                      >
                                        Cart
                                      </Button>
                                    </nav>
                                  </div>
                                </header>
                                {/* Optional promo banner mirror (from Content Wizard / storeMetadata) */}
                                {(() => {
                                  const sections =
                                    (settings.storeMetadata?.sections as
                                      | ThemeSection[]
                                      | undefined) || [];
                                  const promo = sections.find(
                                    (s) =>
                                      s.type === "promo-banner" && s.enabled
                                  );
                                  if (!promo) return null;
                                  return (
                                    <div
                                      className="w-full py-2 px-3 text-center border-b text-xs sm:text-sm"
                                      style={{
                                        background:
                                          promo.styling?.gradient ||
                                          promo.styling?.backgroundColor ||
                                          undefined,
                                        color:
                                          promo.styling?.textColor || undefined,
                                      }}
                                    >
                                      <span className="font-semibold">
                                        {String(promo.content.text || "")}
                                      </span>
                                      {promo.content.link &&
                                        promo.content.linkText && (
                                          <span className="ml-2 underline opacity-90">
                                            {String(promo.content.linkText)}
                                          </span>
                                        )}
                                    </div>
                                  );
                                })()}
                                <AiStorefrontRenderer
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  spec={aiSpec as any}
                                  slug={settings.slug}
                                  companyName={selectedCompany.name}
                                  enableCart={false}
                                  featuredProducts={
                                    Array.isArray(aiPreviewProducts)
                                      ? aiPreviewProducts.map((p) => {
                                          const product = p as FeaturedProduct;
                                          return {
                                            ...product,
                                            description:
                                              typeof product.description ===
                                              "undefined"
                                                ? null
                                                : product.description ?? null,
                                            price:
                                              typeof product.price === "number"
                                                ? product.price
                                                : 0,
                                          };
                                        })
                                      : undefined
                                  }
                                  featuredServices={
                                    Array.isArray(aiPreviewServices)
                                      ? aiPreviewServices.map((s) => {
                                          // Ensure 'price' exists on the service object
                                          const service = {
                                            ...(s as FeaturedService),
                                            price:
                                              typeof (s as FeaturedService)
                                                .price === "number"
                                                ? (s as FeaturedService).price
                                                : 0,
                                          };
                                          return {
                                            id: service.id,
                                            name: service.name,
                                            description:
                                              service.description ?? null,
                                            price: service.price,
                                            image: service.image ?? undefined,
                                          };
                                        })
                                      : undefined
                                  }
                                  featuredTeamMembers={
                                    Array.isArray(aiPreviewTeam)
                                      ? (aiPreviewTeam as FeaturedTeamMember[])
                                      : undefined
                                  }
                                  testimonials={
                                    Array.isArray(aiPreviewTestimonials)
                                      ? (
                                          aiPreviewTestimonials as StorefrontTestimonial[]
                                        ).map((t) => ({
                                          customerName: t.name,
                                          testimonial: t.quote,
                                          company: t.company,
                                          image: t.image,
                                          id: t.id,
                                        }))
                                      : undefined
                                  }
                                  contactEmail={
                                    aiPreviewContactEmail || undefined
                                  }
                                  contactPhone={
                                    aiPreviewContactPhone || undefined
                                  }
                                  heroOverride={(() => {
                                    const sections =
                                      (settings.storeMetadata?.sections as
                                        | ThemeSection[]
                                        | undefined) || [];
                                    const hero = sections.find(
                                      (s) => s.type === "hero" && s.enabled
                                    );
                                    if (!hero || !hero.content) return null;
                                    return {
                                      title:
                                        (hero.content.heading as
                                          | string
                                          | undefined) ||
                                        (hero.content.title as
                                          | string
                                          | undefined),
                                      subtitle:
                                        (hero.content.subheading as
                                          | string
                                          | undefined) ||
                                        (hero.content.subtitle as
                                          | string
                                          | undefined),
                                      description:
                                        (hero.content.description as
                                          | string
                                          | undefined) || undefined,
                                      primaryCTA:
                                        (hero.content.ctaText as
                                          | string
                                          | undefined) ||
                                        (hero.content.primaryCTA as
                                          | string
                                          | undefined),
                                      secondaryCTA:
                                        (hero.content.secondaryCtaText as
                                          | string
                                          | undefined) ||
                                        (hero.content.secondaryCTA as
                                          | string
                                          | undefined),
                                    };
                                  })()}
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

          {/* AI Storefront V2 Tab */}
          <TabsContent value="ai-v2" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Storefront Builder V2
                </CardTitle>
                <CardDescription>
                  Next-generation conversational AI storefront builder with
                  advanced features. Create stunning websites through natural
                  conversation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg border bg-muted/20 overflow-hidden"
                  style={{ height: "calc(100vh - 300px)" }}
                >
                  <iframe
                    src="/dashboard/storefront/v2"
                    className="w-full h-full border-0"
                    title="AI Storefront V2"
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
