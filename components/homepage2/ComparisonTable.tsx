"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComparisonTable() {
  const features = [
    { name: "Time Management and Tracking", ontarget: true, others: true },
    {
      name: "5 Versions of different AI Storefront Builders",
      ontarget: true,
      others: false,
    },
    {
      name: "SEO Compliant frontstore with shopping cart built-in",
      ontarget: true,
      others: false,
    },
    {
      name: "White Label Branding * not available in Essentials Plan",
      ontarget: true,
      others: false,
    },
    {
      name: "Project Management and task assignment",
      ontarget: true,
      others: true,
    },
    { name: "Create Knowledge Base articles", ontarget: true, others: false },
    {
      name: "Bulk Import Products, Services, Customers, and Workforce",
      ontarget: true,
      others: false,
    },
    {
      name: "8 OAuth Providers, MFA, Block Bruteforce attacks and track visitors ",
      ontarget: true,
      others: false,
    },
    { name: "Multiple Payment Providers", ontarget: true, others: false },
    { name: "Industry-Specific AI", ontarget: true, others: false },
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Why Choose OnTarget ERP?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See how we stack up against the competition
          </p>
        </div>

        <Card className="border-2 shadow-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-6 font-bold text-lg">Feature</th>
                    <th className="text-center p-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-br from-purple-500 to-indigo-600 text-white rounded-lg font-bold">
                        OnTarget ERP
                      </div>
                    </th>
                    <th className="text-center p-6 text-gray-500 font-semibold">
                      Others
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="p-6 font-medium">{feature.name}</td>
                      <td className="p-6 text-center">
                        {feature.ontarget ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full">
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {feature.others ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full">
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
