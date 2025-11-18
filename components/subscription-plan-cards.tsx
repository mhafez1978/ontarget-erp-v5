"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BorderBeam } from "@/components/ui/border-beam";
import {
  CheckCircle2,
  Loader2,
  Zap,
  Rocket,
  Crown,
  Building2,
  Users,
  TrendingUp,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: "ESSENTIAL" | "GROWTH" | "ENTERPRISE";
  color: string;
  features: string[];
  companyLimit: number | "Unlimited";
  badge?: string;
}

const PLANS: PlanConfig[] = [
  {
    id: "essential",
    name: "Essential",
    description: "Perfect for getting started",
    icon: Zap,
    type: "ESSENTIAL",
    color: "from-[#10B981] to-[#059669]",
    features: [
      "1 Company",
      "Basic features",
      "Email support",
      "Standard security",
      "Monthly updates",
    ],
    companyLimit: 1,
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing businesses",
    icon: Rocket,
    type: "GROWTH",
    color: "from-[#3B82F6] to-[#2563EB]",
    features: [
      "Up to 3 Companies",
      "Advanced features",
      "Priority support",
      "Enhanced security",
      "Weekly updates",
      "Custom branding",
    ],
    companyLimit: 3,
    badge: "Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    icon: Crown,
    type: "ENTERPRISE",
    color: "from-[#8B5CF6] to-[#7C3AED]",
    features: [
      "Unlimited Companies",
      "All features included",
      "24/7 dedicated support",
      "Advanced security & compliance",
      "Daily updates",
      "White-label options",
      "API access",
      "Custom integrations",
    ],
    companyLimit: "Unlimited",
    badge: "Best Value",
  },
];

export function SubscriptionPlanCards() {
  const [currentPlan, setCurrentPlan] = useState<string>("ESSENTIAL");
  const [selectedPlan, setSelectedPlan] = useState<string>("ESSENTIAL");
  const [isLoading, setIsLoading] = useState(false);
  const [companyCount, setCompanyCount] = useState(0);

  // Fetch current plan and company count
  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const [userResponse, companiesResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/companies/my-owned"),
        ]);

        const userData = await userResponse.json();
        const companiesData = await companiesResponse.json();

        if (userData.authenticated && userData.user) {
          const plan = userData.user.plan || "ESSENTIAL";
          setCurrentPlan(plan);
          setSelectedPlan(plan);
        }

        if (companiesResponse.ok && companiesData.companies) {
          setCompanyCount(companiesData.companies.length);
        }
      } catch (err) {
        console.error("Error fetching plan info:", err);
      }
    };

    fetchPlanInfo();
  }, []);

  const handlePlanChange = async (plan: PlanConfig) => {
    // Check if trying to select current plan
    if (plan.type === currentPlan) {
      toast.info("You're already on this plan");
      return;
    }

    // Check company limit
    const limit =
      plan.companyLimit === "Unlimited" ? Infinity : plan.companyLimit;
    if (companyCount > limit) {
      toast.error(
        `You have ${companyCount} companies. Please delete ${
          companyCount - limit
        } company/companies to downgrade to ${plan.name}.`
      );
      return;
    }

    setSelectedPlan(plan.type);

    try {
      setIsLoading(true);

      const response = await fetch("/api/subscription/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.type }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully changed to ${plan.name} plan!`);
        setCurrentPlan(plan.type);
        setSelectedPlan(plan.type);

        // Refresh the plan info without reloading the page
        const [userResponse, companiesResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/companies/my-owned"),
        ]);

        const userData = await userResponse.json();
        const companiesData = await companiesResponse.json();

        if (userData.authenticated && userData.user) {
          setCurrentPlan(userData.user.plan || "ESSENTIAL");
          setSelectedPlan(userData.user.plan || "ESSENTIAL");
        }

        if (companiesResponse.ok && companiesData.companies) {
          setCompanyCount(companiesData.companies.length);
        }
      } else {
        toast.error(data.error || "Failed to change plan");
        setSelectedPlan(currentPlan);
      }
    } catch (error) {
      console.error("Plan change error:", error);
      toast.error("Failed to change plan");
      setSelectedPlan(currentPlan);
    } finally {
      setIsLoading(false);
    }
  };

  const canDowngrade = (plan: PlanConfig) => {
    const limit =
      plan.companyLimit === "Unlimited" ? Infinity : plan.companyLimit;
    return companyCount <= limit;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Current Plan:</strong> {currentPlan} |{" "}
          <strong>Companies:</strong> {companyCount} /{" "}
          {currentPlan === "ESSENTIAL"
            ? "1"
            : currentPlan === "GROWTH"
            ? "3"
            : "Unlimited"}
        </AlertDescription>
      </Alert>

      {/* Plan Cards Grid */}
      <div className="ml-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.type;
          const canSelectPlan = canDowngrade(plan);
          const Icon = plan.icon;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
                isCurrentPlan && "ring-2 ring-primary",
                !canSelectPlan && "opacity-60"
              )}
              onClick={() => !isLoading && handlePlanChange(plan)}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <CardContent className="p-6">
                {/* Plan Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br p-2",
                      plan.color
                    )}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {plan.name}
                      {isCurrentPlan && (
                        <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          Current
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Company Limit Badge */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {plan.companyLimit === "Unlimited"
                        ? "Unlimited Companies"
                        : `${plan.companyLimit} ${
                            plan.companyLimit === 1 ? "Company" : "Companies"
                          }`}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isLoading || isCurrentPlan || !canSelectPlan}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanChange(plan);
                  }}
                >
                  {isLoading && selectedPlan === plan.type ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : !canSelectPlan ? (
                    "Too Many Companies"
                  ) : currentPlan === "ESSENTIAL" && plan.type === "GROWTH" ? (
                    "Upgrade to Growth"
                  ) : currentPlan === "ESSENTIAL" &&
                    plan.type === "ENTERPRISE" ? (
                    "Upgrade to Enterprise"
                  ) : currentPlan === "GROWTH" && plan.type === "ENTERPRISE" ? (
                    "Upgrade to Enterprise"
                  ) : (
                    `Downgrade to ${plan.name}`
                  )}
                </Button>

                {!canSelectPlan && (
                  <p className="text-sm text-amber-700 text-start mt-6">
                    Delete {companyCount - (plan.companyLimit as number)}{" "}
                    {companyCount - (plan.companyLimit as number) === 1
                      ? "company"
                      : "companies"}{" "}
                    first before downgrading your plan.
                  </p>
                )}

                {/* Status Indicator */}
                {isCurrentPlan && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-primary border-t pt-4">
                    <CheckCircle2 className="h-4 w-4" />
                    Active subscription plan
                  </div>
                )}
              </CardContent>

              {isCurrentPlan && (
                <BorderBeam
                  size={100}
                  duration={8}
                  borderWidth={4}
                  colorFrom="#10b981"
                  colorTo="#a855f7"
                />
              )}
            </Card>
          );
        })}
      </div>

      {/* Information Alert */}
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              About Plan Changes
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Plan changes take effect immediately</li>
              <li>• Upgrading gives you access to more companies instantly</li>
              <li>• Downgrading requires you to be within the plan limits</li>
              <li>• You can change your plan at any time</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Enterprise Contact */}
      <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertDescription>
          <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">
            Need a Custom Solution?
          </p>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Contact our sales team for custom pricing, dedicated infrastructure,
            and tailored features for large enterprises.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
