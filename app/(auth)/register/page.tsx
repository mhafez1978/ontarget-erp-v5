"use client";

import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CreditCardDisplay } from "@/components/credit-card-display";
import { PaymentForm } from "@/components/payment-form";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";

type SubscriptionPlan = "ESSENTIAL" | "GROWTH" | "ENTERPRISE";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if this is a free trial registration
  const isTrial = searchParams.get("trial") === "true";

  const [publishableKey, setPublishableKey] = useState<string>("");
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [isLoadingPublishableKey, setIsLoadingPublishableKey] = useState(
    !isTrial
  ); // Skip loading publishable key for trial
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

      // For trial mode, skip payment step and go directly to account setup
      if (isTrial) {
        setCurrentStep(2); // In trial mode, step 2 is account setup
      } else {
        setCurrentStep(2); // In paid mode, step 2 is payment
      }
    } else if (currentStep === 2 && !isTrial) {
      // Validate payment info (only for non-trial mode)
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
          isTrial: isTrial, // Pass trial mode flag
          paymentMethodId: isTrial ? undefined : paymentMethodId, // Skip payment for trial
          stripeCustomerId: isTrial ? undefined : customerId,
          billingAddress: isTrial ? undefined : billingAddress,
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
      {(isTrial ? [1, 2] : [1, 2, 3]).map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              currentStep >= step
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground dark:text-gray-200"
            }`}
          >
            {currentStep > step ? (
              <Check className="h-5 w-5" />
            ) : (
              <span className="text-sm font-semibold">{step}</span>
            )}
          </div>
          {index < (isTrial ? 1 : 2) && (
            <div
              className={`w-16 h-0.5 mx-2 transition-all ${
                currentStep > step ? "bg-primary" : "bg-muted-foreground"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Step 1: Plan Selection
  const renderPlanSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">
          {isTrial ? "Start Your Free Trial" : "Choose Your Plan"}
        </h3>
        <p className="dark:text-gray-200 text-sm">
          {isTrial
            ? "Start with a 14-day free trial • No credit card required"
            : "Start with a 30-day free trial • Cancel anytime"}
        </p>
      </div>

      {/* Contact Information (needed for setup intent) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name-step1">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 dark:text-gray-200" />
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
            <Mail className="absolute left-3 top-3 h-4 w-4 dark:text-gray-200" />
            <Input
              id="email-step1"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <p className="text-xs dark:text-gray-200">
            We&apos;ll use this to create your account and initialize billing.
          </p>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 p-1 bg-muted rounded-lg w-fit mx-auto">
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
            Save 15%
          </span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["ESSENTIAL", "GROWTH", "ENTERPRISE"] as const).map((plan) => (
          <button
            key={plan}
            type="button"
            onClick={() => setSelectedPlan(plan)}
            className={`text-left p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
              selectedPlan === plan
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{planDetails[plan].name}</h3>
              {selectedPlan === plan && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            {billingCycle === "monthly" ? (
              <div className="text-2xl font-bold text-primary mb-2">
                {planDetails[plan].monthlyPrice}
                <span className="text-sm font-normal dark:text-gray-200">
                  /mo
                </span>
              </div>
            ) : (
              <div className="mb-2">
                <div className="text-2xl font-bold text-primary">
                  {planDetails[plan].annualPrice}
                  <span className="text-sm font-normal dark:text-gray-200">
                    /mo
                  </span>
                </div>
                <p className="text-xs dark:text-gray-200">
                  {planDetails[plan].annualTotal} billed annually
                </p>
              </div>
            )}
            <ul className="space-y-1 text-xs dark:text-gray-200">
              {planDetails[plan].features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={handleNextStep}
          className="w-full max-w-md"
          size="lg"
        >
          {isTrial ? "Continue to Account Setup" : "Continue to Payment"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 2: Payment & Billing
  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Payment Information</h3>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
      </div>

      {publishableKeyError && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive text-sm">
          {publishableKeyError}
        </div>
      )}

      {setupIntentError && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-sm flex flex-col gap-3">
          <span className="text-destructive">{setupIntentError}</span>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={createSetupIntent}
              disabled={isCreatingSetupIntent}
            >
              {isCreatingSetupIntent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retrying...
                </>
              ) : (
                "Retry"
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Credit Card Display */}
        <div className="space-y-4">
          <CreditCardDisplay
            cardNumber={
              paymentSummary.last4
                ? `•••• •••• •••• ${paymentSummary.last4}`
                : cardData.cardNumber || "•••• •••• •••• ••••"
            }
            cardHolder={cardData.cardHolder}
            expiryDate={cardData.expiryDate}
            cvv={cardData.cvv}
          />
          <p className="text-xs dark:text-gray-200">
            For your security we only show masked numbers. The card ending is
            shown after saving.
          </p>
        </div>

        {/* Right Column: Payment Form */}
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
            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg min-h-[300px]">
              <div className="text-center space-y-1">
                <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200 mx-auto" />
                <span className="text-sm dark:text-gray-200">
                  {isLoadingPublishableKey
                    ? "Loading payment provider..."
                    : isCreatingSetupIntent
                    ? "Preparing payment form..."
                    : "Waiting to initialize payment form"}
                </span>
                {publishableKeyError && (
                  <p className="text-xs text-destructive">
                    {publishableKeyError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Address */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
        <AddressAutocomplete
          label="Billing Address"
          value={billingAddress}
          onChange={setBillingAddress}
          required
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plan
        </Button>
        <Button
          type="button"
          onClick={handleNextStep}
          className="flex-1"
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
          Continue to Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 3: Account Details
  const renderAccountStep = () => (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Account Details</h3>
        <p className="text-sm dark:text-gray-200">
          Create your login credentials
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 dark:text-gray-200" />
            <Input
              id="name"
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
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 dark:text-gray-200" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 dark:text-gray-200" />
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
              className="absolute right-3 top-3 dark:text-gray-200 hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs dark:text-gray-200">
            Use 8+ chars with upper, lower, and a number
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 dark:text-gray-200" />
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
              className="absolute right-3 top-3 dark:text-gray-200 hover:text-foreground"
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

      {/* Summary */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <h3 className="font-semibold text-sm">Registration Summary</h3>
        <div className="text-sm dark:text-gray-200 space-y-1">
          <p>
            <span className="font-medium">Plan:</span>{" "}
            {planDetails[selectedPlan].name} (
            {billingCycle === "monthly" ? "Monthly" : "Annual"})
          </p>
          <p>
            <span className="font-medium">Payment:</span>{" "}
            {paymentSummary.last4
              ? `${(paymentSummary.brand || "Card").toUpperCase()} ending in ${
                  paymentSummary.last4
                }`
              : "Payment method pending"}
          </p>
          <p>
            <span className="font-medium">Trial:</span> 30 days free, then{" "}
            {billingCycle === "monthly"
              ? planDetails[selectedPlan].monthlyPrice
              : planDetails[selectedPlan].annualPrice}
            /month
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={isLoading}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center dark:text-gray-200 mt-4">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-center">
            {currentStep === 1 && "Select your plan to get started"}
            {currentStep === 2 && "Enter your payment information"}
            {currentStep === 3 && "Complete your account details"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <StepIndicator />

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderPlanSelection()}
            {currentStep === 2 && !isTrial && renderPaymentStep()}
            {((currentStep === 3 && !isTrial) ||
              (currentStep === 2 && isTrial)) &&
              renderAccountStep()}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
          <Card className="w-full max-w-4xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
