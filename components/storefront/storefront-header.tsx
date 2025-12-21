"use client";


import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
;

interface AiMeta {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface StorefrontHeaderProps {
  slug: string;
  companyName: string;
  logo?: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  storeBlogEnabled?: boolean;
  aiMeta?: AiMeta | null;
  useThemeClass?: string | null;
}

export function StorefrontHeader({
  slug,
  companyName,
  logo,
  logoLight,
  logoDark,
  storeBlogEnabled,
  aiMeta,
  useThemeClass,
}: StorefrontHeaderProps) {
  const headerLogo: string | null =
    (logo as string | null) ||
    (logoLight as string | null) ||
    (logoDark as string | null) ||
    null;

  const aiEnabled = !!aiMeta;

  return (
    <header
      className={
        aiEnabled
          ? "sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
          : `sticky top-0 z-50 ${useThemeClass ?? "border-b bg-background/95"}`
      }
      style={
        aiEnabled
          ? {
              backgroundColor:
                aiMeta?.backgroundColor || aiMeta?.primaryColor || undefined,
              color: aiMeta?.textColor || undefined,
              borderColor: aiMeta?.accentColor || aiMeta?.secondaryColor,
            }
          : undefined
      }
    >
      <div className="container mx-auto h-14 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {headerLogo ? (
            <div className="relative h-14 w-[330px] flex justify-start items-center">
              <Image
                className="object-contain drop-shadow-2xl"
                src={headerLogo}
                alt={companyName}
                width={230}
                height={67}
              />
            </div>
          ) : (
            <h1 className="text-white text-2xl font-bold">{companyName}</h1>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={`/store/${slug}`}
            className="text-sm font-medium hover:underline"
          >
            Home
          </Link>
          {storeBlogEnabled && (
            <Link
              href={`/store/${slug}/posts`}
              className="text-sm font-medium hover:underline"
            >
              Blog
            </Link>
          )}
          <Link
            href={`/store/${slug}/products`}
            className="text-sm font-medium hover:underline"
          >
            Products
          </Link>
          <Link
            href={`/store/${slug}/services`}
            className="text-sm font-medium hover:underline"
          >
            Services
          </Link>

          {/* Contact should appear before auth links */}
          <Link
            href={`/store/${slug}/contact`}
            className="text-sm font-medium hover:underline"
          >
            Contact
          </Link>

          <Link
            href={`/store/${slug}/login`}
            className="text-sm font-medium hover:underline"
          >
            Login
          </Link>

          <Button
            size="sm"
            variant="outline"
            asChild
            style={
              aiEnabled
                ? {
                    borderColor: aiMeta?.accentColor || aiMeta?.secondaryColor,
                    color: aiMeta?.textColor || "#111827",
                  }
                : undefined
            }
          >
            <Link href={`/store/${slug}/register`}>Register</Link>
          </Button>

          <Button
            size="sm"
            asChild
            style={
              aiEnabled
                ? {
                    backgroundColor:
                      aiMeta?.accentColor || aiMeta?.primaryColor,
                    color: aiMeta?.textColor || "#ffffff",
                  }
                : undefined
            }
          >
            <Link href={`/store/${slug}/cart`}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export default StorefrontHeader;
