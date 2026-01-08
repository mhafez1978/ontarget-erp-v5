// Types for Frontstore V5 (strict, reusable across client + server)

export type Asset =
  | string
  | {
      url: string;
      alt?: string | null;
      provider?: string | null; // e.g. 'unsplash', 'pexels', 'unsplash-source', 'placeholder'
      attribution?: {
        userName?: string | null;
        userUrl?: string | null;
        imagePage?: string | null;
      } | null;
    };

export interface Variant {
  variantId: string;
  layout: string;
  schema: Record<string, unknown>;
  assets?: Asset[];
  meta?: Record<string, unknown> & { score?: number };
}

export interface GeneratedSection {
  id: string;
  companyId: string;
  pageId?: string | null;
  personaId?: string | null;
  kind: string;
  layout?: string | null;
  schema: Record<string, unknown>;
  variants: Variant[];
  status: "PENDING" | "GENERATED" | "ACCEPTED" | "FAILED" | string;
  generatedAt?: Date | null;
  acceptedAt?: Date | null;
}

export interface GeneratedPageDraft {
  id: string;
  companyId: string;
  pageId?: string | null;
  name?: string | null;
  sections: Array<{ sectionId: string; variantId?: string | null }>;
  status: "DRAFT" | "PUBLISHED" | string;
  createdBy?: string;
}

export interface GenerationJob {
  id: string;
  companyId: string;
  sectionKind: string;
  personaId?: string | null;
  inputPrompt?: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}

// Session user (minimal view used by APIs)
export interface SessionUser {
  id: string;
  companyId?: string | null;
  companyName?: string | null;
  ownedCompanies?: Array<{ id: string; name?: string }> | null;
}

// Request bodies
export interface GenerateRequest {
  pageId?: string | null;
  prompt: string;
  kind: string;
  personaId?: string | null;
  layoutHints?: string[] | null;
}

export interface AcceptRequest {
  variantId?: string | null;
  draftId?: string | null;
  pageId?: string | null;
}

export interface CreatePageRequest {
  slug: string;
  title: string;
}

export interface AcceptResponseBody {
  success: boolean;
  draftId?: string | null;
  sectionId?: string | null;
}

// SSE events emitted by conductor
export type ConductorEventPayloads =
  | { event: "personaSelected"; data: { persona: string; confidence: number } }
  | { event: "variant"; data: { variant: Variant } }
  | { event: "done"; data: { sectionId: string; jobId: string } }
  | { event: "error"; data: { message: string } }
  | { event: "debug"; data: unknown };
