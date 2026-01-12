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
  const [sectionId, setSectionId] = useState<string | null>(null);

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

      // Fetch or create a working section for this company
      try {
        const sres = await fetch("/api/frontstore/v6/sections/current", {
          cache: "no-store",
        });
        const sjson = await sres.json();
        if (sjson?.success && sjson.section?.id) {
          setSectionId(sjson.section.id);
        }
      } catch (err) {
        console.warn("Failed to fetch current section", err);
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  function handleRefresh() {
    setRefreshSignal((s) => s + 1);
  }

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center dark:text-gray-200">
            Loading Frontstore v6…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 p-4">
        <FrontstoreV6Client
          sectionId={sectionId}
          onRefresh={handleRefresh}
          refreshSignal={refreshSignal}
        />
      </div>
    </DashboardLayout>
  );
}
