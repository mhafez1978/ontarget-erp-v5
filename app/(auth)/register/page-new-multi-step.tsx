"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Check,
  ShieldCheck,
  Quote,
  Building2,
} from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentForm } from "@/components/payment-form";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";

type SubscriptionPlan = "ESSENTIAL" | "GROWTH" | "ENTERPRISE";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [publishableKey, setPublishableKey] = useState<string>("");
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [isLoadingPublishableKey, setIsLoadingPublishableKey] = useState(true);
  const [publishableKeyError, setPublishableKeyError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSetupIntent, setIsCreatingSetupIntent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [setupIntentError, setSetupIntentError] = useState("");

  // Step 1: Plan Selection
  const urlPlan = searchParams
    .get("plan")
    ?.toUpperCase() as SubscriptionPlan | null;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    urlPlan && ["ESSENTIAL", "GROWTH", "ENTERPRISE"].includes(urlPlan)
      ? urlPlan
      : "ESSENTIAL"
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  // Step 2: Payment & Billing
  const [clientSecret, setClientSecret] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [paymentSummary, setPaymentSummary] = useState<{
    brand?: string;
    last4?: string;
  }>({});
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
    cardBrand: "visa" as "visa" | "mastercard" | "amex" | "discover",
  });
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [billingAddress, setBillingAddress] = useState<AddressData>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "United States",
    countryCode: "US",
    postalCode: "",
  });

  // Step 3: Account Details
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Email uniqueness state (checked on blur / debounced while typing)
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState("");

  // Function to capitalize each word in a name
  const capitalizeName = (name: string): string => {
    return name
      .split(" ")
      .map((word) => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const isStrongPassword = (password: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  // Fetch publishable key from backend (root gateway)
  useEffect(() => {
    const controller = new AbortController();

    const loadKey = async () => {
      setIsLoadingPublishableKey(true);
      setPublishableKeyError("");

      try {
        const res = await fetch("/api/payments/public-key", {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Payment provider is not configured");
        }

        const data = (await res.json()) as {
          publishableKey?: string;
          provider?: string;
          isTestMode?: boolean;
        };

        if (!data.publishableKey) {
          throw new Error("Payment provider is missing a publishable key");
        }

        setPublishableKey(data.publishableKey);
        setStripePromise(loadStripe(data.publishableKey));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setPublishableKeyError(
          err instanceof Error ? err.message : "Failed to load payment provider"
        );
      } finally {
        setIsLoadingPublishableKey(false);
      }
    };

    loadKey();
    return () => controller.abort();
  }, []);

  const createSetupIntent = useCallback(async () => {
    if (isCreatingSetupIntent || clientSecret) return;
    if (!formData.name || !formData.email) return;
    if (!publishableKey || publishableKeyError) return;

    setIsCreatingSetupIntent(true);
    setSetupIntentError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("/api/payments/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to initialize payment form.");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setCustomerId(data.customerId);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setSetupIntentError("Payment form timed out. Please retry.");
      } else {
        setSetupIntentError(
          err instanceof Error
            ? err.message
            : "Failed to initialize payment form. Please retry."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setIsCreatingSetupIntent(false);
    }
  }, [
    clientSecret,
    formData.email,
    formData.name,
    isCreatingSetupIntent,
    publishableKey,
    publishableKeyError,
  ]);

  // Create setup intent when moving to step 2
  useEffect(() => {
    if (
      currentStep === 2 &&
      !clientSecret &&
      !setupIntentError &&
      !isLoadingPublishableKey &&
      !publishableKeyError &&
      formData.name &&
      formData.email
    ) {
      createSetupIntent();
    }
  }, [
    currentStep,
    clientSecret,
    createSetupIntent,
    setupIntentError,
    isLoadingPublishableKey,
    publishableKeyError,
    formData.name,
    formData.email,
  ]);

  // Check email immediately (used on blur)
  async function checkEmail(emailRaw: string) {
    const email = (emailRaw || "").trim();
    if (!email || !isValidEmail(email)) return;

    setIsCheckingEmail(true);
    setEmailCheckError("");

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to check email");
      }

      const data = await res.json();
      setEmailExists(!!data.exists);
    } catch (err) {
      setEmailCheckError(
        err instanceof Error ? err.message : "Failed to check email"
      );
    } finally {
      setIsCheckingEmail(false);
    }
  }

  // Debounced email check while typing
  useEffect(() => {
    const controller = new AbortController();
    const email = formData.email.trim();
    if (!email || !isValidEmail(email)) return;

    setIsCheckingEmail(true);
    setEmailCheckError("");

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to check email");
        }

        const data = await res.json();
        setEmailExists(!!data.exists);
      } catch (err) {
        if (!(err instanceof Error && err.name === "AbortError")) {
          setEmailCheckError(
            err instanceof Error ? err.message : "Failed to check email"
          );
        }
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [formData.email]);

  const planDetails = {
    ESSENTIAL: {
      name: "Essential",
      monthlyPrice: "$49.99",
      annualPrice: "$42.49",
      annualTotal: "$509.88",
      features: ["Up to 10 users", "5GB storage", "Email support"],
    },
    GROWTH: {
      name: "Growth",
      monthlyPrice: "$149.99",
      annualPrice: "$127.49",
      annualTotal: "$1,529.88",
      features: [
        "Up to 50 users",
        "50GB storage",
        "Priority support",
        "Advanced analytics",
      ],
    },
    ENTERPRISE: {
      name: "Enterprise",
      monthlyPrice: "$349.99",
      annualPrice: "$297.49",
      annualTotal: "$3,569.88",
      features: [
        "Unlimited users",
        "Unlimited storage",
        "24/7 phone support",
        "Custom integrations",
        "Dedicated account manager",
      ],
    },
  };

  const handleNextStep = () => {
    setError("");

    if (currentStep === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        setError("Please enter your full name");
        return;
      }

      if (!isValidEmail(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (emailExists) {
        setError("An account with this email already exists. Please log in.");
        return;
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate payment info
      if (!isPaymentValid) {
        setError("Please complete your payment information");
        return;
      }
      if (!paymentMethodId) {
        setError("Payment method is required");
        return;
      }
      if (
        !billingAddress.addressLine1 ||
        !billingAddress.city ||
        !billingAddress.state ||
        !billingAddress.postalCode
      ) {
        setError("Please complete your billing address");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (!isStrongPassword(formData.password)) {
      setError("Password must include upper, lower, number, and be 8+ chars");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          plan: selectedPlan,
          billingCycle: billingCycle.toUpperCase(),
          paymentMethodId,
          stripeCustomerId: customerId,
          billingAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/register/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Render step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
              currentStep >= step
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground text-muted-foreground"
            }`}
          >
            {currentStep > step ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="text-xs font-semibold">{step}</span>
            )}
          </div>
          {step < 3 && (
            <div
              className={`w-12 h-0.5 mx-2 transition-all ${
                currentStep > step ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Step 1: Plan Selection
  const renderPlanSelection = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground text-sm">
          Start with a 30-day free trial • Cancel anytime
        </p>
      </div>

      {/* Contact Information (needed for setup intent) */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name-step1">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name-step1"
              type="text"
              placeholder="John Doe"
              className="pl-10"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: capitalizeName(e.target.value),
                })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-step1">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email-step1"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailExists(false);
                setEmailCheckError("");
              }}
              onBlur={() => checkEmail(formData.email)}
              required
            />
          </div>
          {isCheckingEmail && (
            <p className="text-xs text-muted-foreground">Checking email…</p>
          )}
          {emailExists && (
            <p className="text-xs text-destructive">
              An account with this email already exists — please log in.
            </p>
          )}
          {emailCheckError && (
            <p className="text-xs text-destructive">{emailCheckError}</p>
          )}
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 p-1 bg-muted rounded-lg w-fit mx-auto mt-4">
        <button
          type="button"
          onClick={() => setBillingCycle("monthly")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            billingCycle === "monthly"
              ? "bg-background shadow-sm"
              : "hover:bg-background/50"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle("annual")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            billingCycle === "annual"
              ? "bg-background shadow-sm"
              : "hover:bg-background/50"
          }`}
        >
          Annual
          <span className="ml-2 text-xs text-green-600 font-semibold">
            -15%
          </span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-3">
        {(["ESSENTIAL", "GROWTH", "ENTERPRISE"] as const).map((plan) => (
          <button
            key={plan}
            type="button"
            onClick={() => setSelectedPlan(plan)}
            className={`text-left p-4 rounded-lg border transition-all hover:shadow-md ${
              selectedPlan === plan
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">
                  {planDetails[plan].name}
                </h3>
                <div className="text-lg font-bold text-primary">
                  {billingCycle === "monthly"
                    ? planDetails[plan].monthlyPrice
                    : planDetails[plan].annualPrice}
                  <span className="text-xs font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
              </div>
              {selectedPlan === plan && (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={handleNextStep}
        className="w-full"
        size="lg"
      >
        Continue to Payment
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  // Step 2: Payment & Billing
  const renderPaymentStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">Payment Details</h2>
        <p className="text-sm text-muted-foreground">
          Secure payment processing via Stripe
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-medium">
            {planDetails[selectedPlan].name} Plan
          </span>
          <span className="font-bold">
            {billingCycle === "monthly"
              ? planDetails[selectedPlan].monthlyPrice
              : planDetails[selectedPlan].annualPrice}
            /mo
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
          <CheckCircle2 className="h-3 w-3" />
          30-day free trial included
        </div>
      </div>

      {publishableKeyError && (
        <div className="p-3 border border-destructive rounded-lg bg-destructive/10 text-destructive text-sm">
          {publishableKeyError}
        </div>
      )}

      {setupIntentError && (
        <div className="p-3 border border-destructive rounded-lg bg-destructive/10 text-sm flex flex-col gap-2">
          <span className="text-destructive">{setupIntentError}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={createSetupIntent}
            disabled={isCreatingSetupIntent}
          >
            {isCreatingSetupIntent ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Retrying...
              </>
            ) : (
              "Retry"
            )}
          </Button>
        </div>
      )}

      {/* Payment Form - Single Column */}
      <div className="space-y-4">
        {clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#0066ff",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <PaymentForm
              onCardDataChange={setCardData}
              onValidationChange={setIsPaymentValid}
              onPaymentMethodCreated={(id, details) => {
                setPaymentMethodId(id);
                setPaymentSummary({
                  brand: details?.brand,
                  last4: details?.last4,
                });
              }}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg min-h-[200px]">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
              <span className="text-sm text-muted-foreground block">
                {isLoadingPublishableKey
                  ? "Loading secure payment..."
                  : isCreatingSetupIntent
                  ? "Initializing..."
                  : "Please wait..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Billing Address */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">Billing Address</h3>
        <AddressAutocomplete
          label="Address"
          value={billingAddress}
          onChange={setBillingAddress}
          required
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          className="flex-1"
        >
          Back
        </Button>
        <div className="flex-1 flex flex-col gap-1">
          <Button
            type="button"
            onClick={handleNextStep}
            className="w-full"
            disabled={
              !clientSecret ||
              !isPaymentValid ||
              !paymentMethodId ||
              !billingAddress.addressLine1 ||
              !billingAddress.city ||
              !billingAddress.state ||
              !billingAddress.postalCode ||
              isCreatingSetupIntent ||
              isLoadingPublishableKey ||
              !!publishableKeyError
            }
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {/* Diagnostic Message for Disabled Button */}
          {currentStep === 2 && (
            <div className="text-[10px] text-center text-muted-foreground h-4">
              {!clientSecret
                ? "Initializing payment..."
                : !isPaymentValid
                ? "Please complete card details"
                : !paymentMethodId
                ? "Processing card..."
                : !billingAddress.addressLine1
                ? "Enter billing address"
                : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Account Details
  const renderAccountStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">Secure Your Account</h2>
        <p className="text-sm text-muted-foreground">
          Set a strong password to protect your data
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              value={formData.name}
              className="pl-10 bg-muted/50"
              disabled
            />
            <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              className="pl-10 bg-muted/50"
              disabled
            />
            <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={isLoading}
          className="flex-1"
        >
          Back
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left Panel - Brand & Testimonial */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-8 w-8" />
            OnTarget ERP
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <Quote className="h-12 w-12 text-zinc-600" />
          <blockquote className="text-2xl font-medium leading-relaxed">
            &quot;This platform completely transformed how we manage our global
            workforce. The efficiency gains were immediate.&quot;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
              JD
            </div>
            <div>
              <div className="font-semibold">Jane Doe</div>
              <div className="text-sm text-zinc-400">CTO, TechGlobal Inc.</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            Bank-level security
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            PCI Compliant
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <StepIndicator />

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderPlanSelection()}
            {currentStep === 2 && renderPaymentStep()}
            {currentStep === 3 && renderAccountStep()}
          </form>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
