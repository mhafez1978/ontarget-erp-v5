export interface ThemeSection {
  id: string;
  type:
    | "hero"
    | "stats"
    | "social-proof"
    | "featured-products"
    | "featured-services"
    | "team"
    | "about"
    | "contact"
    | "footer"
    | "promo-banner"
    | "video-section"
    | "gallery";
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
    thumbnail: "/themes/black-friday.jpg",
    previewImage: "/themes/previews/black-friday-full.jpg",
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
  // SEASONAL THEMES - HOLIDAY/CHRISTMAS
  // ============================================================================
  {
    id: "holiday-magic",
    name: "Holiday Magic",
    description:
      "Warm, festive Christmas theme with elegant snowfall effects and gift-focused design perfect for the holiday season",
    thumbnail: "/themes/holiday.jpg",
    previewImage: "/themes/previews/holiday-full.jpg",
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
    thumbnail: "/themes/halloween.jpg",
    previewImage: "/themes/previews/halloween-full.jpg",
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
    thumbnail: "/themes/veterans-day.jpg",
    previewImage: "/themes/previews/veterans-day-full.jpg",
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
    thumbnail: "/themes/summer.jpg",
    previewImage: "/themes/previews/summer-full.jpg",
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
    thumbnail: "/themes/spring.jpg",
    previewImage: "/themes/previews/spring-full.jpg",
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
    thumbnail: "/themes/tech.jpg",
    previewImage: "/themes/previews/tech-full.jpg",
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
    thumbnail: "/themes/restaurant.jpg",
    previewImage: "/themes/previews/restaurant-full.jpg",
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
