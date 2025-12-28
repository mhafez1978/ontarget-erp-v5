/**
 * Country-specific onboarding document requirements and form templates
 */

export interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  required: boolean;
  downloadUrl?: string; // URL to download blank form template
  helpText?: string; // Additional guidance
}

export interface OnboardingConfig {
  country: string;
  countryCode: string;
  countryName: string;
  documents: DocumentRequirement[];
  requiredOrder: string[]; // Sequential upload order for required docs
}

/**
 * United States onboarding configuration
 */
const US_CONFIG: OnboardingConfig = {
  country: "US",
  countryCode: "US",
  countryName: "United States",
  requiredOrder: [
    "SSN_CARD",
    "DRIVERS_LICENSE",
    "W4_TAX_FORM",
    "I9_FORM",
    "DIRECT_DEPOSIT_FORM",
    "EMPLOYEE_HANDBOOK_SIGNED",
  ],
  documents: [
    {
      type: "SSN_CARD",
      label: "Social Security Card",
      description:
        "Clear photo or scan of your Social Security card (front and back)",
      required: true,
      helpText: "Make sure all numbers are clearly visible",
    },
    {
      type: "DRIVERS_LICENSE",
      label: "Driver's License or State ID",
      description: "Government-issued photo identification",
      required: true,
      helpText: "Both front and back of card, must be current (not expired)",
    },
    {
      type: "W4_TAX_FORM",
      label: "W-4 Tax Withholding Form",
      description: "Federal tax withholding information (completed and signed)",
      required: true,
      downloadUrl: "https://www.irs.gov/pub/irs-pdf/fw4.pdf",
      helpText:
        "Download, fill out, sign, and upload. Use the latest 2024 version.",
    },
    {
      type: "I9_FORM",
      label: "I-9 Employment Eligibility Verification",
      description:
        "Section 1 completed and signed (Section 2 completed by employer)",
      required: true,
      downloadUrl:
        "https://www.uscis.gov/sites/default/files/document/forms/i-9-paper-version.pdf",
      helpText:
        "Complete Section 1 only. Your employer will complete Section 2.",
    },
    {
      type: "DIRECT_DEPOSIT_FORM",
      label: "Direct Deposit Authorization",
      description: "Bank account information for payroll (with voided check)",
      required: true,
      downloadUrl: "/forms/direct-deposit-authorization.pdf",
      helpText:
        "Include a voided check or bank letter showing account and routing numbers",
    },
    {
      type: "EMPLOYEE_HANDBOOK_SIGNED",
      label: "Employee Handbook Acknowledgment",
      description: "Signed acknowledgment that you've read company policies",
      required: true,
      downloadUrl: "/forms/employee-handbook-acknowledgment.pdf",
      helpText: "Sign and date the acknowledgment page",
    },
    {
      type: "STATE_TAX_FORM",
      label: "State Tax Withholding Form (if applicable)",
      description: "State-specific tax withholding form",
      required: false,
      helpText: "Required in certain states. Check with your administrator.",
    },
    {
      type: "WORK_AUTHORIZATION",
      label: "Work Authorization (if applicable)",
      description: "Visa, work permit, EAD, or green card",
      required: false,
      helpText: "Only if you're not a U.S. citizen or permanent resident",
    },
  ],
};

/**
 * Canada onboarding configuration
 */
const CANADA_CONFIG: OnboardingConfig = {
  country: "CA",
  countryCode: "CA",
  countryName: "Canada",
  requiredOrder: [
    "SIN_CARD",
    "DRIVERS_LICENSE",
    "TD1_FORM",
    "DIRECT_DEPOSIT_FORM",
    "EMPLOYEE_HANDBOOK_SIGNED",
  ],
  documents: [
    {
      type: "SIN_CARD",
      label: "Social Insurance Number (SIN)",
      description:
        "Clear photo or scan of your SIN card or confirmation letter",
      required: true,
      helpText: "Ensure all 9 digits are clearly visible",
    },
    {
      type: "DRIVERS_LICENSE",
      label: "Driver's License or Provincial ID",
      description: "Government-issued photo identification",
      required: true,
      helpText: "Current, non-expired ID from any Canadian province",
    },
    {
      type: "TD1_FORM",
      label: "TD1 Tax Credits Form",
      description: "Federal and provincial tax credit declaration",
      required: true,
      downloadUrl:
        "https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1/td1-23e.pdf",
      helpText: "Fill out both federal TD1 and provincial TD1 forms",
    },
    {
      type: "DIRECT_DEPOSIT_FORM",
      label: "Direct Deposit Authorization",
      description: "Bank account information for payroll",
      required: true,
      downloadUrl: "/forms/direct-deposit-authorization-ca.pdf",
      helpText: "Include void cheque or bank letter",
    },
    {
      type: "EMPLOYEE_HANDBOOK_SIGNED",
      label: "Employee Handbook Acknowledgment",
      description: "Signed acknowledgment of company policies",
      required: true,
      downloadUrl: "/forms/employee-handbook-acknowledgment.pdf",
      helpText: "Sign and date the acknowledgment page",
    },
    {
      type: "WORK_AUTHORIZATION",
      label: "Work Permit (if applicable)",
      description: "Work permit or permanent resident card",
      required: false,
      helpText: "Only if you're not a Canadian citizen or permanent resident",
    },
  ],
};

/**
 * United Kingdom onboarding configuration
 */
