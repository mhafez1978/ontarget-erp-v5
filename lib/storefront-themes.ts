export interface ThemeSection {
  id: string;
  type:
    | "hero"
    | "stats"
    | "social-proof"
    | "featured-products"
    | "featured-services"
    | "posts"
    | "team"
    | "about"
    | "contact"
    | "footer"
    | "promo-banner"
    | "video-section"
    | "gallery"
    // V2 sections for parity
    | "highlights"
    | "product-grid"
    | "service-grid"
    | "portfolio"
    | "testimonials"
    | "faq"
    | "cta-band";
  enabled: boolean;
  order: number;
  content: {
    [key: string]:
      | string
      | string[]
      | boolean
      | number
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | undefined;
  };
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    gradient?: string;
    backgroundImage?: string;
    overlay?: string;
    pattern?: string;
  };
}

export interface StorefrontTheme {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  previewImage?: string;
  category:
    | "seasonal"
    | "industry"
    | "event"
    | "modern"
    | "classic"
    | "minimal"
    | "bold"
    | "creative";
  season?: "spring" | "summer" | "fall" | "winter" | "holiday";
  event?:
    | "black-friday"
    | "cyber-monday"
    | "halloween"
    | "christmas"
    | "new-year"
    | "valentines"
    | "easter"
    | "memorial-day"
    | "independence-day"
    | "labor-day"
    | "veterans-day"
    | "thanksgiving";
  industry?:
    | "tech"
    | "retail"
    | "food"
    | "services"
    | "healthcare"
    | "real-estate"
    | "education"
    | "creative";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    text?: string;
  };
  sections: ThemeSection[];
  features?: {
    videoBackground?: boolean;
    parallax?: boolean;
    animations?: string[];
    countdown?: boolean;
    chatWidget?: boolean;
  };
}

