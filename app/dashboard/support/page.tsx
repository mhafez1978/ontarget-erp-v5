"use client";

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
import {
  BookOpen,
  Search,
  Mail,
  FileText,
  Settings,
  HelpCircle,
  MessageSquare,
  Video,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StaffAndAbove } from "@/components/role-guard";
import { Button } from "@/components/ui/button";

interface KBArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  icon: React.ReactNode;
  slug: string;
}

const articles: KBArticle[] = [
  {
    id: "1",
    title: "How to Connect Google OAuth 2.0 Advanced",
    description:
      "Complete step-by-step guide to configure Google OAuth 2.0 for Gmail API email sending",
    category: "Email Configuration",
    tags: ["Gmail", "OAuth", "Email", "Setup"],
    icon: <Mail className="h-5 w-5" />,
    slug: "google-oauth-setup",
  },
  // Add more articles here in the future
];

const categories = [
  {
    name: "All Articles",
    count: articles.length,
    icon: <BookOpen className="h-4 w-4" />,
  },
  { name: "Email Configuration", count: 1, icon: <Mail className="h-4 w-4" /> },
  { name: "Getting Started", count: 0, icon: <FileText className="h-4 w-4" /> },
  {
    name: "Settings & Permissions",
    count: 0,
    icon: <Settings className="h-4 w-4" />,
  },
];

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
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handler for add button based on active tab
  const handleAddClick = () => {
    switch (activeTab) {
      case "kb-articles":
        alert("Add KB Article functionality will be implemented here");
        // TODO: Open add KB article dialog/sheet
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
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <h1 className="text-3xl font-bold tracking-tight">
                Support & Knowledge Base
              </h1>
              <p className="text-muted-foreground mt-2">
                Find guides, tutorials, and answers to common questions
              </p>
            </div>
            {/* Add Button - Shows for KB Articles, Video Tutorials, and FAQ tabs */}
            {activeTab !== "contact" && (
              <Button onClick={handleAddClick} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                {getAddButtonText()}
              </Button>
            )}
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
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
                            className="text-xs"
                          >
                            {category.count}
                          </Badge>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Links */}
                  <Card className="mt-4">
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
                <div className="lg:col-span-3">
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
                    <div className="space-y-4">
                      {filteredArticles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/dashboard/support/${article.slug}`}
                        >
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader>
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                  {article.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-lg hover:text-primary transition-colors">
                                        {article.title}
                                      </CardTitle>
                                      <CardDescription className="mt-2">
                                        {article.description}
                                      </CardDescription>
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