const UK_CONFIG: OnboardingConfig = {
  country: "GB",
  countryCode: "GB",
  countryName: "United Kingdom",
  requiredOrder: [
    "NI_NUMBER",
    "DRIVERS_LICENSE",
    "P45_FORM",
    "DIRECT_DEPOSIT_FORM",
    "EMPLOYEE_HANDBOOK_SIGNED",
  ],
  documents: [
    {
      type: "NI_NUMBER",
      label: "National Insurance Number",
      description: "NI number confirmation letter or card",
      required: true,
      helpText: "Format: XX 12 34 56 X",
    },
    {
      type: "DRIVERS_LICENSE",
      label: "Driving Licence or Passport",
      description: "Photo identification",
      required: true,
      helpText: "UK driving licence or valid passport",
    },
    {
      type: "P45_FORM",
      label: "P45 Form (if applicable)",
      description: "From your previous employer",
      required: false,
      helpText:
        "Provides your tax code. If you don't have one, we'll use starter checklist.",
    },
    {
      type: "STARTER_CHECKLIST",
      label: "HMRC Starter Checklist",
      description: "New employment declaration if no P45",
      required: false,
      downloadUrl:
        "https://www.gov.uk/government/publications/paye-starter-checklist",
      helpText: "Required only if you don't have a P45",
    },
    {
      type: "DIRECT_DEPOSIT_FORM",
      label: "Bank Details Form",
      description: "UK bank account information for BACS payment",
      required: true,
      downloadUrl: "/forms/direct-deposit-authorization-uk.pdf",
      helpText: "Sort code and account number required",
    },
    {
      type: "EMPLOYEE_HANDBOOK_SIGNED",
      label: "Employee Handbook Acknowledgment",
      description: "Signed acknowledgment of company policies",
      required: true,
      downloadUrl: "/forms/employee-handbook-acknowledgment.pdf",
      helpText: "Sign and date the acknowledgment page",
    },
    {
      type: "RIGHT_TO_WORK",
      label: "Right to Work Document",
      description: "Proof of right to work in the UK",
      required: true,
      helpText:
        "Passport, biometric residence permit, or share code from gov.uk",
    },
  ],
};

/**
 * Default/International configuration (for countries not specifically supported)
 */
const DEFAULT_CONFIG: OnboardingConfig = {
  country: "OTHER",
  countryCode: "OTHER",
  countryName: "International",
  requiredOrder: [
    "TAX_ID",
    "PHOTO_ID",
    "TAX_FORM",
    "DIRECT_DEPOSIT_FORM",
    "EMPLOYEE_HANDBOOK_SIGNED",
  ],
  documents: [
    {
      type: "TAX_ID",
      label: "Tax Identification Number",
      description: "National tax ID, VAT number, or equivalent",
      required: true,
      helpText: "Your country's tax identification document",
    },
    {
      type: "PHOTO_ID",
      label: "Government-Issued Photo ID",
      description: "Passport, national ID card, or driver's license",
      required: true,
      helpText: "Must be current and not expired",
    },
    {
      type: "TAX_FORM",
      label: "Tax Declaration Form",
      description: "Country-specific tax withholding or declaration",
      required: true,
      downloadUrl: "/forms/international-tax-form.pdf",
      helpText: "Complete your country's tax withholding form",
    },
    {
      type: "DIRECT_DEPOSIT_FORM",
      label: "Payment Details Form",
      description: "Bank account or payment method information",
      required: true,
      downloadUrl: "/forms/payment-details-international.pdf",
      helpText: "International bank transfer details (IBAN/SWIFT)",
    },
    {
      type: "EMPLOYEE_HANDBOOK_SIGNED",
      label: "Employee Handbook Acknowledgment",
      description: "Signed acknowledgment of company policies",
      required: true,
      downloadUrl: "/forms/employee-handbook-acknowledgment.pdf",
      helpText: "Sign and date the acknowledgment page",
    },
    {
      type: "WORK_AUTHORIZATION",
      label: "Work Authorization (if applicable)",
      description: "Work permit, visa, or employment authorization",
      required: false,
      helpText: "If required in your country",
    },
  ],
};

/**
 * Country-specific configurations map
 */
const COUNTRY_CONFIGS: Record<string, OnboardingConfig> = {
  US: US_CONFIG,
  CA: CANADA_CONFIG,
  GB: UK_CONFIG,
  UK: UK_CONFIG, // Alias
};

/**
 * Get onboarding configuration for a specific country
 */
export function getOnboardingConfig(
  countryCode?: string | null
): OnboardingConfig {
  if (!countryCode) return DEFAULT_CONFIG;

  const normalizedCode = countryCode.toUpperCase();
  return COUNTRY_CONFIGS[normalizedCode] || DEFAULT_CONFIG;
}

/**
 * Get required document types for sequential upload validation
 */
export function getRequiredDocumentOrder(
  countryCode?: string | null
): string[] {
  const config = getOnboardingConfig(countryCode);
  return config.requiredOrder;
}

/**
 * Check if a document upload is in the correct sequence
 */
export function checkSequentialUpload(
  docType: string,
  uploadedDocTypes: string[] = [],
  countryCode?: string | null
): { ok: boolean; missingPrereqs?: string[] } {
  const requiredOrder = getRequiredDocumentOrder(countryCode);

  if (!requiredOrder.includes(docType)) {
    // Non-sequential/optional docs are allowed anytime
    return { ok: true };
  }

  const index = requiredOrder.indexOf(docType);
  if (index <= 0) return { ok: true };

  const missing = requiredOrder
    .slice(0, index)
    .filter((r) => !uploadedDocTypes.includes(r));

  return { ok: missing.length === 0, missingPrereqs: missing };
}
