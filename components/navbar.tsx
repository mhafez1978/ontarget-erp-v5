"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [branding, setBranding] = React.useState({
    name: "OnTarget ERP",
    slogan: "People Driven & AI Insight",
    logo: null as string | null,
    logoLight: null as string | null,
    logoDark: null as string | null,
  });
  const { theme, resolvedTheme } = useTheme();

  // Determine which logo to display based on theme
  const currentLogo = React.useMemo(() => {
    const activeTheme = theme === "system" ? resolvedTheme : theme;

    if (activeTheme === "dark" && branding.logoDark) {
      return branding.logoDark;
    }
    if (activeTheme === "light" && branding.logoLight) {
      return branding.logoLight;
    }
    return branding.logo;
  }, [
    theme,
    resolvedTheme,
    branding.logoLight,
    branding.logoDark,
    branding.logo,
  ]);

  // Check if we're using theme-specific branding
  const hasThemeLogo = React.useMemo(() => {
    const activeTheme = theme === "system" ? resolvedTheme : theme;
    return (
      (activeTheme === "dark" && branding.logoDark) ||
      (activeTheme === "light" && branding.logoLight)
    );
  }, [theme, resolvedTheme, branding.logoLight, branding.logoDark]);

  const fetchBranding = React.useCallback(async () => {
    try {
      const response = await fetch("/api/branding");
      if (response.ok) {
        const data = await response.json();
        setBranding(data);
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  }, []);

  // Fetch branding on mount
  React.useEffect(() => {
    fetchBranding();

    // Listen for branding updates
    const handleBrandingUpdate = () => {
      fetchBranding();
    };

    window.addEventListener("branding-updated", handleBrandingUpdate);

    return () => {
      window.removeEventListener("branding-updated", handleBrandingUpdate);
    };
  }, [fetchBranding]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setIsOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          {currentLogo ? (
            hasThemeLogo ? (
              /* Theme-specific logo only */
              <div className="relative h-10 w-40">
                <Image
                  src={currentLogo}
                  alt={branding.name}
                  fill
                  className="object-contain object-left"
                  unoptimized
                />
              </div>
            ) : (
              /* Fallback logo with name/slogan */
              <>
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src={currentLogo}
                    alt={branding.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-bold text-xl leading-tight">
                    {branding.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {branding.slogan}
                  </span>
                </div>
              </>
            )
          ) : (
            /* No logo - show name/slogan with letter badge */
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
                {branding.name.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-xl leading-tight">
                  {branding.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {branding.slogan}
                </span>
              </div>
            </>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right side - Theme Toggle, Login & CTA */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/login">Login</Link>
          </Button>
          <Button className="hidden md:inline-flex" size="sm" asChild>
            <Link href="/register">Get Started</Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>
                  <Link
                    href="/"
                    className="flex items-center space-x-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {currentLogo ? (
                      hasThemeLogo ? (
                        /* Theme-specific logo only */
                        <div className="relative h-10 w-40">
                          <Image
                            src={currentLogo}
                            alt={branding.name}
                            fill
                            className="object-contain object-left"
                            unoptimized
                          />
                        </div>
                      ) : (
                        /* Fallback logo with name/slogan */
                        <>
                          <div className="relative h-10 w-10 shrink-0">
                            <Image
                              src={currentLogo}
                              alt={branding.name}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-xl leading-tight">
                              {branding.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {branding.slogan}
                            </span>
                          </div>
                        </>
                      )
                    ) : (
                      /* No logo - show name/slogan with letter badge */
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
                          {branding.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xl leading-tight">
                            {branding.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {branding.slogan}
                          </span>
                        </div>
                      </>
                    )}
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-lg font-medium transition-colors hover:text-primary py-2 cursor-pointer"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="flex flex-col space-y-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    asChild
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button onClick={() => setIsOpen(false)} asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
