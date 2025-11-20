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
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PLAN_PRICING,
  PLAN_LIMITS,
  getTotalUserLimit,
} from "@/lib/plan-limits";

const plans = [
  {
    id: "ESSENTIAL",
    name: "Essential",
    description: "Perfect for small businesses getting started",
    price: `$${PLAN_PRICING.ESSENTIAL.monthlyPrice}/month`,
    features: [
      `Create ${PLAN_LIMITS.ESSENTIAL.companies} company`,
      `${getTotalUserLimit("ESSENTIAL")} total users`,
      `${PLAN_LIMITS.ESSENTIAL.customers} customers`,
      `${PLAN_LIMITS.ESSENTIAL.storageGB} GB storage`,
      "Customer & order management",
      "Email support",
    ],
  },
  {
    id: "GROWTH",
    name: "Growth",
    description: "For growing businesses with multiple locations",
    price: `$${PLAN_PRICING.GROWTH.monthlyPrice}/month`,
    features: [
      `Create up to ${PLAN_LIMITS.GROWTH.companies} companies`,
      `${getTotalUserLimit("GROWTH")} total users`,
      `${PLAN_LIMITS.GROWTH.customers} customers`,
      `${PLAN_LIMITS.GROWTH.storageGB} GB storage`,
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "For large organizations with complex needs",
    price: `$${PLAN_PRICING.ENTERPRISE.monthlyPrice}/month`,
    features: [
      "Unlimited companies",
      "Unlimited users",
      "Unlimited customers",
      `${PLAN_LIMITS.ENTERPRISE.storageGB} GB storage`,
      "Dedicated account manager",
      "Custom integrations",
      "24/7 phone support",
      "SLA guarantee",
    ],
  },
];

export default function SelectPlanPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

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

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome! Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select a plan to get started with OnTarget ERP
          </p>
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
                <div className="text-3xl font-bold mt-4">{plan.price}</div>
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
            onClick={handleSelectPlan}
            disabled={!selectedPlan || isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Dashboard"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
