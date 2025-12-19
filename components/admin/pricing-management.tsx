"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, DollarSign, Save, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface PlanPricing {
  id: string;
  plan: string;
  monthlyPrice: number;
  monthlyPromoPrice: number | null;
  annualPrice: number;
  annualPriceMonthly: number;
  transactionFeePercent: number;
  transactionFeeFixed: number;
  baseStorageGB: number;
  extraStoragePricePer100GB: number;
  extraStoragePricePerGB: number;
  isPopular: boolean;
}

export function PricingManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState<PlanPricing[]>([]);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/pricing");
      const data = await response.json();

      if (data.pricing) {
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (
    plan: string,
    updatedData: Partial<PlanPricing>
  ) => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          pricing: updatedData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save pricing");
      }

      toast.success(`${plan} pricing updated successfully`);
      fetchPricing(); // Refresh data
    } catch (error) {
      console.error("Error saving pricing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save pricing"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateField = (
    index: number,
    field: keyof PlanPricing,
    value: string | number | boolean | null
  ) => {
    const updated = [...pricing];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setPricing(updated);
  };

  const handleSeedPricing = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/seed-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed pricing");
      }

      toast.success("Default pricing initialized successfully");
      fetchPricing(); // Refresh data
    } catch (error) {
      console.error("Error seeding pricing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to seed pricing"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no pricing data exists, show seed button
  if (pricing.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Pricing Configured</CardTitle>
            <CardDescription>
              Initialize default pricing for all plans (Essential, Growth,
              Enterprise)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeedPricing} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Initialize Default Pricing
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              This will create default pricing for all three plans. You can
              customize the prices after initialization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Plan Pricing Management</h2>
        </div>
        <Button 
          onClick={handleSeedPricing} 
          disabled={saving}
          variant="outline"
          size="sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Reset to Defaults
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pricing.map((plan, index) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.plan}
                <Button
                  size="sm"
                  onClick={() =>
                    handleSave(plan.plan, {
                      monthlyPrice: plan.monthlyPrice,
                      monthlyPromoPrice: plan.monthlyPromoPrice,
                      annualPrice: plan.annualPrice,
                      annualPriceMonthly: plan.annualPriceMonthly,
                      transactionFeePercent: plan.transactionFeePercent,
                      transactionFeeFixed: plan.transactionFeeFixed,
                      baseStorageGB: plan.baseStorageGB,
                      extraStoragePricePer100GB: plan.extraStoragePricePer100GB,
                      extraStoragePricePerGB: plan.extraStoragePricePerGB,
                      isPopular: plan.isPopular,
                    })
                  }
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>Configure pricing for this plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Monthly Pricing */}
              <div>
                <Label>Monthly Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.monthlyPrice}
                  onChange={(e) =>
                    updateField(
                      index,
                      "monthlyPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              <div>
                <Label>Monthly Promo Price ($) - Optional</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.monthlyPromoPrice || ""}
                  onChange={(e) =>
                    updateField(
                      index,
                      "monthlyPromoPrice",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="Leave empty for no promo"
                />
              </div>

              {/* Annual Pricing */}
              <div>
                <Label>Annual Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.annualPrice}
                  onChange={(e) =>
                    updateField(
                      index,
                      "annualPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              <div>
                <Label>Annual Monthly Equivalent ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.annualPriceMonthly}
                  onChange={(e) =>
                    updateField(
                      index,
                      "annualPriceMonthly",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              {/* Transaction Fees */}
              <div>
                <Label>Transaction Fee (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={plan.transactionFeePercent}
                  onChange={(e) =>
                    updateField(
                      index,
                      "transactionFeePercent",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              <div>
                <Label>Transaction Fee Fixed ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.transactionFeeFixed}
                  onChange={(e) =>
                    updateField(
                      index,
                      "transactionFeeFixed",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              {/* Storage */}
              <div>
                <Label>Base Storage (GB)</Label>
                <Input
                  type="number"
                  value={plan.baseStorageGB}
                  onChange={(e) =>
                    updateField(
                      index,
                      "baseStorageGB",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>

              <div>
                <Label>Extra Storage per 100GB ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.extraStoragePricePer100GB}
                  onChange={(e) =>
                    updateField(
                      index,
                      "extraStoragePricePer100GB",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              <div>
                <Label>Extra Storage per GB ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.extraStoragePricePerGB}
                  onChange={(e) =>
                    updateField(
                      index,
                      "extraStoragePricePerGB",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              {/* Popular Badge */}
              <div className="flex items-center justify-between pt-2">
                <Label>Mark as Popular</Label>
                <Switch
                  checked={plan.isPopular}
                  onCheckedChange={(checked) =>
                    updateField(index, "isPopular", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Changes take effect immediately across all
          pages including registration, select-plan, and settings pages. Users
          will see the updated pricing in real-time.
        </p>
      </div>
    </div>
  );
}
