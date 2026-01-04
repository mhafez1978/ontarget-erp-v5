/**
 * V4 Conversation Types
 *
 * Interactive design conversation between user and AI
 */

export type V4ConversationPhase =
  | "greeting"
  | "understanding-business"
  | "design-style"
  | "hero-preferences"
  | "color-selection"
  | "typography"
  | "layout-preferences"
  | "sections-selection"
  | "final-confirmation"
  | "generating"
  | "complete";

export interface V4Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  phase: V4ConversationPhase;

  // For AI messages that need user input
  expectsInput?: {
    type: "text" | "choice" | "multiple-choice" | "color-picker" | "number";
    choices?: Array<{
      id: string;
      label: string;
      description?: string;
      preview?: string; // For visual choices like fonts/colors
    }>;
    placeholder?: string;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
  };
}

export interface V4DesignPreferences {
  // Hero section
  heroStyle?: "full-screen" | "above-fold" | "compact" | "split-screen";
  heroLayout?: "center" | "left" | "right";
  heroBackgroundType?: "gradient" | "image" | "video" | "solid";

  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  colorScheme?: "light" | "dark" | "auto";

  // Typography
  headingFont?: string;
  bodyFont?: string;
  fontPairing?: "modern" | "classic" | "playful" | "minimal" | "bold";

  // Layout
  layoutDensity?: "spacious" | "balanced" | "compact";
  navigationStyle?: "traditional" | "mega-menu" | "sidebar" | "minimal";

  // Sections to include
  sections?: {
    hero: boolean;
    features: boolean;
    products: boolean;
    services: boolean;
    team: boolean;
    testimonials: boolean;
    gallery: boolean;
    blog: boolean;
    faq: boolean;
    contact: boolean;
  };

  // Animations
  animations?: "subtle" | "moderate" | "dynamic" | "none";

  // Industry focus
  industryEmphasis?: {
    trustAndCredibility: boolean;
    creativityAndBoldness: boolean;
    professionalismAndClean: boolean;
    warmAndInviting: boolean;
    modernAndTech: boolean;
  };

  // Target audience
  targetAudience?: "b2b" | "b2c" | "both";
  audienceAge?: "young" | "middle" | "senior" | "all";

  // Conversion goals
  primaryCTA?: string;
  secondaryCTA?: string;
  conversionGoal?: "lead-generation" | "sales" | "bookings" | "awareness";

  // Visitor chat widget
  visitorChat?: {
    enabled?: boolean; // whether to inject visitor chat widget on generated pages
  };
}

export interface V4Conversation {
  id: string;
  companyId: string;
  userId: string;

  phase: V4ConversationPhase;
  messages: V4Message[];
  preferences: V4DesignPreferences;

  websiteId?: string; // Set when generation completes

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Font pairings with previews
export const FONT_PAIRINGS = {
  modern: {
    id: "modern",
    label: "Modern & Clean",
    description: "Inter + Inter (consistent, professional)",
    headingFont: "Inter",
    bodyFont: "Inter",
    preview: "Aa",
  },
  classic: {
    id: "classic",
    label: "Classic Elegance",
    description: "Playfair Display + Source Sans Pro",
    headingFont: "Playfair Display",
    bodyFont: "Source Sans Pro",
    preview: "Aa",
  },
  playful: {
    id: "playful",
    label: "Playful & Fun",
    description: "Poppins + Poppins",
    headingFont: "Poppins",
    bodyFont: "Poppins",
    preview: "Aa",
  },
  minimal: {
    id: "minimal",
    label: "Minimal & Swiss",
    description: "Helvetica Neue + Helvetica Neue",
    headingFont: "system-ui",
    bodyFont: "system-ui",
    preview: "Aa",
  },
  bold: {
    id: "bold",
    label: "Bold & Statement",
    description: "Montserrat + Open Sans",
    headingFont: "Montserrat",
    bodyFont: "Open Sans",
    preview: "Aa",
  },
  tech: {
    id: "tech",
    label: "Tech & Startup",
    description: "Space Grotesk + Inter",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    preview: "Aa",
  },
};

// Color scheme presets
export const COLOR_SCHEMES = {
  professional: {
    id: "professional",
    label: "Professional Blue",
    description: "Trusted, corporate, reliable",
    primary: "#2563EB",
    secondary: "#64748B",
    accent: "#F59E0B",
    preview: ["#2563EB", "#64748B", "#F59E0B"],
  },
  creative: {
    id: "creative",
    label: "Creative Purple",
    description: "Innovative, artistic, unique",
    primary: "#9333EA",
    secondary: "#EC4899",
    accent: "#F59E0B",
    preview: ["#9333EA", "#EC4899", "#F59E0B"],
  },
  organic: {
    id: "organic",
    label: "Natural Green",
    description: "Eco-friendly, health, nature",
    primary: "#059669",
    secondary: "#0D9488",
    accent: "#F59E0B",
    preview: ["#059669", "#0D9488", "#F59E0B"],
  },
  luxury: {
    id: "luxury",
    label: "Luxury Gold",
    description: "Premium, elegant, exclusive",
    primary: "#1E293B",
    secondary: "#D97706",
    accent: "#EAB308",
    preview: ["#1E293B", "#D97706", "#EAB308"],
  },
  energetic: {
    id: "energetic",
    label: "Energetic Orange",
    description: "Bold, exciting, dynamic",
    primary: "#EA580C",
    secondary: "#DC2626",
    accent: "#FBBF24",
    preview: ["#EA580C", "#DC2626", "#FBBF24"],
  },
  minimal: {
    id: "minimal",
    label: "Minimal Black",
    description: "Clean, modern, timeless",
    primary: "#0F172A",
    secondary: "#475569",
    accent: "#3B82F6",
    preview: ["#0F172A", "#475569", "#3B82F6"],
  },
  custom: {
    id: "custom",
    label: "Custom Colors",
    description: "Choose your own colors",
    primary: "",
    secondary: "",
    accent: "",
    preview: [],
  },
};

// Hero style examples
export const HERO_STYLES = {
  fullScreen: {
    id: "full-screen",
    label: "Full Screen",
    description: "Immersive, takes entire viewport, bold statement",
    image: "/hero-examples/full-screen.jpg",
  },
  aboveFold: {
    id: "above-fold",
    label: "Above the Fold",
    description: "Balanced, shows content immediately, modern",
    image: "/hero-examples/above-fold.jpg",
  },
  compact: {
    id: "compact",
    label: "Compact",
    description: "Quick intro, gets to content fast, professional",
    image: "/hero-examples/compact.jpg",
  },
  splitScreen: {
    id: "split-screen",
    label: "Split Screen",
    description: "Visual + text side-by-side, engaging",
    image: "/hero-examples/split-screen.jpg",
  },
};
