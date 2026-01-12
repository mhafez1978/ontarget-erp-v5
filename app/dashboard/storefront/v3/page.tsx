"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Globe,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Zap,
  FileText,
  Palette,
  BarChart3,
  Clock,
  Rocket,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  logo: string | null;
}

interface V3Website {
  version: number;
  generatedAt: string;
  brand: {
    colors: string[];
    fonts: string[];
    tone: string;
    logo?: string;
  };
  pages: Array<{
    slug: string;
    pageName: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
    sections: Array<{
      type: string;
      heading: string;
      subheading?: string;
      content: Record<string, unknown>;
      order: number;
    }>;
    headingHierarchy: string[];
  }>;
  navigation: {
    primary: Array<{ label: string; href: string }>;
  };
}

interface V3WebsiteRecord {
  id: string;
  companyId: string;
  websiteData: V3Website;
  qualityScore: number;
  seoCompliant: boolean;
  accessibilityCompliant: boolean;
  validationWarnings: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export default function V3StorefrontPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [userInstructions, setUserInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [websites, setWebsites] = useState<V3WebsiteRecord[]>([]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/companies/my-all");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        if (data.companies?.length > 0) {
          setSelectedCompanyId(data.companies[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWebsites = useCallback(async () => {
    if (!selectedCompanyId) return;

    try {
      const res = await fetch(
        `/api/storefront/v3/websites?companyId=${selectedCompanyId}`
      );
      if (res.ok) {
        const data = await res.json();
        setWebsites(data.websites || []);
      }
    } catch (error) {
      console.error("Error fetching V3 websites:", error);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchUser();
    fetchCompanies();
  }, [fetchUser, fetchCompanies]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchWebsites();
    }
  }, [selectedCompanyId, fetchWebsites]);

  const handleGenerate = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/storefront/v3/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          userInstructions: userInstructions || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || "Failed to generate website";
        const isRetryable = data.retryable || res.status === 503;

        toast.error(errorMsg, {
          description: isRetryable
            ? "This is a temporary issue. Click Generate again to retry."
            : data.details,
          duration: 6000,
        });
        return;
      }

      toast.success(
        `Website generated successfully! Quality Score: ${data.qualityScore}/100`
      );
      setUserInstructions("");
      await fetchWebsites();
    } catch (error) {
      console.error("Error generating V3 website:", error);
      toast.error("Failed to generate website");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (websiteId: string) => {
    try {
      const res = await fetch(
        `/api/storefront/v3/websites/${websiteId}/publish`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        toast.error("Failed to publish website");
        return;
      }

      toast.success("Website published successfully!");
      await fetchWebsites();
    } catch (error) {
      console.error("Error publishing website:", error);
      toast.error("Failed to publish website");
    }
  };

  const handleDelete = async (websiteId: string) => {
    if (!confirm("Are you sure you want to delete this website version?")) {
      return;
    }

    try {
      const res = await fetch(`/api/storefront/v3/websites/${websiteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete website");
        return;
      }

      toast.success("Website deleted successfully");
      await fetchWebsites();
    } catch (error) {
      console.error("Error deleting website:", error);
      toast.error("Failed to delete website");
    }
  };

  const handleExportToContentWizard = async (websiteId: string) => {
    try {
      const res = await fetch(
        `/api/storefront/v3/websites/${websiteId}/export`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to export website");
      }

      const data = await res.json();

      // Store exported data in sessionStorage for Content Wizard
      sessionStorage.setItem(
        "content-wizard-import",
        JSON.stringify({
          source: "v3",
          sections: data.sections,
          companyData: data.companyData,
          metadata: data.metadata,
        })
      );

      toast.success(
        `Exported ${data.metadata.sectionCount} sections to Content Wizard`
      );

      // Navigate to universal Content Wizard tab
      router.push("/dashboard/storefront?tab=content");
    } catch (error) {
      console.error("Error exporting website:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to export website"
      );
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket className="h-7 w-7 text-primary" />
              </div>
              AI Storefront V3
            </h1>
            <p className="dark:text-gray-200 mt-2 text-lg">
              Professional multi-page websites with AI-powered generation
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              SEO Optimized
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              WCAG 2.1 AA
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        {selectedCompanyId && websites.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {websites.length}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      Total Websites
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {websites.filter((w) => w.isActive).length}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Active
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {Math.round(
                        websites.reduce((acc, w) => acc + w.qualityScore, 0) /
                          websites.length
                      ) || 0}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      Avg Quality
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {websites.reduce(
                        (acc, w) => acc + w.websiteData.pages.length,
                        0
                      )}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      Total Pages
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Company Selection & Generation */}
      <Card className="border-2">
        <CardHeader className="bg-linear-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Generate New Website</CardTitle>
              <CardDescription className="mt-1">
                AI-powered multi-page website with SEO and accessibility
                built-in
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Company
                </Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{company.name}</span>
                          {company.industry && (
                            <Badge variant="outline" className="text-xs">
                              {company.industry}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="instructions"
                  className="text-sm font-semibold flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Custom Instructions
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="E.g., 'Focus on enterprise solutions and case studies' or 'Highlight our eco-friendly practices'"
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  rows={4}
                  disabled={generating}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  What You&apos;ll Get
                </div>
                <ul className="space-y-2 text-sm dark:text-gray-200">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Multi-page website (Home, About, Services, Contact)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    SEO-optimized content with meta tags
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    WCAG 2.1 AA accessibility compliance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Responsive design (mobile-first)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Professional brand colors & typography
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Export to Content Wizard for editing
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedCompanyId}
                className="w-full h-12 text-base"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Your Website...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Website
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Websites */}
      {selectedCompanyId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Globe className="h-5 w-5" />
                </div>
                Generated Websites
                <Badge variant="secondary" className="text-sm">
                  {websites.length}
                </Badge>
              </h2>
              <p className="text-sm dark:text-gray-200 mt-1">
                {selectedCompany?.name} websites
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWebsites}
              disabled={websites.length === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {websites.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Globe className="h-12 w-12 dark:text-gray-200" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">No websites yet</h3>
                <p className="dark:text-gray-200 max-w-md mx-auto">
                  Generate your first AI-powered website using the form above.
                  It only takes a few seconds!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {websites.map((website) => (
                <Card
                  key={website.id}
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    website.isActive ? "border-primary border-2 shadow-md" : ""
                  }`}
                >
                  {website.isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/80 to-primary" />
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl">
                            {website.websiteData.brand.tone
                              .charAt(0)
                              .toUpperCase() +
                              website.websiteData.brand.tone.slice(1)}{" "}
                            Style
                          </CardTitle>
                          {website.isActive ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm dark:text-gray-200">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(website.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {website.websiteData.pages.length} pages
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!selectedCompany?.slug) {
                              toast.error(
                                "Company slug not found. Please set a company slug first."
                              );
                              return;
                            }
                            const previewUrl = `/store/v3/${selectedCompany.slug}/home`;
                            console.log("Opening preview:", previewUrl);
                            window.open(previewUrl, "_blank");
                          }}
                          title="Preview Website"
                          disabled={!selectedCompany?.slug}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleExportToContentWizard(website.id)
                          }
                          title="Export to Content Wizard"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!website.isActive && (
                          <Button
                            size="sm"
                            onClick={() => handlePublish(website.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Publish
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(website.id)}
                          disabled={website.isActive}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quality Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <div className="text-xs font-semibold dark:text-gray-200">
                            Quality Score
                          </div>
                        </div>
                        <div
                          className={`text-3xl font-bold ${getQualityColor(
                            website.qualityScore
                          )}`}
                        >
                          {website.qualityScore}
                        </div>
                        <Progress
                          value={website.qualityScore}
                          className="mt-3 h-2"
                        />
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 dark:text-gray-200" />
                          <div className="text-xs font-semibold dark:text-gray-200">
                            Total Pages
                          </div>
                        </div>
                        <div className="text-3xl font-bold">
                          {website.websiteData.pages.length}
                        </div>
                        <div className="text-xs dark:text-gray-200 mt-1">
                          Multi-page site
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 dark:text-gray-200" />
                          <div className="text-xs font-semibold dark:text-gray-200">
                            SEO Optimized
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {website.seoCompliant ? (
                            <>
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                              <span className="text-lg font-bold text-green-600">
                                Compliant
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-6 w-6 text-red-600" />
                              <span className="text-lg font-bold text-red-600">
                                Issues
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 dark:text-gray-200" />
                          <div className="text-xs font-semibold dark:text-gray-200">
                            Accessibility
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {website.accessibilityCompliant ? (
                            <>
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                              <span className="text-sm font-bold text-green-600">
                                WCAG 2.1 AA
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-6 w-6 text-red-600" />
                              <span className="text-sm font-bold text-red-600">
                                Non-compliant
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Validation Warnings */}
                    {website.validationWarnings &&
                      website.validationWarnings.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-semibold mb-1">
                              Validation Warnings:
                            </div>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {website.validationWarnings.map(
                                (warning, idx) => (
                                  <li key={idx}>{warning}</li>
                                )
                              )}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                    {/* Brand Identity */}
                    <div className="p-4 rounded-lg bg-linear-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Palette className="h-4 w-4 text-purple-600" />
                        Brand Identity
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-xs font-semibold dark:text-gray-200 mb-3 flex items-center gap-1">
                            <div className="w-1 h-4 bg-purple-500 rounded" />
                            Color Palette
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {website.websiteData.brand.colors.map(
                              (color, idx) => (
                                <div key={idx} className="group relative">
                                  <div
                                    className="w-10 h-10 rounded-lg border-2 border-background shadow-sm cursor-pointer transition-transform hover:scale-110"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs bg-black text-white px-2 py-1 rounded whitespace-nowrap">
                                      {color}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold dark:text-gray-200 mb-3 flex items-center gap-1">
                            <div className="w-1 h-4 bg-purple-500 rounded" />
                            Typography
                          </div>
                          <div className="space-y-2">
                            {website.websiteData.brand.fonts.map(
                              (font, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-2 bg-background rounded-md text-sm font-medium border"
                                >
                                  {font}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pages Preview */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        Website Pages
                        <Badge variant="outline">
                          {website.websiteData.pages.length}
                        </Badge>
                      </h3>
                      <div className="grid gap-3">
                        {website.websiteData.pages.map((page, idx) => (
                          <div
                            key={idx}
                            className="group border rounded-lg p-4 bg-linear-to-br from-muted/30 to-muted/10 hover:shadow-md transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-primary">
                                    /{page.slug === "home" ? "" : page.slug}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {page.pageName}
                                  </Badge>
                                </div>
                                <p className="text-xs dark:text-gray-200 line-clamp-2">
                                  {page.seo.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-xs dark:text-gray-200">
                                    Sections
                                  </div>
                                  <div className="text-lg font-bold">
                                    {page.sections.length}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const slug =
                                      selectedCompany?.slug || "preview";
                                    const pageSlug =
                                      page.slug === "home"
                                        ? ""
                                        : `/${page.slug}`;
                                    window.open(
                                      `/store/v3/${slug}${pageSlug}`,
                                      "_blank"
                                    );
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {page.sections
                                .slice(0, 6)
                                .map((section, sIdx) => (
                                  <Badge
                                    key={sIdx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {section.type}
                                  </Badge>
                                ))}
                              {page.sections.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                  +{page.sections.length - 6} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
