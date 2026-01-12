import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-zinc-900/30 backdrop-blur-md">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* 404 Animation */}
          <div className="mb-8 relative">
            <div className="text-[200px] md:text-[300px] font-black leading-none text-purple-500/10 dark:text-[#2bee79]/10">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <span className="relative flex h-32 w-32">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 dark:bg-emerald-400 opacity-20"></span>
                  <span className="relative inline-flex items-center justify-center rounded-full h-32 w-32 bg-purple-500/20 dark:bg-emerald-300/20 backdrop-blur-sm">
                    <Search className="h-16 w-16 text-purple-500 dark:text-[#2bee79]" />
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex justify-center items-center gap-2 px-4 py-2 rounded-full border border-purple-500 text-purple-500 dark:text-[#2bee79] dark:border-[#2bee79] text-xs font-semibold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 dark:bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400 dark:bg-emerald-300"></span>
            </span>
            PAGE NOT FOUND
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-6 text-black dark:text-gray-200">
            Lost in{" "}
            <span className="text-purple-500 dark:text-[#2bee79]">
              Cyberspace
            </span>
            ?
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Looks like you&apos;ve ventured into uncharted territory. The page
            you&apos;re looking for doesn&apos;t exist or has been moved to a
            new location.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-purple-500 text-white font-bold rounded-xl text-lg hover:bg-purple-600 dark:bg-[#2bee79] dark:text-black dark:hover:shadow-[0_0_40px_rgba(43,238,121,0.4)] transition-all"
            >
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/5 font-bold rounded-xl text-lg hover:bg-white/10 transition-all text-black dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
              Go to Dashboard
            </Link>
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              Need help?{" "}
              <Link
                href="/#contact"
                className="text-purple-500 dark:text-[#2bee79] hover:underline font-semibold"
              >
                Contact Support
              </Link>
            </p>
          </div>

          {/* Decorative Element */}
          <div className="mt-16 flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 dark:bg-[#2bee79] animate-bounce"></div>
            <div className="h-2 w-2 rounded-full bg-purple-500 dark:bg-[#2bee79] animate-bounce [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 rounded-full bg-purple-500 dark:bg-[#2bee79] animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
