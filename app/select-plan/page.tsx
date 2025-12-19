"use client";

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
import { Check, Loader2, CreditCard, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LIMITS, getTotalUserLimit } from "@/lib/plan-limits";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentForm } from "@/components/payment-form";

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

export default function SelectPlanPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Plan, 2: Payment
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([]);

  useEffect(() => {
    // Check if user actually needs to select a plan
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
  }, [router]);

  // Load pricing from API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch("/api/admin/pricing");
        const data = await response.json();

        if (data.pricing && Array.isArray(data.pricing)) {
          const formattedPlans: PlanData[] = data.pricing.map((p: any) => {
            const planLimits = PLAN_LIMITS[p.plan as keyof typeof PLAN_LIMITS];
            
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
          });

          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
        toast.error("Failed to load pricing");
      }
    };

    fetchPricing();
  }, []);

  // Load Stripe and create setup intent when component mounts
  useEffect(() => {
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
        const setupRes = await fetch("/api/payments/create-setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const setupData = await setupRes.json();

        if (!setupRes.ok) {
          throw new Error(
            setupData.error || "Failed to create payment setup intent"
          );
        }

        setClientSecret(setupData.clientSecret);
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
  }, []);

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

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/select-plan", {
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

      if (!response.ok) {
        throw new Error("Failed to select plan");
      }

      toast.success("Plan selected successfully!");

      // Redirect to dashboard
      router.push("/dashboard");
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

          {stripePromise && clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>
                    Your card will be charged starting next billing cycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentForm
                    onPaymentMethodCreated={(pmId) => {
                      setPaymentMethodId(pmId);
                      setIsPaymentValid(true);
                    }}
                    onValidationChange={setIsPaymentValid}
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
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
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
                  Transaction fee: {plan.transactionFeePercent}% + ${plan.transactionFeeFixed}
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
