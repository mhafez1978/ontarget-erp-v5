"use client";


import { BookOpen, Search, Mail, FileText, Settings, HelpCircle, MessageSquare, Video, Plus, Pencil, Trash2, Copy } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";











;
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StaffAndAbove } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface KBArticle {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  tags: string[];
  slug: string;
  companyId: string | null;
  companyName: string | null;
  authorId: string;
  authorName: string;
  readTimeMinutes: number;
  isGlobal: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface Category {
  name: string;
  count: number;
  icon: React.ReactNode;
}

interface MyCompaniesResponse {
  companies?: {
    id: string;
    name: string;
    isOwner?: boolean;
  }[];
}

interface SupportArticlesResponse {
  articles?: {
    id: string;
    title: string;
    summary?: string | null;
    category?: string | null;
    tags?: string[];
    slug: string;
    companyId?: string | null;
    companyName?: string | null;
    authorId: string;
    authorName: string;
    readTimeMinutes?: number;
    isGlobal?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  }[];
}

export default function SupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Articles");
  const [activeTab, setActiveTab] = useState("kb-articles");
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<
    { id: string; name: string; isOwner?: boolean }[]
  >([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data?.authenticated || data?.user?.role === "GUEST") {
          router.push("/login");
          return;
        }

        setUser(data.user);
        // Fetch companies after auth
        try {
          const companiesRes = await fetch("/api/company/my-companies");
          if (companiesRes.ok) {
            const companiesData: MyCompaniesResponse =
              await companiesRes.json();
            const list: { id: string; name: string; isOwner?: boolean }[] = (
              companiesData.companies || []
            ).map((c) => ({
              id: c.id,
              name: c.name,
              isOwner: c.isOwner,
            }));
            setCompanies(list);
            if (list.length > 0) {
              setSelectedCompanyId(list[0].id);
            }
          }
        } catch (err) {
          console.error("Error fetching companies for support page:", err);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchArticles = async () => {
      try {
        const params = selectedCompanyId
          ? `?companyId=${encodeURIComponent(selectedCompanyId)}`
          : "";
        const response = await fetch(`/api/support/articles${params}`);
        if (!response.ok) {
          console.error("Failed to fetch support articles");
          return;
        }
        const data = await response.json();
        const { articles: apiArticles = [] } =
          (data as SupportArticlesResponse) || {};

        const fetched: KBArticle[] = apiArticles.map((article) => ({
          id: article.id,
          title: article.title,
          summary: article.summary ?? null,
          category: article.category || "Uncategorized",
          tags: Array.isArray(article.tags) ? article.tags : [],
          slug: article.slug,
          companyId: article.companyId ?? null,
          companyName: article.companyName ?? null,
          authorId: article.authorId,
          authorName: article.authorName,
          readTimeMinutes: article.readTimeMinutes ?? 5,
          isGlobal: !!article.isGlobal,
          canEdit: !!article.canEdit,
          canDelete: !!article.canDelete,
        }));
        setArticles(fetched);

        const categoryMap: Record<string, number> = {};
        fetched.forEach((article) => {
          const cat = article.category || "Uncategorized";
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        const categoryList: Category[] = [
          {
            name: "All Articles",
            count: fetched.length,
            icon: <BookOpen className="h-4 w-4" />,
          },
          ...Object.entries(categoryMap).map(([name, count]) => {
            let icon: React.ReactNode = <BookOpen className="h-4 w-4" />;
            if (name === "Email Configuration") {
              icon = <Mail className="h-4 w-4" />;
            } else if (name === "Getting Started") {
              icon = <FileText className="h-4 w-4" />;
            } else if (name === "Settings & Permissions") {
              icon = <Settings className="h-4 w-4" />;
            }
            return { name, count, icon };
          }),
        ];
        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching support articles:", error);
      }
    };

    fetchArticles();
  }, [user, selectedCompanyId]);

  // Handler for add button based on active tab
  const handleAddClick = () => {
    switch (activeTab) {
      case "kb-articles":
        (async () => {
          try {
            // const res = await fetch("/api/support/articles", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({
            //     title: "Untitled article",
            //     summary: "",
            //     category: "Getting Started",
            //     tags: [],
            //     content: "",
            //     companyId: selectedCompanyId || undefined,
            //   }),
            // });

            const res = await fetch("/api/support/articles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                // Add a timestamp to ensure the slug is unique every time
                title: `KB Article - ${new Date().toLocaleTimeString()}`,
                summary: "",
                category: "New KB Article,...",
                tags: [],
                content: "Content goes here, ...",
                companyId: selectedCompanyId || undefined,
              }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              console.error("Failed to create article:", data);
              return;
            }
            const created = data.article;
            if (created) {
              router.push(`/dashboard/support/${created.slug}?mode=edit`);
            }
          } catch (error) {
            console.error("Error creating article:", error);
          }
        })();
        break;
      case "video-tutorials":
        alert("Add Video Tutorial functionality will be implemented here");
        // TODO: Open add video tutorial dialog/sheet
        break;
      case "faq":
        alert("Add FAQ functionality will be implemented here");
        // TODO: Open add FAQ dialog/sheet
        break;
      default:
        break;
    }
  };

  // Get button text based on active tab
  const getAddButtonText = () => {
    switch (activeTab) {
      case "kb-articles":
        return "Add KB Article";
      case "video-tutorials":
        return "Add Video Tutorial";
      case "faq":
        return "Add FAQ";
      default:
        return "Add";
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.summary || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All Articles" ||
      article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Show loading state while checking authentication
  if (loading) {
    return (
      <DashboardLayout user={user || undefined}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Require authenticated users (all roles except GUEST)
  return (
    <StaffAndAbove>
      <DashboardLayout user={user || undefined}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Support</h1>
              <p className="text-muted-foreground mt-2">
                Find guides, tutorials, and answers to common questions
              </p>
            </div>
            <div className="flex items-center gap-3">
              {companies.length > 0 && (
                <div className="flex flex-col text-right justify-center">
                  <select
                    className="mt-1 border rounded py-3 px-2 text-sm bg-background"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.isOwner ? " (Owner)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Add Button - Shows for KB Articles, Video Tutorials, and FAQ tabs */}
              {activeTab !== "contact" && (
                <Button onClick={handleAddClick} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  {getAddButtonText()}
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            defaultValue="kb-articles"
            className="space-y-6"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="kb-articles" className="gap-2">
                <BookOpen className="h-4 w-4" />
                KB Articles
              </TabsTrigger>
              <TabsTrigger value="video-tutorials" className="gap-2">
                <Video className="h-4 w-4" />
                Video Tutorials
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-2">
                <Mail className="h-4 w-4" />
                Contact Support
              </TabsTrigger>
            </TabsList>

            {/* KB Articles Tab */}
            <TabsContent value="kb-articles" className="space-y-6">
              {/* Search Bar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles, guides, and tutorials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="bg-yellow-200/60 font-semibold">
                    <CardHeader>
                      <CardTitle className="text-lg font-black">
                        Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          onClick={() => setSelectedCategory(category.name)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            selectedCategory === category.name
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {category.icon}
                            <span className="text-sm font-medium">
                              {category.name}
                            </span>
                          </div>
                          <Badge
                            variant={
                              selectedCategory === category.name
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs font-black border-2 border-black bg-emerald-500/20 text-emerald-800"
                          >
                            {category.count}
                          </Badge>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Links */}
                  <Card className="mt-4 bg-pink-50/50 font-semibold">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Need More Help?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <a
                        href="mailto:support@ontarget-erp.com"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Email Support</span>
                      </a>
                      <a
                        href="#"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span>Submit a Ticket</span>
                      </a>
                    </CardContent>
                  </Card>
                </div>

                {/* Articles Grid */}
                <div className="lg:col-span-3 font-semibold space-y-4">
                  {filteredArticles.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          No articles found
                        </h3>
                        <p className="text-sm text-muted-foreground text-center">
                          Try adjusting your search or browse different
                          categories
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6 grid-cols-1">
                      {filteredArticles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/dashboard/support/${article.slug}`}
                        >
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-emerald-50/50">
                            <CardHeader>
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-lg hover:text-primary transition-colors">
                                        {article.title}
                                      </CardTitle>
                                      {article.summary && (
                                        <CardDescription className="mt-2">
                                          {article.summary}
                                        </CardDescription>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {article.canEdit && (
                                        <>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              router.push(
                                                `/dashboard/support/${article.slug}?mode=edit`
                                              );
                                            }}
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" // Added generic styling for delete indication
                                            onClick={(e) => {
                                              e.preventDefault();

                                              // Trigger the confirmation toast
                                              toast("Delete this article?", {
                                                description:
                                                  "This action cannot be undone.",
                                                action: {
                                                  label: "Delete",
                                                  // The actual delete logic moves here
                                                  onClick: async () => {
                                                    try {
                                                      const res = await fetch(
                                                        `/api/support/articles/${article.id}`,
                                                        { method: "DELETE" }
                                                      );

                                                      if (!res.ok) {
                                                        const data = await res
                                                          .json()
                                                          .catch(() => null);
                                                        console.error(
                                                          "Delete error:",
                                                          data
                                                        );
                                                        toast.error(
                                                          "Failed to delete article"
                                                        );
                                                        return;
                                                      }

                                                      // Update UI on success
                                                      setArticles((prev) =>
                                                        prev.filter(
                                                          (a) =>
                                                            a.id !== article.id
                                                        )
                                                      );
                                                      toast.success(
                                                        "Article deleted successfully"
                                                      );
                                                    } catch (err) {
                                                      console.error(
                                                        "Delete failed:",
                                                        err
                                                      );
                                                      toast.error(
                                                        "Something went wrong"
                                                      );
                                                    }
                                                  },
                                                },
                                                cancel: {
                                                  label: "Cancel",
                                                  onClick: () => {},
                                                },
                                                duration: 5000, // Give user time to decide
                                              });
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={async (e) => {
                                              e.preventDefault();
                                              try {
                                                const detailsRes = await fetch(
                                                  `/api/support/articles/by-slug?slug=${encodeURIComponent(
                                                    article.slug
                                                  )}`
                                                );
                                                const details = await detailsRes
                                                  .json()
                                                  .catch(() => null);
                                                if (!detailsRes.ok) {
                                                  console.error(
                                                    "Failed to load article for clone:",
                                                    details
                                                  );
                                                  return;
                                                }
                                                const original =
                                                  details.article;

                                                const res = await fetch(
                                                  "/api/support/articles",
                                                  {
                                                    method: "POST",
                                                    headers: {
                                                      "Content-Type":
                                                        "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                      title: `${article.title} (Copy)`,
                                                      summary: article.summary,
                                                      category:
                                                        article.category,
                                                      tags: article.tags,
                                                      content: original.content,
                                                      isGlobal:
                                                        article.isGlobal,
                                                      companyId:
                                                        article.companyId ??
                                                        undefined,
                                                      readTimeMinutes:
                                                        article.readTimeMinutes,
                                                    }),
                                                  }
                                                );
                                                const data = await res
                                                  .json()
                                                  .catch(() => null);
                                                if (!res.ok) {
                                                  console.error(
                                                    "Clone error:",
                                                    data
                                                  );
                                                  return;
                                                }
                                                const cloned = data.article;
                                                if (cloned) {
                                                  setArticles((prev) => [
                                                    {
                                                      id: cloned.id,
                                                      title: cloned.title,
                                                      summary:
                                                        cloned.summary ?? null,
                                                      category:
                                                        cloned.category ||
                                                        "Uncategorized",
                                                      tags: Array.isArray(
                                                        cloned.tags
                                                      )
                                                        ? cloned.tags
                                                        : [],
                                                      slug: cloned.slug,
                                                      companyId:
                                                        cloned.companyId ??
                                                        null,
                                                      companyName: null,
                                                      authorId: cloned.authorId,
                                                      authorName:
                                                        article.authorName,
                                                      readTimeMinutes:
                                                        cloned.readTimeMinutes ??
                                                        5,
                                                      isGlobal:
                                                        !!cloned.isGlobal,
                                                      canEdit: true,
                                                      canDelete: true,
                                                    },
                                                    ...prev,
                                                  ]);
                                                }
                                              } catch (err) {
                                                console.error(
                                                  "Clone failed:",
                                                  err
                                                );
                                              }
                                            }}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-3">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {article.category}
                                    </Badge>
                                    {article.tags.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Video Tutorials Tab */}
            <TabsContent value="video-tutorials">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Video className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Video tutorials will be available here soon. Check back
                    later for step-by-step video guides.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Frequently asked questions will be available here soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Support Tab */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>
                    Get in touch with our support team for assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <Mail className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Email Support</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Send us an email and we&apos;ll respond within 24
                          hours
                        </p>
                        <a
                          href="mailto:support@ontarget-erp.com"
                          className="text-sm text-primary hover:underline"
                        >
                          support@ontarget-erp.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <HelpCircle className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Help Center</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Browse our knowledge base for instant answers
                        </p>
                        <button
                          onClick={() =>
                            document
                              .querySelector('[value="kb-articles"]')
                              ?.dispatchEvent(
                                new MouseEvent("click", { bubbles: true })
                              )
                          }
                          className="text-sm text-primary hover:underline"
                        >
                          Browse KB Articles
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </StaffAndAbove>
  );
}
