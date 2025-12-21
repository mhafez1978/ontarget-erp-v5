"use client";


import { Loader2, FileEdit } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

;
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subscription {
  id: string;
  companyId: string;
  companyName: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
}

interface EditSubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSuccess?: () => void;
}

export function EditSubscriptionSheet({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: EditSubscriptionSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    plan: "",
    status: "",
    trialEndsAt: "",
    billingCycleStart: "",
    billingCycleEnd: "",
  });

  // Load subscription data when sheet opens or subscription changes
  useEffect(() => {
    if (subscription && open) {
      console.log("Loading subscription data:", subscription); // Debug log
      setFormData({
        plan: subscription.plan || "",
        status: subscription.status || "",
        trialEndsAt: subscription.trialEndsAt
          ? new Date(subscription.trialEndsAt).toISOString().split("T")[0]
          : "",
        billingCycleStart: subscription.billingCycleStart
          ? new Date(subscription.billingCycleStart).toISOString().split("T")[0]
          : "",
        billingCycleEnd: subscription.billingCycleEnd
          ? new Date(subscription.billingCycleEnd).toISOString().split("T")[0]
          : "",
      });
      setError(null);
    } else if (!open) {
      // Reset form when sheet closes
      setFormData({
        plan: "",
        status: "",
        trialEndsAt: "",
        billingCycleStart: "",
        billingCycleEnd: "",
      });
      setError(null);
    }
  }, [subscription, open]);

  // Track if form is dirty
  const isFormDirty = useFormDirty(
    {
      plan: subscription?.plan || "",
      status: subscription?.status || "",
      trialEndsAt: subscription?.trialEndsAt
        ? new Date(subscription.trialEndsAt).toISOString().split("T")[0]
        : "",
      billingCycleStart: subscription?.billingCycleStart
        ? new Date(subscription.billingCycleStart).toISOString().split("T")[0]
        : "",
      billingCycleEnd: subscription?.billingCycleEnd
        ? new Date(subscription.billingCycleEnd).toISOString().split("T")[0]
        : "",
    },
    formData
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/subscription/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: formData.plan,
          status: formData.status,
          trialEndsAt: formData.trialEndsAt || null,
          billingCycleStart: formData.billingCycleStart || null,
          billingCycleEnd: formData.billingCycleEnd || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update subscription");
      }

      toast.success(
        `Subscription for "${subscription.companyName}" updated successfully`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update subscription:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(
        err instanceof Error ? err.message : "Failed to update subscription"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Edit Subscription
          </SheetTitle>
          <SheetDescription>
            Update subscription details for {subscription?.companyName}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="plan">Plan *</Label>
            <Select
              value={formData.plan}
              onValueChange={(value) =>
                setFormData({ ...formData, plan: value })
              }
            >
              <SelectTrigger id="plan">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESSENTIAL">Essential</SelectItem>
                <SelectItem value="GROWTH">Growth</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialEndsAt">Trial Ends At</Label>
            <Input
              id="trialEndsAt"
              type="date"
              value={formData.trialEndsAt}
              onChange={(e) =>
                setFormData({ ...formData, trialEndsAt: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCycleStart">Billing Cycle Start</Label>
            <Input
              id="billingCycleStart"
              type="date"
              value={formData.billingCycleStart}
              onChange={(e) =>
                setFormData({ ...formData, billingCycleStart: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCycleEnd">Billing Cycle End</Label>
            <Input
              id="billingCycleEnd"
              type="date"
              value={formData.billingCycleEnd}
              onChange={(e) =>
                setFormData({ ...formData, billingCycleEnd: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${getPulsateClassName(isFormDirty)}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Update Subscription
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
