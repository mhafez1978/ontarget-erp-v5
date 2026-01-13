"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingCheck } from "@/components/onboarding-check";
import { CartProvider } from "@/contexts/cart-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        // Redirect if not authenticated or if user is GUEST
        if (!data.authenticated || data.user?.role === "GUEST") {
          router.push("/");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Failed to check access:", error);
        router.push("/");
      }
    };

    checkAccess();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <OnboardingCheck />
      {children}
    </CartProvider>
  );
}
