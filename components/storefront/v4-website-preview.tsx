"use client";

import { useState } from "react";
import {
  Eye,
  Monitor,
  Smartphone,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface V4Component {
  type?: string;
  name?: string;
  code?: string;
  componentCode?: string;
  html?: string;
  metadata?: {
    name?: string;
    description?: string;
  };
}

export interface V4WebsiteData {
  chatWidgetHtml?: string | null;
  chatWidgetConfig?: {
    position?: "bottom-right" | "bottom-left";
    primaryColor?: string;
    theme?: "light" | "dark";
    initialOpen?: boolean;
    mountId?: string;
  } | null;
  designSystem: {
    colors: { [key: string]: string };
    typography: {
      headingFont: string;
      bodyFont: string;
      heading?: string;
      body?: string;
    };
  };
  pages: Array<{
    path: string;
    title: string;
    name?: string;
    description?: string;
    components: V4Component[];
    metadata?: {
      ogTitle?: string;
      ogDescription?: string;
      keywords?: string[];
    };
    seo?: {
      description?: string;
    };
  }>;
  accessibility: {
    wcagLevel: string;
    features: string[];
    colorContrastAA?: boolean;
    keyboardNavigable?: boolean;
    ariaLabelsComplete?: boolean;
  };
}

interface V4WebsitePreviewProps {
  websiteData: V4WebsiteData;
  qualityScore: number;
  creativityScore: number;
  onExport?: () => void;
  onPublish?: () => void;
}

export function V4WebsitePreview({
  websiteData,
  qualityScore,
  creativityScore,
  onExport,
  onPublish,
}: V4WebsitePreviewProps) {
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      onExport?.();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      onPublish?.();
    } finally {
      setIsPublishing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  // Generate inline CSS for design system
  const generateDesignSystemCSS = () => {
    if (!websiteData?.designSystem) return "";

    const { colors, typography } = websiteData.designSystem;

    return `
      .website-preview {
        font-family: ${typography?.bodyFont || "system-ui"};
      }
      .website-preview h1, .website-preview h2, .website-preview h3, 
      .website-preview h4, .website-preview h5, .website-preview h6 {
        font-family: ${
          typography?.headingFont || typography?.bodyFont || "system-ui"
        };
      }
      ${
        colors
          ? Object.entries(colors)
              .map(
                ([name, value]) => `
        .website-preview .bg-${name} { background-color: ${value}; }
        .website-preview .text-${name} { color: ${value}; }
        .website-preview .border-${name} { border-color: ${value}; }
      `
              )
              .join("\n")
          : ""
      }
    `;
  };

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: generateDesignSystemCSS() }} />

      {/* Inject any site-wide snippets such as chat widget */}
      {websiteData.chatWidgetHtml ? (
        <div
          className="sr-only"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: websiteData.chatWidgetHtml }}
        />
      ) : null}

      {/* Mount modular ChatWidget in preview when available */}
      {websiteData.chatWidgetConfig ? (
        <div className="relative">
          {/* Mount inside preview container to avoid global window-fixed position in admin preview */}
          {/* @ts-ignore - dynamic import not necessary here */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Import/Render the widget client-side */}
            {/* This intentionally renders inside the preview so it visually matches the generated site */}
            <div className="pointer-events-auto">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {/* eslint-disable-next-line react/no-unknown-property */}
              {typeof window !== "undefined"
                ? // Dynamic require to avoid server-side import
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  (() => {
                    const {
                      ChatWidget,
                    } = require("@/components/storefront/chat-widget");
                    // eslint-disable-next-line react/jsx-no-constructed-context-values
                    return (
                      // @ts-ignore - TS can't statically verify dynamic require return
                      <ChatWidget
                        companySlug={"preview"}
                        companyName={"Preview"}
                        config={websiteData.chatWidgetConfig}
                        mountInside
                      />
                    );
                  })()
                : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Scores & Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generated Website</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Quality:</span>
                  <Badge
                    variant="outline"
                    className={getScoreColor(qualityScore)}
                  >
                    {qualityScore}/100
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Creativity:</span>
                  <Badge
                    variant="outline"
                    className={getScoreColor(creativityScore)}
                  >
                    {creativityScore}/100
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export to Wizard
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Device Switcher */}
          <div className="flex items-center justify-between mb-4">
            <Tabs
              value={previewDevice}
              onValueChange={(v) => setPreviewDevice(v as "desktop" | "mobile")}
            >
              <TabsList>
                <TabsTrigger value="desktop">
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          </div>

          {/* Preview Frame */}
          <div className="border rounded-lg overflow-hidden bg-muted/50">
            <div
              className={`bg-white transition-all duration-300 mx-auto overflow-auto ${
                previewDevice === "mobile"
                  ? "w-[375px] min-h-[667px]"
                  : "w-full min-h-[600px]"
              }`}
            >
              {/* Actual Website Preview - Render Generated HTML */}
              {websiteData?.pages?.[0]?.components && (
                <div
                  className="website-preview"
                  style={{
                    fontFamily:
                      websiteData.designSystem?.typography?.bodyFont ||
                      "system-ui",
                    color: websiteData.designSystem?.colors?.text || "#000000",
                  }}
                >
                  {(() => {
                    console.log("[V4 Preview] Full websiteData:", websiteData);
                    console.log(
                      "[V4 Preview] Components:",
                      websiteData.pages[0].components
                    );
                    return websiteData.pages[0].components.map(
                      (component: V4Component, idx: number) => {
                        console.log(
                          `[V4 Preview] Component ${idx}:`,
                          component
                        );
                        // Render each component's HTML code
                        return (
                          <div
                            key={idx}
                            dangerouslySetInnerHTML={{
                              __html:
                                component.code ||
                                component.componentCode ||
                                component.html ||
                                "",
                            }}
                            style={
                              {
                                // Apply design system colors as CSS variables
                                "--color-primary":
                                  websiteData.designSystem?.colors?.primary,
                                "--color-secondary":
                                  websiteData.designSystem?.colors?.secondary,
                                "--color-accent":
                                  websiteData.designSystem?.colors?.accent,
                                "--color-background":
                                  websiteData.designSystem?.colors?.background,
                                "--color-text":
                                  websiteData.designSystem?.colors?.text,
                              } as React.CSSProperties
                            }
                          />
                        );
                      }
                    );
                  })()}
                </div>
              )}

              {/* Fallback: Show metadata if no components */}
              {(!websiteData?.pages?.[0]?.components ||
                websiteData.pages[0].components.length === 0) && (
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Design System Preview */}
                    {websiteData?.designSystem && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Design System</h4>
                        <div className="grid grid-cols-7 gap-2">
                          {Object.entries(websiteData.designSystem.colors).map(
                            ([name, color]) => (
                              <div key={name} className="text-center">
                                <div
                                  className="w-12 h-12 rounded-lg border"
                                  style={{ backgroundColor: color as string }}
                                />
                                <p className="text-xs mt-1 capitalize">
                                  {name}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pages Preview */}
                    {websiteData?.pages && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">
                          Pages ({websiteData.pages.length})
                        </h4>
                        <div className="space-y-2">
                          {websiteData.pages.map((page, idx: number) => (
                            <div
                              key={idx}
                              className="border rounded-lg p-3 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{page.name}</span>
                                <Badge variant="secondary">
                                  {page.components?.length || 0} components
                                </Badge>
                              </div>
                              {page.seo?.description && (
                                <p className="text-sm text-muted-foreground">
                                  {page.seo.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
