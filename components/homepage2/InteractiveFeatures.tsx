"use client";

import React, { useState } from "react";
import {
  Clock,
  Users,
  ShoppingCart,
  Briefcase,
  Zap,
  FileText,
  DollarSign,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InteractiveFeatures() {
  const features = [
    {
      id: "time-tracking",
      title: "Time & Payroll",
      icon: Clock,
      description:
        "Track work hours, breaks, and automatically calculate payroll",
      benefits: [
        "Real-time clock in/out",
        "Break time tracking",
        "Automated payroll calculations",
        "Multi-company support",
        "Weekly/monthly reports",
      ],
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "workforce",
      title: "Team Management",
      icon: Users,
      description:
        "Manage your entire workforce from onboarding to offboarding",
      benefits: [
        "Employee onboarding",
        "Role-based permissions",
        "Department organization",
        "Bulk import capabilities",
        "Performance tracking",
      ],
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "projects",
      title: "Project Tracking",
      icon: Briefcase,
      description: "Kanban boards, timelines, and task management in one place",
      benefits: [
        "Drag & drop Kanban",
        "Multiple view options",
        "File sharing",
        "Task assignments",
        "Progress monitoring",
      ],
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "ecommerce",
      title: "E-Commerce",
      icon: ShoppingCart,
      description: "Built-in storefront with AI-powered design generation",
      benefits: [
        "AI storefront builder",
        "Product catalogs",
        "Shopping cart",
        "Payment processing",
        "Order management",
      ],
      color: "from-orange-500 to-red-600",
    },
    {
      id: "ai-features",
      title: "AI Automation",
      icon: Zap,
      description: "Let AI handle repetitive tasks and generate content",
      benefits: [
        "Auto-generate storefronts",
        "Content creation",
        "Smart recommendations",
        "Industry-specific personas",
        "SEO optimization",
      ],
      color: "from-pink-500 to-rose-600",
    },
    {
      id: "knowledge",
      title: "Knowledge Base",
      icon: FileText,
      description: "Documentation, blog posts, and help center management",
      benefits: [
        "Article management",
        "Blog publishing",
        "Search functionality",
        "Rich text editor",
        "Public/private access",
      ],
      color: "from-teal-500 to-cyan-600",
    },
    {
      id: "billing",
      title: "Billing & Invoices",
      icon: DollarSign,
      description: "Handle subscriptions, invoices, and payment processing",
      benefits: [
        "Subscription management",
        "Invoice generation",
        "Payment gateways",
        "Automated billing",
        "Financial reports",
      ],
      color: "from-yellow-500 to-amber-600",
    },
    {
      id: "white-label",
      title: "White Label",
      icon: Globe,
      description: "Fully customizable branding for your business",
      benefits: [
        "Custom logos & colors",
        "Domain names",
        "Branded emails",
        "Storefront themes",
        "Multi-company support",
      ],
      color: "from-violet-500 to-purple-600",
    },
  ];

  const [activeFeature, setActiveFeature] = useState(features[0]);

  return (
    <section
      id="features"
      className="py-24 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Everything You Need to Run Your Business
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            From time tracking to AI-powered storefronts, we&apos;ve got you
            covered with a complete business management suite
          </p>
        </div>

        {/* Interactive feature tabs */}
        <Tabs defaultValue="time-tracking" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 h-auto bg-transparent mb-12">
            {features.map((feature) => (
              <TabsTrigger
                key={feature.id}
                value={feature.id}
                onClick={() => setActiveFeature(feature)}
                className="flex flex-col items-center gap-2 px-4 py-3 data-[state=active]:bg-linear-to-br data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:scale-105"
              >
                <feature.icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">
                  {feature.title}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {features.map((feature) => (
            <TabsContent key={feature.id} value={feature.id} className="mt-0">
              <Card className="border-2 shadow-2xl">
                <CardContent className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Left: Description */}
                    <div>
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 bg-linear-to-br ${feature.color} rounded-2xl mb-6`}
                      >
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                        {feature.description}
                      </p>
                      <ul className="space-y-3">
                        {feature.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div
                              className={`mt-1 flex-shrink-0 w-6 h-6 bg-linear-to-br ${feature.color} rounded-full flex items-center justify-center`}
                            >
                              <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative">
                      <div
                        className={`aspect-square bg-linear-to-br ${feature.color} rounded-3xl p-8 shadow-2xl flex items-center justify-center`}
                      >
                        <feature.icon className="h-48 w-48 text-white opacity-20" />
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl rounded-3xl" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
