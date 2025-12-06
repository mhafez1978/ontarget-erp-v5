/**
 * Storefront Readiness Checker
 *
 * Evaluates storefront completeness and provides actionable feedback
 * for improving the customer-facing store experience.
 */

export interface StorefrontReadiness {
  isReady: boolean;
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  missing: {
    products: boolean;
    services: boolean;
    teamMembers: boolean;
    testimonials: boolean;
    banner: boolean;
    customers: boolean;
    logo: boolean;
    description: boolean;
    contact: boolean;
  };
  counts: {
    products: number;
    services: number;
    teamMembers: number;
    testimonials: number;
    customers: number;
  };
  suggestions: string[];
  warnings: string[];
}

interface StorefrontData {
  productsCount: number;
  servicesCount: number;
  teamMembersCount: number;
  testimonialsCount: number;
  customersCount?: number;
  hasBanner: boolean;
  hasLogo: boolean;
  hasDescription: boolean;
  hasContactInfo: boolean;
  isStoreEnabled: boolean;
}

/**
 * Calculate storefront readiness score and provide recommendations
 */
export function checkStorefrontReadiness(
  data: StorefrontData
): StorefrontReadiness {
  const suggestions: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Scoring weights (total: 100 points)
  const weights = {
    products: 25, // Critical for e-commerce
    services: 15, // Important for service businesses
    banner: 15, // Visual impact
    teamMembers: 10, // Trust building
    testimonials: 15, // Social proof
    logo: 10, // Branding
    description: 5, // SEO/clarity
    contact: 5, // Customer service
  };

  // Check products (25 points max)
  if (data.productsCount === 0) {
    warnings.push("No products listed. Customers can't purchase anything.");
    suggestions.push("Add at least 5-10 products to showcase your offerings");
  } else if (data.productsCount < 3) {
    score += weights.products * 0.3;
    suggestions.push(
      `Add more products (currently ${data.productsCount}). Aim for at least 5-10 products.`
    );
  } else if (data.productsCount < 5) {
    score += weights.products * 0.6;
    suggestions.push("Consider adding more product variety");
  } else if (data.productsCount < 10) {
    score += weights.products * 0.9;
  } else {
    score += weights.products;
  }

  // Check services (15 points max)
  if (data.servicesCount === 0) {
    suggestions.push(
      "Consider adding services to complement your product offerings"
    );
  } else if (data.servicesCount < 3) {
    score += weights.services * 0.5;
    suggestions.push(
      `Add more services (currently ${data.servicesCount}). Aim for 3-5 services.`
    );
  } else if (data.servicesCount < 5) {
    score += weights.services * 0.8;
  } else {
    score += weights.services;
  }

  // Check banner (15 points)
  if (!data.hasBanner) {
    suggestions.push(
      "Upload a banner image to make your storefront more visually appealing"
    );
  } else {
    score += weights.banner;
  }

  // Check team members (10 points)
  if (data.teamMembersCount === 0) {
    suggestions.push("Add team member profiles to build trust with customers");
  } else if (data.teamMembersCount < 3) {
    score += weights.teamMembers * 0.7;
    suggestions.push("Feature more team members to strengthen customer trust");
  } else {
    score += weights.teamMembers;
  }

  // Check testimonials (15 points)
  if (data.testimonialsCount === 0) {
    warnings.push("No customer testimonials. Social proof is crucial.");
    suggestions.push(
      "Add customer testimonials to build credibility and trust"
    );
  } else if (data.testimonialsCount < 3) {
    score += weights.testimonials * 0.6;
    suggestions.push(
      `Add more testimonials (currently ${data.testimonialsCount}). Aim for at least 3-5.`
    );
  } else if (data.testimonialsCount < 5) {
    score += weights.testimonials * 0.9;
  } else {
    score += weights.testimonials;
  }

  // Check logo (10 points)
  if (!data.hasLogo) {
    suggestions.push("Upload your company logo for better branding");
  } else {
    score += weights.logo;
  }

  // Check description (5 points)
  if (!data.hasDescription) {
    suggestions.push("Add a company description for SEO and clarity");
  } else {
    score += weights.description;
  }

  // Check contact info (5 points)
  if (!data.hasContactInfo) {
    suggestions.push(
      "Add contact information (email, phone) so customers can reach you"
    );
  } else {
    score += weights.contact;
  }

  // Customers (informational) — do not alter scoring but surface suggestions
  if ((data.customersCount ?? 0) === 0) {
    suggestions.push(
      "Consider building an initial customer base — encourage signups or import customer data."
    );
  }

  // Additional warnings
  if (data.isStoreEnabled && score < 50) {
    warnings.push(
      "Your storefront is live but incomplete. Consider adding more content before promoting it."
    );
  }

  if (data.productsCount === 0 && data.servicesCount === 0) {
    warnings.push(
      "Critical: No products or services available. Customers cannot make purchases."
    );
  }

  // Determine grade
  let grade: "A" | "B" | "C" | "D" | "F";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  // Ready threshold: score >= 70 and at least some products
  const isReady =
    score >= 70 &&
    (data.productsCount > 0 || data.servicesCount > 0) &&
    data.hasBanner;

  return {
    isReady,
    score: Math.round(score),
    grade,
    missing: {
      products: data.productsCount === 0,
      services: data.servicesCount === 0,
      teamMembers: data.teamMembersCount === 0,
      testimonials: data.testimonialsCount === 0,
      customers: (data.customersCount ?? 0) === 0,
      banner: !data.hasBanner,
      logo: !data.hasLogo,
      description: !data.hasDescription,
      contact: !data.hasContactInfo,
    },
    counts: {
      products: data.productsCount,
      services: data.servicesCount,
      teamMembers: data.teamMembersCount,
      testimonials: data.testimonialsCount,
      customers: data.customersCount ?? 0,
    },
    suggestions,
    warnings,
  };
}

/**
 * Get priority action items for improving storefront
 */
export function getPriorityActions(
  readiness: StorefrontReadiness
): { priority: "critical" | "high" | "medium"; action: string }[] {
  const actions: {
    priority: "critical" | "high" | "medium";
    action: string;
  }[] = [];

  // Critical actions
  if (readiness.missing.products && readiness.missing.services) {
    actions.push({
      priority: "critical",
      action: "Add products or services - your store has nothing to sell",
    });
  } else if (readiness.missing.products && readiness.counts.services < 3) {
    actions.push({
      priority: "critical",
      action: "Add products to give customers more options",
    });
  }

  // High priority actions
  if (readiness.missing.banner) {
    actions.push({
      priority: "high",
      action: "Upload a hero banner image for better first impression",
    });
  }

  if (readiness.missing.testimonials) {
    actions.push({
      priority: "high",
      action: "Add customer testimonials to build trust",
    });
  }

  if (readiness.counts.products > 0 && readiness.counts.products < 5) {
    actions.push({
      priority: "high",
      action: `Add more products (currently ${readiness.counts.products}, aim for 5-10)`,
    });
  }

  // Medium priority actions
  if (readiness.missing.teamMembers) {
    actions.push({
      priority: "medium",
      action: "Add team member profiles to humanize your brand",
    });
  }

  if (readiness.missing.logo) {
    actions.push({
      priority: "medium",
      action: "Upload your company logo",
    });
  }

  if (readiness.missing.description) {
    actions.push({
      priority: "medium",
      action: "Add company description for SEO",
    });
  }

  if (readiness.missing.contact) {
    actions.push({
      priority: "medium",
      action: "Add contact information (email, phone)",
    });
  }

  return actions;
}
