"use client";

import React from "react";
import {
  Loader2,
  Rocket,
  Building2,
  User,
  Briefcase,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  interface SetupFormData {
    fullName: string;
    name: string;
    legalName: string;
    slogan: string;
    description: string;
    industry?: string;
    website: string;
    phone: string;
    email: string;
    salesEmail: string;
    supportEmail: string;
    password: string;
    confirmPassword: string;
    jobTitle: string;
    payRate: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    countryCode: string;
    postalCode: string;
    taxInfo: { taxId?: string; [key: string]: string | undefined };
    instagramUrl: string;
    facebookUrl: string;
    twitterUrl: string;
    linkedInUrl: string;
    linkedUrl?: string;
    youtubeUrl: string;
  }

  const [formData, setFormData] = useState<SetupFormData>({
    fullName: "",
    name: "",
    legalName: "",
    slogan: "",
    description: "",
    industry: undefined,
    website: "",
    phone: "",
    email: "",
    salesEmail: "",
    supportEmail: "",
    password: "",
    confirmPassword: "",
    jobTitle: "",
    payRate: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
    taxInfo: {},
    instagramUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    linkedInUrl: "",
    linkedUrl: "",
    youtubeUrl: "",
  });

  const [error, setError] = useState("");

  // Check if setup is needed
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch("/api/setup/check");
        if (response.ok) {
          const data = await response.json();
          if (data.hasSetup) {
            // Setup already complete, redirect to home
            router.push("/");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
      } finally {
        setIsChecking(false);
      }
    };
    checkSetup();
  }, [router]);

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // System Branding
        if (!formData.name) {
          setError("System name is required");
          return false;
        }
        break;
      case 2: // Super Admin Account
        if (
          !formData.fullName ||
          !formData.email ||
          !formData.jobTitle ||
          !formData.payRate
        ) {
          setError("All fields in this step are required");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters long");
          return false;
        }
        break;
      case 3: // Company Details
        if (!formData.legalName) {
          setError("Legal name is required");
          return false;
        }
        break;
      case 4: // Address
        // Address is optional, no validation needed
        break;
      case 5: // Social Links
        // Social links are optional, no validation needed
        break;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Final validation
    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/setup/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          name: formData.name,
          legalName: formData.legalName,
          slogan: formData.slogan,
          description: formData.description,
          industry: formData.industry,
          website: formData.website,
          phone: formData.phone,
          salesEmail: formData.salesEmail,
          supportEmail: formData.supportEmail,
          email: formData.email,
          password: formData.password,
          jobTitle: formData.jobTitle,
          payRate: formData.payRate,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          countryCode: formData.countryCode,
          postalCode: formData.postalCode,
          taxInfo: formData.taxInfo,
          instagramUrl: formData.instagramUrl,
          facebookUrl: formData.facebookUrl,
          twitterUrl: formData.twitterUrl,
          linkedInUrl: formData.linkedInUrl,
          youtubeUrl: formData.youtubeUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Setup failed");
      }

      // Setup successful and cookie is already set by the API
      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "System Branding", icon: Briefcase },
    { id: 2, title: "Super Admin", icon: User },
    { id: 3, title: "Company Details", icon: Building2 },
    { id: 4, title: "Address", icon: Building2 },
    { id: 5, title: "Social Links", icon: Building2 },
  ];

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm dark:text-gray-200">Checking setup status...</p>
        </div>
      </div>
    );
  }

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto pt-28">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Rocket className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl text-center font-bold mb-2">
            Welcome to OnTarget ERP SUPER ADMIN
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Let&apos;s set up your system. Create your Super Admin account and
            configure your root company.
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      isCurrent
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, {
                className: "w-5 h-5",
              })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                "Configure your ERP system branding and name"}
              {currentStep === 2 &&
                "Create your Super Admin account credentials"}
              {currentStep === 3 && "Set up your root company information"}
              {currentStep === 4 && "Add your company address (optional)"}
              {currentStep === 5 &&
                "Connect your social media profiles (optional)"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              {/* Step 1: System Branding */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">System Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                      placeholder="OnTarget ERP"
                    />
                    <p className="text-xs text-muted-foreground">
                      The name of your ERP system (can be changed later)
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Super Admin Account */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            fullName: e.target.value,
                          });
                          setIsDirty(true);
                        }}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="superadmin@your-company.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setIsDirty(true);
                        }}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input
                        id="jobTitle"
                        type="text"
                        placeholder="Chief Executive Officer"
                        value={formData.jobTitle}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            jobTitle: e.target.value,
                          });
                          setIsDirty(true);
                        }}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payRate">Hourly Pay Rate *</Label>
                      <Input
                        id="payRate"
                        type="number"
                        step="0.01"
                        placeholder="75.00"
                        value={formData.payRate}
                        onChange={(e) => {
                          setFormData({ ...formData, payRate: e.target.value });
                          setIsDirty(true);
                        }}
                        required
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your hourly rate for payroll calculations
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            });
                            setIsDirty(true);
                          }}
                          required
                          minLength={8}
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum 8 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            });
                            setIsDirty(true);
                          }}
                          required
                          minLength={8}
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Company Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name *</Label>
                    <Input
                      id="legalName"
                      type="text"
                      placeholder="OnTarget Brands Inc"
                      value={formData.legalName}
                      onChange={(e) => {
                        setFormData({ ...formData, legalName: e.target.value });
                        setIsDirty(true);
                      }}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slogan">Slogan (Optional)</Label>
                    <Input
                      id="slogan"
                      type="text"
                      placeholder="Innovating for tomorrow"
                      value={formData.slogan}
                      onChange={(e) => {
                        setFormData({ ...formData, slogan: e.target.value });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      A tagline or mission statement for your company
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="We are a leading firm in providing quality and value to our customers."
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Description of your company for SEO optimization.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry (Optional)</Label>
                    <Input
                      id="industry"
                      type="text"
                      placeholder="Technology"
                      value={formData.industry}
                      onChange={(e) => {
                        setFormData({ ...formData, industry: e.target.value });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Industry of your company for SEO optimization.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Company EIN (Optional)</Label>
                    <Input
                      id="taxId"
                      type="text"
                      placeholder="12-3456789"
                      value={formData.taxInfo.taxId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          taxInfo: {
                            ...formData.taxInfo,
                            taxId: e.target.value,
                          },
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your personal SSN or Business EIN or ITIN number for tax
                      purposes
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Address */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">
                      Address Line 1 (Optional)
                    </Label>
                    <Input
                      id="addressLine1"
                      type="text"
                      placeholder="123 Main St"
                      value={formData.addressLine1}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          addressLine1: e.target.value,
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">
                      Address Line 2 (Optional)
                    </Label>
                    <Input
                      id="addressLine2"
                      type="text"
                      placeholder="Apt, Suite, etc."
                      value={formData.addressLine2}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          addressLine2: e.target.value,
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City (Optional)</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => {
                          setFormData({ ...formData, city: e.target.value });
                          setIsDirty(true);
                        }}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State (Optional)</Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => {
                          setFormData({ ...formData, state: e.target.value });
                          setIsDirty(true);
                        }}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Zipcode (Optional)</Label>
                      <Input
                        id="postalCode"
                        type="text"
                        placeholder="Zipcode"
                        value={formData.postalCode}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            postalCode: e.target.value,
                          });
                          setIsDirty(true);
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country (Optional)</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) => {
                        setFormData({ ...formData, country: e.target.value });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Social Links */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook URL (Optional)</Label>
                    <Input
                      id="facebookUrl"
                      type="text"
                      placeholder="https://facebook.com/yourcompany"
                      value={formData.facebookUrl}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          facebookUrl: e.target.value,
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedInUrl">LinkedIn URL (Optional)</Label>
                    <Input
                      id="linkedInUrl"
                      type="text"
                      placeholder="https://linkedin.com/company/yourcompany"
                      value={formData.linkedInUrl}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          linkedInUrl: e.target.value,
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">X URL (Optional)</Label>
                    <Input
                      id="twitterUrl"
                      type="text"
                      placeholder="https://x.com/yourcompany"
                      value={formData.twitterUrl}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          twitterUrl: e.target.value,
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube URL (Optional)</Label>
                    <Input
                      id="youtubeUrl"
                      type="text"
                      placeholder="https://youtube.com/@yourcompany"
                      value={formData.youtubeUrl}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          youtubeUrl: e.target.value,
                        });
                        setIsDirty(true);
                      }}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={handleNext} disabled={isLoading}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className={`bg-linear-300 text-lg bg-from-purple-500 to-purple-600 text-white dark:from-green-400 dark:to-emerald-200 dark:text-black ${
                    isDirty && !isLoading
                      ? "animate-[heartbeat_2s_ease-in-out_infinite]"
                      : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Initializing System...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Initialize Root Company & Login
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
          By creating this account, you will have full administrative access to
          the system. You can create additional users and companies after setup.
        </p>
      </div>
    </div>
  );
}
