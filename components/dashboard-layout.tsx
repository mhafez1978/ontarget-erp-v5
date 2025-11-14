"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { getRoleMenuItems } from "@/components/dashboard-menus/main-dashboard-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [companyCount, setCompanyCount] = React.useState(0);
  const [branding, setBranding] = React.useState({
    name: "OnTarget ERP",
    slogan: "People Driven & AI Insight",
    logo: null as string | null,
    logoLight: null as string | null,
    logoDark: null as string | null,
  });
  const pathname = usePathname();
  const router = useRouter();
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
    // Fallback to general logo or null
    return branding.logo;
  }, [
    theme,
    resolvedTheme,
    branding.logoLight,
    branding.logoDark,
    branding.logo,
  ]);

  // Check if we're using theme-specific branding (image only) vs fallback (name+slogan+logo)
  const hasThemeLogo = React.useMemo(() => {
    const activeTheme = theme === "system" ? resolvedTheme : theme;
    return (
      (activeTheme === "dark" && branding.logoDark) ||
      (activeTheme === "light" && branding.logoLight)
    );
  }, [theme, resolvedTheme, branding.logoLight, branding.logoDark]);

  const fetchCompanyCount = React.useCallback(async () => {
    try {
      const response = await fetch("/api/company/my-companies");
      if (response.ok) {
        const data = await response.json();
        setCompanyCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch company count:", error);
    }
  }, []);

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

  // Fetch company count for menu
  React.useEffect(() => {
    if (
      user?.role &&
      (user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        user.role === "ERP_CUSTOMER")
    ) {
      fetchCompanyCount();
    }
  }, [user?.role, fetchCompanyCount]);

  // Get menu items based on user role and company count
  const menuItems = getRoleMenuItems(user?.role || "GUEST", companyCount);

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Redirect to home page after logout
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.name || user?.email || "User";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-muted/40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div
          className={cn(
            "flex h-16 items-center border-b",
            hasThemeLogo ? "px-0" : "px-4"
          )}
        >
          {!isCollapsed ? (
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center",
                hasThemeLogo ? "w-full" : "space-x-2"
              )}
            >
              {hasThemeLogo ? (
                // Theme-specific logo: Show ONLY the image (larger)
                <div className="relative w-full flex items-center justify-center py-2">
                  <Image
                    src={currentLogo!}
                    alt={branding.name}
                    width={320}
                    height={80}
                    className="object-contain w-full max-w-60 h-auto mt-6 -ml-8"
                  />
                </div>
              ) : (
                // Fallback branding: Show name + slogan + optional logo
                <>
                  {currentLogo ? (
                    <div className="relative h-8 w-8 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={currentLogo}
                        alt={branding.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
                      O
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-sm leading-tight">
                      {branding.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {branding.slogan}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full"
            >
              {currentLogo ? (
                <div className="relative h-8 w-8 rounded-lg overflow-hidden">
                  <Image
                    src={currentLogo}
                    alt={branding.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  O
                </div>
              )}
            </Link>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Separator className="my-4" />

          {/* Sign Out Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="ml-3">Sign Out</span>}
          </Button>
          {/* Theme Toggle */}
          <div className={cn("mb-2", isCollapsed ? "flex justify-center" : "")}>
            <ThemeToggle />
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="border-t p-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  {displayName}
                </span>
                {user?.role && (
                  <span className="text-xs text-muted-foreground truncate">
                    {user.role.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
