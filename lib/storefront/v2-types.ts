import type { AiFrontstoreSpec } from "@/lib/ai/ai-storefront-types";

export interface ChatIntentHints {
  style?: string;
  goal?: "sell-products" | "sell-services" | "lead-gen" | "bookings";
  emphasis?: "balanced" | "products" | "services" | "testimonials";
  includeBlog?: boolean;
  includeCart?: boolean;
}

export interface ChatRequestBody {
  companyId: string;
  conversationId?: string;
  message: string;
  previewOnly?: boolean;
  intentHints?: ChatIntentHints;
  applyVersionId?: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "ai" | "system";
  content?: string | null;
  toolsUsed?: Record<string, unknown> | null;
  specVersionId?: string | null;
  isApplied: boolean;
  isPreviewOnly: boolean;
  createdAt: string;
}

export interface ChatResponse {
  messages: ChatMessageRecord[];
  specDelta?: AiFrontstoreSpec | null;
  previewSpec?: AiFrontstoreSpec | null;
  versionId?: string | null;
  actions?: string[]; // e.g., ["apply", "export", "rollback"]
}

export interface ConversationSummary {
  id: string;
  companyId: string;
  createdBy?: string | null;
  status: string;
  lastMessageAt?: string | null;
  createdAt: string;
}

export interface ApplyVersionRequest {
  companyId: string;
  versionId: string;
}

export interface RollbackRequest {
  companyId: string;
  versionId: string;
}
