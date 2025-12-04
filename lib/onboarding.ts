export const REQUIRED_ONBOARDING_ORDER = [
  "SSN_CARD",
  "DRIVERS_LICENSE",
  "W4_TAX_FORM",
  "I9_FORM",
  "DIRECT_DEPOSIT_FORM",
  "EMPLOYEE_HANDBOOK_SIGNED",
];

export function checkSequentialUpload(
  docType: string,
  uploadedDocTypes: string[] = []
): { ok: boolean; missingPrereqs?: string[] } {
  if (!REQUIRED_ONBOARDING_ORDER.includes(docType)) {
    // Non-sequential/optional docs are allowed anytime
    return { ok: true };
  }

  const index = REQUIRED_ONBOARDING_ORDER.indexOf(docType);
  if (index <= 0) return { ok: true };

  const missing = REQUIRED_ONBOARDING_ORDER.slice(0, index).filter(
    (r) => !uploadedDocTypes.includes(r)
  );

  return { ok: missing.length === 0, missingPrereqs: missing };
}

export default { REQUIRED_ONBOARDING_ORDER, checkSequentialUpload };
