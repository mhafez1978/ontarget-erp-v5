"use client";

import {
  MapPin,
  Info,
  Key,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Database,
  Users,
  Mail,
  Eye,
  EyeOff,
  UsersRound,
  Sparkles,
  CreditCard,
  Lock,
  Webhook,
  AlertTriangle,
  Video,
  Shield,
  ImageIcon,
  Link,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { GeoTrackingProviderCards } from "@/components/geo-tracking-provider-cards";
import PaymentProviderCards from "@/components/payment-provider-cards";
import { StorageProviderCards } from "@/components/storage-provider-cards";
import { EmailProviderCards } from "@/components/email-provider-cards";
import { SubscriptionPlanCards } from "@/components/subscription-plan-cards";
import { UserManagementTable } from "@/components/user-management-table";
import { TeamsManagement } from "@/components/teams-management";
import { CreateTeamDialog } from "@/components/create-team-dialog";
import { EditTeamDialog } from "@/components/edit-team-dialog";
import { DeleteTeamDialog } from "@/components/delete-team-dialog";
import { AddTeamMemberDialog } from "@/components/add-team-member-dialog";
import { PricingManagement } from "@/components/admin/pricing-management";
import { PasswordManagementTab } from "@/components/password-management-tab";
import { WebhookManager } from "@/components/dashboard/webhook-manager";
import ImageProviderCards from "@/components/image-provider-cards";
import { DangerZone } from "@/components/danger-zone";
import { BorderBeam } from "@/components/ui/border-beam";
import { HederaSettingsForm } from "@/components/hedera-settings-form";
import { CompanyBlockchainList } from "@/components/company-blockchain-list";
import { HederaCostDashboard } from "@/components/hedera-cost-dashboard";
import {
  getModelsForProvider,
  estimateGenerationCost,
  formatCost,
  getRelativeCostMultiplier,
  type ModelInfo,
} from "@/lib/ai/model-config";

interface OAuthProvider {
  id: string;
  provider:
    | "google"
    | "microsoft"
    | "github"
    | "linkedin"
    | "yahoo"
    | "line"
    | "yandex"
    | "wechat";
  enabled: boolean;
  clientId: string;
  clientSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function SettingsPage() {
  const router = useRouter();

  // OAuth Providers state
  const [oauthProviders, setOauthProviders] = useState<{
    google: { enabled: boolean; clientId: string; clientSecret: string };
    microsoft: { enabled: boolean; clientId: string; clientSecret: string };
    github: { enabled: boolean; clientId: string; clientSecret: string };
    linkedin: { enabled: boolean; clientId: string; clientSecret: string };
    yahoo: { enabled: boolean; clientId: string; clientSecret: string };
    line: { enabled: boolean; clientId: string; clientSecret: string };
    yandex: { enabled: boolean; clientId: string; clientSecret: string };
    wechat: { enabled: boolean; clientId: string; clientSecret: string };
  }>({
    google: { enabled: false, clientId: "", clientSecret: "" },
    microsoft: { enabled: false, clientId: "", clientSecret: "" },
    github: { enabled: false, clientId: "", clientSecret: "" },
    linkedin: { enabled: false, clientId: "", clientSecret: "" },
    yahoo: { enabled: false, clientId: "", clientSecret: "" },
    line: { enabled: false, clientId: "", clientSecret: "" },
    yandex: { enabled: false, clientId: "", clientSecret: "" },
    wechat: { enabled: false, clientId: "", clientSecret: "" },
  });
  const [oauthLoading, setOauthLoading] = useState<{
    google: boolean;
    microsoft: boolean;
    github: boolean;
    linkedin: boolean;
    yahoo: boolean;
    line: boolean;
    yandex: boolean;
    wechat: boolean;
  }>({
    google: false,
    microsoft: false,
    github: false,
    linkedin: false,
    yahoo: false,
    line: false,
    yandex: false,
    wechat: false,
  });

  // AI Provider (LLM for AI Storefront) state - Super Admin only
  const [aiProviderLoading, setAiProviderLoading] = useState(false);
  const [aiProviderSaving, setAiProviderSaving] = useState(false);
  const [aiProviderTesting, setAiProviderTesting] = useState(false);
  const [aiProviderType, setAiProviderType] = useState("openai");
  const [aiProviderEnabled, setAiProviderEnabled] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiApiBase, setAiApiBase] = useState("");
  const [aiHasExistingKey, setAiHasExistingKey] = useState(false);
  const [dynamicModels, setDynamicModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // State to track password visibility for each provider
  const [showSecrets, setShowSecrets] = useState<{
    google: boolean;
    microsoft: boolean;
    github: boolean;
    linkedin: boolean;
    yahoo: boolean;
    line: boolean;
    yandex: boolean;
    wechat: boolean;
  }>({
    google: false,
    microsoft: false,
    github: false,
    linkedin: false,
    yahoo: false,
    line: false,
    yandex: false,
    wechat: false,
  });

  const [user, setUser] = useState({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
    plan: "ESSENTIAL",
    companyId: null as string | null,
  });

  const [canCustomizeOAuth, setCanCustomizeOAuth] = useState(false);

  // Teams Management state
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [showEditTeamDialog, setShowEditTeamDialog] = useState(false);
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const [showManageMembersDialog, setShowManageMembersDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
    description: string | null;
    companyId: string;
    memberCount?: number;
    projectCount?: number;
    members?: Array<{ id: string; staffId: string; user: { id: string } }>;
  } | null>(null);
  const [teamsRefreshKey, setTeamsRefreshKey] = useState(0);
  const [activeUserManagementTab, setActiveUserManagementTab] = useState<
    "users" | "teams" | "passwords"
  >("users");
  const [selectedCompanyForTeams, setSelectedCompanyForTeams] = useState<
    string | null
  >(null);
  const [availableCompanies, setAvailableCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data.authenticated || data.user.role === "GUEST") {
          router.push("/");
          return;
        }

        // Only allow specific roles to access settings
        const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
        if (!allowedRoles.includes(data.user.role)) {
          router.push("/dashboard");
          return;
        }

        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
          plan: data.user.plan || "ESSENTIAL",
          companyId: data.user.companyId || null,
        });

        // Fetch companies for SUPER_ADMIN and ADMIN to manage teams
        if (data.user.role === "SUPER_ADMIN" || data.user.role === "ADMIN") {
          try {
            const companiesResponse = await fetch("/api/companies/my-owned");
            const companiesData = await companiesResponse.json();
            if (companiesResponse.ok && companiesData.companies) {
              setAvailableCompanies(companiesData.companies);
              // Auto-select first company if available
              if (companiesData.companies.length > 0) {
                setSelectedCompanyForTeams(companiesData.companies[0].id);
              }
            }
          } catch (err) {
            console.error("Failed to fetch companies:", err);
          }
        }
      } catch (error) {
        console.error("Failed to check user:", error);
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  // Load current settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load OAuth provider settings
        let providers: OAuthProvider[] = [];
        const oauthResponse = await fetch("/api/settings/oauth-providers");
        if (oauthResponse.ok) {
          const oauthData = await oauthResponse.json();
          providers = oauthData.providers || [];

          // Set customization permission
          setCanCustomizeOAuth(oauthData.canCustomize || false);
        }

        // Prepare provider lookups for use below even if captcha fails
        const googleProvider = providers.find(
          (p: OAuthProvider) => p.provider === "google"
        );
        const microsoftProviderPre = providers.find(
          (p: OAuthProvider) => p.provider === "microsoft"
        );
        const githubProviderPre = providers.find(
          (p: OAuthProvider) => p.provider === "github"
        );
        const linkedinProviderPre = providers.find(
          (p: OAuthProvider) => p.provider === "linkedin"
        );
        const yahooProviderPre = providers.find(
          (p: OAuthProvider) => p.provider === "yahoo"
        );
        const lineProviderPre = providers.find(
          (p: OAuthProvider) => p.provider === "line"
        );
        const yandexProviderPre = providers.find(
          (p: OAuthProvider) => p.provider === "yandex"
        );
        const wechatProviderPre = providers.find(
          (p: OAuthProvider) => p.provider === "wechat"
        );
        // Load Captcha settings
        try {
          const captchaResp = await fetch("/api/settings/captcha");
          if (captchaResp.ok) {
            const data = await captchaResp.json();
            setGlobalCaptchaActive(!!data.isActive);
            setGlobalCaptchaSiteKey(data.siteKey || "");
            // Never set secret key for security - but we know it exists if siteKey exists
            setCompanyCaptchaFallback({
              active: !!data.fallback?.isActive,
              siteKey: data.fallback?.siteKey || "",
            });
          }
        } catch (e) {
          console.warn("Failed to load captcha settings", e);
        }

        // Set OAuth providers (moved outside captcha try-catch)
        const microsoftProvider = microsoftProviderPre;
        const githubProvider = githubProviderPre;
        const linkedinProvider = linkedinProviderPre;
        const yahooProvider = yahooProviderPre;
        const lineProvider = lineProviderPre;
        const yandexProvider = yandexProviderPre;
        const wechatProvider = wechatProviderPre;

        setOauthProviders({
          google: {
            enabled: googleProvider?.enabled || false,
            clientId: googleProvider?.clientId || "",
            clientSecret: googleProvider?.clientSecret || "",
          },
          microsoft: {
            enabled: microsoftProvider?.enabled || false,
            clientId: microsoftProvider?.clientId || "",
            clientSecret: microsoftProvider?.clientSecret || "",
          },
          github: {
            enabled: githubProvider?.enabled || false,
            clientId: githubProvider?.clientId || "",
            clientSecret: githubProvider?.clientSecret || "",
          },
          linkedin: {
            enabled: linkedinProvider?.enabled || false,
            clientId: linkedinProvider?.clientId || "",
            clientSecret: linkedinProvider?.clientSecret || "",
          },
          yahoo: {
            enabled: yahooProvider?.enabled || false,
            clientId: yahooProvider?.clientId || "",
            clientSecret: yahooProvider?.clientSecret || "",
          },
          line: {
            enabled: lineProvider?.enabled || false,
            clientId: lineProvider?.clientId || "",
            clientSecret: lineProvider?.clientSecret || "",
          },
          yandex: {
            enabled: yandexProvider?.enabled || false,
            clientId: yandexProvider?.clientId || "",
            clientSecret: yandexProvider?.clientSecret || "",
          },
          wechat: {
            enabled: wechatProvider?.enabled || false,
            clientId: wechatProvider?.clientId || "",
            clientSecret: wechatProvider?.clientSecret || "",
          },
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Load AI provider (LLM) settings for Super Admin
  useEffect(() => {
    if (user.role !== "SUPER_ADMIN") return;

    const loadAiProvider = async () => {
      try {
        setAiProviderLoading(true);
        const response = await fetch("/api/settings/ai-provider?scope=GLOBAL");
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (data.provider) {
          const provider = data.provider as {
            provider: string;
            isActive: boolean;
            model?: string | null;
            apiBase?: string | null;
            hasApiKey: boolean;
          };
          setAiProviderType(provider.provider || "openai");
          setAiProviderEnabled(!!provider.isActive);
          setAiModel(provider.model || "gpt-4o-mini");
          setAiApiBase(provider.apiBase || "");
          setAiHasExistingKey(provider.hasApiKey);
          // Never hydrate the real API key into the UI for security.
          setAiApiKey("");
        }
      } catch (error) {
        console.error("Failed to load AI provider settings:", error);
      } finally {
        setAiProviderLoading(false);
      }
    };

    loadAiProvider();
  }, [user.role]);

  // Video Provider (LTX/Hugging Face) settings - Super Admin only
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoTesting, setVideoTesting] = useState(false);
  const [videoPrimary, setVideoPrimary] = useState("ltx");

  const [ltxKey, setLtxKey] = useState("");
  const [ltxSecret, setLtxSecret] = useState("");
  const [ltxEnabled, setLtxEnabled] = useState(false);
  const [hfToken, setHfToken] = useState("");
  const [hfEnabled, setHfEnabled] = useState(false);

  const [hasLtxKey, setHasLtxKey] = useState(false);
  const [hasLtxSecret, setHasLtxSecret] = useState(false);
  const [hasHfToken, setHasHfToken] = useState(false);

  const [testResult, setTestResult] = useState<null | {
    ok: boolean;
    error?: string;
  }>(null);

  useEffect(() => {
    if (user.role !== "SUPER_ADMIN") return;

    const loadVideoProvider = async () => {
      try {
        setVideoLoading(true);
        const resp = await fetch("/api/settings/video-provider");
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.config) {
          setLtxEnabled(!!data.config.ltxEnabled);
          setHfEnabled(!!data.config.hfEnabled);
          setVideoPrimary(data.config.primaryProvider || "ltx");
          setHasLtxKey(!!data.config.hasLtxApiKey);
          setHasLtxSecret(!!data.config.hasLtxSecret);
          setHasHfToken(!!data.config.hasHfApiToken);
        }
      } catch (err) {
        console.error("Failed to load video provider settings:", err);
      } finally {
        setVideoLoading(false);
      }
    };

    loadVideoProvider();
  }, [user.role]);

  const saveVideoProvider = async () => {
    if (user.role !== "SUPER_ADMIN") return;
    try {
      setVideoSaving(true);
      const resp = await fetch("/api/settings/video-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ltxApiKey: ltxKey,
          ltxSecret,
          hfApiToken: hfToken,
          ltxEnabled,
          hfEnabled,
          primaryProvider: videoPrimary,
        }),
      });
      if (!resp.ok) throw new Error("Failed to save");
      const data = await resp.json();
      if (data.success) {
        setHasLtxKey(!!ltxKey || hasLtxKey);
        setHasLtxSecret(!!ltxSecret || hasLtxSecret);
        setHasHfToken(!!hfToken || hasHfToken);
        toast.success("Video provider settings saved");
      }
    } catch (err) {
      console.error("Save video provider failed:", err);
      toast.error("Failed to save video provider settings");
    } finally {
      setVideoSaving(false);
    }
  };

  const testVideoProvider = async () => {
    if (user.role !== "SUPER_ADMIN") return;
    try {
      setVideoTesting(true);
      const resp = await fetch("/api/settings/video-provider/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: videoPrimary }),
      });
      const data = await resp.json();

      if (resp.ok && data.ok) {
        setTestResult({ ok: true });
        toast.success("Video provider test succeeded");
      } else {
        setTestResult({
          ok: false,
          error: data.error || data.statusText || "Unknown",
        });
        toast.error("Video provider test failed");
      }
    } catch (err) {
      console.error("Test video provider failed:", err);
      setTestResult({ ok: false, error: String(err) });
      toast.error("Video provider test failed");
    } finally {
      setVideoTesting(false);
    }
  };

  // Auto-update model when provider changes and fetch dynamic models
  useEffect(() => {
    const fetchDynamicModels = async () => {
      // Only fetch if we have an API key (saved OR currently entered)
      const hasApiKey = aiHasExistingKey || aiApiKey.trim().length > 0;

      if (!hasApiKey) {
        // If no API key at all, use fallback models
        const fallbackModels = getModelsForProvider(
          aiProviderType as "openai" | "anthropic" | "deepseek"
        );
        setDynamicModels(fallbackModels);
        return;
      }

      console.log(
        `[Settings Page] Fetching dynamic models for ${aiProviderType}, hasApiKey: ${hasApiKey}`
      );
      setModelsLoading(true);
      try {
        const response = await fetch("/api/settings/ai-provider/models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: aiProviderType,
            forceRefresh: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.models && data.models.length > 0) {
            setDynamicModels(data.models);

            // Auto-select recommended model if current model not in list
            const currentModelExists = data.models.find(
              (m: ModelInfo) => m.id === aiModel
            );
            if (!currentModelExists) {
              const recommended = data.models.find(
                (m: ModelInfo) => m.recommended
              );
              if (recommended) {
                setAiModel(recommended.id);
              } else if (data.models[0]) {
                setAiModel(data.models[0].id);
              }
            }
          } else {
            // Fallback to static models
            const fallbackModels = getModelsForProvider(
              aiProviderType as "openai" | "anthropic" | "deepseek"
            );
            setDynamicModels(fallbackModels);
          }
        } else {
          // Fallback to static models on error
          const fallbackModels = getModelsForProvider(
            aiProviderType as "openai" | "anthropic" | "deepseek"
          );
          setDynamicModels(fallbackModels);
        }
      } catch (error) {
        console.error("Failed to fetch dynamic models:", error);
        // Fallback to static models
        const fallbackModels = getModelsForProvider(
          aiProviderType as "openai" | "anthropic" | "deepseek"
        );
        setDynamicModels(fallbackModels);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchDynamicModels();
  }, [aiProviderType, aiHasExistingKey, aiApiKey, aiModel]);

  const handleAiProviderSave = async () => {
    if (user.role !== "SUPER_ADMIN") {
      toast.error("Only Super Admin can manage AI provider settings");
      return;
    }

    setAiProviderSaving(true);
    try {
      const response = await fetch("/api/settings/ai-provider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope: "GLOBAL",
          provider: aiProviderType || "openai",
          isActive: aiProviderEnabled,
          // Only send apiKey if user typed something, otherwise keep existing encrypted key in DB
          apiKey: aiApiKey.trim() ? aiApiKey.trim() : undefined,
          model: aiModel.trim() || undefined,
          apiBase: aiApiBase.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error || "Failed to save AI provider settings. Please try again."
        );
        return;
      }

      const provider = data.provider as {
        isActive: boolean;
        model?: string | null;
        apiBase?: string | null;
        hasApiKey: boolean;
      };

      setAiProviderEnabled(!!provider.isActive);
      setAiModel(provider.model || "gpt-4o-mini");
      setAiApiBase(provider.apiBase || "");
      setAiHasExistingKey(provider.hasApiKey);
      // Clear local apiKey field after save to avoid showing secrets
      setAiApiKey("");

      toast.success("AI provider settings saved");
    } catch (error) {
      console.error("Failed to save AI provider settings:", error);
      toast.error("Failed to save AI provider settings");
    } finally {
      setAiProviderSaving(false);
    }
  };

  // Captcha settings state
  const [globalCaptchaActive, setGlobalCaptchaActive] = useState(false);
  const [globalCaptchaSiteKey, setGlobalCaptchaSiteKey] = useState("");
  const [globalCaptchaSecretKey, setGlobalCaptchaSecretKey] = useState("");
  const [captchaSaving, setCaptchaSaving] = useState(false);
  const [companyCaptchaActive, setCompanyCaptchaActive] = useState(false);
  const [companyCaptchaSiteKey, setCompanyCaptchaSiteKey] = useState("");
  const [companyCaptchaSecretKey, setCompanyCaptchaSecretKey] = useState("");
  const [companyCaptchaFallback, setCompanyCaptchaFallback] = useState<{
    active: boolean;
    siteKey: string;
  }>({ active: false, siteKey: "" });

  const saveGlobalCaptcha = async () => {
    if (user.role !== "SUPER_ADMIN") {
      toast.error("Only Super Admin can manage global captcha");
      return;
    }
    setCaptchaSaving(true);
    try {
      const resp = await fetch("/api/settings/captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "GOOGLE_RECAPTCHA",
          siteKey: globalCaptchaSiteKey.trim(),
          secretKey: globalCaptchaSecretKey.trim(),
          isActive: globalCaptchaActive,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "Failed to save global captcha");
      } else {
        toast.success("Global captcha settings saved");
        setGlobalCaptchaSecretKey("");
      }
    } catch {
      toast.error("Error saving captcha settings");
    } finally {
      setCaptchaSaving(false);
    }
  };

  const saveCompanyCaptcha = async () => {
    if (user.role !== "ADMIN") {
      toast.error("Only Company Admin can manage company captcha");
      return;
    }
    setCaptchaSaving(true);
    try {
      const resp = await fetch("/api/settings/captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "GOOGLE_RECAPTCHA",
          siteKey: companyCaptchaSiteKey.trim(),
          secretKey: companyCaptchaSecretKey.trim(),
          isActive: companyCaptchaActive,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "Failed to save company captcha");
      } else {
        toast.success("Company captcha settings saved");
        setCompanyCaptchaSecretKey("");
      }
    } catch {
      toast.error("Error saving captcha settings");
    } finally {
      setCaptchaSaving(false);
    }
  };

  const handleAiProviderTest = async () => {
    if (user.role !== "SUPER_ADMIN") {
      toast.error("Only Super Admin can test AI provider");
      return;
    }

    if (!aiProviderEnabled) {
      toast.error("Enable the AI provider before running a connection test");
      return;
    }

    setAiProviderTesting(true);
    try {
      const response = await fetch("/api/settings/ai-provider/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scope: "GLOBAL" }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.error ||
            data.message ||
            "AI provider connection test failed. Verify your credentials."
        );
        return;
      }

      toast.success(
        data.message || "AI provider connection test succeeded and is healthy"
      );
    } catch (error) {
      console.error("AI provider test failed:", error);
      toast.error("AI provider connection test failed");
    } finally {
      setAiProviderTesting(false);
    }
  };

  const handleOAuthToggle = async (
    provider:
      | "google"
      | "microsoft"
      | "github"
      | "linkedin"
      | "yahoo"
      | "line"
      | "yandex"
      | "wechat",
    checked: boolean
  ) => {
    // Check if user can customize OAuth
    if (!canCustomizeOAuth && user.role !== "SUPER_ADMIN") {
      toast.error(
        "Upgrade to GROWTH or ENTERPRISE plan to customize OAuth providers",
        {
          description:
            "Your current plan doesn't allow OAuth provider customization. Upgrade your plan to unlock this feature.",
          duration: 5000,
        }
      );
      return;
    }

    setOauthLoading({ ...oauthLoading, [provider]: true });
    try {
      const response = await fetch("/api/settings/oauth-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          enabled: checked,
          clientId: oauthProviders[provider].clientId || null,
          clientSecret: oauthProviders[provider].clientSecret || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "PLAN_UPGRADE_REQUIRED") {
          toast.error("Plan Upgrade Required", {
            description:
              data.message ||
              "OAuth customization requires GROWTH or ENTERPRISE plan",
            duration: 5000,
          });
        } else {
          toast.error("Failed to update OAuth setting");
        }
        return;
      }

      setOauthProviders({
        ...oauthProviders,
        [provider]: { ...oauthProviders[provider], enabled: checked },
      });
      toast.success(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth ${
          checked ? "enabled" : "disabled"
        } successfully`
      );
    } catch (error) {
      console.error(`Failed to update ${provider} OAuth setting:`, error);
      toast.error("Failed to update OAuth setting");
    } finally {
      setOauthLoading({ ...oauthLoading, [provider]: false });
    }
  };

  const handleOAuthUpdate = async (
    provider:
      | "google"
      | "microsoft"
      | "github"
      | "linkedin"
      | "yahoo"
      | "line"
      | "yandex"
      | "wechat"
  ) => {
    // Check if user can customize OAuth
    if (!canCustomizeOAuth && user.role !== "SUPER_ADMIN") {
      toast.error(
        "Upgrade to GROWTH or ENTERPRISE plan to customize OAuth providers",
        {
          description:
            "Your current plan doesn't allow OAuth provider customization. Upgrade your plan to unlock this feature.",
          duration: 5000,
        }
      );
      return;
    }

    setOauthLoading({ ...oauthLoading, [provider]: true });
    try {
      const secret = oauthProviders[provider].clientSecret;
      // Don't send masked secret - only send if it's a real value (not "••••••••")
      const shouldSendSecret = secret && !secret.match(/^•+$/);

      const response = await fetch("/api/settings/oauth-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          enabled: oauthProviders[provider].enabled,
          clientId: oauthProviders[provider].clientId,
          ...(shouldSendSecret && { clientSecret: secret }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "PLAN_UPGRADE_REQUIRED") {
          toast.error("Plan Upgrade Required", {
            description:
              data.message ||
              "OAuth customization requires GROWTH or ENTERPRISE plan",
            duration: 5000,
          });
        } else {
          toast.error("Failed to save credentials");
        }
        return;
      }

      toast.success(
        `${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        } OAuth credentials saved successfully!`
      );
    } catch (error) {
      console.error(`Failed to save ${provider} OAuth credentials:`, error);
      toast.error("Failed to save credentials. Please try again.");
    } finally {
      setOauthLoading({ ...oauthLoading, [provider]: false });
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="dark:text-gray-200">
            Manage your application settings and preferences
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {/* Geo Tracking - SUPER_ADMIN only */}
          {user.role === "SUPER_ADMIN" && (
            <AccordionItem value="geo-tracking">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Geo Tracking
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <GeoTrackingProviderCards />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* OAuth Provider Settings - SUPER_ADMIN only */}
          {user.role === "SUPER_ADMIN" && (
            <AccordionItem value="oauth-providers">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  OAuth Provider Integrations
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Provider Visibility on Login/Register Pages
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Important:</strong> When you enable a provider
                          below and save its credentials, the corresponding
                          OAuth button (Google or Microsoft) will automatically
                          appear on both the login and register pages. Disabled
                          providers will not show any button.
                        </p>
                      </div>
                    </div>
                  </div>

                  {user.role === "SUPER_ADMIN" ? (
                    <div className="space-y-2">
                      <p className="text-sm dark:text-gray-200">
                        <strong>Global Settings (Root Platform):</strong> These
                        OAuth providers are configured globally and will be used
                        on the main platform login page (/login) for ERP
                        subscribers. Companies can override these with their own
                        settings for their storefronts (GROWTH/ENTERPRISE plans
                        only).
                      </p>
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Two-Tier OAuth Architecture
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                              <strong>Root Platform (/login):</strong> Uses
                              these global settings for ERP_CUSTOMER signups.
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                              <strong>
                                Company Storefronts (/store/[slug]/login):
                              </strong>{" "}
                              Uses company-specific OAuth settings (if
                              configured) for COMPANY_CUSTOMER signups.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm dark:text-gray-200">
                        <strong>Storefront OAuth Settings:</strong> Configure
                        OAuth providers for your company&apos;s storefront
                        customers. These settings will be used on your
                        storefront login/register pages (/store/your-slug/login)
                        and create COMPANY_CUSTOMER accounts, not ERP platform
                        accounts.
                      </p>
                      <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                              What are storefront customers?
                            </p>
                            <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                              Storefront customers (COMPANY_CUSTOMER role) are
                              your end customers who shop at your online store.
                              They are different from ERP platform users who
                              manage your business. Your storefront OAuth
                              settings only affect storefront login pages, not
                              the main ERP platform.
                            </p>
                          </div>
                        </div>
                      </div>
                      {!canCustomizeOAuth && (
                        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Upgrade Required for OAuth Customization
                              </p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                Your current plan ({user.plan}) uses the global
                                OAuth settings configured by the administrator.
                                Upgrade to GROWTH or ENTERPRISE plan to
                                configure your own OAuth providers for your
                                storefront.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Google OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold">Google OAuth</h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with Google
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.google.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm text-green-500 font-medium">
                            {oauthProviders.google.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.google.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("google", checked)
                          }
                          disabled={oauthLoading.google}
                        />
                      </div>
                    </div>

                    {oauthProviders.google.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://console.cloud.google.com/apis/credentials"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                Google Cloud Console - Credentials
                              </a>
                            </li>
                            <li>
                              Create a new project or select an existing one
                            </li>
                            <li>
                              Click &quot;Create Credentials&quot; → &quot;OAuth
                              client ID&quot;
                            </li>
                            <li>
                              Select &quot;Web application&quot; as the
                              application type
                            </li>
                            <li>
                              Add Authorized JavaScript origins:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                              </code>
                            </li>
                            <li>
                              Add Authorized redirect URI:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                                /api/auth/callback/google
                              </code>
                            </li>
                            <li>Click &quot;Create&quot;</li>
                            <li>
                              Copy the &quot;Client ID&quot; and &quot;Client
                              Secret&quot; and paste them below
                            </li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="google-client-id">Client ID</Label>
                          <Input
                            id="google-client-id"
                            placeholder="Enter Google OAuth Client ID"
                            value={oauthProviders.google.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                google: {
                                  ...oauthProviders.google,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="google-client-secret">
                            Client Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="google-client-secret"
                              type={showSecrets.google ? "text" : "password"}
                              placeholder={
                                oauthProviders.google.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter Google OAuth Client Secret"
                              }
                              value={oauthProviders.google.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  google: {
                                    ...oauthProviders.google,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  google: !showSecrets.google,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.google ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("google")}
                          disabled={oauthLoading.google}
                          size="sm"
                        >
                          Save Google Credentials
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Microsoft OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            Microsoft OAuth (Office 365)
                          </h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with Microsoft/Office 365
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.microsoft.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {oauthProviders.microsoft.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.microsoft.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("microsoft", checked)
                          }
                          disabled={oauthLoading.microsoft}
                        />
                      </div>
                    </div>

                    {oauthProviders.microsoft.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                Azure Portal - App Registrations
                              </a>
                            </li>
                            <li>Click &quot;New registration&quot;</li>
                            <li>
                              Enter a name (e.g., &quot;OnTarget ERP
                              OAuth&quot;)
                            </li>
                            <li>
                              Under &quot;Supported account types&quot;, select
                              &quot;Accounts in any organizational directory and
                              personal Microsoft accounts&quot;
                            </li>
                            <li>
                              Add Redirect URI:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                                /api/auth/microsoft/callback
                              </code>
                            </li>
                            <li>Click &quot;Register&quot;</li>
                            <li>
                              Copy the &quot;Application (client) ID&quot; and
                              paste it below
                            </li>
                            <li>
                              Go to &quot;Certificates & secrets&quot; →
                              &quot;New client secret&quot;
                            </li>
                            <li>
                              Create a secret, copy the value immediately, and
                              paste it below
                            </li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="microsoft-client-id">
                            Application (Client) ID
                          </Label>
                          <Input
                            id="microsoft-client-id"
                            placeholder="Enter Microsoft Azure Application ID"
                            value={oauthProviders.microsoft.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                microsoft: {
                                  ...oauthProviders.microsoft,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="microsoft-client-secret">
                            Client Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="microsoft-client-secret"
                              type={showSecrets.microsoft ? "text" : "password"}
                              placeholder={
                                oauthProviders.microsoft.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter Microsoft Azure Client Secret"
                              }
                              value={oauthProviders.microsoft.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  microsoft: {
                                    ...oauthProviders.microsoft,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  microsoft: !showSecrets.microsoft,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.microsoft ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("microsoft")}
                          disabled={oauthLoading.microsoft}
                          size="sm"
                        >
                          Save Microsoft Credentials
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* GitHub OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shadow-sm">
                          <svg
                            className="h-6 w-6 text-white dark:text-gray-900"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold">GitHub OAuth</h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with GitHub
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.github.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {oauthProviders.github.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.github.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("github", checked)
                          }
                          disabled={oauthLoading.github}
                        />
                      </div>
                    </div>
                    {oauthProviders.github.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://github.com/settings/developers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                GitHub Developer Settings
                              </a>
                            </li>
                            <li>
                              Click &quot;OAuth Apps&quot; → &quot;New OAuth
                              App&quot;
                            </li>
                            <li>
                              Enter application name (e.g., &quot;OnTarget
                              ERP&quot;)
                            </li>
                            <li>
                              Set Homepage URL:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                              </code>
                            </li>
                            <li>
                              Set Authorization callback URL:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                                /api/auth/github/callback
                              </code>
                            </li>
                            <li>Click &quot;Register application&quot;</li>
                            <li>
                              Copy the &quot;Client ID&quot; and paste it below
                            </li>
                            <li>
                              Click &quot;Generate a new client secret&quot;
                            </li>
                            <li>
                              Copy the secret immediately and paste it below
                              (you won&apos;t be able to see it again!)
                            </li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="github-client-id">Client ID</Label>
                          <Input
                            id="github-client-id"
                            placeholder="Enter GitHub OAuth Client ID"
                            value={oauthProviders.github.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                github: {
                                  ...oauthProviders.github,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github-client-secret">
                            Client Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="github-client-secret"
                              type={showSecrets.github ? "text" : "password"}
                              placeholder={
                                oauthProviders.github.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter GitHub OAuth Client Secret"
                              }
                              value={oauthProviders.github.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  github: {
                                    ...oauthProviders.github,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  github: !showSecrets.github,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.github ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("github")}
                          disabled={oauthLoading.github}
                          size="sm"
                        >
                          Save GitHub Credentials
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* LinkedIn OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#0077B5] flex items-center justify-center shadow-sm">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold">LinkedIn OAuth</h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with LinkedIn
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.linkedin.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {oauthProviders.linkedin.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.linkedin.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("linkedin", checked)
                          }
                          disabled={oauthLoading.linkedin}
                        />
                      </div>
                    </div>
                    {oauthProviders.linkedin.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://www.linkedin.com/developers/apps"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                LinkedIn Developers - My Apps
                              </a>
                            </li>
                            <li>Click &quot;Create app&quot; button</li>
                            <li>
                              Fill in required information:
                              <ul className="ml-6 mt-1 space-y-1 list-disc">
                                <li>
                                  App name (e.g., &quot;OnTarget ERP&quot;)
                                </li>
                                <li>
                                  LinkedIn Page (must have a company page)
                                </li>
                                <li>App logo (upload company logo)</li>
                              </ul>
                            </li>
                            <li>
                              Accept LinkedIn API Terms of Use and click
                              &quot;Create app&quot;
                            </li>
                            <li>
                              Go to the &quot;Auth&quot; tab in your app
                              settings
                            </li>
                            <li>
                              Under &quot;OAuth 2.0 settings&quot;, add Redirect
                              URL:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                                /api/auth/linkedin/callback
                              </code>
                            </li>
                            <li>
                              Copy the &quot;Client ID&quot; and &quot;Client
                              Secret&quot; from the Auth tab
                            </li>
                            <li>
                              Go to &quot;Products&quot; tab and request access
                              to &quot;Sign In with LinkedIn using OpenID
                              Connect&quot;
                            </li>
                            <li>
                              Paste your Client ID and Client Secret below
                            </li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="linkedin-client-id">Client ID</Label>
                          <Input
                            id="linkedin-client-id"
                            placeholder="Enter LinkedIn OAuth Client ID"
                            value={oauthProviders.linkedin.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                linkedin: {
                                  ...oauthProviders.linkedin,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin-client-secret">
                            Client Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="linkedin-client-secret"
                              type={showSecrets.linkedin ? "text" : "password"}
                              placeholder={
                                oauthProviders.linkedin.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter LinkedIn OAuth Client Secret"
                              }
                              value={oauthProviders.linkedin.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  linkedin: {
                                    ...oauthProviders.linkedin,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  linkedin: !showSecrets.linkedin,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.linkedin ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("linkedin")}
                          disabled={oauthLoading.linkedin}
                          size="sm"
                        >
                          Save LinkedIn Credentials
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Yahoo OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#6001D2] flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-xl">
                            Y!
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">Yahoo OAuth</h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with Yahoo
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.yahoo.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {oauthProviders.yahoo.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.yahoo.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("yahoo", checked)
                          }
                          disabled={oauthLoading.yahoo}
                        />
                      </div>
                    </div>
                    {oauthProviders.yahoo.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://developer.yahoo.com/apps/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                Yahoo Developer Network - My Apps
                              </a>
                            </li>
                            <li>Click &quot;Create an App&quot; button</li>
                            <li>
                              Fill in the application details:
                              <ul className="ml-6 mt-1 space-y-1 list-disc">
                                <li>
                                  Application Name (e.g., &quot;OnTarget
                                  ERP&quot;)
                                </li>
                                <li>Application Type: Web Application</li>
                                <li>Description: Brief app description</li>
                              </ul>
                            </li>
                            <li>
                              Under &quot;API Permissions&quot;, select:
                              <ul className="ml-6 mt-1 space-y-1 list-disc">
                                <li>OpenID Connect Permissions</li>
                                <li>Profile (Read/Write Public and Private)</li>
                              </ul>
                            </li>
                            <li>
                              Set Redirect URI (Callback Domain):{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                                /api/auth/yahoo/callback
                              </code>
                            </li>
                            <li>Click &quot;Create App&quot;</li>
                            <li>
                              Copy the &quot;Client ID (Consumer Key)&quot; from
                              the app dashboard
                            </li>
                            <li>
                              Copy the &quot;Client Secret (Consumer
                              Secret)&quot; (you may need to regenerate it)
                            </li>
                            <li>Paste both credentials below</li>
                          </ol>
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-900 dark:text-blue-100">
                              <strong>Note:</strong> Yahoo OAuth may require app
                              verification for production use. Test thoroughly
                              in development first.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="yahoo-client-id">Client ID</Label>
                          <Input
                            id="yahoo-client-id"
                            placeholder="Enter Yahoo OAuth Client ID"
                            value={oauthProviders.yahoo.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                yahoo: {
                                  ...oauthProviders.yahoo,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yahoo-client-secret">
                            Client Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="yahoo-client-secret"
                              type={showSecrets.yahoo ? "text" : "password"}
                              placeholder={
                                oauthProviders.yahoo.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter Yahoo OAuth Client Secret"
                              }
                              value={oauthProviders.yahoo.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  yahoo: {
                                    ...oauthProviders.yahoo,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  yahoo: !showSecrets.yahoo,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.yahoo ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("yahoo")}
                          disabled={oauthLoading.yahoo}
                          size="sm"
                        >
                          Save Yahoo Credentials
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* LINE OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#00B900] flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-xl">
                            LINE
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">LINE OAuth</h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with LINE
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.line.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {oauthProviders.line.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.line.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("line", checked)
                          }
                          disabled={oauthLoading.line}
                        />
                      </div>
                    </div>
                    {oauthProviders.line.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://developers.line.biz/console/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                LINE Developers Console
                              </a>
                            </li>
                            <li>
                              Click &quot;Create&quot; to create a new provider
                            </li>
                            <li>
                              After creating provider, click &quot;Create a LINE
                              Login channel&quot;
                            </li>
                            <li>
                              Fill in channel information:
                              <ul className="ml-6 mt-1 space-y-1 list-disc">
                                <li>Channel type: LINE Login</li>
                                <li>
                                  Channel name (e.g., &quot;OnTarget ERP&quot;)
                                </li>
                                <li>Channel description</li>
                              </ul>
                            </li>
                            <li>
                              In the &quot;LINE Login&quot; tab, set Callback
                              URL:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                                /api/auth/line/callback
                              </code>
                            </li>
                            <li>Go to &quot;Basic settings&quot; tab</li>
                            <li>
                              Copy the &quot;Channel ID&quot; and paste it below
                            </li>
                            <li>
                              Copy the &quot;Channel Secret&quot; and paste it
                              below
                            </li>
                            <li>
                              Enable &quot;Email address permission&quot; in
                              &quot;LINE Login&quot; settings
                            </li>
                          </ol>
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-900 dark:text-blue-100">
                              <strong>Note:</strong> LINE Login requires app
                              verification before production use. Popular in
                              Japan, Taiwan, and Thailand.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="line-client-id">Channel ID</Label>
                          <Input
                            id="line-client-id"
                            placeholder="Enter LINE Channel ID"
                            value={oauthProviders.line.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                line: {
                                  ...oauthProviders.line,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="line-client-secret">
                            Channel Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="line-client-secret"
                              type={showSecrets.line ? "text" : "password"}
                              placeholder={
                                oauthProviders.line.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter LINE Channel Secret"
                              }
                              value={oauthProviders.line.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  line: {
                                    ...oauthProviders.line,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  line: !showSecrets.line,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.line ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("line")}
                          disabled={oauthLoading.line}
                          size="sm"
                        >
                          Save LINE Credentials
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Yandex OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#FF0000] flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-xl">
                            Я
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">Yandex OAuth</h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with Yandex
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.yandex.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {oauthProviders.yandex.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.yandex.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("yandex", checked)
                          }
                          disabled={oauthLoading.yandex}
                        />
                      </div>
                    </div>
                    {oauthProviders.yandex.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://oauth.yandex.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                Yandex OAuth - My Applications
                              </a>
                            </li>
                            <li>
                              Click &quot;Register new client&quot; or &quot;New
                              application&quot;
                            </li>
                            <li>
                              Fill in application details:
                              <ul className="ml-6 mt-1 space-y-1 list-disc">
                                <li>
                                  Application name (e.g., &quot;OnTarget
                                  ERP&quot;)
                                </li>
                                <li>Platform: Web services</li>
                              </ul>
                            </li>
                            <li>
                              Under &quot;Callback URI&quot; (Redirect URI),
                              add:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL}
                                /api/auth/yandex/callback
                              </code>
                            </li>
                            <li>
                              Under &quot;Data access&quot;, select:
                              <ul className="ml-6 mt-1 space-y-1 list-disc">
                                <li>Access to email address</li>
                                <li>Access to user avatar</li>
                                <li>Access to username, first and last name</li>
                              </ul>
                            </li>
                            <li>Click &quot;Create application&quot;</li>
                            <li>
                              Copy the &quot;ID&quot; (Client ID) and paste it
                              below
                            </li>
                            <li>
                              Copy the &quot;Password&quot; (Client Secret) and
                              paste it below
                            </li>
                          </ol>
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-900 dark:text-blue-100">
                              <strong>Note:</strong> Yandex is the most popular
                              search engine in Russia. Ideal for
                              Russian-speaking users.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="yandex-client-id">
                            Application ID
                          </Label>
                          <Input
                            id="yandex-client-id"
                            placeholder="Enter Yandex Application ID"
                            value={oauthProviders.yandex.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                yandex: {
                                  ...oauthProviders.yandex,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yandex-client-secret">
                            Client Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="yandex-client-secret"
                              type={showSecrets.yandex ? "text" : "password"}
                              placeholder={
                                oauthProviders.yandex.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter Yandex Client Secret"
                              }
                              value={oauthProviders.yandex.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  yandex: {
                                    ...oauthProviders.yandex,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  yandex: !showSecrets.yandex,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.yandex ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("yandex")}
                          disabled={oauthLoading.yandex}
                          size="sm"
                        >
                          Save Yandex Credentials
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* WeChat OAuth */}
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#07C160] flex items-center justify-center shadow-sm">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088v-.034zm-3.01 2.402c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold">WeChat OAuth</h3>
                          <p className="text-sm dark:text-gray-200">
                            Allow users to sign in with WeChat
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {oauthProviders.wechat.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {oauthProviders.wechat.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <Switch
                          checked={oauthProviders.wechat.enabled}
                          onCheckedChange={(checked) =>
                            handleOAuthToggle("wechat", checked)
                          }
                          disabled={oauthLoading.wechat}
                        />
                      </div>
                    </div>
                    {oauthProviders.wechat.enabled && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Setup Instructions */}
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Setup Instructions
                          </h4>
                          <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                              Go to{" "}
                              <a
                                href="https://open.weixin.qq.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                WeChat Open Platform
                              </a>
                            </li>
                            <li>
                              Register a developer account (requires Chinese
                              phone number)
                            </li>
                            <li>
                              Create a new &quot;Website Application&quot;
                              (网站应用)
                            </li>
                            <li>
                              Fill in application details:
                              <ul className="ml-6 mt-1 space-y-1 list-disc">
                                <li>
                                  Application name (e.g., &quot;OnTarget
                                  ERP&quot;)
                                </li>
                                <li>Application introduction/description</li>
                                <li>
                                  Website URL: {process.env.NEXT_PUBLIC_APP_URL}
                                </li>
                              </ul>
                            </li>
                            <li>
                              Set Authorization Callback Domain:{" "}
                              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">
                                {process.env.NEXT_PUBLIC_APP_URL?.replace(
                                  /^https?:\/\//,
                                  ""
                                )}
                              </code>
                            </li>
                            <li>
                              Submit for verification (requires business license
                              and may take several days)
                            </li>
                            <li>
                              After approval, copy the &quot;AppID&quot; and
                              paste it below
                            </li>
                            <li>
                              Copy the &quot;AppSecret&quot; and paste it below
                            </li>
                          </ol>
                          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded border border-orange-200 dark:border-orange-800">
                            <div className="text-xs text-orange-900 dark:text-orange-100 space-y-2">
                              <p>
                                <strong>Important:</strong> WeChat OAuth
                                requires:
                              </p>
                              <ul className="ml-4 mt-1 list-disc">
                                <li>Chinese business registration</li>
                                <li>Verification (3-7 business days)</li>
                                <li>Annual fee (¥300 RMB)</li>
                              </ul>
                              <p className="m-0!">
                                Essential for Chinese market access.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="wechat-client-id">App ID</Label>
                          <Input
                            id="wechat-client-id"
                            placeholder="Enter WeChat App ID"
                            value={oauthProviders.wechat.clientId}
                            onChange={(e) =>
                              setOauthProviders({
                                ...oauthProviders,
                                wechat: {
                                  ...oauthProviders.wechat,
                                  clientId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wechat-client-secret">
                            App Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="wechat-client-secret"
                              type={showSecrets.wechat ? "text" : "password"}
                              placeholder={
                                oauthProviders.wechat.clientSecret
                                  ? "••••••••••••••••"
                                  : "Enter WeChat App Secret"
                              }
                              value={oauthProviders.wechat.clientSecret}
                              onChange={(e) =>
                                setOauthProviders({
                                  ...oauthProviders,
                                  wechat: {
                                    ...oauthProviders.wechat,
                                    clientSecret: e.target.value,
                                  },
                                })
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  wechat: !showSecrets.wechat,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-200 hover:text-foreground transition-colors"
                            >
                              {showSecrets.wechat ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOAuthUpdate("wechat")}
                          disabled={oauthLoading.wechat}
                          size="sm"
                        >
                          Save WeChat Credentials
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Plan Pricing Management - SUPER_ADMIN only */}
          {user.role === "SUPER_ADMIN" && (
            <AccordionItem value="plan-pricing">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plan Pricing Management
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <PricingManagement />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* AI Storefront & LLM Provider - SUPER_ADMIN only */}
          {user.role === "SUPER_ADMIN" && (
            <AccordionItem value="ai-video-provider">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  AI Video Provider (Global)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Global AI Video Engine
                      </p>
                      <p className="text-sm dark:text-gray-200">
                        Configure Lightricks LTX or Hugging Face as the global
                        provider for AI-generated videos used in Hero sections
                      </p>
                    </div>
                  </div>
                  <p className="text-xs dark:text-gray-200">
                    The API keys are encrypted using AES-256-GCM and are never
                    displayed in plaintext after saving.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Primary Provider</p>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={videoPrimary}
                        onChange={(e) => setVideoPrimary(e.target.value)}
                        className="border rounded px-2 py-1 bg-background"
                      >
                        <option value="ltx">Lightricks (LTX)</option>
                        <option value="huggingface">Hugging Face</option>
                      </select>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div>
                        <p className="text-xs dark:text-gray-200">
                          Lightricks LTX API Key
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="password"
                            value={ltxKey}
                            onChange={(e) => setLtxKey(e.target.value)}
                            placeholder={
                              hasLtxKey
                                ? "Configured — save to replace"
                                : "ltx_xxx"
                            }
                          />
                          <Switch
                            checked={ltxEnabled}
                            onCheckedChange={setLtxEnabled}
                          />
                        </div>
                        <p className="text-xs dark:text-gray-200 mt-1">
                          {hasLtxKey
                            ? "Key is configured"
                            : "No key configured"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs dark:text-gray-200">
                          Lightricks LTX Secret (optional)
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="password"
                            value={ltxSecret}
                            onChange={(e) => setLtxSecret(e.target.value)}
                            placeholder={
                              hasLtxSecret
                                ? "Configured — save to replace"
                                : "secret_xxx"
                            }
                          />
                        </div>
                        <p className="text-xs dark:text-gray-200 mt-1">
                          {hasLtxSecret
                            ? "Secret is configured"
                            : "No secret configured"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs dark:text-gray-200">
                          Hugging Face API Token
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="password"
                            value={hfToken}
                            onChange={(e) => setHfToken(e.target.value)}
                            placeholder={
                              hasHfToken
                                ? "Configured — save to replace"
                                : "hf_xxx"
                            }
                          />
                          <Switch
                            checked={hfEnabled}
                            onCheckedChange={setHfEnabled}
                          />
                        </div>
                        <p className="text-xs dark:text-gray-200 mt-1">
                          {hasHfToken
                            ? "Token is configured"
                            : "No token configured"}
                        </p>
                      </div>

                      <div className="flex gap-3 mt-2">
                        <Button onClick={testVideoProvider} variant="outline">
                          Test Connection
                        </Button>
                        <Button onClick={saveVideoProvider}>
                          Save Configuration
                        </Button>
                      </div>

                      {testResult && (
                        <div className="mt-2">
                          <p className="text-sm">
                            Test Result: {testResult.ok ? "Success" : "Failed"}
                          </p>
                          {testResult.error && (
                            <p className="text-xs dark:text-gray-200">
                              {testResult.error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* AI Storefront & LLM Provider - SUPER_ADMIN only */}
          {user.role === "SUPER_ADMIN" && (
            <AccordionItem value="ai-storefront-provider">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Storefront & LLM Provider (Global)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-6">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Global AI Engine for Storefront Generation
                        </p>
                        <p className="text-sm dark:text-gray-200">
                          Configure a global LLM provider (OpenAI-compatible)
                          that will power{" "}
                          <span className="font-semibold">
                            AI-generated storefronts
                          </span>{" "}
                          for companies on{" "}
                          <span className="font-semibold">
                            GROWTH and ENTERPRISE
                          </span>{" "}
                          plans. Essential plan continues to use the manual
                          theme and content wizard.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs dark:text-gray-200">
                      The API key is stored encrypted in the database. We never
                      show the raw key again after you save it.
                    </p>
                  </div>

                  <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Setup Instructions
                    </p>
                    <ol className="list-decimal list-inside text-xs text-blue-900 dark:text-blue-100 space-y-2">
                      <li>
                        <strong>For OpenAI:</strong> Go to{" "}
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          platform.openai.com/api-keys
                        </a>{" "}
                        and create a secret key. Add billing at{" "}
                        <a
                          href="https://platform.openai.com/account/billing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          platform.openai.com/account/billing
                        </a>
                        .
                      </li>
                      <li>
                        <strong>For Anthropic Claude:</strong> Sign up at{" "}
                        <a
                          href="https://console.anthropic.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          console.anthropic.com
                        </a>
                        , then go to{" "}
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          Settings → API Keys
                        </a>{" "}
                        and click &quot;Create Key&quot;.{" "}
                      </li>
                      <li>
                        <strong>For DeepSeek:</strong> Sign up at{" "}
                        <a
                          href="https://platform.deepseek.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          platform.deepseek.com
                        </a>
                        , then go to{" "}
                        <a
                          href="https://platform.deepseek.com/api_keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          API Keys
                        </a>{" "}
                        and create a new key.{" "}
                        <strong>Most affordable option</strong> at $0.14/$0.28
                        per 1M tokens (~$0.001/generation).
                      </li>
                      <li>
                        Paste the key into the <strong>API Key</strong> field
                        below. It will be encrypted and never shown again.
                      </li>
                      <li>
                        Select a <strong>Model</strong> - recommended models are
                        marked with ⭐ and show estimated cost per generation.
                      </li>
                      <li>
                        Click <strong>Save Settings</strong>, then{" "}
                        <strong>Test Connection</strong> to verify.
                      </li>
                    </ol>
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-900 dark:text-green-100">
                        <strong>💡 Recommendations:</strong>
                      </p>
                      <ul className="text-xs text-green-900 dark:text-green-100 mt-1 space-y-1 ml-4 list-disc">
                        <li>
                          <strong>For testing with free credits:</strong> Start
                          with <strong>Anthropic Claude 3.5 Haiku</strong> - new
                          accounts get{" "}
                          <a
                            href="https://www.anthropic.com/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                          >
                            $5 in free credits
                          </a>{" "}
                          (no credit card required).
                        </li>
                        <li>
                          <strong>For production/high-volume:</strong> Use{" "}
                          <strong>DeepSeek Chat</strong> - GPT-4 level quality
                          at 90-99% lower cost (~$0.001 per generation vs
                          ~$0.01-0.10 for others).
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Enable AI Storefront Engine
                          </p>
                          <p className="text-xs dark:text-gray-200">
                            When enabled and credentials are valid, Growth /
                            Enterprise companies can generate AI storefront
                            specs.
                          </p>
                        </div>
                        <Switch
                          checked={aiProviderEnabled}
                          onCheckedChange={setAiProviderEnabled}
                          disabled={aiProviderLoading || aiProviderSaving}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ai-api-key">API Key</Label>
                        <Input
                          id="ai-api-key"
                          type="password"
                          autoComplete="off"
                          placeholder={
                            aiHasExistingKey
                              ? "•••••••••••••••• (stored)"
                              : aiProviderType === "anthropic"
                              ? "Enter Anthropic API key (sk-ant-...)"
                              : aiProviderType === "deepseek"
                              ? "Enter DeepSeek API key (sk-...)"
                              : "Enter OpenAI API key (sk-...)"
                          }
                          value={aiApiKey}
                          onChange={(e) => setAiApiKey(e.target.value)}
                          disabled={aiProviderLoading}
                        />
                        <p className="text-xs dark:text-gray-200">
                          Leave blank to keep the existing key. Enter a new key
                          to replace it.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ai-provider-type">Provider</Label>
                        <select
                          id="ai-provider-type"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={aiProviderType}
                          onChange={(e) => {
                            const newProvider = e.target.value;
                            setAiProviderType(newProvider);

                            // Auto-select recommended model for the new provider
                            const models = getModelsForProvider(
                              newProvider as "openai" | "anthropic" | "deepseek"
                            );
                            const recommendedModel = models.find(
                              (m) => m.recommended
                            );
                            if (recommendedModel) {
                              setAiModel(recommendedModel.id);
                            } else if (models[0]) {
                              setAiModel(models[0].id);
                            }
                          }}
                          disabled={aiProviderLoading}
                        >
                          <option value="openai">
                            OpenAI (GPT-4o, GPT-4o Mini) - Requires billing
                          </option>
                          <option value="anthropic">
                            Anthropic Claude (3.5 Sonnet, Haiku) - $5 free
                            credits
                          </option>
                          <option value="deepseek">
                            DeepSeek (Chat, Coder) - Most affordable option
                          </option>
                        </select>
                        <p className="text-xs dark:text-gray-200">
                          {aiProviderType === "anthropic"
                            ? "Anthropic offers $5 in free credits for new accounts, making it ideal for testing."
                            : aiProviderType === "deepseek"
                            ? "DeepSeek offers extremely affordable pricing ($0.14/$0.28 per 1M tokens) with GPT-4 level performance."
                            : "OpenAI requires a paid account with billing information."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ai-model">Model</Label>
                        <select
                          id="ai-model"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                          disabled={aiProviderLoading || modelsLoading}
                        >
                          {modelsLoading ? (
                            <option value={aiModel}>Loading models...</option>
                          ) : (
                            (dynamicModels.length > 0
                              ? dynamicModels
                              : getModelsForProvider(
                                  aiProviderType as
                                    | "openai"
                                    | "anthropic"
                                    | "deepseek"
                                )
                            ).map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name} - {estimateGenerationCost(model)}
                                /gen{" "}
                                {getRelativeCostMultiplier(
                                  model,
                                  dynamicModels.length > 0
                                    ? dynamicModels
                                    : getModelsForProvider(
                                        aiProviderType as
                                          | "openai"
                                          | "anthropic"
                                          | "deepseek"
                                      )
                                )}
                                {model.recommended ? " ⭐" : ""}
                              </option>
                            ))
                          )}
                        </select>
                        <div className="text-xs dark:text-gray-200 space-y-1">
                          {(() => {
                            const models =
                              dynamicModels.length > 0
                                ? dynamicModels
                                : getModelsForProvider(
                                    aiProviderType as
                                      | "openai"
                                      | "anthropic"
                                      | "deepseek"
                                  );
                            const currentModel = models.find(
                              (m) => m.id === aiModel
                            );
                            if (currentModel) {
                              return (
                                <>
                                  <p>{currentModel.description}</p>
                                  <p>
                                    <strong>Context:</strong>{" "}
                                    {currentModel.contextWindow.toLocaleString()}{" "}
                                    tokens • <strong>Input:</strong>{" "}
                                    {formatCost(currentModel.inputCostPer1M)}/1M
                                    • <strong>Output:</strong>{" "}
                                    {formatCost(currentModel.outputCostPer1M)}
                                    /1M
                                  </p>
                                </>
                              );
                            }
                            return null;
                          })()}
                          {aiHasExistingKey && dynamicModels.length > 0 && (
                            <p className="text-green-600 dark:text-green-400">
                              ✓ Showing {dynamicModels.length} models available
                              for your API key
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ai-api-base">API Base URL</Label>
                        <Input
                          id="ai-api-base"
                          placeholder="Optional. Override base URL for compatible providers"
                          value={aiApiBase}
                          onChange={(e) => setAiApiBase(e.target.value)}
                          disabled={aiProviderLoading}
                        />
                        <p className="text-xs dark:text-gray-200">
                          Leave empty to use the default OpenAI API base. Set
                          this for Azure OpenAI or other compatible providers.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                        <p className="text-sm font-medium">How this is used</p>
                        <ul className="list-disc list-inside text-sm dark:text-gray-200 space-y-1">
                          <li>
                            The key/model are used by the resident AI to{" "}
                            <span className="font-medium">
                              generate AI storefront specs
                            </span>{" "}
                            per company.
                          </li>
                          <li>
                            We enforce strict safety rules (no adult, gambling,
                            drugs, weapons, or illegal content).
                          </li>
                          <li>
                            If the model fails or is misconfigured, companies
                            fall back to the manual themed storefront.
                          </li>
                        </ul>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAiProviderSave}
                            disabled={
                              aiProviderLoading ||
                              aiProviderSaving ||
                              !aiProviderEnabled
                            }
                          >
                            {aiProviderSaving ? "Saving..." : "Save Settings"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAiProviderTest}
                            disabled={
                              aiProviderLoading ||
                              aiProviderTesting ||
                              !aiProviderEnabled
                            }
                          >
                            {aiProviderTesting
                              ? "Testing..."
                              : "Test Connection"}
                          </Button>
                        </div>
                        <p className="text-xs dark:text-gray-200">
                          Save settings first, then run a connection test to
                          confirm the LLM provider is reachable and responding
                          with valid JSON.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Storage Provider Configuration - SUPER_ADMIN and ADMIN */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <AccordionItem value="storage-provider">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Cold Storage Configuration
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <StorageProviderCards userRole={user.role} />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Blockchain Immutable Records Configuration - SUPER_ADMIN and ADMIN */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <AccordionItem value="blockchain-records">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Blockchain Immutable Records Configuration
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-6">
                  {/* Information Banner */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          What are Blockchain Immutable Records?
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          When enabled, all audit logs (invoices, payments, time
                          tracking, etc.) are cryptographically anchored to the
                          Hedera blockchain. This creates a permanent,
                          tamper-proof record that can be independently
                          verified.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Critical Warning Banner */}
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Important: Data Permanence
                        </p>
                        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                          <li>
                            Once enabled, blockchain anchoring{" "}
                            <strong>CANNOT be disabled</strong>
                          </li>
                          <li>
                            All historical records will be permanently anchored
                          </li>
                          <li>
                            Data remains on-chain even if your account is
                            deleted
                          </li>
                          <li>
                            This ensures trust but means records cannot be
                            hidden
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* SUPER_ADMIN View: Global Hedera Configuration + Company List */}
                  {user.role === "SUPER_ADMIN" && (
                    <div className="space-y-6 bg-slate-100 border border-black rounded-2xl">
                      {/* Blockchain Hedera Integration */}
                      <div className="border-t pt-6 px-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Blockchain Hedera Integration
                        </h3>

                        <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                          <h4 className="text-sm font-semibold">
                            Super Admin instructions
                          </h4>
                          <p className="mt-2 text-sm dark:text-gray-200">
                            Configure the Hedera integration for your platform.
                            Required steps:
                          </p>
                          <ol className="mt-2 ml-4 list-decimal text-sm text-muted-foreground">
                            <li>
                              Provide a Hedera <strong>Account ID</strong> and{" "}
                              <strong>Private Key</strong>. These are encrypted
                              at rest.
                            </li>
                            <li>
                              Create a Hedera <strong>Topic</strong> on the
                              network and enter its <strong>Topic ID</strong>.
                            </li>
                            <li>
                              Use the <strong>Use Testnet</strong> toggle to
                              switch environments while testing.
                            </li>
                            <li>
                              Set <strong>Enable Globally</strong> to activate
                              the integration system-wide.
                            </li>
                          </ol>

                          <p className="mt-3 text-sm dark:text-gray-200">
                            You can also configure via the admin API:
                            <code className="block mt-2 rounded px-2 py-1 bg-muted/20 text-xs">
                              POST /api/admin/hedera-settings
                            </code>
                            JSON body:{" "}
                            <code className="block mt-1 rounded px-2 py-1 bg-muted/20 text-xs">{`{ accountId, privateKey, topicId, useTestnet, isActive }`}</code>
                          </p>

                          <div className="mt-4 flex items-center gap-2">
                            <a
                              href="https://portal.hedera.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-purple-500 dark:text-green-500 dark:hover:text-green-300"
                            >
                              <Button
                                variant="default"
                                className="bg-transparent"
                              >
                                <Link />
                                Hedera Developer Portal
                              </Button>
                            </a>
                            <a
                              href="https://docs.hedera.com/"
                              rel="noopener noreferrer"
                              target="_blank"
                              className="text-gray-700 hover:outline hover:rounded-2xl dark:text-gray-300 dark:hover:text-gray-200"
                            >
                              <Button variant="ghost">
                                View Integration Docs
                              </Button>
                            </a>
                          </div>
                        </div>

                        <HederaSettingsForm />
                      </div>

                      {/* Company Enable List */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Enable Blockchain Per Company
                        </h3>
                        <CompanyBlockchainList userRole="SUPER_ADMIN" />
                      </div>

                      {/* Cost Dashboard */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Global Transaction Costs & Usage
                        </h3>
                        <HederaCostDashboard />
                      </div>
                    </div>
                  )}

                  {/* ADMIN View: Only Company List (No Global Config Access) */}
                  {user.role === "ADMIN" && (
                    <div className="space-y-6">
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm dark:text-gray-200">
                          Enable blockchain immutable records for companies you
                          own. Once enabled for a company, it cannot be
                          disabled. Contact support if you need assistance.
                        </p>
                      </div>

                      {/* Company Enable List */}
                      <CompanyBlockchainList userRole="ADMIN" />

                      {/* Cost Dashboard for current company */}
                      {user.companyId && (
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Transaction Costs & Usage
                          </h3>
                          <HederaCostDashboard
                            companyId={user.companyId}
                            isAdminView={true}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Email Provider Configuration - SUPER_ADMIN and ADMIN */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <AccordionItem value="email-provider">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Service Configuration
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <EmailProviderCards userRole={user.role} />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Payment Provider Configuration - visible to all, content gated by role */}
          <AccordionItem value="payment-provider">
            <AccordionTrigger className="text-xl font-semibold">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Provider Configuration
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                {/* Show config UI only to SUPER_ADMIN or ADMIN; otherwise show informative message */}
                {user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? (
                  <div className="pt-2 pl-2">
                    {/* PaymentProviderCards is client component */}

                    <PaymentProviderCards userRole={user.role} />
                  </div>
                ) : (
                  <div className="p-4 rounded-md bg-muted dark:text-gray-200">
                    <div className="font-semibold">
                      Payment Provider Configuration
                    </div>
                    <div className="text-sm">
                      Only company administrators and the SUPER_ADMIN can
                      configure payment gateways. If you believe you should have
                      access, please contact your account administrator.
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Image Providers */}
          {user.role === "SUPER_ADMIN" && (
            <AccordionItem value="image-providers">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Image Providers
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <ImageProviderCards />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Webhooks Configuration */}
          {user.companyId && (
            <AccordionItem value="webhooks">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          About Webhooks
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Webhooks allow you to receive real-time notifications
                          when events occur in your account. Configure webhook
                          endpoints to integrate with external systems and
                          automate workflows.
                        </p>
                      </div>
                    </div>
                  </div>
                  <WebhookManager companyId={user.companyId} />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Captcha Settings */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <AccordionItem value="captcha-config">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Captcha Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-6">
                  {/* Captcha Setup Instructions */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          How to set up reCAPTCHA
                        </p>
                        <ol className="list-decimal list-inside text-sm space-y-2 text-blue-800 dark:text-blue-200">
                          <li>
                            Visit{" "}
                            <a
                              href="https://www.google.com/recaptcha/admin/create"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Google reCAPTCHA Admin
                            </a>{" "}
                            and create a new site.
                          </li>
                          <li>
                            Choose reCAPTCHA type:
                            <strong className="ml-1">v3</strong> (recommended
                            for frictionless UX) or
                            <strong className="ml-1">v2</strong> (checkbox).
                          </li>
                          <li>
                            Add domain: set your app origin{" "}
                            <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">
                              {process.env.NEXT_PUBLIC_APP_URL}
                            </code>{" "}
                            (and other environments if needed).
                          </li>
                          <li>
                            After creating, copy the <strong>Site Key</strong>{" "}
                            and <strong>Secret Key</strong>.
                          </li>
                          <li>
                            As <strong>Super Admin</strong>, paste keys into the{" "}
                            <strong>Global Captcha</strong> section and toggle
                            it on. Homepage forms will use Global captcha when
                            active.
                          </li>
                          <li>
                            As <strong>Company Admin</strong>, optionally
                            configure <strong>Company Captcha</strong> for
                            storefront forms. Storefront uses Company captcha
                            when active; otherwise falls back to Global.
                          </li>
                          <li>
                            Click <strong>Save</strong>. Secret keys are stored
                            encrypted and never shown back in the UI.
                          </li>
                          <li>
                            Test: open homepage, submit the contact form. If
                            Global captcha is active, you should see the captcha
                            execute client-side and the request succeed.
                          </li>
                        </ol>
                        <p className="text-xs dark:text-gray-200">
                          Note: When captcha is inactive, submissions are still
                          rate-limited server-side and will skip captcha
                          verification.
                        </p>
                      </div>
                    </div>
                  </div>
                  {user.role === "SUPER_ADMIN" && (
                    <div className="rounded-lg border p-4 space-y-4 relative">
                      {globalCaptchaActive && globalCaptchaSiteKey && (
                        <BorderBeam
                          size={250}
                          duration={12}
                          delay={9}
                          colorFrom="#10b981"
                          colorTo="#3b82f6"
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">
                          Enable Global Captcha
                        </Label>
                        <Switch
                          checked={globalCaptchaActive}
                          onCheckedChange={setGlobalCaptchaActive}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Global Site Key</Label>
                          <Input
                            value={globalCaptchaSiteKey}
                            onChange={(e) =>
                              setGlobalCaptchaSiteKey(e.target.value)
                            }
                            placeholder="Google reCAPTCHA site key"
                          />
                        </div>
                        <div>
                          <Label>Global Secret Key</Label>
                          <Input
                            type="password"
                            value={globalCaptchaSecretKey}
                            onChange={(e) =>
                              setGlobalCaptchaSecretKey(e.target.value)
                            }
                            placeholder={
                              globalCaptchaSiteKey
                                ? "••••••••••••••••• (stored securely)"
                                : "Google reCAPTCHA secret key"
                            }
                          />
                          {globalCaptchaSiteKey && !globalCaptchaSecretKey && (
                            <p className="text-xs dark:text-gray-200 mt-1">
                              Leave blank to keep existing secret key
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={saveGlobalCaptcha}
                          disabled={captchaSaving}
                        >
                          Save Global Captcha
                        </Button>
                      </div>
                      <p className="text-xs dark:text-gray-200">
                        Homepage guest contact uses <strong>Global</strong>{" "}
                        captcha when enabled. Secrets are stored encrypted and
                        never shown back.
                      </p>
                    </div>
                  )}

                  {user.role === "ADMIN" && (
                    <div className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">
                          Enable Company Captcha
                        </Label>
                        <Switch
                          checked={companyCaptchaActive}
                          onCheckedChange={setCompanyCaptchaActive}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Company Site Key</Label>
                          <Input
                            value={companyCaptchaSiteKey}
                            onChange={(e) =>
                              setCompanyCaptchaSiteKey(e.target.value)
                            }
                            placeholder="Google reCAPTCHA site key"
                          />
                        </div>
                        <div>
                          <Label>Company Secret Key</Label>
                          <Input
                            type="password"
                            value={companyCaptchaSecretKey}
                            onChange={(e) =>
                              setCompanyCaptchaSecretKey(e.target.value)
                            }
                            placeholder="Google reCAPTCHA secret key"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={saveCompanyCaptcha}
                          disabled={captchaSaving}
                        >
                          Save Company Captcha
                        </Button>
                      </div>
                      <p className="text-xs dark:text-gray-200">
                        Company storefront forms use the{" "}
                        <strong>Company</strong> captcha when enabled; otherwise
                        fallback to Global if available.
                      </p>
                      {companyCaptchaFallback.active && (
                        <div className="text-xs dark:text-gray-200">
                          Global fallback is active.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* User Management - For SUPER_ADMIN and ADMIN */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <AccordionItem value="user-management">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Directory & Teams
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  {/* Tabs for User Directory and Teams Management */}
                  <div className="border-b border-border mb-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveUserManagementTab("users")}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                          activeUserManagementTab === "users"
                            ? "border-primary text-primary"
                            : "border-transparent dark:text-gray-200 hover:text-foreground"
                        }`}
                      >
                        <Users className="h-4 w-4 inline mr-2" />
                        User Directory
                      </button>
                      <button
                        onClick={() => setActiveUserManagementTab("teams")}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                          activeUserManagementTab === "teams"
                            ? "border-primary text-primary"
                            : "border-transparent dark:text-gray-200 hover:text-foreground"
                        }`}
                      >
                        <UsersRound className="h-4 w-4 inline mr-2" />
                        Teams Management
                      </button>
                      {(user.role === "SUPER_ADMIN" ||
                        user.role === "ADMIN") && (
                        <button
                          onClick={() =>
                            setActiveUserManagementTab("passwords")
                          }
                          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeUserManagementTab === "passwords"
                              ? "border-primary text-primary"
                              : "border-transparent dark:text-gray-200 hover:text-foreground"
                          }`}
                        >
                          <Lock className="h-4 w-4 inline mr-2" />
                          Password Management
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeUserManagementTab === "users" ? (
                    <UserManagementTable currentUserRole={user.role} />
                  ) : activeUserManagementTab === "passwords" ? (
                    <PasswordManagementTab currentUserRole={user.role} />
                  ) : (
                    <>
                      {/* Company Selector for SUPER_ADMIN and ADMIN */}
                      {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") &&
                        availableCompanies.length > 0 && (
                          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                            <Label className="text-sm font-medium mb-2 block">
                              Select Company to Manage Teams
                            </Label>
                            <select
                              className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={selectedCompanyForTeams || ""}
                              onChange={(e) =>
                                setSelectedCompanyForTeams(e.target.value)
                              }
                            >
                              <option value="" disabled>
                                Select a company...
                              </option>
                              {availableCompanies.map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs dark:text-gray-200 mt-2">
                              {user.role === "SUPER_ADMIN"
                                ? "Manage teams for the selected company"
                                : "Select one of your companies to manage teams"}
                            </p>
                          </div>
                        )}

                      <TeamsManagement
                        key={teamsRefreshKey}
                        companyId={selectedCompanyForTeams}
                        onCreateTeam={() => setShowCreateTeamDialog(true)}
                        onEditTeam={(team) => {
                          setSelectedTeam({
                            id: team.id,
                            name: team.name,
                            description: team.description,
                            companyId: team.companyId,
                            memberCount: team.memberCount,
                            projectCount: team.projectCount,
                            members:
                              team.members?.map((m) => ({
                                id: m.id,
                                staffId: m.staffId,
                                user: { id: m.user?.id ?? "" },
                              })) || [],
                          });
                          setShowEditTeamDialog(true);
                        }}
                        onDeleteTeam={(team) => {
                          setSelectedTeam({
                            id: team.id,
                            name: team.name,
                            description: team.description,
                            companyId: team.companyId,
                            memberCount: team.memberCount,
                            projectCount: team.projectCount,
                            members:
                              team.members?.map((m) => ({
                                id: m.id,
                                staffId: m.staffId,
                                user: { id: m.user?.id ?? "" },
                              })) || [],
                          });
                          setShowDeleteTeamDialog(true);
                        }}
                        onManageMembers={(team) => {
                          setSelectedTeam({
                            id: team.id,
                            name: team.name,
                            description: team.description,
                            companyId: team.companyId,
                            memberCount: team.memberCount,
                            projectCount: team.projectCount,
                            members:
                              team.members?.map((m) => ({
                                id: m.id,
                                staffId: m.staffId,
                                user: { id: m.user?.id ?? "" },
                              })) || [],
                          });
                          setShowManageMembersDialog(true);
                        }}
                      />
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Subscription Plan Management - Only for ADMIN */}
          {user.role === "ADMIN" && (
            <AccordionItem value="subscription-plan">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Subscription Plan
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <SubscriptionPlanCards />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Danger Zone - Only for company owners (ADMIN) */}
          {user.role === "ADMIN" && user.companyId && (
            <AccordionItem value="danger-zone">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Danger Zone</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <DangerZone
                    companyId={user.companyId}
                    companyName={"Your Company"}
                    isOwner={true}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Team Management Dialogs */}
      {(user.role === "SUPER_ADMIN" || user.role === "ADMIN"
        ? selectedCompanyForTeams
        : user.companyId) && (
        <CreateTeamDialog
          open={showCreateTeamDialog}
          onOpenChange={setShowCreateTeamDialog}
          companyId={
            (user.role === "SUPER_ADMIN" || user.role === "ADMIN"
              ? selectedCompanyForTeams
              : user.companyId)!
          }
          onSuccess={() => {
            setTeamsRefreshKey((prev) => prev + 1);
            toast.success("Team created successfully");
          }}
        />
      )}

      {selectedTeam && (
        <>
          <EditTeamDialog
            open={showEditTeamDialog}
            onOpenChange={setShowEditTeamDialog}
            // @ts-expect-error - Team type mismatch handled by component
            team={selectedTeam}
            onSuccess={() => {
              setTeamsRefreshKey((prev) => prev + 1);
              toast.success("Team updated successfully");
            }}
          />

          <DeleteTeamDialog
            open={showDeleteTeamDialog}
            onOpenChange={setShowDeleteTeamDialog}
            // @ts-expect-error - Team type mismatch handled by component
            team={selectedTeam}
            onSuccess={() => {
              setTeamsRefreshKey((prev) => prev + 1);
              toast.success("Team deleted successfully");
            }}
          />

          <AddTeamMemberDialog
            open={showManageMembersDialog}
            onOpenChange={setShowManageMembersDialog}
            teamId={selectedTeam.id}
            companyId={selectedTeam.companyId}
            existingMembers={
              selectedTeam.members?.map((m) => ({
                id: m.id,
                // Use companyStaff.id so API duplicate checks and filters work correctly
                staffId: m.staffId,
              })) || []
            }
            onSuccess={() => {
              setTeamsRefreshKey((prev) => prev + 1);
              toast.success("Team members updated successfully");
            }}
          />
        </>
      )}
    </DashboardLayout>
  );
}
