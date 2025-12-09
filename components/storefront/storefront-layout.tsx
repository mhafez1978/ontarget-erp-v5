import StorefrontHeader from "./storefront-header";
import StorefrontHero from "./storefront-hero";
import StorefrontFooter from "./storefront-footer";

interface HeroProps {
  title?: string;
  subtitle?: string;
  publishedAt?: string | Date | null;
  ctaHref?: string;
  ctaLabel?: string;
}

interface AiMeta {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface StoreMetadata {
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  copyright?: string | boolean;
}

interface StorefrontLayoutProps {
  slug: string;
  companyName: string;
  logo?: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  storeBanner?: string | null;
  storeMetadata?: StoreMetadata | null;
  aiMeta?: AiMeta | null;
  isStoreEnabled?: boolean;
  useThemeClass?: string | null;
  storeBlogEnabled?: boolean;
  renderHero?: boolean;
  heroProps?: HeroProps;
  children?: React.ReactNode;
}

export default function StorefrontLayout({
  slug,
  companyName,
  logo,
  logoLight,
  logoDark,
  storeBanner,
  storeMetadata,
  aiMeta,
  isStoreEnabled = true,
  useThemeClass,
  storeBlogEnabled = false,
  renderHero = false,
  heroProps,
  children,
}: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {!isStoreEnabled && (
        <div className="bg-yellow-500 text-yellow-950 px-4 py-3 text-center font-medium">
          ⚠️ This store is currently disabled and only visible in preview mode
        </div>
      )}

      <StorefrontHeader
        slug={slug}
        companyName={companyName}
        logo={logo}
        logoLight={logoLight}
        logoDark={logoDark}
        aiMeta={aiMeta}
        storeBlogEnabled={storeBlogEnabled}
        useThemeClass={useThemeClass ?? null}
      />

      {renderHero && (
        <StorefrontHero
          slug={slug}
          companyName={companyName}
          title={heroProps?.title}
          subtitle={heroProps?.subtitle}
          publishedAt={heroProps?.publishedAt}
          storeBanner={storeBanner}
          aiMeta={aiMeta}
          ctaHref={heroProps?.ctaHref}
          ctaLabel={heroProps?.ctaLabel}
        />
      )}

      <main>{children}</main>

      <StorefrontFooter
        slug={slug}
        companyName={companyName}
        aiMeta={aiMeta}
        storeMetadata={storeMetadata}
      />
    </div>
  );
}
