"use client";


import { Check, Loader2, CreditCard, ChevronLeft, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";








import { toast } from "sonner";
import { PLAN_LIMITS, getTotalUserLimit } from "@/lib/plan-limits";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentForm } from "@/components/payment-form";
import { CreditCardDisplay } from "@/components/credit-card-display";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";

interface PlanData {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  monthlyPromoPrice: number | null;
  annualPrice: number;
  annualPriceMonthly: number;
  transactionFeePercent: number;
  transactionFeeFixed: number;
  isPopular: boolean;
  features: string[];
}

interface PricingApiResponse {
  plan: string;
  monthlyPrice: number;
  monthlyPromoPrice: number | null;
  annualPrice: number;
  annualPriceMonthly: number;
  transactionFeePercent: number;
  transactionFeeFixed: number;
  isPopular: boolean;
}

export default function SelectPlanPage() {
  const [step, setStep] = useState<0 | 1 | 2>(1); // 0: Set Password (OAuth), 1: Select Plan, 2: Payment
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const onboardTokenQuery = searchParams.get("onboard");
  const needsPasswordQuery = searchParams.get("needsPassword") === "true";

  // Password setup state (for OAuth users)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);

  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([]);

  // Billing address state
  const [billingAddress, setBillingAddress] = useState<AddressData>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "United States",
    countryCode: "US",
    postalCode: "",
  });

  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });
  const [paymentSummary, setPaymentSummary] = useState<{
    brand?: string;
    last4?: string;
  }>({});

  // Onboarding-specific state
  const [onboardToken, setOnboardToken] = useState<string | null>(
    onboardTokenQuery || null
  );
  const [onboardUser, setOnboardUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    // If this page was reached via an onboarding token, verify that token
    const verifyOnboard = async (token: string) => {
      try {
        const res = await fetch(
          `/api/onboarding/verify-oauth-token?token=${encodeURIComponent(
            token
          )}`
        );
        const data = await res.json();
        if (!res.ok) {
          // Token invalid / expired -> send to login with message
          console.error("Onboard token invalid:", data);
          router.push("/login");
          return;
        }

        console.log("[Select Plan] Token verified, user data:", data.user);

        // Pre-fill requested plan and user info
        if (data.requestedPlan) setSelectedPlan(data.requestedPlan);
        setOnboardUser(data.user);
        setOnboardToken(token);

        // If this is an OAuth user who needs to set a password, start at step 0
        if (needsPasswordQuery) {
          setStep(0);
        }

        setVerifying(false);
      } catch (err) {
        console.error("Failed to verify onboarding token:", err);
        router.push("/login");
      }
    };

    if (onboardTokenQuery) {
      verifyOnboard(onboardTokenQuery);
      return;
    }

    // Otherwise require normal authentication / session
    const checkPlan = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (data.authenticated && data.user) {
          // If user already has a plan (not GUEST), redirect to dashboard
          if (data.user.plan && data.user.plan !== "GUEST") {
            router.push("/dashboard");
            return;
          }

          // Set user info for creating setup intent
          console.log("[Select Plan] Authenticated user:", data.user);
          setOnboardUser({
            id: data.user.id,
            name: data.user.name || data.user.email || "User",
            email: data.user.email,
          });
        } else {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }

        setVerifying(false);
      } catch (error) {
        console.error("Failed to check plan:", error);
        router.push("/login");
      }
    };

    checkPlan();
  }, [router, onboardTokenQuery, needsPasswordQuery]);

  // Load pricing from API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch("/api/admin/pricing");
        const data = await response.json();

        if (data.pricing && Array.isArray(data.pricing)) {
          const formattedPlans: PlanData[] = data.pricing.map(
            (p: PricingApiResponse) => {
              const planLimits =
                PLAN_LIMITS[p.plan as keyof typeof PLAN_LIMITS];

              // Define features based on plan
              let features: string[] = [];
              if (p.plan === "ESSENTIAL") {
                features = [
                  `Create ${planLimits.companies} company`,
                  `${getTotalUserLimit("ESSENTIAL")} total users`,
                  `${planLimits.customers} customers`,
                  `${planLimits.storageGB} GB storage`,
                  "Customer & order management",
                  "Email support",
                ];
              } else if (p.plan === "GROWTH") {
                features = [
                  `Create up to ${planLimits.companies} companies`,
                  `${getTotalUserLimit("GROWTH")} total users`,
                  `${planLimits.customers} customers`,
                  `${planLimits.storageGB} GB storage`,
                  "Advanced analytics",
                  "Priority support",
                  "Custom branding",
                ];
              } else if (p.plan === "ENTERPRISE") {
                features = [
                  "Unlimited companies",
                  "Unlimited users",
                  "Unlimited customers",
                  `${planLimits.storageGB} GB storage`,
                  "Dedicated account manager",
                  "Custom integrations",
                  "24/7 phone support",
                  "SLA guarantee",
                ];
              }

              let description = "";
              if (p.plan === "ESSENTIAL") {
                description = "Perfect for small businesses getting started";
              } else if (p.plan === "GROWTH") {
                description = "For growing businesses with multiple locations";
              } else if (p.plan === "ENTERPRISE") {
                description = "For large organizations with complex needs";
              }

              return {
                id: p.plan,
                name: p.plan.charAt(0) + p.plan.slice(1).toLowerCase(),
                description,
                monthlyPrice: p.monthlyPrice,
                monthlyPromoPrice: p.monthlyPromoPrice,
                annualPrice: p.annualPrice,
                annualPriceMonthly: p.annualPriceMonthly,
                transactionFeePercent: p.transactionFeePercent,
                transactionFeeFixed: p.transactionFeeFixed,
                isPopular: p.isPopular,
                features,
              };
            }
          );

          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
        toast.error("Failed to load pricing");
      }
    };

    fetchPricing();
  }, []);

  // Load Stripe and create setup intent when user reaches step 2
  useEffect(() => {
    if (step !== 2) return; // Only initialize on step 2

    const initializePayment = async () => {
      try {
        // Fetch Stripe publishable key
        const res = await fetch("/api/payments/public-key", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Payment provider is not configured");
        }

        const { publishableKey } = data;

        if (!publishableKey || publishableKey === "not_configured") {
          throw new Error("Payment provider is missing a publishable key");
        }

        // Initialize Stripe
        const stripe = loadStripe(publishableKey);
        setStripePromise(stripe);

        // Create SetupIntent for card verification
        // If we're onboarding an OAuth user, include their name/email so the
        // setup intent / customer is created for them
        const setupBody =
          onboardUser && onboardUser.email && onboardUser.name
            ? {
                email: onboardUser.email,
                name: onboardUser.name,
              }
            : {};

        console.log(
          "[Select Plan] Creating setup intent with body:",
          setupBody
        );

        const setupRes = await fetch("/api/payments/create-setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setupBody),
        });

        const setupData = await setupRes.json();

        if (!setupRes.ok) {
          throw new Error(
            setupData.error || "Failed to create payment setup intent"
          );
        }

        setClientSecret(setupData.clientSecret);
        if (setupData.customerId) setCustomerId(setupData.customerId);
      } catch (error: unknown) {
        console.error("Error initializing payment:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to initialize payment"
        );
      }
    };

    initializePayment();
  }, [step, onboardUser]); // Depend on step so it initializes when step changes to 2

  // Password requirements validation
  const passwordRequirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { text: "At least one number", met: /[0-9]/.test(password) },
    {
      text: "At least one special character (!@#$%^&*)",
      met: /[!@#$%^&*]/.test(password),
    },
    {
      text: "Passwords match",
      met: Boolean(password && password === confirmPassword),
    },
  ];
  const allPasswordRequirementsMet = passwordRequirements.every(
    (req) => req.met
  );

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allPasswordRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!onboardToken || !onboardUser) {
      toast.error("Invalid onboarding session");
      return;
    }

    setSettingPassword(true);

    try {
      const response = await fetch("/api/auth/set-password-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: onboardToken,
          password,
          confirmPassword,
          name: onboardUser.name,
          email: onboardUser.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to set password");
        return;
      }

      toast.success("Password set successfully!");

      // Move to step 1 (plan selection)
      setStep(1);
    } catch (error) {
      console.error("Error setting password:", error);
      toast.error("Failed to set password");
    } finally {
      setSettingPassword(false);
    }
  };

  const handleContinueToPayment = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }
    setStep(2);
  };

  const handleBackToPlan = () => {
    setStep(1);
  };

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    if (!paymentMethodId) {
      toast.error("Please add a payment method");
      return;
    }

    // Validate billing address
    if (
      !billingAddress ||
      !billingAddress.addressLine1 ||
      !billingAddress.city ||
      !billingAddress.state ||
      !billingAddress.postalCode
    ) {
      toast.error("Please complete your billing address");
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (onboardToken && onboardUser) {
        // Complete OAuth onboarding flow
        response = await fetch("/api/onboarding/complete-oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: onboardToken,
            plan: selectedPlan,
            billingCycle: billingCycle.toUpperCase(),
            paymentMethodId,
            stripeCustomerId: customerId || undefined,
            billingAddress,
          }),
        });
      } else {
        // Regular logged-in flow
        response = await fetch("/api/user/select-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: selectedPlan,
            billingCycle: billingCycle.toUpperCase(),
            paymentMethodId,
          }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to select/complete plan");
      }

      toast.success("Plan selected successfully!");

      // Redirect to success page with beating heart animation
      router.push("/register/success");
      router.refresh();
    } catch (error) {
      console.error("Error selecting plan:", error);
      toast.error("Failed to select plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 0: Set Password (for OAuth users)
  if (step === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Set Up Your Password</CardTitle>
              <CardDescription>
                Create a secure password to complete your account setup. You can
                use this to sign in anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSetup} className="space-y-4">
                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Password Requirements:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span
                        className={
                          req.met ? "text-green-600" : "text-muted-foreground"
                        }
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!allPasswordRequirementsMet || settingPassword}
                >
                  {settingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Password...
                    </>
                  ) : (
                    "Continue to Plan Selection"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Payment
  if (step === 2) {
    const selectedPlanData = plans.find((p) => p.id === selectedPlan);

    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Button variant="ghost" onClick={handleBackToPlan} className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Add Payment Method</h1>
            <p className="text-lg text-muted-foreground">
              Selected Plan: <strong>{selectedPlanData?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {billingCycle === "monthly"
                ? selectedPlanData?.monthlyPromoPrice
                  ? `$${selectedPlanData.monthlyPromoPrice}/month`
                  : `$${selectedPlanData?.monthlyPrice}/month`
                : `$${selectedPlanData?.annualPriceMonthly}/month`}{" "}
              • Billed {billingCycle === "monthly" ? "Monthly" : "Annually"}
            </p>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Secure payment • Cancel anytime • No surprise charges
              </p>
            </div>
          </div>

          {stripePromise && clientSecret ? (
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
              <div className="flex flex-col gap-6 mb-6">
                {/* Left Column: Credit Card Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Card Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                    <p className="text-xs text-muted-foreground mt-3">
                      For your security we only show masked numbers. The card
                      ending is shown after saving.
                    </p>
                  </CardContent>
                </Card>

                {/* Right Column: Payment Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>
                      Your card will be charged starting next billing cycle
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                  <CardDescription>
                    Enter the billing address for your payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddressAutocomplete
                    label="Billing Address"
                    value={billingAddress}
                    onChange={setBillingAddress}
                    required
                  />
                </CardContent>
              </Card>

              <div className="mt-6 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSelectPlan}
                  disabled={!isPaymentValid || isLoading}
                  className="min-w-[200px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </Elements>
          ) : (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Select Plan
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Welcome! Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select a plan to get started with OnTarget ERP
          </p>
        </div>
        {/* Billing Cycle Toggle */}
        <div className="w-[230px] mx-auto flex flx-row justify-between items-center gap-2 mb-8 border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-lg transition-all ${
              billingCycle === "monthly"
                ? "bg-primary text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-6 py-2 rounded-lg relative transition-all ${
              billingCycle === "annual"
                ? "bg-primary text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
              Save
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan === plan.id
                  ? "ring-2 ring-primary shadow-lg scale-105"
                  : ""
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </div>
                  {selectedPlan === plan.id && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                {billingCycle === "monthly" ? (
                  <>
                    {plan.monthlyPromoPrice ? (
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl text-orange-500 line-through font-semibold">
                            ${plan.monthlyPrice}
                          </span>
                          <span className="text-3xl font-bold">
                            ${plan.monthlyPromoPrice}/month
                          </span>
                        </div>
                        <p className="text-xs text-primary font-medium mt-1">
                          Limited time offer!
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Billed monthly
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl font-bold mt-4">
                          ${plan.monthlyPrice}/month
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Billed monthly
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      ${plan.annualPriceMonthly}/month
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                      ${plan.annualPrice}/year
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed annually
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Transaction fee: {plan.transactionFeePercent}% + $
                  {plan.transactionFeeFixed}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinueToPayment}
            disabled={!selectedPlan}
            className="min-w-[200px]"
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
