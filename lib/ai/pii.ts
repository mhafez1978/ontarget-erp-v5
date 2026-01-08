export function scrubPII(text: string): string {
  if (!text) return text;

  // redact emails
  text = text.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[REDACTED_EMAIL]"
  );
  // redact phone-like numbers (naive)
  text = text.replace(/\+?\d[\d\-\s]{6,}\d/g, "[REDACTED_PHONE]");
  // redact simple SSN-like numbers (XXX-XX-XXXX)
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
  // redact potential credit card patterns (very naive)
  text = text.replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CC]");
  // redact URLs
  text = text.replace(/https?:\/\/[^\s]+/gi, "[REDACTED_URL]");

  return text;
}
