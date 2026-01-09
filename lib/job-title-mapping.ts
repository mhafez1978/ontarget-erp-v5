// Job Title normalization utility
// Converts common job title inputs to a consistent format

const JOBTITLE_SYNONYMS: Record<string, string> = {
  manager: "Manager",
  mgr: "Manager",
  "manager role": "Manager",
  manager_role: "Manager",
  engineer: "Engineer",
  eng: "Engineer",
  developer: "Developer",
  dev: "Developer",
  "sales rep": "Sales Rep",
  salesrep: "Sales Rep",
  "sales representative": "Sales Rep",
  "customer service": "Customer Service",
  "customer support": "Customer Support",
  hr: "HR Staff",
  "hr manager": "HR Manager",
  cto: "CTO",
  ceo: "CEO",
  cfo: "CFO",
  coo: "COO",
  cmo: "CMO",
  marketer: "Marketing Staff",
  "marketing manager": "Marketing Manager",
  accountant: "Accountant",
  analyst: "Analyst",
  intern: "Intern",
  technician: "Technician",
  "field tech": "Field Tech",
  supervisor: "Supervisor",
  coordinator: "Coordinator",
  specialist: "Specialist",
  administrator: "Administrator",
  admin: "Administrator",
  director: "Director",
  "vice president": "Vice President",
  vp: "Vice President",
  president: "President",
};

/**
 * Normalizes a job title string to a consistent format.
 * - Trims whitespace
 * - Maps common synonyms to standard titles
 * - Returns title-cased string
 * @param input - The raw job title string
 * @returns Normalized job title string or undefined if empty
 */
export function normalizeJobTitle(input?: string): string | undefined {
  if (!input) return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const key = trimmed.toLowerCase();

  // Check if there's a synonym mapping
  const mapped = JOBTITLE_SYNONYMS[key];
  if (mapped) {
    return mapped;
  }

  // If no mapping, return title-cased version
  return toTitleCase(trimmed);
}

/**
 * Converts a string to title case (e.g., "senior developer" -> "Senior Developer")
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s_-]+/) // Split on spaces, underscores, or hyphens
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
