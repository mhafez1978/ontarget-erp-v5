"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingData {
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  annualPriceMonthly: number;
  monthlyPromoPrice: number | null;
  transactionFeePercent: number;
  transactionFeeFixed: number;
  extraStoragePricePerGB: number;
}

interface HomepagePricingProps {
  pricingMap: Record<string, PricingData>;
}

export function HomepagePricing({ pricingMap }: HomepagePricingProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  const getPrice = (plan: keyof typeof pricingMap) => {
    const pricing = pricingMap[plan];
    if (!pricing) return { display: "0.00", originalMonthly: null };

    if (billingCycle === "monthly") {
      return {
        display: (pricing.monthlyPromoPrice || pricing.monthlyPrice).toFixed(2),
        originalMonthly: pricing.monthlyPromoPrice
          ? pricing.monthlyPrice.toFixed(2)
          : null,
      };
    } else {
      return {
        display: pricing.annualPriceMonthly.toFixed(2),
        originalMonthly: null,
        savings: (
          (pricing.monthlyPrice - pricing.annualPriceMonthly) *
          12
        ).toFixed(2),
      };
    }
  };

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs. All plans include
            our core features.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="w-[230px] mx-auto flex flex-row justify-between items-center gap-2 mb-12 border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
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

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Essential Plan */}
          <div className="relative flex flex-col rounded-2xl border bg-background p-8 shadow-sm hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Essential</h3>
              <div className="flex items-baseline gap-2">
                {getPrice("ESSENTIAL").originalMonthly && (
                  <span className="text-2xl text-orange-500 line-through font-semibold">
                    ${getPrice("ESSENTIAL").originalMonthly}
                  </span>
                )}
                <span className="text-4xl font-bold">
                  ${getPrice("ESSENTIAL").display}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {billingCycle === "monthly" &&
                pricingMap.ESSENTIAL?.monthlyPromoPrice && (
                  <p className="text-sm text-primary font-medium mt-2">
                    Limited time offer!
                  </p>
                )}
              {billingCycle === "annual" && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Save ${getPrice("ESSENTIAL").savings} per year!
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-semibold">1 company</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">10 total users (all roles)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Up to 100 customers</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">50 GB storage</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Email support</span>
              </li>
            </ul>

            <div className="border-t pt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                {pricingMap.ESSENTIAL?.transactionFeePercent || 3.9}% + $
                {(pricingMap.ESSENTIAL?.transactionFeeFixed || 0.99).toFixed(2)}{" "}
                per CC transaction
              </p>
              <p className="text-xs text-muted-foreground">
                Plus any other Stripe fees
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Extra storage: $
                {(pricingMap.ESSENTIAL?.extraStoragePricePerGB || 0.45).toFixed(
                  2
                )}
                /GB/month
              </p>
            </div>

            <Link
              href={`/register?plan=ESSENTIAL&billing=${billingCycle}`}
              className="block mt-6"
            >
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-background p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Growth</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  ${getPrice("GROWTH").display}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {billingCycle === "annual" && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Save ${getPrice("GROWTH").savings} per year!
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-semibold">Up to 3 companies</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">50 total users (all roles)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Up to 300 customers</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">250 GB storage</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Custom branding</span>
              </li>
            </ul>

            <div className="border-t pt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                {pricingMap.GROWTH?.transactionFeePercent || 3.2}% + $
                {(pricingMap.GROWTH?.transactionFeeFixed || 0.49).toFixed(2)}{" "}
                per CC transaction
              </p>
              <p className="text-xs text-muted-foreground">
                Plus any other Stripe fees
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Extra storage: $
                {(pricingMap.GROWTH?.extraStoragePricePerGB || 0.32).toFixed(2)}
                /GB/month
              </p>
            </div>

            <Link
              href={`/register?plan=GROWTH&billing=${billingCycle}`}
              className="block mt-6"
            >
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="relative flex flex-col rounded-2xl border bg-background p-8 shadow-sm hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  ${getPrice("ENTERPRISE").display}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {billingCycle === "annual" && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Save ${getPrice("ENTERPRISE").savings} per year!
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-semibold">
                  Unlimited companies
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Unlimited users</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Unlimited customers</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">1 TB storage</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Dedicated account manager</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">24/7 phone support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">SLA guarantee</span>
              </li>
            </ul>

            <div className="border-t pt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                {pricingMap.ENTERPRISE?.transactionFeePercent || 2.9}% + $
                {(pricingMap.ENTERPRISE?.transactionFeeFixed || 0.2).toFixed(2)}{" "}
                per CC transaction
              </p>
              <p className="text-xs text-muted-foreground">
                Plus any other Stripe fees
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Extra storage: $
                {(
                  pricingMap.ENTERPRISE?.extraStoragePricePerGB || 0.21
                ).toFixed(2)}
                /GB/month
              </p>
            </div>

            <Link
              href={`/register?plan=ENTERPRISE&billing=${billingCycle}`}
              className="block mt-6"
            >
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
