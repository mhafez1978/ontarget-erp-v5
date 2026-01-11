"use client";

import React from "react";
import { Utensils, Wrench, Store, Heart, Truck, Laptop } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function IndustryShowcase() {
  const industries = [
    {
      icon: Utensils,
      name: "Restaurants & Food Service",
      description: "Manage orders, inventory, and staff schedules",
      color: "from-orange-500 to-red-600",
    },
    {
      icon: Wrench,
      name: "Auto Repair & Mechanics",
      description: "Track jobs, parts inventory, and technician hours",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: Store,
      name: "Retail & E-Commerce",
      description: "Product catalogs, orders, and customer management",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: Heart,
      name: "Healthcare & Wellness",
      description: "Appointments, patient records, and billing",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Truck,
      name: "Logistics & Delivery",
      description: "Fleet management, routes, and delivery tracking",
      color: "from-yellow-500 to-orange-600",
    },
    {
      icon: Laptop,
      name: "Tech & Services",
      description: "Project management, time tracking, and invoicing",
      color: "from-indigo-500 to-purple-600",
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Built for Your Industry
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            Industry-specific AI personas that understand your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2"
            >
              <CardContent className="p-6">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${industry.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  <industry.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{industry.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {industry.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
