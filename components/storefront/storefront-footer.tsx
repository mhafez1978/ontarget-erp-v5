"use client";


import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";



;

interface AiMeta {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface StorefrontFooterProps {
  slug: string;
  companyName: string;
  aiMeta?: AiMeta | null;
  storeMetadata?: {
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
    copyright?: string | boolean;
  } | null;
}

export function StorefrontFooter({
  slug,
  companyName,
  aiMeta,
  storeMetadata,
}: StorefrontFooterProps) {
  const aiEnabled = !!aiMeta;

  const bgStyle = aiEnabled ? aiMeta?.backgroundColor || undefined : undefined;
  const colorStyle = aiEnabled ? aiMeta?.textColor || undefined : undefined;

  return (
    <footer
      className="border-t mt-8 py-8 bg-background"
      style={{ backgroundColor: bgStyle, color: colorStyle }}
    >
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm">
        <div className="text-left">
          <div className="text-sm font-semibold capitalize">{companyName}.</div>
          <div className="text-xs text-muted-foreground capitalize">
            © {new Date().getFullYear()} {companyName ?? slug}. All rights
            reserved.
          </div>
        </div>

        <div className="flex items-center gap-4">
          {storeMetadata?.socialLinks?.facebook && (
            <Link
              href={storeMetadata.socialLinks.facebook}
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80"
            >
              <Facebook className="h-4 w-4" />
            </Link>
          )}
          {storeMetadata?.socialLinks?.twitter && (
            <Link
              href={storeMetadata.socialLinks.twitter}
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80"
            >
              <Twitter className="h-4 w-4" />
            </Link>
          )}
          {storeMetadata?.socialLinks?.instagram && (
            <Link
              href={storeMetadata.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80"
            >
              <Instagram className="h-4 w-4" />
            </Link>
          )}
          {storeMetadata?.socialLinks?.linkedin && (
            <Link
              href={storeMetadata.socialLinks.linkedin}
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}

export default StorefrontFooter;
