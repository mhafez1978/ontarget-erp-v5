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
} from "lucide-react";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import confetti from "canvas-confetti";

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

  const initialFormData = {
    name: "",
    slogan: "",
    description: "",
    email: "",
    phone: "",
    website: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const isFormDirty = useFormDirty(initialFormData, formData);

  const totalSteps = 3;

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
        body: JSON.stringify(formData),
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

      // Small delay to let confetti start before calling onSuccess
      setTimeout(() => {
        onSuccess(data.company, data.user);
      }, 500);
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
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://acme.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Review Your Information</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Company Name:</strong> {formData.name || "N/A"}
                </p>
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
                <CardTitle>Create Your Company</CardTitle>
                <CardDescription>
                  Step {currentStep} of {totalSteps}
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

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
