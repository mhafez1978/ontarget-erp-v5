"use client";

import React from "react";
import { Users, Building2, Clock, Star } from "lucide-react";

export function StatsBanner() {
  const stats = [
    { icon: Users, value: "10K+", label: "Active Users" },
    { icon: Building2, value: "500+", label: "Companies" },
    { icon: Clock, value: "1M+", label: "Hours Tracked" },
    { icon: Star, value: "4.9/5", label: "Customer Rating" },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