export const defaultThemes: StorefrontTheme[] = [
  // ============================================================================
  // SEASONAL THEMES - BLACK FRIDAY
  // ============================================================================
  {
    id: "black-friday-mega-sale",
    name: "Black Friday Mega Sale",
    description:
      "High-converting Black Friday theme with urgency elements, countdown timers, and bold CTAs designed to maximize sales",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "seasonal",
    season: "fall",
    event: "black-friday",
    colors: {
      primary: "#000000",
      secondary: "#FF1744",
      accent: "#FFD700",
      background: "#0A0A0A",
      text: "#FFFFFF",
    },
    features: {
      countdown: true,
      parallax: true,
      animations: ["flash", "pulse"],
      chatWidget: true,
    },
    sections: [
      {
        id: "promo-banner",
        type: "promo-banner",
        enabled: true,
        order: 0,
        content: {
          text: "🔥 BLACK FRIDAY: UP TO 70% OFF + FREE SHIPPING | ENDS IN:",
          countdown: true,
          countdownDate: "2024-11-29T23:59:59",
          urgent: true,
          link: "#products",
          linkText: "Shop Now",
        },
        styling: {
          backgroundColor: "#FF1744",
          textColor: "#FFFFFF",
          gradient: "linear-gradient(90deg, #FF1744 0%, #C51162 100%)",
        },
      },
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "BLACK FRIDAY BLOWOUT",
          subtitle: "The Biggest Sale of the Year",
          description:
            "Up to 70% off everything. Limited quantities. Doorbuster deals starting at midnight.",
          primaryCTA: "Shop Doorbusters",
          secondaryCTA: "View All Deals",
          backgroundType: "split-screen",
          layout: "centered",
          showCountdown: true,
          urgencyLevel: "high",
        },
        styling: {
          backgroundColor: "#000000",
          textColor: "#FFFFFF",
          gradient:
            "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #FF1744 100%)",
          overlay: "rgba(0, 0, 0, 0.7)",
          pattern: "diagonal-stripes",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 2,
        content: {
          title: "Join 50,000+ Happy Shoppers",
          stats: [
            { value: "50K+", label: "Customers Served", icon: "users" },
            { value: "98%", label: "Satisfaction Rate", icon: "star" },
            { value: "24/7", label: "Support Available", icon: "support" },
            { value: "100%", label: "Secure Checkout", icon: "shield" },
          ],
        },
        styling: {
          backgroundColor: "#0F0F0F",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 6,
        content: {
          heading: "💪 Meet Our Black Friday Power Team",
          description:
            "The experts working around the clock to bring you the best deals",
          layout: "grid",
          columns: 3,
        },
        styling: {
          backgroundColor: "#1A1A1A",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 3,
        content: {
          title: "⚡ DOORBUSTER DEALS",
          subtitle: "Lightning deals - grab them before they're gone!",
          layout: "carousel",
          columns: 4,
          showBadges: true,
          showCountdown: true,
          showStock: true,
          ctaText: "Add to Cart",
          style: "bold-cards",
          urgencyMessages: [
            "Only 3 left at this price!",
            "Selling fast - 87% claimed",
            "Limited time offer",
          ],
        },
        styling: {
          backgroundColor: "#1A1A1A",
          textColor: "#FFFFFF",
          pattern: "dots",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 4,
        content: {
          heading: "⚡ EXPRESS SERVICES - BLACK FRIDAY SPECIAL",
          description:
            "Book now and save up to 50% on premium services. Limited slots available!",
          layout: "grid",
          showBadges: true,
          ctaText: "Book Now & Save",
          urgencyText: "🔥 Filling Fast - Limited Availability",
        },
        styling: {
          backgroundColor: "#0F0F0F",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 7,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#0F0F0F",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 8,
        content: {
          title: "Questions? We're Here 24/7",
          description:
            "Our Black Friday support team is standing by to help you save big",
          email: "info@example.com",
          salesEmail: "sales@example.com",
          supportEmail: "support@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Shopping Plaza, Sale City, SC 12345",
          showForm: true,
          showMap: false,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
          hours: "24/7 During Black Friday Weekend",
        },
        styling: {
          backgroundColor: "#0F0F0F",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 9,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Don't Miss Future Sales!",
          newsletterDescription:
            "Be first to know about exclusive deals and new arrivals",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Secure Payment", icon: "lock" },
            { text: "Free Returns", icon: "return" },
            { text: "24/7 Support", icon: "support" },
            { text: "Price Match", icon: "guarantee" },
          ],
          links: [
            { text: "Shipping Info", url: "/shipping" },
            { text: "Returns", url: "/returns" },
            { text: "Track Order", url: "/tracking" },
            { text: "Contact", url: "/contact" },
          ],
        },
        styling: {
          backgroundColor: "#000000",
          textColor: "#FFFFFF",
        },
      },
    ],
  },
  // ============================================================================
  // INDUSTRY THEMES - HEALTHCARE CLINIC
  // ============================================================================
  {
    id: "healthcare-precision-care",
    name: "Precision Care Clinic",
    description:
      "Clean, calming layout for medical practices, clinics, and wellness groups focused on trust and outcomes.",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "healthcare",
    colors: {
      primary: "#0E8AA8",
      secondary: "#0FB5BA",
      accent: "#E8F5F7",
      background: "#F7FBFC",
      text: "#0F3040",
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: {
          title: "Evidence-Based Care for Every Patient",
          subtitle: "Integrated health, diagnostics, and recovery",
          description:
            "Board-certified physicians, modern facilities, and compassionate teams delivering outcomes you can measure.",
          primaryCTA: "Book Appointment",
          secondaryCTA: "Meet Our Providers",
          backgroundType: "soft-gradient",
          layout: "left",
        },
        styling: {
          gradient: "linear-gradient(135deg, #F7FBFC 0%, #E8F5F7 100%)",
          textColor: "#0F3040",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 1,
        content: {
          title: "Quality you can trust",
          stats: [
            { value: "15+", label: "Specialties", icon: "stethoscope" },
            { value: "98%", label: "Patient Satisfaction", icon: "smile" },
            { value: "24/7", label: "Urgent Care Access", icon: "clock" },
            { value: "30K", label: "Patients Served", icon: "users" },
          ],
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#0F3040",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 2,
        content: {
          heading: "Specialty Programs",
          description:
            "From preventive care to advanced diagnostics, pick the right path for your health.",
          layout: "cards",
          showBadges: true,
          ctaText: "Schedule",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#0F3040",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 3,
        content: {
          heading: "Patients share their journey",
          subheading: "Real stories of recovery and ongoing care",
          layout: "carousel",
        },
        styling: {
          backgroundColor: "#E8F5F7",
          textColor: "#0F3040",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 4,
        content: {
          heading: "Clinical leaders & care teams",
          description:
            "Multidisciplinary experts collaborating on every treatment plan.",
          layout: "grid",
          columns: 3,
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#0F3040",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 5,
        content: {
          heading: "Visit or contact us",
          subheading: "Same-day appointments available",
          showMap: true,
          showContactDetails: true,
          showBusinessHours: true,
          showSocialLinks: false,
        },
        styling: {
          backgroundColor: "#0E8AA8",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 6,
        content: {
          copyright: true,
          showNewsletter: false,
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "HIPAA Compliant", icon: "shield" },
            { text: "Board Certified", icon: "check" },
            { text: "Emergency Ready", icon: "alert" },
          ],
        },
        styling: {
          backgroundColor: "#0B6A82",
          textColor: "#FFFFFF",
        },
      },
    ],
  },
  // ============================================================================
  // INDUSTRY THEMES - FINTECH / SAAS
  // ============================================================================
  {
    id: "fintech-trust-lab",
    name: "Trust Lab Fintech",
    description:
      "Crisp, conversion-focused layout for fintech, SaaS, or compliance-forward products.",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "tech",
    colors: {
      primary: "#0F172A",
      secondary: "#22D3EE",
      accent: "#A855F7",
      background: "#0B1220",
      text: "#E2E8F0",
    },
    features: {
      animations: ["fade-up", "slide-in"],
      parallax: true,
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: {
          title: "Build Trust. Ship Faster.",
          subtitle: "Financial infrastructure without the drag",
          description:
            "KYC, payments, risk, and analytics in one modular platform—secure, compliant, and developer-friendly.",
          primaryCTA: "Launch a Demo",
          secondaryCTA: "View Security",
          backgroundType: "gradient",
          layout: "centered",
          showBadge: true,
          badgeText: "SOC2 & ISO27001 Ready",
        },
        styling: {
          gradient:
            "radial-gradient(circle at 20% 20%, #22D3EE22, #0F172A 60%), radial-gradient(circle at 80% 0%, #A855F722, #0B1220 60%)",
          textColor: "#E2E8F0",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 1,
        content: {
          title: "Proven scale",
          stats: [
            { value: "12M+", label: "Monthly API Calls", icon: "server" },
            { value: "99.99%", label: "Uptime", icon: "shield" },
            { value: "42%", label: "Faster Onboarding", icon: "zap" },
            { value: "18", label: "Markets Supported", icon: "globe" },
          ],
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#E2E8F0",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 2,
        content: {
          heading: "Platform modules",
          description:
            "Mix and match capabilities to launch faster and stay compliant.",
          layout: "cards",
          showBadges: true,
          ctaText: "Explore Module",
        },
        styling: {
          backgroundColor: "#0B1220",
          textColor: "#E2E8F0",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 3,
        content: {
          title: "Solutions by outcome",
          subtitle: "From onboarding to fraud to payouts",
          layout: "tiles",
          columns: 3,
          showBadges: true,
          ctaText: "See Details",
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#E2E8F0",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 4,
        content: {
          heading: "Trusted by operators and auditors",
          subheading: "Customer results and compliance wins",
          layout: "grid",
        },
        styling: {
          backgroundColor: "#0B1220",
          textColor: "#E2E8F0",
        },
      },
      {
        id: "video-section",
        type: "video-section",
        enabled: true,
        order: 5,
        content: {
          title: "Watch the platform in action",
          description: "2-minute overview of onboarding and monitoring flows",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#E2E8F0",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 6,
        content: {
          heading: "Talk to solutions engineering",
          subheading: "Sandbox in hours, production in days",
          showMap: false,
          showContactDetails: true,
          showBusinessHours: false,
          showSocialLinks: true,
        },
        styling: {
          backgroundColor: "#111827",
          textColor: "#E2E8F0",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 7,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Ship faster with Trust Lab",
          newsletterDescription:
            "Security updates, feature launches, and playbooks.",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "SOC2", icon: "shield" },
            { text: "ISO27001", icon: "lock" },
            { text: "PCI Ready", icon: "credit-card" },
          ],
        },
        styling: {
          backgroundColor: "#0B1220",
          textColor: "#E2E8F0",
        },
      },
    ],
  },
  // ============================================================================
  // INDUSTRY THEMES - REAL ESTATE / PROPERTY
  // ============================================================================
  {
    id: "real-estate-luxe",
    name: "Luxe Property Showcase",
    description:
      "Elegant showcase for brokers, developers, and property managers featuring rich visuals and calls to tour.",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "real-estate",
    colors: {
      primary: "#1F2937",
      secondary: "#C08457",
      accent: "#F3EDE4",
      background: "#F7F5F2",
      text: "#1F2937",
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: {
          title: "Residences Crafted for Living Well",
          subtitle: "Premium locations, thoughtful design, curated amenities",
          description:
            "Explore available listings, virtual tours, and private showings tailored to your lifestyle.",
          primaryCTA: "Schedule a Tour",
          secondaryCTA: "Browse Listings",
          backgroundType: "image",
          layout: "split",
        },
        styling: {
          backgroundImage: "/file.svg",
          overlay: "rgba(0,0,0,0.35)",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "gallery",
        type: "gallery",
        enabled: true,
        order: 1,
        content: {
          title: "Signature properties",
          subtitle: "Curated homes and developments",
          layout: "masonry",
          showCaptions: true,
        },
        styling: {
          backgroundColor: "#F7F5F2",
          textColor: "#1F2937",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 2,
        content: {
          title: "Available listings",
          subtitle: "See pricing, floor plans, and amenities",
          layout: "grid",
          columns: 3,
          showBadges: true,
          ctaText: "View Details",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 3,
        content: {
          heading: "What residents and partners say",
          subheading: "Confidence from closings, leases, and hospitality",
          layout: "grid",
        },
        styling: {
          backgroundColor: "#F3EDE4",
          textColor: "#1F2937",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 4,
        content: {
          heading: "Your advisory team",
          description:
            "Agents, designers, and property managers guiding every step from tour to move-in.",
          layout: "grid",
          columns: 3,
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 5,
        content: {
          heading: "Book a viewing",
          subheading: "Private and virtual tours available",
          showMap: true,
          showContactDetails: true,
          showBusinessHours: true,
          showSocialLinks: true,
        },
        styling: {
          backgroundColor: "#1F2937",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 6,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Market insights",
          newsletterDescription: "Weekly listings and neighborhood intel.",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "MLS Verified", icon: "check" },
            { text: "Virtual Tours", icon: "video" },
            { text: "Concierge Move-In", icon: "home" },
          ],
        },
        styling: {
          backgroundColor: "#161E2E",
          textColor: "#FFFFFF",
        },
      },
    ],
  },
  // ============================================================================
  // INDUSTRY THEMES - EDUCATION / ONLINE LEARNING
  // ============================================================================
  {
    id: "education-digital-campus",
    name: "Digital Campus",
    description:
      "Bright, structured theme for online courses, academies, and cohort-based programs.",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "education",
    colors: {
      primary: "#2563EB",
      secondary: "#F59E0B",
      accent: "#E0ECFF",
      background: "#F8FAFC",
      text: "#0F172A",
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: {
          title: "Programs that move careers forward",
          subtitle: "Live cohorts, self-paced tracks, and mentorship",
          description:
            "Practical curriculum, hands-on projects, and career outcomes supported by real practitioners.",
          primaryCTA: "Browse Programs",
          secondaryCTA: "Book a Call",
          backgroundType: "soft-gradient",
          layout: "left",
        },
        styling: {
          gradient: "linear-gradient(135deg, #E0ECFF 0%, #F8FAFC 100%)",
          textColor: "#0F172A",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 1,
        content: {
          title: "Learner impact",
          stats: [
            { value: "92%", label: "Job-ready grads", icon: "briefcase" },
            { value: "35K", label: "Alumni worldwide", icon: "globe" },
            { value: "4.8/5", label: "Course ratings", icon: "star" },
            { value: "6 mo", label: "Avg. time to upskill", icon: "clock" },
          ],
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#0F172A",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 2,
        content: {
          title: "Top programs",
          subtitle: "Designed with industry partners",
          layout: "grid",
          columns: 3,
          showBadges: true,
          ctaText: "View Syllabus",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#0F172A",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 3,
        content: {
          heading: "Student experience",
          description:
            "Mentorship, career coaching, and community support that keep learners on track.",
          layout: "cards",
          showBadges: true,
          ctaText: "Explore Support",
        },
        styling: {
          backgroundColor: "#F8FAFC",
          textColor: "#0F172A",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 4,
        content: {
          heading: "Alumni stories",
          subheading: "Career transitions and promotions from our graduates",
          layout: "carousel",
        },
        styling: {
          backgroundColor: "#E0ECFF",
          textColor: "#0F172A",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 5,
        content: {
          heading: "Talk to admissions",
          subheading: "Get guidance on the right program and financing",
          showMap: false,
          showContactDetails: true,
          showBusinessHours: true,
          showSocialLinks: true,
        },
        styling: {
          backgroundColor: "#2563EB",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 6,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Stay ahead",
          newsletterDescription: "Program launches, scholarships, and events.",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Accredited Partners", icon: "check" },
            { text: "Career Coaching", icon: "user" },
            { text: "Certifications", icon: "award" },
          ],
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#FFFFFF",
        },
      },
    ],
  },
  // ============================================================================
  // INDUSTRY THEMES - FITNESS / WELLNESS STUDIO
  // ============================================================================
  {
    id: "fitness-boutique",
    name: "Boutique Fitness",
    description:
      "High-energy, modern layout for gyms, studios, and trainers with schedules, passes, and transformations.",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "services",
    colors: {
      primary: "#111827",
      secondary: "#F97316",
      accent: "#FDE68A",
      background: "#0B0F1A",
      text: "#F9FAFB",
    },
    features: {
      animations: ["slide-up", "pulse"],
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: {
          title: "Train with Intensity. Recover with Intention.",
          subtitle: "Small-group sessions, 1:1 coaching, and recovery labs",
          description:
            "Personalized programming, evidence-based coaching, and community accountability.",
          primaryCTA: "Start a Trial",
          secondaryCTA: "View Schedule",
          backgroundType: "image",
          layout: "centered",
        },
        styling: {
          backgroundImage: "/file.svg",
          overlay: "linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.7))",
          textColor: "#F9FAFB",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 1,
        content: {
          title: "Proven results",
          stats: [
            {
              value: "12-Week",
              label: "Transformation Plans",
              icon: "activity",
            },
            { value: "4.9/5", label: "Member Rating", icon: "star" },
            { value: "24/7", label: "Access & Support", icon: "clock" },
            { value: "3x", label: "Avg. Strength Gains", icon: "zap" },
          ],
        },
        styling: {
          backgroundColor: "#0B0F1A",
          textColor: "#F9FAFB",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 2,
        content: {
          heading: "Programs & experiences",
          description:
            "Strength, conditioning, mobility, recovery, and nutrition—pick your track.",
          layout: "grid",
          showBadges: true,
          ctaText: "Book Session",
        },
        styling: {
          backgroundColor: "#111827",
          textColor: "#F9FAFB",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 3,
        content: {
          heading: "Member transformations",
          subheading: "Stories from the community",
          layout: "carousel",
        },
        styling: {
          backgroundColor: "#0B0F1A",
          textColor: "#F9FAFB",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "Passes & memberships",
          subtitle: "Drop-ins, class packs, and unlimited options",
          layout: "grid",
          columns: 3,
          showBadges: true,
          ctaText: "Choose Plan",
        },
        styling: {
          backgroundColor: "#111827",
          textColor: "#F9FAFB",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 5,
        content: {
          heading: "Visit the studio",
          subheading: "Tours and intro consults available",
          showMap: true,
          showContactDetails: true,
          showBusinessHours: true,
          showSocialLinks: true,
        },
        styling: {
          backgroundColor: "#F97316",
          textColor: "#111827",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 6,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Stay in the loop",
          newsletterDescription: "New classes, challenges, and events.",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Certified Coaches", icon: "user" },
            { text: "Recovery Lab", icon: "heart" },
            { text: "Community Events", icon: "calendar" },
          ],
        },
        styling: {
          backgroundColor: "#0B0F1A",
          textColor: "#F9FAFB",
        },
      },
    ],
  },
  // ============================================================================
  // INDUSTRY THEMES - HOSPITALITY / BOUTIQUE HOTEL
  // ============================================================================
  {
    id: "hospitality-boutique-stay",
    name: "Boutique Stay",
    description:
      "Warm, immersive storytelling for hotels, resorts, and luxury rentals with booking-friendly CTAs.",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "services",
    colors: {
      primary: "#1B1A1F",
      secondary: "#D4A373",
      accent: "#F1E9DD",
      background: "#F9F6F1",
      text: "#1B1A1F",
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: {
          title: "Arrive Inspired, Depart Restored",
          subtitle: "Boutique stays with curated experiences",
          description:
            "Thoughtful interiors, locally inspired dining, and concierge itineraries tailored to every guest.",
          primaryCTA: "Check Availability",
          secondaryCTA: "View Rooms",
          backgroundType: "image",
          layout: "left",
        },
        styling: {
          backgroundImage: "/file.svg",
          overlay: "rgba(0,0,0,0.4)",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "gallery",
        type: "gallery",
        enabled: true,
        order: 1,
        content: {
          title: "Spaces & moments",
          subtitle: "Suites, lounges, dining, and amenities",
          layout: "grid",
          showCaptions: true,
        },
        styling: {
          backgroundColor: "#F9F6F1",
          textColor: "#1B1A1F",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 2,
        content: {
          title: "Rooms & offers",
          subtitle: "Suites, packages, and seasonal escapes",
          layout: "grid",
          columns: 3,
          showBadges: true,
          ctaText: "Book Now",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#1B1A1F",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 3,
        content: {
          heading: "Experiences",
          description:
            "Spa, dining, excursions, and concierge-planned itineraries for every stay.",
          layout: "cards",
          showBadges: true,
          ctaText: "Plan Experience",
        },
        styling: {
          backgroundColor: "#F1E9DD",
          textColor: "#1B1A1F",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 4,
        content: {
          heading: "Guest impressions",
          subheading: "Reviews from recent stays",
          layout: "carousel",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#1B1A1F",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 5,
        content: {
          heading: "Plan your visit",
          subheading: "Concierge available 24/7",
          showMap: true,
          showContactDetails: true,
          showBusinessHours: true,
          showSocialLinks: true,
        },
        styling: {
          backgroundColor: "#1B1A1F",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 6,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Stay inspired",
          newsletterDescription: "Seasonal offers and curated itineraries.",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Concierge 24/7", icon: "clock" },
            { text: "Locally Curated", icon: "map" },
            { text: "Wellness Ready", icon: "heart" },
          ],
        },
        styling: {
          backgroundColor: "#151419",
          textColor: "#FFFFFF",
        },
      },
    ],
  },
  // ============================================================================
  // INDUSTRY THEMES - CONSTRUCTION / TRADES
  // ============================================================================
  {
    id: "construction-buildcraft",
    name: "BuildCraft",
    description:
      "Confident, project-focused theme for construction, trades, and field services showcasing projects and services.",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "services",
    colors: {
      primary: "#0F172A",
      secondary: "#F59E0B",
      accent: "#F4F4F5",
      background: "#0B1220",
      text: "#E5E7EB",
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 0,
        content: {
          title: "Building with precision and safety",
          subtitle: "Commercial, residential, and specialty projects",
          description:
            "Certified crews, transparent timelines, and quality materials for every scope.",
          primaryCTA: "Request a Bid",
          secondaryCTA: "View Projects",
          backgroundType: "image",
          layout: "left",
        },
        styling: {
          backgroundImage: "/file.svg",
          overlay: "rgba(0,0,0,0.55)",
          textColor: "#E5E7EB",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 1,
        content: {
          title: "Operational excellence",
          stats: [
            { value: "250+", label: "Projects Delivered", icon: "briefcase" },
            { value: "18", label: "Crew Certifications", icon: "shield" },
            { value: "12", label: "Trade Specialties", icon: "hammer" },
            { value: "4.9/5", label: "Safety Rating", icon: "check" },
          ],
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#E5E7EB",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 2,
        content: {
          heading: "Core services",
          description:
            "General contracting, design-build, tenant improvements, and maintenance programs.",
          layout: "grid",
          showBadges: true,
          ctaText: "Request Service",
        },
        styling: {
          backgroundColor: "#0B1220",
          textColor: "#E5E7EB",
        },
      },
      {
        id: "gallery",
        type: "gallery",
        enabled: true,
        order: 3,
        content: {
          title: "Featured projects",
          subtitle: "Recent builds and renovations",
          layout: "masonry",
          showCaptions: true,
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#E5E7EB",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 4,
        content: {
          heading: "Client references",
          subheading: "Owners, developers, and facility teams",
          layout: "grid",
        },
        styling: {
          backgroundColor: "#F4F4F5",
          textColor: "#0F172A",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 5,
        content: {
          heading: "Let's build",
          subheading: "Timeline, scope, and budget alignment",
          showMap: true,
          showContactDetails: true,
          showBusinessHours: true,
          showSocialLinks: true,
        },
        styling: {
          backgroundColor: "#0B1220",
          textColor: "#E5E7EB",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 6,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Project insights",
          newsletterDescription:
            "Bid openings, safety updates, and portfolio news.",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Licensed & Bonded", icon: "shield" },
            { text: "Safety First", icon: "alert" },
            { text: "Certified Crews", icon: "award" },
          ],
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#E5E7EB",
        },
      },
    ],
  },

  // ============================================================================
  // SEASONAL THEMES - HOLIDAY/CHRISTMAS
  // ============================================================================
  {
    id: "holiday-magic",
    name: "Holiday Magic",
    description:
      "Warm, festive Christmas theme with elegant snowfall effects and gift-focused design perfect for the holiday season",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "seasonal",
    season: "winter",
    event: "christmas",
    colors: {
      primary: "#C41E3A",
      secondary: "#165B33",
      accent: "#FFD700",
      background: "#F8F9FA",
      text: "#2C3E50",
    },
    features: {
      parallax: true,
      animations: ["fadeIn", "snowfall"],
      chatWidget: true,
    },
    sections: [
      {
        id: "promo-banner",
        type: "promo-banner",
        enabled: true,
        order: 0,
        content: {
          text: "🎄 Holiday Special: Free Gift Wrapping on All Orders | Shop Early for Best Selection",
          countdown: false,
          link: "#products",
          linkText: "Browse Gifts",
        },
        styling: {
          backgroundColor: "#C41E3A",
          textColor: "#FFFFFF",
          gradient: "linear-gradient(90deg, #C41E3A 0%, #165B33 100%)",
        },
      },
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "Give Joy This Holiday Season",
          subtitle: "Perfect Gifts for Everyone on Your List",
          description:
            "Curated collections, gift wrapping included, and guaranteed delivery before Christmas",
          primaryCTA: "Shop Gift Guide",
          secondaryCTA: "Last-Minute Gifts",
          backgroundType: "centered-elegant",
          layout: "centered",
          showSnowfall: true,
          animationStyle: "gentle",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
          gradient:
            "linear-gradient(135deg, #C41E3A 0%, #165B33 50%, #FFD700 100%)",
          backgroundImage: "url('/patterns/snowflakes.svg')",
          overlay: "rgba(255, 255, 255, 0.9)",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 2,
        content: {
          title: "Spreading Holiday Cheer Since [Year]",
          stats: [
            { value: "100K+", label: "Gifts Delivered", icon: "gift" },
            { value: "4.9/5", label: "Customer Rating", icon: "star" },
            { value: "99%", label: "On-Time Delivery", icon: "truck" },
            { value: "24/7", label: "Holiday Support", icon: "headphones" },
          ],
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 3,
        content: {
          heading: "Meet Our Elves 🎅",
          description:
            "Our dedicated gift experts ready to help you find the perfect presents",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "🎁 Holiday Gift Guide",
          subtitle: "Thoughtfully curated gifts for everyone",
          layout: "grid",
          columns: 3,
          showBadges: true,
          showGiftOptions: true,
          ctaText: "Add Gift to Cart",
          categories: [
            "For Her",
            "For Him",
            "For Kids",
            "For Home",
            "Stocking Stuffers",
            "Luxury Gifts",
          ],
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 4,
        content: {
          heading: "🎁 Holiday Gift Services",
          description:
            "Make your holiday season stress-free with our premium gift services",
          layout: "grid",
          showBadges: true,
          ctaText: "Book Holiday Service",
        },
        styling: {
          backgroundColor: "#FFF5F5",
          textColor: "#2C3E50",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 6,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#F8F9FA",
          textColor: "#2C3E50",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 7,
        content: {
          title: "Holiday Shopping Assistance",
          description:
            "Need gift advice? Our holiday helpers are here to assist you",
          email: "info@example.com",
          salesEmail: "sales@example.com",
          supportEmail: "support@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Shopping Plaza, Sale City, SC 12345",
          showForm: true,
          showMap: false,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
          hours: "Extended Holiday Hours: Mon-Sat 8am-9pm, Sun 10am-6pm",
        },
        styling: {
          backgroundColor: "#F8F9FA",
          textColor: "#2C3E50",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 8,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Holiday Updates & Exclusive Offers",
          newsletterDescription:
            "Get early access to holiday sales and gift ideas",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Free Gift Wrap", icon: "gift" },
            { text: "Easy Returns", icon: "return" },
            { text: "Secure Payment", icon: "lock" },
            { text: "Ships Worldwide", icon: "globe" },
          ],
        },
        styling: {
          backgroundColor: "#165B33",
          textColor: "#FFFFFF",
        },
      },
    ],
  },

  // ============================================================================
  // SEASONAL THEMES - HALLOWEEN
  // ============================================================================
  {
    id: "spooky-halloween",
    name: "Spooky Halloween",
    description:
      "Dark, atmospheric Halloween theme with eerie effects and bold orange accents perfect for seasonal promotions",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "seasonal",
    season: "fall",
    event: "halloween",
    colors: {
      primary: "#FF6600",
      secondary: "#1A0A2E",
      accent: "#9B59B6",
      background: "#0F0515",
      text: "#FFFFFF",
    },
    features: {
      parallax: true,
      animations: ["float", "flicker", "fade"],
      chatWidget: true,
    },
    sections: [
      {
        id: "promo-banner",
        type: "promo-banner",
        enabled: true,
        order: 0,
        content: {
          text: "🎃 SPOOKY SAVINGS: 40% OFF EVERYTHING | Limited Time Halloween Sale",
          countdown: true,
          countdownDate: "2024-10-31T23:59:59",
          link: "#products",
          linkText: "Shop Halloween",
        },
        styling: {
          backgroundColor: "#1A0A2E",
          textColor: "#FF6600",
          gradient: "linear-gradient(90deg, #1A0A2E 0%, #FF6600 100%)",
        },
      },
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "Frighteningly Good Deals",
          subtitle: "Treat Yourself This Halloween",
          description: "Spooky savings up to 40% off. No tricks, just treats!",
          primaryCTA: "Shop Halloween Sale",
          secondaryCTA: "View Costumes",
          backgroundType: "dark-gradient",
          showFloatingElements: true,
        },
        styling: {
          backgroundColor: "#0F0515",
          textColor: "#FFFFFF",
          gradient:
            "linear-gradient(135deg, #0F0515 0%, #1A0A2E 50%, #FF6600 100%)",
          backgroundImage: "url('/patterns/spiderwebs.svg')",
          overlay: "rgba(15, 5, 21, 0.8)",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 2,
        content: {
          title: "Trusted by Ghouls & Goblins Everywhere",
          stats: [
            { value: "13K+", label: "Haunted Customers", icon: "ghost" },
            { value: "666", label: "Spooky Products", icon: "pumpkin" },
            { value: "100%", label: "Satisfaction", icon: "star" },
            { value: "31st", label: "Ships by Oct", icon: "shipping" },
          ],
        },
        styling: {
          backgroundColor: "#1A0A2E",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 3,
        content: {
          heading: "🎃 Meet the Spooky Squad",
          description: "Our frighteningly talented team",
        },
        styling: {
          backgroundColor: "#0F0515",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "👻 Halloween Favorites",
          subtitle: "Eerily amazing products at scary good prices",
          layout: "masonry",
          columns: 4,
          showBadges: true,
          style: "spooky-cards",
          ctaText: "Add to Cauldron",
        },
        styling: {
          backgroundColor: "#0F0515",
          textColor: "#FFFFFF",
          pattern: "bats",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 5,
        content: {
          heading: "👻 Spooktacular Services",
          description:
            "Frighteningly good services to make your Halloween unforgettable",
          layout: "grid",
          showBadges: true,
          ctaText: "Book Spooky Service",
        },
        styling: {
          backgroundColor: "#0F0820",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 6,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#1A0A2E",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 6,
        content: {
          title: "Summon Customer Service",
          description: "Got questions? Our support spirits are here to help",
          email: "info@example.com",
          salesEmail: "sales@example.com",
          supportEmail: "support@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Shopping Plaza, Sale City, SC 12345",
          hours: "Mon-Fri 9am-8pm, Sat-Sun 10am-6pm",
          showForm: true,
          showMap: false,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
        },
        styling: {
          backgroundColor: "#1A0A2E",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 8,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Join Our Coven of Subscribers",
          newsletterDescription: "Get spooky deals delivered to your inbox",
          showSocialMedia: true,
          showTrustBadges: true,
        },
        styling: {
          backgroundColor: "#0F0515",
          textColor: "#FF6600",
        },
      },
    ],
  },

  // ============================================================================
  // SEASONAL THEMES - VETERANS DAY
  // ============================================================================
  {
    id: "veterans-day-patriotic",
    name: "Veterans Day Patriotic",
    description:
      "Honorable patriotic theme with red, white, and blue design to celebrate and honor our veterans",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "seasonal",
    season: "fall",
    event: "veterans-day",
    colors: {
      primary: "#B22234",
      secondary: "#3C3B6E",
      accent: "#FFFFFF",
      background: "#F5F5F5",
      text: "#2C3E50",
    },
    features: {
      parallax: false,
      animations: ["fadeIn", "slideIn"],
      chatWidget: true,
    },
    sections: [
      {
        id: "promo-banner",
        type: "promo-banner",
        enabled: true,
        order: 0,
        content: {
          text: "🇺🇸 Veterans Day Special: 25% Off for All Veterans & Active Military | Thank You for Your Service",
          countdown: false,
          link: "#products",
          linkText: "Shop Now",
        },
        styling: {
          backgroundColor: "#B22234",
          textColor: "#FFFFFF",
        },
      },
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "Honoring Those Who Served",
          subtitle: "Veterans Day Sale",
          description:
            "25% off for all veterans and active military. Because your service deserves recognition.",
          primaryCTA: "Shop Veterans Sale",
          secondaryCTA: "Learn More",
          backgroundType: "patriotic",
        },
        styling: {
          backgroundColor: "#F5F5F5",
          textColor: "#2C3E50",
          gradient:
            "linear-gradient(135deg, #DC143C 0%, #FFFFFF 50%, #0047AB 100%)",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: false,
        order: 6,
        content: {
          title: "Serving Those Who Served",
          stats: [
            { value: "10K+", label: "Veterans Served", icon: "flag" },
            { value: "100%", label: "Veteran Owned", icon: "badge" },
            { value: "$1M+", label: "Donated to Vets", icon: "heart" },
            { value: "25%", label: "Military Discount", icon: "star" },
          ],
        },
        styling: {
          backgroundColor: "#F5F5F5",
          textColor: "#2C3E50",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 2,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#F5F5F5",
          textColor: "#2C3E50",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 3,
        content: {
          heading: "🇺🇸 Meet Our Team",
          description: "Veteran-owned and operated",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "🇺🇸 Made with Pride",
          subtitle: "Honoring service with quality products",
          layout: "list",
          columns: 3,
          showBadges: true,
          style: "clean-cards",
          ctaText: "Shop Now",
        },
        styling: {
          backgroundColor: "#F5F5F5",
          textColor: "#2C3E50",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 5,
        content: {
          heading: "🇺🇸 Services with Honor",
          description:
            "Professional services delivered with integrity and respect",
          layout: "grid",
          showBadges: true,
          ctaText: "Request Service",
        },
        styling: {
          backgroundColor: "#F8F9FA",
          textColor: "#2C3E50",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 7,
        content: {
          title: "We're Here to Serve You",
          description:
            "Questions about military discounts or products? Contact us anytime",
          email: "info@example.com",
          salesEmail: "sales@example.com",
          supportEmail: "support@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Shopping Plaza, Sale City, SC 12345",
          showForm: true,
          showMap: false,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
          hours: "Mon-Fri 9am-6pm, Sat 10am-4pm",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 8,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Join Our Community",
          newsletterDescription:
            "Stay updated on military discounts and special offers",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Veteran Owned", icon: "flag" },
            { text: "Made in USA", icon: "star" },
            { text: "Secure Payment", icon: "lock" },
            { text: "Free Shipping", icon: "truck" },
          ],
        },
        styling: {
          backgroundColor: "#3C3B6E",
          textColor: "#FFFFFF",
        },
      },
    ],
  },

  // ============================================================================
  // SEASONAL THEMES - SUMMER SALE
  // ============================================================================
  {
    id: "summer-paradise",
    name: "Summer Paradise",
    description:
      "Bright, energetic summer theme with beach vibes, vibrant colors, and vacation-ready design",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "seasonal",
    season: "summer",
    colors: {
      primary: "#FF6B35",
      secondary: "#004E89",
      accent: "#FFD23F",
      background: "#F7F7F2",
      text: "#1A1A1D",
    },
    features: {
      parallax: true,
      animations: ["wave", "float", "fadeIn"],
      chatWidget: true,
    },
    sections: [
      {
        id: "promo-banner",
        type: "promo-banner",
        enabled: true,
        order: 0,
        content: {
          text: "☀️ SUMMER SALE: 50% OFF Swimwear, Beach Gear & More | Free Shipping on $75+",
          countdown: false,
          link: "#products",
          linkText: "Shop Summer",
        },
        styling: {
          backgroundColor: "#FF6B35",
          textColor: "#FFFFFF",
          gradient: "linear-gradient(90deg, #FF6B35 0%, #FFD23F 100%)",
        },
      },
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "Summer Paradise Awaits",
          subtitle: "Get Beach-Ready",
          description:
            "Dive into summer with 50% off swimwear, beach essentials, and outdoor gear",
          primaryCTA: "Shop Summer Collection",
          secondaryCTA: "Beach Essentials",
          backgroundType: "gradient-overlay",
        },
        styling: {
          backgroundColor: "#F7F7F2",
          textColor: "#1A1A1D",
          gradient:
            "linear-gradient(135deg, #FF6B35 0%, #004E89 50%, #FFD23F 100%)",
          backgroundImage: "url('/patterns/waves.svg')",
          overlay: "rgba(247, 247, 242, 0.85)",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 2,
        content: {
          title: "Making Summers Unforgettable",
          stats: [
            { value: "75K+", label: "Beach-Ready Customers", icon: "sun" },
            { value: "4.8/5", label: "Customer Rating", icon: "star" },
            { value: "100+", label: "Summer Products", icon: "umbrella" },
            { value: "50%", label: "Summer Savings", icon: "sale" },
          ],
        },
        styling: {
          backgroundColor: "#F7F7F2",
          textColor: "#1A1A1D",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 3,
        content: {
          heading: "☀️ Meet Our Summer Squad",
          description: "Your guides to the perfect summer",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#1A1A1D",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "🏖️ Summer Essentials",
          subtitle: "Everything you need for the perfect summer",
          layout: "horizontal-scroll",
          columns: 4,
          showBadges: true,
          style: "bright-cards",
          ctaText: "Add to Cart",
          categories: [
            "Swimwear",
            "Beach Gear",
            "Outdoor Fun",
            "Sun Protection",
            "Summer Fashion",
            "Pool Accessories",
          ],
        },
        styling: {
          backgroundColor: "#F7F7F2",
          textColor: "#1A1A1D",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 4,
        content: {
          heading: "☀️ Summer Services",
          description:
            "Beat the heat with our refreshing summer service offerings",
          layout: "grid",
          showBadges: true,
          ctaText: "Book Summer Service",
        },
        styling: {
          backgroundColor: "#FFFEF0",
          textColor: "#1A1A1D",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 6,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#F7F7F2",
          textColor: "#1A1A1D",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 7,
        content: {
          title: "Need Summer Shopping Help?",
          description:
            "Our team is here to help you find the perfect summer essentials",
          email: "info@example.com",
          salesEmail: "sales@example.com",
          supportEmail: "support@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Shopping Plaza, Sale City, SC 12345",
          showForm: true,
          showMap: false,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
          hours: "Mon-Fri 9am-8pm, Sat-Sun 10am-6pm",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#1A1A1D",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 8,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Get Summer Updates",
          newsletterDescription:
            "Exclusive summer deals and new arrival alerts",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Easy Returns", icon: "return" },
            { text: "Secure Checkout", icon: "lock" },
            { text: "Fast Shipping", icon: "truck" },
            { text: "Quality Guaranteed", icon: "shield" },
          ],
        },
        styling: {
          backgroundColor: "#004E89",
          textColor: "#FFFFFF",
        },
      },
    ],
  },

  // ============================================================================
  // SEASONAL THEMES - SPRING RENEWAL
  // ============================================================================
  {
    id: "spring-renewal",
    name: "Spring Renewal",
    description:
      "Fresh, vibrant spring theme with pastel colors, floral accents, and renewal-focused design",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "seasonal",
    season: "spring",
    colors: {
      primary: "#86C232",
      secondary: "#61892F",
      accent: "#FFB6C1",
      background: "#F5FFF8",
      text: "#2C3E50",
    },
    features: {
      parallax: true,
      animations: ["bloom", "fadeIn", "float"],
      chatWidget: true,
    },
    sections: [
      {
        id: "promo-banner",
        type: "promo-banner",
        enabled: true,
        order: 0,
        content: {
          text: "🌸 Spring Sale: Fresh Arrivals Up to 40% Off | Celebrate the Season of Renewal",
          countdown: false,
          link: "#products",
          linkText: "Shop Spring",
        },
        styling: {
          backgroundColor: "#86C232",
          textColor: "#FFFFFF",
          gradient: "linear-gradient(90deg, #86C232 0%, #FFB6C1 100%)",
        },
      },
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "Bloom Into Spring",
          subtitle: "Fresh Starts, New Favorites",
          description:
            "Refresh your life with our spring collection. Up to 40% off new arrivals.",
          primaryCTA: "Shop New Arrivals",
          secondaryCTA: "Spring Guide",
          backgroundType: "minimal-clean",
          layout: "minimal",
          animationStyle: "smooth",
        },
        styling: {
          backgroundColor: "#F5FFF8",
          textColor: "#2C3E50",
          gradient:
            "linear-gradient(135deg, #86C232 0%, #FFB6C1 50%, #61892F 100%)",
          backgroundImage: "url('/patterns/flowers.svg')",
          overlay: "rgba(245, 255, 248, 0.9)",
          pattern: "botanical",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 2,
        content: {
          title: "Growing Together Since [Year]",
          stats: [
            { value: "60K+", label: "Spring Shoppers", icon: "flower" },
            { value: "4.9/5", label: "Customer Love", icon: "heart" },
            { value: "500+", label: "Spring Products", icon: "leaf" },
            { value: "40%", label: "Spring Savings", icon: "sale" },
          ],
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 3,
        content: {
          heading: "🌸 Meet Our Spring Team",
          description: "Helping you bloom this season",
        },
        styling: {
          backgroundColor: "#F5FFF8",
          textColor: "#2C3E50",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "🌷 Spring Collection",
          subtitle: "Fresh arrivals for a fresh season",
          layout: "grid",
          columns: 3,
          showBadges: true,
          ctaText: "Shop Now",
        },
        styling: {
          backgroundColor: "#F5FFF8",
          textColor: "#2C3E50",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 4,
        content: {
          heading: "🌸 Spring Into Action",
          description: "Refresh and renew with our spring service specials",
          layout: "grid",
          showBadges: true,
          ctaText: "Schedule Spring Service",
        },
        styling: {
          backgroundColor: "#F0FFF4",
          textColor: "#2C3E50",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 6,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#F5FFF8",
          textColor: "#2C3E50",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 7,
        content: {
          title: "Let's Grow Together",
          description:
            "Questions about our spring collection? We're here to help!",
          email: "info@example.com",
          salesEmail: "sales@example.com",
          supportEmail: "support@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Shopping Plaza, Sale City, SC 12345",
          showForm: true,
          showMap: false,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
          hours: "Mon-Fri 9am-6pm, Sat 10am-4pm",
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C3E50",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 8,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Spring Into Savings",
          newsletterDescription: "Get exclusive spring deals and style tips",
          showSocialMedia: true,
          showTrustBadges: true,
        },
        styling: {
          backgroundColor: "#61892F",
          textColor: "#FFFFFF",
        },
      },
    ],
  },

  // ============================================================================
  // INDUSTRY THEMES - TECH/SaaS
  // ============================================================================
  {
    id: "tech-innovate",
    name: "Tech Innovate",
    description:
      "Modern, sleek technology theme with gradient effects, perfect for SaaS, tech products, and digital services",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "tech",
    colors: {
      primary: "#2563EB",
      secondary: "#7C3AED",
      accent: "#06B6D4",
      background: "#0F172A",
      text: "#F1F5F9",
    },
    features: {
      parallax: true,
      animations: ["fadeIn", "slideIn", "glow"],
      chatWidget: true,
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "Innovation Meets Performance",
          subtitle: "Next-Generation Solutions",
          description:
            "Transform your business with cutting-edge technology designed for modern enterprises",
          primaryCTA: "Start Free Trial",
          secondaryCTA: "Watch Demo",
          backgroundType: "tech-gradient",
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#F1F5F9",
          gradient:
            "linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #06B6D4 100%)",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 2,
        content: {
          title: "Trusted by Leading Companies",
          stats: [
            { value: "10K+", label: "Active Users", icon: "users" },
            { value: "99.9%", label: "Uptime SLA", icon: "server" },
            { value: "24/7", label: "Support", icon: "support" },
            { value: "150+", label: "Integrations", icon: "plugin" },
          ],
        },
        styling: {
          backgroundColor: "#1E293B",
          textColor: "#F1F5F9",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 3,
        content: {
          heading: "💻 Meet Our Tech Team",
          description: "Industry experts driving innovation",
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#F1F5F9",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "🚀 Enterprise Solutions",
          subtitle: "Powerful tools for modern teams",
          layout: "grid",
          columns: 3,
          showBadges: true,
          ctaText: "Learn More",
        },
        styling: {
          backgroundColor: "#0F172A",
          textColor: "#F1F5F9",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 4,
        content: {
          heading: "⚡ Tech Services & Solutions",
          description:
            "Next-generation services powered by cutting-edge technology",
          layout: "grid",
          showBadges: true,
          ctaText: "Get Started",
        },
        styling: {
          backgroundColor: "#050A15",
          textColor: "#F1F5F9",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 6,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#1E293B",
          textColor: "#F1F5F9",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 7,
        content: {
          title: "Let's Build Something Amazing",
          description:
            "Ready to transform your business? Get in touch with our team",
          email: "info@example.com",
          salesEmail: "sales@example.com",
          supportEmail: "support@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Tech Plaza, Innovation City, IC 12345",
          showForm: true,
          showMap: false,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
          hours: "24/7 Support Available",
        },
        styling: {
          backgroundColor: "#1E293B",
          textColor: "#F1F5F9",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 8,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Stay Updated",
          newsletterDescription: "Get product updates and tech insights",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "SOC 2 Certified", icon: "shield" },
            { text: "GDPR Compliant", icon: "lock" },
            { text: "99.9% Uptime", icon: "server" },
            { text: "24/7 Support", icon: "support" },
          ],
        },
        styling: {
          backgroundColor: "#020617",
          textColor: "#F1F5F9",
        },
      },
    ],
  },

  // ============================================================================
  // INDUSTRY THEMES - RESTAURANT/FOOD
  // ============================================================================
  {
    id: "gourmet-dining",
    name: "Gourmet Dining",
    description:
      "Elegant, appetizing theme for restaurants, cafes, and food businesses with mouth-watering design",
    thumbnail: "/file.svg",
    previewImage: "/file.svg",
    category: "industry",
    industry: "food",
    colors: {
      primary: "#C8102E",
      secondary: "#1C1C1C",
      accent: "#F4A460",
      background: "#FAF9F6",
      text: "#2C2C2C",
    },
    features: {
      parallax: false,
      animations: ["fadeIn", "zoom"],
      chatWidget: true,
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        content: {
          title: "Culinary Excellence",
          subtitle: "Where Flavor Meets Artistry",
          description:
            "Experience unforgettable dining with fresh, locally-sourced ingredients and award-winning recipes",
          primaryCTA: "View Menu",
          secondaryCTA: "Reserve Table",
          backgroundType: "image-focus",
          layout: "magazine",
          animationStyle: "elegant",
        },
        styling: {
          backgroundColor: "#FAF9F6",
          textColor: "#2C2C2C",
          gradient:
            "linear-gradient(135deg, rgba(200, 16, 46, 0.9) 0%, rgba(28, 28, 28, 0.9) 100%)",
          backgroundImage: "url('/images/restaurant-hero.jpg')",
          overlay: "rgba(0, 0, 0, 0.3)",
          pattern: "subtle-texture",
        },
      },
      {
        id: "stats",
        type: "stats",
        enabled: true,
        order: 2,
        content: {
          title: "Loved by Food Critics & Diners",
          stats: [
            { value: "25+", label: "Years Experience", icon: "chef" },
            { value: "4.9/5", label: "Customer Rating", icon: "star" },
            { value: "100%", label: "Fresh Ingredients", icon: "leaf" },
            { value: "50+", label: "Signature Dishes", icon: "plate" },
          ],
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C2C2C",
        },
      },
      {
        id: "team",
        type: "team",
        enabled: true,
        order: 3,
        content: {
          heading: "👨‍🍳 Meet Our Culinary Team",
          description: "Award-winning chefs crafting memorable experiences",
        },
        styling: {
          backgroundColor: "#FAF9F6",
          textColor: "#2C2C2C",
        },
      },
      {
        id: "featured-products",
        type: "featured-products",
        enabled: true,
        order: 4,
        content: {
          title: "🍽️ Chef's Specials",
          subtitle: "Our most popular signature dishes",
          layout: "featured-image",
          columns: 3,
          showBadges: true,
          style: "gourmet-cards",
          ctaText: "Order Now",
        },
        styling: {
          backgroundColor: "#FAF9F6",
          textColor: "#2C2C2C",
        },
      },
      {
        id: "featured-services",
        type: "featured-services",
        enabled: true,
        order: 4,
        content: {
          heading: "🍷 Premium Dining Experiences",
          description:
            "Exceptional culinary services for your special occasions",
          layout: "grid",
          showBadges: true,
          ctaText: "Reserve Experience",
        },
        styling: {
          backgroundColor: "#FFF8F0",
          textColor: "#2C2C2C",
        },
      },
      {
        id: "social-proof",
        type: "social-proof",
        enabled: true,
        order: 6,
        content: {
          heading: "What Our Customers Say",
          description:
            "Don't just take our word for it - hear from our happy customers",
        },
        styling: {
          backgroundColor: "#FAF9F6",
          textColor: "#2C2C2C",
        },
      },
      {
        id: "contact",
        type: "contact",
        enabled: true,
        order: 7,
        content: {
          title: "Visit Us or Reserve Your Table",
          description:
            "We'd love to serve you. Make a reservation or contact us for private events",
          email: "info@example.com",
          salesEmail: "reservations@example.com",
          supportEmail: "events@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Culinary Plaza, Food City, FC 12345",
          hours:
            "Tue-Thu 11am-9pm, Fri-Sat 11am-11pm, Sun 10am-8pm, Closed Mon",
          showForm: true,
          showMap: true,
          showHours: true,
          showSocialLinks: true,
          privacyMode: false,
          showOnlyPublicEmails: false,
          showAddressIfPublished: true,
        },
        styling: {
          backgroundColor: "#FFFFFF",
          textColor: "#2C2C2C",
        },
      },
      {
        id: "footer",
        type: "footer",
        enabled: true,
        order: 8,
        content: {
          copyright: true,
          showNewsletter: true,
          newsletterTitle: "Stay Hungry for Updates",
          newsletterDescription:
            "Get exclusive offers and new menu announcements",
          showSocialMedia: true,
          showTrustBadges: true,
          trustBadges: [
            { text: "Michelin Rated", icon: "star" },
            { text: "Farm to Table", icon: "leaf" },
            { text: "Award Winning", icon: "trophy" },
            { text: "Private Events", icon: "calendar" },
          ],
        },
        styling: {
          backgroundColor: "#1C1C1C",
          textColor: "#FAF9F6",
        },
      },
    ],
  },
];

export const getThemeById = (themeId: string): StorefrontTheme | undefined => {
  return defaultThemes.find((theme) => theme.id === themeId);
};

export const getThemesByCategory = (
  category: StorefrontTheme["category"]
): StorefrontTheme[] => {
  return defaultThemes.filter((theme) => theme.category === category);
};

export const getThemesBySeason = (season: string): StorefrontTheme[] => {
  return defaultThemes.filter((theme) => theme.season === season);
};

export const getThemesByEvent = (event: string): StorefrontTheme[] => {
  return defaultThemes.filter((theme) => theme.event === event);
};

export const getThemesByIndustry = (industry: string): StorefrontTheme[] => {
  return defaultThemes.filter((theme) => theme.industry === industry);
};
