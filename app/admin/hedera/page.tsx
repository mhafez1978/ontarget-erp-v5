"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hedera");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSetting(data.setting);
      setCompanies(data.companies || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Hedera admin data");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hedera Trust Layer — Admin</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Global Settings</h2>
        <div className="mt-2">
          <label className="block text-sm font-medium">Current Status: </label>
          <div className="mt-1">
            {setting
              ? setting.isActive
                ? "Enabled"
                : "Disabled"
              : "Not configured"}
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
          <Button onClick={() => openConfirm("enable")}>
            Enable for selected
          </Button>
          <Button variant="ghost" onClick={() => openConfirm("disable")}>
            Disable for selected
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
                <>This action will disable Hedera for the selected companies.</>
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
  );
}
