"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BorderBeam } from "@/components/ui/border-beam";
import { CreditCard, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
}

export default function PaymentProviderCards({
  userRole,
}: {
  userRole: string;
}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("GLOBAL");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("stripe");

  // Config fields
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isTestMode, setIsTestMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Track active providers
  const [activeProviders, setActiveProviders] = useState<{
    stripe: boolean;
    paypal: boolean;
  }>({ stripe: false, paypal: false });

  useEffect(() => {
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
      const fetchCompanies = async () => {
        try {
          const resp = await fetch("/api/companies/my-owned");
          const data = await resp.json();
          if (resp.ok) setCompanies(data.companies || []);
          else {
            console.warn(
              "Failed to fetch companies for payment providers",
              data
            );
            setCompanies([]);
          }
        } catch (err) {
          console.error("Failed to fetch companies:", err);
        }
      };
      fetchCompanies();
    }
  }, [userRole]);

  // Check active providers function (extracted for reuse)
  const checkActiveProviders = async () => {
    const providers = ["stripe", "paypal"];
    const results: { stripe: boolean; paypal: boolean } = {
      stripe: false,
      paypal: false,
    };

    for (const provider of providers) {
      try {
        const url =
          selectedCompanyId === "GLOBAL"
            ? `/api/settings/payment-provider?scope=GLOBAL&provider=${provider}`
            : `/api/settings/payment-provider?companyId=${selectedCompanyId}&provider=${provider}`;
        const resp = await fetch(url);
        const data = await resp.json();
        console.log(`[${provider}] Response:`, data);
        if (resp.ok && data.provider && data.provider.isEnabled) {
          console.log(`✅ ${provider} is enabled`);
          results[provider as "stripe" | "paypal"] = true;
        } else {
          console.log(`❌ ${provider} not enabled`, {
            hasProvider: !!data.provider,
            isEnabled: data.provider?.isEnabled,
          });
        }
      } catch (err) {
        console.error(`Failed to check ${provider} status:`, err);
      }
    }

    console.log("Final activeProviders:", results);
    setActiveProviders(results);
  };

  // Check active providers on mount and when scope changes
  useEffect(() => {
    checkActiveProviders();
  }, [selectedCompanyId]);

  const openFor = async (provider: string) => {
    setSelectedProvider(provider);
    setIsSheetOpen(true);

    // fetch existing config (GLOBAL scope or company)
    try {
      const url =
        selectedCompanyId === "GLOBAL"
          ? `/api/settings/payment-provider?scope=GLOBAL&provider=${provider}`
          : `/api/settings/payment-provider?companyId=${selectedCompanyId}&provider=${provider}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (resp.ok && data.provider) {
        setPublicKey(data.provider.publicKey || "");
        // secrets not returned
        setSecretKey("");
        setWebhookSecret("");
        setIsTestMode(!!data.provider.isTestMode);
      } else {
        setPublicKey("");
        setSecretKey("");
        setWebhookSecret("");
        setIsTestMode(true);
      }
    } catch (err) {
      console.error("Failed to load payment provider config:", err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    // UI validation: require all keys for Stripe provider
    if (selectedProvider === "stripe") {
      if (!publicKey || !secretKey || !webhookSecret) {
        toast.error(
          "Please enter Publishable Key, Secret Key and Webhook Secret for Stripe"
        );
        setIsSaving(false);
        return;
      }
    }

    try {
      const body: {
        provider: string;
        publicKey: string;
        secretKey: string;
        webhookSecret: string;
        isTestMode: boolean;
        isEnabled: boolean;
        companyId?: string;
        scope?: string;
      } = {
        provider: selectedProvider,
        publicKey,
        secretKey,
        webhookSecret,
        isTestMode,
        isEnabled: true,
      };
      if (selectedCompanyId !== "GLOBAL") body.companyId = selectedCompanyId;
      else body.scope = "GLOBAL";

      const resp = await fetch("/api/settings/payment-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (resp.ok) {
        // After saving, run a connection test to ensure keys are valid.
        const testBody: any = {
          provider: selectedProvider,
          publicKey,
          secretKey,
          webhookSecret,
          isTestMode,
        };

        // If company-scoped, use company test endpoint
        let testUrl = "/api/settings/payment-provider/test";
        if (selectedCompanyId !== "GLOBAL") {
          testUrl = `/api/company/payment-gateways/${selectedProvider}/test`;
          testBody.companyId = selectedCompanyId;
        }

        try {
          const testResp = await fetch(testUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testBody),
          });
          const testData = await testResp.json();
          if (testResp.ok && testData.success) {
            toast.success("Payment provider saved and connection verified");
            setIsSheetOpen(false);
          } else {
            toast.error(
              testData.message ||
                testData.error ||
                "Saved but test connection failed"
            );
          }
        } catch (err) {
          console.error("Failed to test connection after saving:", err);
          toast.error("Saved but failed to validate connection");
        }

        // Refresh active providers by re-running the check
        await checkActiveProviders();
      } else {
        toast.error(data.error || data.message || "Failed to save provider");
      }
    } catch (err) {
      console.error("Failed to save payment provider:", err);
      toast.error("Failed to save payment provider");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={cn(
            "relative cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
            activeProviders.stripe && "ring-2 ring-primary"
          )}
          onClick={() => openFor("stripe")}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#635BFF] to-[#0066ff] p-2">
                <svg
                  className="h-8 w-8 brightness-0 invert"
                  viewBox="0 0 60 25"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.87zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  Stripe
                  {activeProviders.stripe && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Accept card and ACH payments
                </p>
              </div>
            </div>
            {activeProviders.stripe && (
              <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Active payment gateway
              </div>
            )}
          </CardContent>

          {activeProviders.stripe && (
            <BorderBeam
              size={100}
              duration={8}
              borderWidth={4}
              colorFrom="#635BFF"
              colorTo="#a855f7"
            />
          )}
        </Card>

        <Card
          className={cn(
            "relative cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
            activeProviders.paypal && "ring-2 ring-primary"
          )}
          onClick={() => openFor("paypal")}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#179BD7] to-[#253B80] p-2">
                <svg
                  className="h-8 w-8 brightness-0 invert"
                  viewBox="0 0 124 33"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"
                    fill="#253B80"
                  />
                  <path
                    d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z"
                    fill="#179BD7"
                  />
                  <path
                    d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z"
                    fill="#253B80"
                  />
                  <path
                    d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z"
                    fill="#179BD7"
                  />
                  <path
                    d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z"
                    fill="#222D65"
                  />
                  <path
                    d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  PayPal
                  {activeProviders.paypal && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Accept PayPal balance and cards
                </p>
              </div>
            </div>
            {activeProviders.paypal && (
              <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Active payment gateway
              </div>
            )}
          </CardContent>

          {activeProviders.paypal && (
            <BorderBeam
              size={100}
              duration={8}
              borderWidth={4}
              colorFrom="#179BD7"
              colorTo="#253B80"
            />
          )}
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">
              Configure {selectedProvider === "stripe" ? "Stripe" : "PayPal"}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6 px-6">
            {/* Setup Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {selectedProvider === "stripe"
                      ? "Stripe Setup Instructions"
                      : "PayPal Setup Instructions"}
                  </p>
                  {selectedProvider === "stripe" ? (
                    <ol className="space-y-2 text-blue-800 dark:text-blue-200 list-decimal list-inside">
                      <li>
                        Go to{" "}
                        <a
                          href="https://dashboard.stripe.com/register"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          Stripe Dashboard
                        </a>
                      </li>
                      <li>
                        Navigate to <strong>Developers → API keys</strong>
                      </li>
                      <li>
                        Copy your <strong>Publishable key</strong> (starts with
                        pk_test_ or pk_live_)
                      </li>
                      <li>
                        Reveal and copy your <strong>Secret key</strong> (starts
                        with sk_test_ or sk_live_)
                      </li>
                      <li>
                        Go to <strong>Developers → Webhooks</strong>
                      </li>
                      <li>
                        Click <strong>Add endpoint</strong>
                      </li>
                      <li>
                        Enter your webhook URL:{" "}
                        <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-xs">
                          {typeof window !== "undefined"
                            ? window.location.origin
                            : "https://yourdomain.com"}
                          /api/payments/webhook
                        </code>
                      </li>
                      <li>
                        Select events: <strong>payment_intent.succeeded</strong>
                        , <strong>payment_intent.payment_failed</strong>,{" "}
                        <strong>customer.subscription.created</strong>,{" "}
                        <strong>customer.subscription.updated</strong>,{" "}
                        <strong>customer.subscription.deleted</strong>
                      </li>
                      <li>
                        Copy the <strong>Signing secret</strong> (starts with
                        whsec_)
                      </li>
                    </ol>
                  ) : (
                    <ol className="space-y-2 text-blue-800 dark:text-blue-200 list-decimal list-inside">
                      <li>
                        Go to{" "}
                        <a
                          href="https://developer.paypal.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          PayPal Developer Dashboard
                        </a>
                      </li>
                      <li>
                        Click <strong>My Apps & Credentials</strong>
                      </li>
                      <li>
                        Switch between <strong>Sandbox</strong> (test) or{" "}
                        <strong>Live</strong> mode
                      </li>
                      <li>
                        Click <strong>Create App</strong> (or select existing
                        app)
                      </li>
                      <li>
                        Copy your <strong>Client ID</strong>
                      </li>
                      <li>
                        Reveal and copy your <strong>Secret</strong>
                      </li>
                      <li>
                        Under <strong>Webhooks</strong>, click{" "}
                        <strong>Add Webhook</strong>
                      </li>
                      <li>
                        Enter your webhook URL:{" "}
                        <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-xs">
                          {typeof window !== "undefined"
                            ? window.location.origin
                            : "https://yourdomain.com"}
                          /api/payments/webhook
                        </code>
                      </li>
                      <li>
                        Select event types:{" "}
                        <strong>PAYMENT.CAPTURE.COMPLETED</strong>,{" "}
                        <strong>PAYMENT.CAPTURE.DENIED</strong>,{" "}
                        <strong>BILLING.SUBSCRIPTION.CREATED</strong>,{" "}
                        <strong>BILLING.SUBSCRIPTION.UPDATED</strong>,{" "}
                        <strong>BILLING.SUBSCRIPTION.CANCELLED</strong>
                      </li>
                      <li>
                        Copy the <strong>Webhook ID</strong> for your records
                      </li>
                    </ol>
                  )}
                </div>
              </div>
            </div>

            {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Configuration Scope
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      selectedCompanyId === "GLOBAL" ? "default" : "outline"
                    }
                    onClick={() => setSelectedCompanyId("GLOBAL")}
                    className="flex-shrink-0"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Global (Root)
                  </Button>
                  {companies.map((c) => (
                    <Button
                      key={c.id}
                      type="button"
                      size="sm"
                      variant={
                        selectedCompanyId === c.id ? "default" : "outline"
                      }
                      onClick={() => setSelectedCompanyId(c.id)}
                      className="flex-shrink-0"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {c.name}
                    </Button>
                  ))}
                </div>
                {companies.length === 0 && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">
                    No companies found. Configure the global (root) payment
                    provider for ERP subscription billing.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="publicKey" className="text-sm font-medium">
                {selectedProvider === "stripe" ? (
                  <>
                    Publishable Key <span className="text-red-500 ml-1">*</span>
                  </>
                ) : (
                  "Client ID"
                )}
              </Label>
              <Input
                id="publicKey"
                type="text"
                placeholder={
                  selectedProvider === "stripe" ? "pk_test_..." : "Client ID"
                }
                value={publicKey}
                onChange={(e) =>
                  setPublicKey((e.target as HTMLInputElement).value)
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {selectedProvider === "stripe"
                  ? "Found in Stripe Dashboard → Developers → API keys"
                  : "Found in PayPal Developer Dashboard"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey" className="text-sm font-medium">
                {selectedProvider === "stripe" ? "Secret Key" : "Client Secret"}
              </Label>
              <Input
                id="secretKey"
                type="password"
                placeholder={
                  selectedProvider === "stripe"
                    ? "sk_test_..."
                    : "Client Secret"
                }
                value={secretKey}
                onChange={(e) =>
                  setSecretKey((e.target as HTMLInputElement).value)
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Encrypted before storage. Never shown after saving.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret" className="text-sm font-medium">
                Webhook Secret <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder={
                  selectedProvider === "stripe" ? "whsec_..." : "Webhook Secret"
                }
                value={webhookSecret}
                onChange={(e) =>
                  setWebhookSecret((e.target as HTMLInputElement).value)
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Used to verify webhook signatures from{" "}
                {selectedProvider === "stripe" ? "Stripe" : "PayPal"}.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-0.5">
                <Label
                  htmlFor="testMode"
                  className="text-sm font-medium cursor-pointer"
                >
                  Test Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use test credentials and simulate transactions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="testMode"
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) =>
                    setIsTestMode((e.target as HTMLInputElement).checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
