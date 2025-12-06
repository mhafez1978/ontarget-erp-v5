"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Wand2, Eye, EyeOff, Sparkles } from "lucide-react";
import { defaultThemes, ThemeSection } from "@/lib/storefront-themes";
import { cn } from "@/lib/utils";

interface ContentWizardProps {
  themeId: string;
  companyData?: {
    name: string;
    slogan?: string;
    description?: string;
    logo?: string;
    email?: string;
    salesEmail?: string;
    supportEmail?: string;
    phone?: string;
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  initialSections?: ThemeSection[];
  onContentChange: (sections: ThemeSection[]) => void;
  onSave?: () => void;
}

export function ContentWizard({
  themeId,
  companyData,
  initialSections,
  onContentChange,
  onSave,
}: ContentWizardProps) {
  const [currentThemeId, setCurrentThemeId] = useState(themeId);
  const theme = useMemo(
    () => defaultThemes.find((t) => t.id === currentThemeId),
    [currentThemeId]
  );
  const [sections, setSections] = useState<ThemeSection[]>(() => {
    const initialTheme = defaultThemes.find((t) => t.id === themeId);
    return initialTheme?.sections || [];
  });
  const [selectedSection, setSelectedSection] = useState<string>(() => {
    const initialTheme = defaultThemes.find((t) => t.id === themeId);
    return initialTheme?.sections[0]?.id || "";
  });

  // Track whether we've already applied initialSections to avoid loops
  const hasAppliedInitialSectionsRef = useRef(false);

  // Update when theme changes
  if (themeId !== currentThemeId) {
    setCurrentThemeId(themeId);
    const newTheme = defaultThemes.find((t) => t.id === themeId);
    if (newTheme) {
      setSections(newTheme.sections);
      setSelectedSection(newTheme.sections[0]?.id || "");
    }
  }

  useEffect(() => {
    onContentChange(sections);
    // We intentionally omit onContentChange from dependencies because callers
    // often pass an inline callback, which would cause this effect to fire on
    // every parent render and create an update loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Apply externally provided initial sections (e.g. from AI export)
  useEffect(() => {
    if (
      !hasAppliedInitialSectionsRef.current &&
      initialSections &&
      initialSections.length > 0
    ) {
      setSections(initialSections);
      setSelectedSection(initialSections[0]?.id || "");
      hasAppliedInitialSectionsRef.current = true;
    }
  }, [initialSections]);

  // Initialize sections with company data on mount
  useEffect(() => {
    if (companyData && sections.length > 0) {
      setSections((prev) =>
        prev.map((section) => {
          const updated = { ...section };

          // Populate Hero section
          if (section.type === "hero") {
            updated.content = {
              ...section.content,
              heading: companyData.slogan || section.content.heading,
              subheading: companyData.name || section.content.subheading,
              description:
                companyData.description || section.content.description,
            };
          }

          // Populate About section
          if (section.type === "about") {
            updated.content = {
              ...section.content,
              heading: `About ${companyData.name}`,
              description:
                companyData.description || section.content.description,
            };
          }

          // Populate Contact section
          if (section.type === "contact") {
            // Build full address from company data
            const addressParts = [
              companyData.addressLine1,
              companyData.addressLine2,
              companyData.city,
              companyData.state,
              companyData.country,
              companyData.postalCode,
            ].filter(Boolean);
            const fullAddress = addressParts.join(", ");

            updated.content = {
              ...section.content,
              heading: "Contact Us",
              description: `Get in touch with ${companyData.name}`,
              email: companyData.email || section.content.email,
              salesEmail: companyData.salesEmail || section.content.salesEmail,
              supportEmail:
                companyData.supportEmail || section.content.supportEmail,
              phone: companyData.phone || section.content.phone,
              address: fullAddress || section.content.address,
            };
          }

          // Populate Footer section
          if (section.type === "footer") {
            updated.content = {
              ...section.content,
              description:
                companyData.description ||
                "Your trusted partner for quality products and services",
            };
          }

          return updated;
        })
      );
    }
    // Only run on mount when companyData is available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyData?.name]); // Only trigger when company name changes (initial load)

  const updateSectionContent = (
    sectionId: string,
    key: string,
    value: string | boolean
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              content: {
                ...section.content,
                [key]: value,
              },
            }
          : section
      )
    );
  };

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled }
          : section
      )
    );
  };

  const autoPopulateFromCompany = (sectionId: string) => {
    if (!companyData) return;

    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId && section.type === "hero") {
          return {
            ...section,
            content: {
              ...section.content,
              heading: companyData.slogan || section.content.heading,
              description:
                companyData.description || section.content.description,
            },
          };
        }
        return section;
      })
    );
  };

  // Use first theme as fallback if no theme is selected (all themes have same sections anyway)
  const activeTheme = theme || defaultThemes[0];
  const activeSections =
    sections.length > 0 ? sections : activeTheme?.sections || [];

  const currentSection = activeSections.find((s) => s.id === selectedSection);

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "hero":
        return "🎯";
      case "social-proof":
        return "⭐";
      case "featured-products":
        return "📦";
      case "featured-services":
        return "🔧";
      case "about":
        return "ℹ️";
      case "contact":
        return "📞";
      case "footer":
        return "🦶";
      case "features":
        return "✨";
      case "products":
        return "📦";
      case "services":
        return "🔧";
      case "team":
        return "👥";
      case "testimonials":
        return "💬";
      case "cta":
        return "📢";
      default:
        return "📄";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-linear-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Content Wizard
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your storefront content for the {activeTheme.name}{" "}
                theme
              </p>
            </div>
            {companyData && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => autoPopulateFromCompany(selectedSection)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Auto-fill from Company
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Navigator */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {activeSections.map((section) => (
          <Card
            key={section.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedSection === section.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:border-primary/50",
              !section.enabled && "opacity-50"
            )}
            onClick={() => setSelectedSection(section.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">
                {getSectionIcon(section.type)}
              </div>
              <div className="text-xs font-medium capitalize">
                {section.type}
              </div>
              <div className="mt-2">
                {section.enabled ? (
                  <Eye className="h-3 w-3 mx-auto text-green-500" />
                ) : (
                  <EyeOff className="h-3 w-3 mx-auto text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Editor */}
      {currentSection && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 capitalize">
                  <span className="text-2xl">
                    {getSectionIcon(currentSection.type)}
                  </span>
                  {currentSection.type} Section
                </CardTitle>
                <CardDescription>
                  Edit the content for this section
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Label
                  htmlFor={`toggle-${currentSection.id}`}
                  className="text-sm"
                >
                  {currentSection.enabled ? "Enabled" : "Disabled"}
                </Label>
                <Switch
                  id={`toggle-${currentSection.id}`}
                  checked={currentSection.enabled}
                  onCheckedChange={() => toggleSection(currentSection.id)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hero Section Fields */}
            {currentSection.type === "hero" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Main Heading</Label>
                  <Input
                    id="heading"
                    value={currentSection.content.heading as string}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      )
                    }
                    placeholder="Your powerful headline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subheading">Subheading</Label>
                  <Input
                    id="subheading"
                    value={currentSection.content.subheading as string}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "subheading",
                        e.target.value
                      )
                    }
                    placeholder="Supporting text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentSection.content.description as string}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Compelling description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ctaText">Primary Button Text</Label>
                    <Input
                      id="ctaText"
                      value={currentSection.content.ctaText as string}
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "ctaText",
                          e.target.value
                        )
                      }
                      placeholder="Get Started"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ctaLink">Primary Button Link</Label>
                    <Input
                      id="ctaLink"
                      value={currentSection.content.ctaLink as string}
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "ctaLink",
                          e.target.value
                        )
                      }
                      placeholder="#products"
                    />
                  </div>
                </div>

                {currentSection.content.secondaryCtaText !== undefined && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryCtaText">
                        Secondary Button Text
                      </Label>
                      <Input
                        id="secondaryCtaText"
                        value={
                          currentSection.content.secondaryCtaText as string
                        }
                        onChange={(e) =>
                          updateSectionContent(
                            currentSection.id,
                            "secondaryCtaText",
                            e.target.value
                          )
                        }
                        placeholder="Learn More"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryCtaLink">
                        Secondary Button Link
                      </Label>
                      <Input
                        id="secondaryCtaLink"
                        value={
                          currentSection.content.secondaryCtaLink as string
                        }
                        onChange={(e) =>
                          updateSectionContent(
                            currentSection.id,
                            "secondaryCtaLink",
                            e.target.value
                          )
                        }
                        placeholder="#about"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Promo Banner Section */}
            {currentSection.type === "promo-banner" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="promo-text">Banner Text</Label>
                  <Textarea
                    id="promo-text"
                    value={(currentSection.content.text as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "text",
                        e.target.value
                      )
                    }
                    placeholder="🔥 BLACK FRIDAY: UP TO 70% OFF + FREE SHIPPING | ENDS IN:"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="promo-link-text">
                      Button Text (optional)
                    </Label>
                    <Input
                      id="promo-link-text"
                      value={(currentSection.content.linkText as string) || ""}
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "linkText",
                          e.target.value
                        )
                      }
                      placeholder="Shop Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promo-link">Button Link (optional)</Label>
                    <Input
                      id="promo-link"
                      value={(currentSection.content.link as string) || ""}
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "link",
                          e.target.value
                        )
                      }
                      placeholder="#products"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Stats Section */}
            {currentSection.type === "stats" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Section Heading</Label>
                  <Input
                    id="heading"
                    value={
                      (currentSection.content.heading as string) ||
                      (currentSection.content.title as string) ||
                      ""
                    }
                    onChange={(e) => {
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      );
                      // Keep legacy title in sync for renderer
                      updateSectionContent(
                        currentSection.id,
                        "title",
                        e.target.value
                      );
                    }}
                    placeholder="Trusted by Thousands"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Short intro above your stats"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Social Proof Section */}
            {currentSection.type === "social-proof" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Section Heading</Label>
                  <Input
                    id="heading"
                    value={(currentSection.content.heading as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      )
                    }
                    placeholder="Trusted by Thousands"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Join our growing community"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ctaText">CTA Button Text</Label>
                    <Input
                      id="ctaText"
                      value={
                        (currentSection.content.ctaText as string) ||
                        "Share your experience"
                      }
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "ctaText",
                          e.target.value
                        )
                      }
                      placeholder="Share your experience"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ctaLink">CTA Link (optional)</Label>
                    <Input
                      id="ctaLink"
                      value={
                        (currentSection.content.ctaLink as string) ||
                        "#testimonials"
                      }
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "ctaLink",
                          e.target.value
                        )
                      }
                      placeholder="#testimonials"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                  <div className="text-sm font-medium">
                    Stats & Testimonials
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stats and testimonials can be customized in the advanced
                    editor (coming soon)
                  </div>
                </div>
              </>
            )}

            {/* Featured Products Section */}
            {currentSection.type === "featured-products" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Section Heading</Label>
                  <Input
                    id="heading"
                    value={(currentSection.content.heading as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      )
                    }
                    placeholder="Featured Products"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Explore our most popular offerings"
                    rows={2}
                  />
                </div>

                <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-950/20 space-y-2">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Auto-populated from Product Catalog
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-500">
                    Shows products marked as &quot;Featured&quot; in your
                    catalog
                  </div>
                </div>
              </>
            )}

            {/* Featured Services Section */}
            {currentSection.type === "featured-services" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Section Heading</Label>
                  <Input
                    id="heading"
                    value={(currentSection.content.heading as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      )
                    }
                    placeholder="Featured Services"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Discover our premium services"
                    rows={2}
                  />
                </div>

                <div className="p-4 border rounded-md bg-purple-50 dark:bg-purple-950/20 space-y-2">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    Auto-populated from Service Catalog
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-500">
                    Shows services marked as &quot;Featured&quot; in your
                    catalog
                  </div>
                </div>
              </>
            )}

            {/* About Section */}
            {currentSection.type === "about" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Section Heading</Label>
                  <Input
                    id="heading"
                    value={(currentSection.content.heading as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      )
                    }
                    placeholder="About Us"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Tell your company story"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={(currentSection.content.content as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "content",
                        e.target.value
                      )
                    }
                    placeholder="Detailed company information"
                    rows={6}
                  />
                </div>

                {/* FAQ items for About section (optional) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">FAQ Items (optional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Use this area to manage common questions and answers
                        about your business.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSections((prev) =>
                          prev.map((section) => {
                            if (section.id !== currentSection.id) {
                              return section;
                            }
                            const rawItems = Array.isArray(
                              section.content.faqItems
                            )
                              ? [
                                  ...(section.content.faqItems as Array<
                                    Record<string, unknown>
                                  >),
                                ]
                              : [];
                            rawItems.push({
                              question: "",
                              answer: "",
                            });
                            return {
                              ...section,
                              content: {
                                ...section.content,
                                faqItems: rawItems,
                              },
                            };
                          })
                        );
                      }}
                    >
                      Add question
                    </Button>
                  </div>

                  {Array.isArray(currentSection.content.faqItems) &&
                    (
                      currentSection.content.faqItems as Array<
                        Record<string, unknown>
                      >
                    ).length > 0 && (
                      <div className="space-y-3">
                        {(
                          currentSection.content.faqItems as Array<
                            Record<string, unknown>
                          >
                        ).map((item, index) => {
                          const question =
                            typeof item.question === "string"
                              ? item.question
                              : "";
                          const answer =
                            typeof item.answer === "string" ? item.answer : "";
                          return (
                            <div
                              key={index}
                              className="border rounded-md p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Q{index + 1}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-muted-foreground"
                                  onClick={() => {
                                    setSections((prev) =>
                                      prev.map((section) => {
                                        if (section.id !== currentSection.id) {
                                          return section;
                                        }
                                        const rawItems = Array.isArray(
                                          section.content.faqItems
                                        )
                                          ? [
                                              ...(section.content
                                                .faqItems as Array<
                                                Record<string, unknown>
                                              >),
                                            ]
                                          : [];
                                        rawItems.splice(index, 1);
                                        return {
                                          ...section,
                                          content: {
                                            ...section.content,
                                            faqItems: rawItems,
                                          },
                                        };
                                      })
                                    );
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Question</Label>
                                <Input
                                  value={question}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSections((prev) =>
                                      prev.map((section) => {
                                        if (section.id !== currentSection.id) {
                                          return section;
                                        }
                                        const rawItems = Array.isArray(
                                          section.content.faqItems
                                        )
                                          ? [
                                              ...(section.content
                                                .faqItems as Array<
                                                Record<string, unknown>
                                              >),
                                            ]
                                          : [];
                                        const existing =
                                          rawItems[index] &&
                                          typeof rawItems[index] === "object"
                                            ? (rawItems[index] as Record<
                                                string,
                                                unknown
                                              >)
                                            : {};
                                        rawItems[index] = {
                                          ...existing,
                                          question: value,
                                        };
                                        return {
                                          ...section,
                                          content: {
                                            ...section.content,
                                            faqItems: rawItems,
                                          },
                                        };
                                      })
                                    );
                                  }}
                                  placeholder="What services do you offer?"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Answer</Label>
                                <Textarea
                                  value={answer}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSections((prev) =>
                                      prev.map((section) => {
                                        if (section.id !== currentSection.id) {
                                          return section;
                                        }
                                        const rawItems = Array.isArray(
                                          section.content.faqItems
                                        )
                                          ? [
                                              ...(section.content
                                                .faqItems as Array<
                                                Record<string, unknown>
                                              >),
                                            ]
                                          : [];
                                        const existing =
                                          rawItems[index] &&
                                          typeof rawItems[index] === "object"
                                            ? (rawItems[index] as Record<
                                                string,
                                                unknown
                                              >)
                                            : {};
                                        rawItems[index] = {
                                          ...existing,
                                          answer: value,
                                        };
                                        return {
                                          ...section,
                                          content: {
                                            ...section.content,
                                            faqItems: rawItems,
                                          },
                                        };
                                      })
                                    );
                                  }}
                                  placeholder="We specialize in..."
                                  rows={3}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </>
            )}

            {/* Team Section */}
            {currentSection.type === "team" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Section Heading</Label>
                  <Input
                    id="heading"
                    value={(currentSection.content.heading as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      )
                    }
                    placeholder="Meet the Team"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="A short description of your team"
                    rows={2}
                  />
                </div>

                <div className="p-4 border rounded-md bg-muted/50 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Individual team members are auto-populated from your
                    company&apos;s featured staff. Edit those in the Teams &amp;
                    Workforce area.
                  </div>
                </div>
              </>
            )}

            {/* Contact Section */}
            {currentSection.type === "contact" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heading">Section Heading</Label>
                  <Input
                    id="heading"
                    value={(currentSection.content.heading as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "heading",
                        e.target.value
                      )
                    }
                    placeholder="Contact Us"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Get in touch with our team"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">General Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={(currentSection.content.email as string) || ""}
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "email",
                          e.target.value
                        )
                      }
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={(currentSection.content.phone as string) || ""}
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "phone",
                          e.target.value
                        )
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salesEmail">Sales Email</Label>
                    <Input
                      id="salesEmail"
                      type="email"
                      value={
                        (currentSection.content.salesEmail as string) || ""
                      }
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "salesEmail",
                          e.target.value
                        )
                      }
                      placeholder="sales@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={
                        (currentSection.content.supportEmail as string) || ""
                      }
                      onChange={(e) =>
                        updateSectionContent(
                          currentSection.id,
                          "supportEmail",
                          e.target.value
                        )
                      }
                      placeholder="support@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={(currentSection.content.address as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "address",
                        e.target.value
                      )
                    }
                    placeholder="123 Business St, Suite 100"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Footer Section */}
            {currentSection.type === "footer" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Footer Description</Label>
                  <Textarea
                    id="description"
                    value={(currentSection.content.description as string) || ""}
                    onChange={(e) =>
                      updateSectionContent(
                        currentSection.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Your trusted partner for quality products and services"
                    rows={2}
                  />
                </div>

                <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                  <div className="text-sm font-medium">
                    Social Links & Quick Links
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Social media links and footer navigation can be customized
                    in advanced settings
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {onSave && (
        <div className="flex justify-end">
          <Button size="sm" onClick={onSave}>
            Save Storefront
          </Button>
        </div>
      )}
    </div>
  );
}
