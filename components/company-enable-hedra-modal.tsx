"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  onSuccess?: () => void;
}

export function CompanyEnableHederaModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  onSuccess,
}: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [anchorHistory, setAnchorHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirmEnable = async () => {
    if (confirmText !== companyName) {
      toast.error("Please type the company name exactly to confirm");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/company/hedera/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          enable: true,
          historicalAnchoring: anchorHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enable");
      toast.success("Hedera enabled for company");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to enable Hedera for company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Enable Hedera Anchoring</SheetTitle>
          <p className="mt-2">
            This will make Hedera anchoring active for{" "}
            <strong>{companyName}</strong>. This action is irreversible for
            future anchors.
          </p>
        </SheetHeader>

        <div className="mt-4">
          <Label>Type the company name to confirm</Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-2"
          />

          <div className="mt-4">
            <Label>Anchor historical records (optional)</Label>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                checked={anchorHistory}
                onCheckedChange={(v) => setAnchorHistory(!!v)}
              />
              <div className="text-sm dark:text-gray-200">
                I understand the cost and privacy implications of anchoring
                historical records.
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={confirmEnable} disabled={loading}>
              Enable
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
