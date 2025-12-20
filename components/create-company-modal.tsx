"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import confetti from "canvas-confetti";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";
import LocationsManager from "@/components/locations-manager";
interface CreateCompanyModalProps {
  onSuccess: (company: unknown, user: unknown) => void;
  onClose: () => void;
}

export function CreateCompanyModal({
  onSuccess,
  onClose,
}: CreateCompanyModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);

  const initialFormData = {
    name: "",
    slogan: "",
    description: "",
    email: "",
    salesEmail: "",
    supportEmail: "",
    phone: "",
    website: "",
  };

  const initialAddressData: AddressData = {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [addressData, setAddressData] =
    useState<AddressData>(initialAddressData);
  const isFormDirty = useFormDirty(initialFormData, formData);

  const totalSteps = 4;

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !formData.name.trim()) {
      setError("Company name is required");
      return;
    }
    if (currentStep === 2 && formData.email && !formData.email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setError("");
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          address: addressData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create company");
      }

      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: ReturnType<typeof setInterval> = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire confetti from random positions
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Store company ID and show locations manager
      setCreatedCompanyId(data.company.id);
      // Don't call onSuccess yet - let user add locations first
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isLoading}
                className="capitalize"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slogan">Slogan (Optional)</Label>
              <Input
                id="slogan"
                placeholder="Your company tagline or slogan"
                value={formData.slogan}
                onChange={(e) =>
                  setFormData({ ...formData, slogan: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                placeholder="Brief description of your company..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Company Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@acme.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesEmail">Sales Email (Optional)</Label>
              <Input
                id="salesEmail"
                type="email"
                placeholder="sales@acme.com"
                value={formData.salesEmail}
                onChange={(e) =>
                  setFormData({ ...formData, salesEmail: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email (Optional)</Label>
              <Input
                id="supportEmail"
                type="email"
                placeholder="support@acme.com"
                value={formData.supportEmail}
                onChange={(e) =>
                  setFormData({ ...formData, supportEmail: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Address (Optional)</Label>
              <AddressAutocomplete
                onSelect={setAddressData}
                initialData={addressData}
                disabled={isLoading}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {/* Summary */}
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2 max-h-[300px] overflow-y-auto">
              <h4 className="font-semibold text-sm">Review Your Information</h4>
              <div className="text-sm space-y-2">
                <p>
                  <strong>Company Name:</strong> {formData.name || "N/A"}
                </p>
                {formData.slogan && (
                  <p>
                    <strong>Slogan:</strong> {formData.slogan}
                  </p>
                )}
                {formData.description && (
                  <p>
                    <strong>Description:</strong> {formData.description}
                  </p>
                )}
                {formData.email && (
                  <p>
                    <strong>Email:</strong> {formData.email}
                  </p>
                )}
                {formData.salesEmail && (
                  <p>
                    <strong>Sales Email:</strong> {formData.salesEmail}
                  </p>
                )}
                {formData.supportEmail && (
                  <p>
                    <strong>Support Email:</strong> {formData.supportEmail}
                  </p>
                )}
                {formData.phone && (
                  <p>
                    <strong>Phone:</strong> {formData.phone}
                  </p>
                )}
                {formData.website && (
                  <p>
                    <strong>Website:</strong> {formData.website}
                  </p>
                )}
                {addressData.addressLine1 && (
                  <>
                    <p>
                      <strong>Address:</strong> {addressData.addressLine1}
                      {addressData.addressLine2 &&
                        `, ${addressData.addressLine2}`}
                    </p>
                    <p>
                      <strong>Location:</strong> {addressData.city}
                      {addressData.state && `, ${addressData.state}`}{" "}
                      {addressData.country}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>
                  {createdCompanyId ? "Add Locations" : "Create Your Company"}
                </CardTitle>
                <CardDescription>
                  {createdCompanyId
                    ? "Add one or more locations for your company (optional)"
                    : `Step ${currentStep} of ${totalSteps}`}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              ✕
            </Button>
          </div>

          {/* Progress bar - only show during creation steps */}
          {!createdCompanyId && (
            <div className="w-full bg-muted rounded-full h-2 mt-4">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {createdCompanyId ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Company created successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                      Now add one or more locations for your company.
                    </p>
                  </div>
                </div>
              </div>
              <LocationsManager companyId={createdCompanyId} />
            </div>
          ) : (
            renderStep()
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={
                createdCompanyId
                  ? () => {
                      // Call onSuccess when user finishes with locations
                      onSuccess(null, null);
                    }
                  : currentStep === 1
                  ? onClose
                  : handleBack
              }
              disabled={isLoading}
            >
              {createdCompanyId ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Done
                </>
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {currentStep === 1 ? "Cancel" : "Back"}
                </>
              )}
            </Button>

            {!createdCompanyId && (
              <>
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className={getPulsateClassName(isFormDirty)}
                    disabled={isLoading || !formData.name.trim()}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className={getPulsateClassName(isFormDirty)}
                    disabled={isLoading || !formData.name.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Company
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
