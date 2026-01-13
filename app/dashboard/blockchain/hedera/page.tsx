"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { HederaSetting, Company } from "@prisma/client";

export default function HederaAdminPage() {
  const [loading, setLoading] = useState(false);
  const [setting, setSetting] = useState<HederaSetting | null>(null);
  const [companies, setCompanies] = useState<
    (Company & { companyHederaSetting?: { enabled?: boolean } | null })[]
  >([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmTyping, setConfirmTyping] = useState("");
  const [currentBulkAction, setCurrentBulkAction] = useState<
    "enable" | "disable" | null
  >(null);

  // Authenticated user for dashboard layout/menu
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    companyId?: string | null;
  }>({ name: null, email: null, image: null, role: "GUEST", companyId: null });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (data?.authenticated && data?.user) {
          setUser({
            name: data.user.name ?? null,
            email: data.user.email ?? null,
            image: data.user.image ?? null,
            role: data.user.role ?? "GUEST",
            companyId: data.user.companyId ?? null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch auth user for dashboard:", err);
      }
    };

    fetchUser();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hedera");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          // Friendly message + redirect for ADMINs who are denied
          toast.error(
            "Access denied: only Super Admins or companies you own may manage Hedera settings."
          );
          router.push("/dashboard");
          return;
        }
        throw new Error(data.error || "Failed");
      }

      setSetting(data.setting);
      setCompanies(data.companies || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Hedera admin data");
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSelect = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const openConfirm = (action: "enable" | "disable") => {
    if (selectedCompanies.length === 0) {
      toast.error("Please select one or more companies first");
      return;
    }
    setCurrentBulkAction(action);
    setConfirmTyping("");
    setModalOpen(true);
  };

  const submitBulk = async () => {
    if (!confirmTyping || confirmTyping !== "ENABLE") {
      toast.error("Please type ENABLE to confirm");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hedera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableCompanies: selectedCompanies,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enable");
      toast.success("Companies updated");
      setModalOpen(false);
      setSelectedCompanies([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update companies");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">
          Hedera Blockchain Management
        </h1>
        <p className="mb-6 text-gray-700">
          Enable or disable Hedera blockchain anchoring for your companies.
        </p>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Global Settings</h2>
          <div className="mt-2">
            <label className="block text-sm font-medium">
              Current Status:{" "}
            </label>
            <div className="mt-1" role="status" aria-live="polite">
              {setting ? (
                setting.isActive ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-pulse"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-green-500 font-semibold">
                      Enabled
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span className="text-muted-foreground">Disabled</span>
                  </div>
                )
              ) : (
                <div className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span className="text-muted-foreground">Not configured</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Companies</h2>
          <div className="mt-3 grid gap-2">
            {companies.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.companyHederaSetting?.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(c.id)}
                    onChange={() => toggleSelect(c.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => openConfirm("enable")}
              className="bg-gray-300"
            >
              <span className="text-black">Enable Blockchain for selected</span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => openConfirm("disable")}
              className="bg-red-100/90 outline border-red-500 rounded-xl"
            >
              <span className="text-red-600">
                Disable Blockchain for selected
              </span>
            </Button>
          </div>
        </div>

        {/* Confirmation Modal */}
        <Sheet open={modalOpen} onOpenChange={setModalOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                {currentBulkAction === "disable"
                  ? "Confirm Disable"
                  : "Confirm Bulk Action"}
              </SheetTitle>
              <p className="mt-2">
                {currentBulkAction === "disable" ? (
                  <>
                    This action will disable Hedera for the selected companies.
                  </>
                ) : (
                  <>
                    This action is irreversible. Type <strong>ENABLE</strong> to
                    confirm enabling Hedera for the selected companies.
                  </>
                )}
              </p>
            </SheetHeader>
            <div className="mt-4">
              <Label>Type ENABLE to confirm</Label>
              <Input
                value={confirmTyping}
                onChange={(e) => setConfirmTyping(e.target.value)}
                className="mt-2"
              />
              <div className="mt-4 flex gap-2">
                <Button onClick={submitBulk} disabled={loading}>
                  {loading ? "Working..." : "Confirm"}
                </Button>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
