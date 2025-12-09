"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import { z } from "zod";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";

const subscriberSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Customer name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm password"),
    companyName: z
      .string()
      .trim()
      .min(1, "Company name is required")
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must be less than 100 characters"),
    plan: z.enum(["ESSENTIAL", "GROWTH", "ENTERPRISE"], {
      message: "Plan is required",
    }),
    status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"], {
      message: "Status is required",
    }),
    trialDays: z
      .number()
      .min(0, "Trial days must be at least 0")
      .max(365, "Trial days cannot exceed 365"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface AddSubscriberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSubscriberSheet({
  open,
  onOpenChange,
  onSuccess,
}: AddSubscriberSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const initialFormData = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    plan: "ESSENTIAL" as "ESSENTIAL" | "GROWTH" | "ENTERPRISE",
    status: "TRIAL" as
      | "TRIAL"
      | "ACTIVE"
      | "PAST_DUE"
      | "SUSPENDED"
      | "CANCELLED",
    trialDays: 30,
  };

  const initialAddressData: AddressData = useMemo(
    () => ({
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "",
      countryCode: "",
      postalCode: "",
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormData);
  const [addressData, setAddressData] =
    useState<AddressData>(initialAddressData);

  // Track if form is dirty
  const isFormDirty = useFormDirty(initialFormData, formData);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        plan: "ESSENTIAL" as "ESSENTIAL" | "GROWTH" | "ENTERPRISE",
        status: "TRIAL" as
          | "TRIAL"
          | "ACTIVE"
          | "PAST_DUE"
          | "SUSPENDED"
          | "CANCELLED",
        trialDays: 30,
      });
      setAddressData(initialAddressData);
      setError(null);
      setValidationErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, initialAddressData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Client-side validation
    const result = subscriberSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/subscribers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          address: addressData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscriber");
      }

      // Success
      setFormData(initialFormData);
      setAddressData(initialAddressData);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Customer
          </SheetTitle>
          <SheetDescription>
            Create a new subscriber company with OnTarget-ERP The customer will
            be set as ADMIN and owner of their company.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">
              Company Information (Subscriber)
            </h3>

            <div className="space-y-2">
              <Label htmlFor="name" className="mb-4">
                Company Owner <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                disabled={isSubmitting}
                className={
                  validationErrors.name ? "border-red-500 mb-4" : " mb-4"
                }
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="mb-4">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@company.com"
                disabled={isSubmitting}
                className={
                  validationErrors.email ? "border-red-500 mb-4" : " mb-4"
                }
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="mb-4">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  minLength={8}
                  className={validationErrors.password ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-red-600">
                  {validationErrors.password}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Minimum 8 characters required
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="mb-4">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  minLength={8}
                  className={
                    validationErrors.confirmPassword ? "border-red-500" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="mb-4">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Acme Corporation"
                disabled={isSubmitting}
                className={validationErrors.companyName ? "border-red-500" : ""}
              />
              {validationErrors.companyName && (
                <p className="text-sm text-red-600">
                  {validationErrors.companyName}
                </p>
              )}
            </div>

            {/* Company Owner Address */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-100 mb-4">
                Company Owner Address (Optional)
              </h3>
              <AddressAutocomplete
                label="Address"
                value={addressData}
                onChange={setAddressData}
                required={false}
              />
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">
              Subscription Settings
            </h3>

            <div className="space-y-2">
              <Label htmlFor="plan">
                Plan <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.plan}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    plan: value as "ESSENTIAL" | "GROWTH" | "ENTERPRISE",
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="plan"
                  className={validationErrors.plan ? "border-red-500" : ""}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESSENTIAL">
                    Essential (1 Company)
                  </SelectItem>
                  <SelectItem value="GROWTH">Growth (3 Companies)</SelectItem>
                  <SelectItem value="ENTERPRISE">
                    Enterprise (Unlimited)
                  </SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.plan && (
                <p className="text-sm text-red-600">{validationErrors.plan}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as
                      | "TRIAL"
                      | "ACTIVE"
                      | "PAST_DUE"
                      | "SUSPENDED"
                      | "CANCELLED",
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="status"
                  className={validationErrors.status ? "border-red-500" : ""}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL">Trial (Default)</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAST_DUE">Past Due</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.status && (
                <p className="text-sm text-red-600">
                  {validationErrors.status}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialDays">
                Trial Period (Days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="trialDays"
                type="number"
                value={formData.trialDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trialDays: parseInt(e.target.value) || 0,
                  })
                }
                min={0}
                max={365}
                disabled={isSubmitting}
                className={validationErrors.trialDays ? "border-red-500" : ""}
              />
              {validationErrors.trialDays && (
                <p className="text-sm text-red-600">
                  {validationErrors.trialDays}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Default is 30 days. Set to 0 for no trial.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 ${getPulsateClassName(isFormDirty)}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
