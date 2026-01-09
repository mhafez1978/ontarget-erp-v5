"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import FrontstoreV6Client from "./components/frontstore-v6-client";

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
          <div className="text-center text-muted-foreground">
            Loading Frontstore v6…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 p-4">
        <FrontstoreV6Client />
      </div>
    </DashboardLayout>
  );
}
