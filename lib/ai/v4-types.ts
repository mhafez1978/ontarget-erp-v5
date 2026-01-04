/**
 * V4 AI Storefront Types
 *
 * V4 generates actual TSX components with full creative freedom
 * AI reads comprehensive company data and creates unique designs
 */

export interface V4CompanyContext {
  // Core company data
  company: {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    description: string | null;
    slogan: string | null;
    logo: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    foundedYear: number | null;
    employeeCount: number | null;
    // Optional address/location fields for contact/map generation
    addressLine1?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  // Locations & contact
  locations: Array<{
    id: string;
    name: string | null;
    type: string | null;
    // Optional top-level address fields (some sources provide them flattened)
    addressLine1?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    address: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      postalCode: string | null;
    };
    phone: string | null;
    email: string | null;
    hours: string | null;
    isPrimary: boolean;
  }>;

  // Team members
  team: Array<{
    id: string;
    name: string;
    role: string;
    bio: string | null;
    email: string | null;
    phone: string | null;
    profileImage: string | null;
    linkedin: string | null;
    twitter: string | null;
    specialties: string[];
  }>;

  // Products catalog
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    price: number | null;
    compareAtPrice: number | null;
    sku: string | null;
    inStock: boolean;
    featured: boolean;
    images: Array<{ url: string; alt: string | null }>;
    tags: string[];
  }>;

  // Services catalog
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    price: number | null;
    duration: string | null;
    featured: boolean;
    images: Array<{ url: string; alt: string | null }>;
    benefits: string[];
  }>;

  // Customer testimonials
  testimonials: Array<{
    id: string;
    customerName: string;
    customerRole: string | null;
    customerCompany: string | null;
    content: string;
    rating: number | null;
    image: string | null;
    date: string;
    featured: boolean;
  }>;

  // Customer insights (aggregated, not individual data)
  customerInsights: {
    totalCustomers: number;
    topIndustries: Array<{ industry: string; count: number }>;
    averageRating: number | null;
    repeatCustomerRate: number | null;
  };

  // Business metrics
  metrics: {
    yearsInBusiness: number;
    projectsCompleted: number | null;
    satisfactionScore: number | null;
    certifications: string[];
    awards: string[];
  };

  // Social proof
  socialProof: {
    instagramFollowers: number | null;
    facebookLikes: number | null;
    linkedinFollowers: number | null;
    youtubeSubscribers: number | null;
    trustpilotRating: number | null;
    googleRating: number | null;
  };

  // Content & media
  gallery: Array<{
    url: string;
    alt: string | null;
    category: string | null;
  }>;

  blogPosts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    heroImage: string | null;
    publishedAt: string | null;
  }>;

  // SEO keywords extracted from company data
  seoKeywords: string[];
}

export interface V4ComponentMetadata {
  name: string; // e.g., "HeroSection", "ProductGrid"
  description: string;
  props: Record<string, unknown>; // Props passed to component
  dependencies: string[]; // External packages needed (lucide-react, etc.)
}

export interface V4Page {
  slug: string;
  name: string;
  components: Array<{
    id: string;
    order: number;
    componentCode: string; // Full TSX code
    metadata: V4ComponentMetadata;
  }>;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string | null;
    canonicalUrl: string | null;
    structuredData: Record<string, unknown>[]; // Schema.org JSON-LD
  };
}

export interface V4Website {
  version: 4;
  generatedAt: string;
  companyId: string;

  // Design system generated for this company
  designSystem: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      foreground: string;
      muted: string;
      border: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      monoFont: string;
    };
    spacing: {
      unit: number; // Base spacing unit
      scale: number[]; // Spacing scale [0.5, 1, 2, 4, 8, 16...]
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    animations: {
      duration: {
        fast: string;
        normal: string;
        slow: string;
      };
      easing: {
        ease: string;
        spring: string;
      };
    };
  };

  // Global styles (CSS)
  globalStyles: string;

  // Pages
  pages: V4Page[];

  // Navigation
  navigation: {
    header: {
      logo: string | null;
      links: Array<{
        label: string;
        href: string;
        isExternal: boolean;
      }>;
      cta: {
        label: string;
        href: string;
      } | null;
    };
    footer: {
      sections: Array<{
        title: string;
        links: Array<{
          label: string;
          href: string;
        }>;
      }>;
      social: Array<{
        platform: string;
        url: string;
        icon: string;
      }>;
      copyright: string;
    };
  };

  // Analytics & tracking
  analytics: {
    googleAnalyticsId: string | null;
    facebookPixelId: string | null;
    hotjarSiteId: string | null;
  };

  // Accessibility
  accessibility: {
    ariaLabelsComplete: boolean;
    colorContrastAA: boolean;
    keyboardNavigable: boolean;
    screenReaderOptimized: boolean;
  };

  // Visitor chat widget to be injected on generated pages (optional)
  chatWidget?: {
    enabled: boolean;
    // legacy inline HTML (kept for backward compatibility)
    html?: string;
    // Preferred: structured config emitted by the generator so the site can load a modular widget
    config?: {
      position?: "bottom-right" | "bottom-left";
      primaryColor?: string;
      theme?: "light" | "dark";
      initialOpen?: boolean;
      mountId?: string; // optional id used to mount the widget
    };
  };
}

export interface V4GenerationInput {
  companyId: string;
  context: V4CompanyContext;
  userInstructions?: string;
  providerConfig: {
    provider: "openai" | "anthropic" | "deepseek";
    apiKey: string;
    model?: string;
    apiBase?: string;
  };
}

export interface V4GenerationResult {
  success: boolean;
  website: V4Website | null;
  qualityScore: number;
  creativityScore: number; // How unique/creative the design is
  errors: string[];
  warnings: string[];
  generationTime: number; // milliseconds
  tokensUsed: number;
}
