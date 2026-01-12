"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

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
    <section id="pricing" className="pt-40 pb-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16 flex flex-col items-center">
          <h2 className="max-w-4xl text-center text-5xl md:text-7xl font-display font-black tracking-tight dark:dark:text-gray-200 mb-6">
            <span className="text-purple-500 dark:text-[#2bee79] mr-4">
              Choose
            </span>
            Your Plan
          </h2>
          <p className="w-full px-4 mx-auto text-base md:text-lg text-black dark:text-gray-50 text-center leading-relaxed font-body md:max-w-4xl mb-6">
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
                ? "bg-purple-500 text-white dark:bg-[#2bee79] dark:text-black shadow-lg"
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
                ? "bg-purple-500 text-white dark:bg-[#2bee79] dark:text-black shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 text-white bg-purple-500 dark:bg-green-600 dark:text-black text-xs px-2 py-1 rounded font-semibold">
              Save
            </span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Essential Plan */}
          <div className="relative flex flex-col rounded-2xl border border-purple-500 dark:border-[#2bee79] p-8 shadow-sm hover:shadow-lg transition-shadow">
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
                <span className="dark:text-gray-200">/month</span>
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
              <p className="text-sm dark:text-gray-200">
                {pricingMap.ESSENTIAL?.transactionFeePercent || 3.9}% + $
                {(pricingMap.ESSENTIAL?.transactionFeeFixed || 0.99).toFixed(2)}{" "}
                Per CC transaction
              </p>
              <p className="text-xs dark:text-gray-200">
                Plus any other Stripe fees
              </p>
              <p className="text-sm dark:text-gray-200 mt-2">
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
              <Button
                className="w-full py-5 dark:border hover:bg-purple-500/10 hover:border-purple-500 dark:border-[#2bee79] transition-all"
                variant="outline"
              >
                <span className="text-black dark:text-[#2bee79]">
                  {" "}
                  Get Started
                </span>{" "}
              </Button>
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="relative flex flex-col rounded-2xl border-2 border-purple-500 dark:border-[#2bee79] p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-purple-500 text-white  px-4 py-1 rounded-full text-sm font-medium dark:bg-[#2bee79] dark:text-black">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Growth</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  ${getPrice("GROWTH").display}
                </span>
                <span className="dark:text-gray-200">/month</span>
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
              <p className="text-sm dark:text-gray-200">
                {pricingMap.GROWTH?.transactionFeePercent || 3.2}% + $
                {(pricingMap.GROWTH?.transactionFeeFixed || 0.49).toFixed(2)}{" "}
                Per CC transaction
              </p>
              <p className="text-xs dark:text-gray-200">
                Plus any other Stripe fees
              </p>
              <p className="text-sm dark:text-gray-200 mt-2">
                Extra storage: $
                {(pricingMap.GROWTH?.extraStoragePricePerGB || 0.32).toFixed(2)}
                /GB/month
              </p>
            </div>

            <Link
              href={`/register?plan=GROWTH&billing=${billingCycle}`}
              className="block mt-6 outline py-2 text-center rounded-lg border border-purple-500 hover:bg-purple-300/10 dark:border-[#2bee79] transition-all"
            >
              <span className="text-black dark:text-[#2bee79]">
                Get Started
              </span>{" "}
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="relative flex flex-col rounded-2xl border border-purple-500 dark:border-[#2bee79] p-8 shadow-sm hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  ${getPrice("ENTERPRISE").display}
                </span>
                <span className="dark:text-gray-200">/month</span>
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
              <p className="text-sm dark:text-gray-200">
                {pricingMap.ENTERPRISE?.transactionFeePercent || 2.9}% + $
                {(pricingMap.ENTERPRISE?.transactionFeeFixed || 0.2).toFixed(2)}{" "}
                Per CC transaction
              </p>
              <p className="text-xs dark:text-gray-200">
                Plus any other Stripe fees
              </p>
              <p className="text-sm dark:text-gray-200 mt-2">
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
              <Button
                className="w-full py-5 dark:border hover:bg-purple-500/10 hover:border-purple-500 dark:border-[#2bee79] dark:hover:border-[#2bee79] transition-all"
                variant="outline"
              >
                <span className="text-black dark:text-[#2bee79]">
                  Get Started
                </span>{" "}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
