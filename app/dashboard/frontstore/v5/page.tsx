"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import FrontstoreV5Client from "./frontstore-v5-client";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
    companyId: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (!data.authenticated || data.user.role === "GUEST") {
        router.push("/");
        return;
      }
      setUser({
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
        role: data.user.role,
        companyId: data.user.companyId,
      });

      // v5 uses pages and variants (no 'current section' endpoint).
      // The V5 client (`FrontstoreV5Client`) manages pages and page state itself,
      // so we don't need to call the v6 `/sections/current` endpoint here.
    } catch (err) {
      console.error("Failed to fetch user", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center dark:text-gray-200">
            Loading Frontstore v5…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 p-4">
        {user.companyId && <FrontstoreV5Client companyId={user.companyId} />}
      </div>
    </DashboardLayout>
  );
}
