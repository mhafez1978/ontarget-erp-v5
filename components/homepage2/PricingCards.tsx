"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingCardsProps {
  pricingMap: Record<string, any>;
}

export function PricingCards({ pricingMap }: PricingCardsProps) {
  const plans = [
    {
      name: "Trial",
      key: "TRIAL",
      description: "Perfect for trying out all features",
      popular: false,
      features: [
        "14-day free trial",
        "Full access to all features",
        "1 company workspace",
        "Basic storage",
        "Email support",
      ],
    },
    {
      name: "Professional",
      key: "ERP_CUSTOMER",
      description: "For growing businesses",
      popular: true,
      features: [
        "Unlimited company workspaces",
        "Advanced AI features",
        "Priority support",
        "Custom branding",
        "Advanced analytics",
        "API access",
      ],
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Start free, upgrade when you&apos;re ready
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const pricing = pricingMap[plan.key];
            if (!pricing) return null;

            return (
              <Card
                key={plan.key}
                className={`relative border-2 ${
                  plan.popular
                    ? "border-purple-500 shadow-2xl shadow-purple-500/20 scale-105"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-12">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold">
                      ${pricing.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                  {pricing.annualPrice > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      or ${pricing.annualPrice}/year (save 2 months!)
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0 w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    size="lg"
                    className={`w-full ${
                      plan.popular
                        ? "bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                        : ""
                    }`}
                  >
                    <Link
                      href={
                        plan.key === "TRIAL"
                          ? "/register?trial=true"
                          : "/select-plan"
                      }
                    >
                      {plan.key === "TRIAL"
                        ? "Start Free Trial"
                        : "Get Started"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
