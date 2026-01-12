"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { GeoTrackingDisplay } from "@/components/geo-tracking-display";

export default function TrackingPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data.authenticated || data.user.role === "GUEST") {
          router.push("/");
          return;
        }

        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
        });
      } catch (error) {
        console.error("Failed to check user:", error);
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Visitor & User Tracking
          </h1>
          <p className="dark:text-gray-200">
            Monitor visitors and logged-in users with real-time location data
          </p>
        </div>

        <GeoTrackingDisplay />
      </div>
    </DashboardLayout>
  );
}
