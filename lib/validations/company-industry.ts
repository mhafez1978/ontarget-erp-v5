import { CompanyIndustry } from "@prisma/client";

/**
 * Display labels for company industries
 */
export const COMPANY_INDUSTRY_LABELS: Record<
  CompanyIndustry,
  { label: string; category: string }
> = {
  // Technology & Software
  SOFTWARE_DEVELOPMENT: {
    label: "Software Development & Engineering",
    category: "Technology & Software",
  },
  SAAS: { label: "SaaS", category: "Technology & Software" },
  IT_SERVICES: {
    label: "IT Services & Consulting",
    category: "Technology & Software",
  },
  CYBERSECURITY: {
    label: "Cybersecurity & Information Security",
    category: "Technology & Software",
  },
  AI_ML: {
    label: "Artificial Intelligence & Machine Learning",
    category: "Technology & Software",
  },
  CLOUD_COMPUTING: {
    label: "Cloud Computing & Infrastructure",
    category: "Technology & Software",
  },
  MOBILE_APPS: {
    label: "Mobile App Development",
    category: "Technology & Software",
  },
  WEB_DEVELOPMENT: {
    label: "Web Development & Design",
    category: "Technology & Software",
  },
  GAME_DEVELOPMENT: {
    label: "Game Development",
    category: "Technology & Software",
  },
  BLOCKCHAIN: {
    label: "Blockchain & Cryptocurrency",
    category: "Technology & Software",
  },

  // Healthcare & Medical
  HEALTHCARE: {
    label: "Healthcare Services",
    category: "Healthcare & Medical",
  },
  MEDICAL_DEVICES: {
    label: "Medical Devices & Equipment",
    category: "Healthcare & Medical",
  },
  PHARMACEUTICALS: {
    label: "Pharmaceuticals & Biotechnology",
    category: "Healthcare & Medical",
  },
  TELEHEALTH: {
    label: "Telemedicine & Digital Health",
    category: "Healthcare & Medical",
  },
  HEALTH_INSURANCE: {
    label: "Health Insurance",
    category: "Healthcare & Medical",
  },
  DENTAL: { label: "Dental Services", category: "Healthcare & Medical" },
  VETERINARY: {
    label: "Veterinary Services",
    category: "Healthcare & Medical",
  },
  FITNESS: { label: "Fitness & Wellness", category: "Healthcare & Medical" },

  // Finance & Banking
  BANKING: {
    label: "Banking & Financial Services",
    category: "Finance & Banking",
  },
  FINTECH: {
    label: "Financial Technology (FinTech)",
    category: "Finance & Banking",
  },
  INSURANCE: { label: "Insurance Services", category: "Finance & Banking" },
  ACCOUNTING: {
    label: "Accounting & Bookkeeping",
    category: "Finance & Banking",
  },
  INVESTMENT: { label: "Investment Management", category: "Finance & Banking" },
  CRYPTOCURRENCY: {
    label: "Cryptocurrency & Digital Assets",
    category: "Finance & Banking",
  },
  PAYMENT_PROCESSING: {
    label: "Payment Processing",
    category: "Finance & Banking",
  },

  // Retail & E-commerce
  ECOMMERCE: {
    label: "E-commerce & Online Retail",
    category: "Retail & E-commerce",
  },
  RETAIL: { label: "Retail Stores", category: "Retail & E-commerce" },
  FASHION: { label: "Fashion & Apparel", category: "Retail & E-commerce" },
  JEWELRY: { label: "Jewelry & Accessories", category: "Retail & E-commerce" },
  BEAUTY: { label: "Beauty & Cosmetics", category: "Retail & E-commerce" },
  GROCERY: { label: "Grocery & Food Retail", category: "Retail & E-commerce" },
  FURNITURE: {
    label: "Furniture & Home Goods",
    category: "Retail & E-commerce",
  },
  ELECTRONICS: {
    label: "Consumer Electronics",
    category: "Retail & E-commerce",
  },

  // Manufacturing & Industrial
  MANUFACTURING: {
    label: "General Manufacturing",
    category: "Manufacturing & Industrial",
  },
  AUTOMOTIVE: {
    label: "Automotive Manufacturing",
    category: "Manufacturing & Industrial",
  },
  AEROSPACE: {
    label: "Aerospace & Defense",
    category: "Manufacturing & Industrial",
  },
  CONSTRUCTION: {
    label: "Construction & Building Materials",
    category: "Manufacturing & Industrial",
  },
  INDUSTRIAL_EQUIPMENT: {
    label: "Industrial Equipment & Machinery",
    category: "Manufacturing & Industrial",
  },
  CHEMICALS: {
    label: "Chemicals & Materials",
    category: "Manufacturing & Industrial",
  },
  TEXTILES: {
    label: "Textiles & Fabrics",
    category: "Manufacturing & Industrial",
  },
  PACKAGING: {
    label: "Packaging & Containers",
    category: "Manufacturing & Industrial",
  },

  // Food & Beverage
  RESTAURANT: {
    label: "Restaurants & Food Service",
    category: "Food & Beverage",
  },
  CAFE: { label: "Cafes & Coffee Shops", category: "Food & Beverage" },
  CATERING: { label: "Catering Services", category: "Food & Beverage" },
  FOOD_PRODUCTION: {
    label: "Food Production & Processing",
    category: "Food & Beverage",
  },
  BREWERY: { label: "Brewery & Distillery", category: "Food & Beverage" },

  // Real Estate & Property
  REAL_ESTATE: {
    label: "Real Estate Services",
    category: "Real Estate & Property",
  },
  PROPERTY_MANAGEMENT: {
    label: "Property Management",
    category: "Real Estate & Property",
  },
  CONSTRUCTION_DEVELOPMENT: {
    label: "Construction & Development",
    category: "Real Estate & Property",
  },
  ARCHITECTURE: {
    label: "Architecture & Design",
    category: "Real Estate & Property",
  },
  INTERIOR_DESIGN: {
    label: "Interior Design",
    category: "Real Estate & Property",
  },

  // Professional Services
  CONSULTING: {
    label: "Business Consulting",
    category: "Professional Services",
  },
  LEGAL: { label: "Legal Services", category: "Professional Services" },
  MARKETING: {
    label: "Marketing & Advertising",
    category: "Professional Services",
  },
  PR: { label: "Public Relations", category: "Professional Services" },
  HR: { label: "Human Resources Services", category: "Professional Services" },
  RECRUITMENT: {
    label: "Recruitment & Staffing",
    category: "Professional Services",
  },
  BUSINESS_SERVICES: {
    label: "General Business Services",
    category: "Professional Services",
  },

  // Education & Training
  EDUCATION: { label: "Education Services", category: "Education & Training" },
  ELEARNING: {
    label: "E-Learning & Online Courses",
    category: "Education & Training",
  },
  TRAINING: {
    label: "Training & Professional Development",
    category: "Education & Training",
  },
  TUTORING: { label: "Tutoring Services", category: "Education & Training" },
  CHILDCARE: {
    label: "Childcare & Early Education",
    category: "Education & Training",
  },

  // Media & Entertainment
  MEDIA: { label: "Media & Publishing", category: "Media & Entertainment" },
  ENTERTAINMENT: {
    label: "Entertainment Services",
    category: "Media & Entertainment",
  },
  FILM: { label: "Film & Video Production", category: "Media & Entertainment" },
  MUSIC: {
    label: "Music Production & Distribution",
    category: "Media & Entertainment",
  },
  GAMING: { label: "Gaming & Esports", category: "Media & Entertainment" },
  PODCASTING: {
    label: "Podcasting & Audio Content",
    category: "Media & Entertainment",
  },

  // Transportation & Logistics
  LOGISTICS: {
    label: "Logistics & Supply Chain",
    category: "Transportation & Logistics",
  },
  SHIPPING: {
    label: "Shipping & Freight",
    category: "Transportation & Logistics",
  },
  TRANSPORTATION: {
    label: "Transportation Services",
    category: "Transportation & Logistics",
  },
  DELIVERY: {
    label: "Delivery & Courier Services",
    category: "Transportation & Logistics",
  },
  WAREHOUSING: {
    label: "Warehousing & Distribution",
    category: "Transportation & Logistics",
  },

  // Hospitality & Travel
  HOTEL: { label: "Hotels & Accommodations", category: "Hospitality & Travel" },
  TRAVEL: { label: "Travel & Tourism", category: "Hospitality & Travel" },
  EVENT_PLANNING: {
    label: "Event Planning & Management",
    category: "Hospitality & Travel",
  },

  // Energy & Utilities
  ENERGY: { label: "Energy & Utilities", category: "Energy & Utilities" },
  RENEWABLE_ENERGY: {
    label: "Renewable Energy",
    category: "Energy & Utilities",
  },
  OIL_GAS: { label: "Oil & Gas", category: "Energy & Utilities" },
  SOLAR: { label: "Solar Energy", category: "Energy & Utilities" },

  // Agriculture & Environment
  AGRICULTURE: {
    label: "Agriculture & Farming",
    category: "Agriculture & Environment",
  },
  ENVIRONMENTAL: {
    label: "Environmental Services",
    category: "Agriculture & Environment",
  },
  SUSTAINABILITY: {
    label: "Sustainability Consulting",
    category: "Agriculture & Environment",
  },

  // Telecommunications
  TELECOM: { label: "Telecommunications", category: "Telecommunications" },
  ISP: { label: "Internet Service Provider", category: "Telecommunications" },

  // Non-Profit & Social
  NON_PROFIT: {
    label: "Non-Profit Organization",
    category: "Non-Profit & Social",
  },
  CHARITY: { label: "Charity & Philanthropy", category: "Non-Profit & Social" },
  SOCIAL_ENTERPRISE: {
    label: "Social Enterprise",
    category: "Non-Profit & Social",
  },

  // Other
  OTHER: { label: "Other Industry", category: "Other" },
};

/**
 * Group industries by category for dropdown
 */
export function getIndustriesByCategory() {
  const categories: Record<
    string,
    Array<{ value: CompanyIndustry; label: string }>
  > = {};

  (Object.keys(COMPANY_INDUSTRY_LABELS) as CompanyIndustry[]).forEach(
    (industry) => {
      const { label, category } = COMPANY_INDUSTRY_LABELS[industry];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ value: industry, label });
    }
  );

  return categories;
}
