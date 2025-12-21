"use client";


import { Check, Sparkles, Zap, Snowflake, Ghost, Flag, Sun, Flower, Laptop, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";









;
import { defaultThemes } from "@/lib/storefront-themes";
import { cn } from "@/lib/utils";

interface ThemeGalleryProps {
  selectedTheme: string;
  onThemeSelect: (themeId: string) => void;
}

export function ThemeGallery({
  selectedTheme,
  onThemeSelect,
}: ThemeGalleryProps) {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  const getThemeIcon = (themeId: string) => {
    if (themeId.includes("black-friday")) return Zap;
    if (themeId.includes("holiday")) return Snowflake;
    if (themeId.includes("halloween")) return Ghost;
    if (themeId.includes("veterans")) return Flag;
    if (themeId.includes("summer")) return Sun;
    if (themeId.includes("spring")) return Flower;
    if (themeId.includes("tech")) return Laptop;
    if (themeId.includes("restaurant")) return UtensilsCrossed;
    return Sparkles;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "modern":
        return "from-blue-500 to-cyan-500";
      case "classic":
        return "from-amber-500 to-orange-600";
      case "minimal":
        return "from-gray-700 to-gray-900";
      case "bold":
        return "from-pink-500 to-purple-600";
      case "creative":
        return "from-purple-500 to-indigo-600";
      default:
        return "from-gray-500 to-gray-700";
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "modern":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "classic":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "minimal":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "bold":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300";
      case "creative":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Choose a theme that best represents your brand</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultThemes.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          const isHovered = hoveredTheme === theme.id;

          return (
            <Card
              key={theme.id}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-300 group",
                isSelected
                  ? "ring-2 ring-primary shadow-lg scale-105"
                  : "hover:shadow-xl hover:scale-105",
                isHovered && !isSelected && "shadow-md"
              )}
              onMouseEnter={() => setHoveredTheme(theme.id)}
              onMouseLeave={() => setHoveredTheme(null)}
              onClick={() => onThemeSelect(theme.id)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg animate-in zoom-in">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Gradient background */}
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-br opacity-10 transition-opacity duration-300",
                  getCategoryColor(theme.category),
                  isHovered && "opacity-20"
                )}
              />

              <CardContent className="p-6 relative">
                {/* Theme preview mockup */}
                <div className="mb-4 rounded-lg overflow-hidden border-2 border-muted shadow-inner">
                  {/* Mini preview showing theme colors */}
                  <div
                    className="h-32 relative"
                    style={{
                      backgroundColor:
                        theme.colors.background || theme.colors.primary,
                    }}
                  >
                    {/* Header bar */}
                    <div className="h-8 bg-black/10 border-b border-white/10 flex items-center px-2 gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500/50" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                      <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    </div>
                    {/* Content area showing color scheme */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-16 h-3 rounded"
                          style={{
                            backgroundColor: theme.colors.primary,
                            opacity: 0.9,
                          }}
                        />
                        <div
                          className="w-10 h-3 rounded"
                          style={{
                            backgroundColor: theme.colors.secondary,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div
                          className="flex-1 h-16 rounded border-2 border-white/20"
                          style={{
                            backgroundColor: theme.colors.primary,
                            opacity: 0.3,
                          }}
                        />
                        <div
                          className="flex-1 h-16 rounded border-2 border-white/20"
                          style={{
                            backgroundColor: theme.colors.secondary,
                            opacity: 0.3,
                          }}
                        />
                        <div
                          className="flex-1 h-16 rounded border-2 border-white/20"
                          style={{
                            backgroundColor: theme.colors.accent,
                            opacity: 0.3,
                          }}
                        />
                      </div>
                      <div className="flex justify-center">
                        <div
                          className="px-3 py-1 rounded text-xs font-bold"
                          style={{
                            backgroundColor: theme.colors.accent,
                            color: theme.colors.text || "#fff",
                          }}
                        >
                          CTA
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme icon */}
                <div className="flex items-center justify-center mb-4">
                  {(() => {
                    const Icon = getThemeIcon(theme.id);
                    return (
                      <div
                        className={cn(
                          "w-16 h-16 rounded-xl bg-linear-to-br flex items-center justify-center shadow-lg transition-transform duration-300",
                          getCategoryColor(theme.category),
                          isHovered && "scale-110 rotate-3"
                        )}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    );
                  })()}
                </div>

                {/* Theme info */}
                <div className="text-center space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{theme.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                  </div>

                  {/* Category badge */}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "capitalize",
                      getCategoryBadgeColor(theme.category)
                    )}
                  >
                    {theme.category}
                  </Badge>

                  {/* Color palette */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary color"
                    />
                    <div
                      className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="Secondary color"
                    />
                    <div
                      className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: theme.colors.accent }}
                      title="Accent color"
                    />
                  </div>

                  {/* Sections count */}
                  <div className="text-xs text-muted-foreground pt-2">
                    {theme.sections.length} sections included
                  </div>
                </div>

                {/* Hover overlay */}
                {isHovered && !isSelected && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 animate-in fade-in">
                    <Button size="sm" variant="default">
                      Select Theme
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected theme info */}
      {selectedTheme && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="p-4">
            <div className="w-full">
              <div className="flex flex-row gap-4 justify-start items-start">
                <h4 className="font-semibold p-1">
                  {defaultThemes.find((t) => t.id === selectedTheme)?.name}{" "}
                  Theme Selected
                </h4>
                <p className="text-sm text-muted-foreground p-1.5">
                  Customize the content in the Content Wizard tab
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
