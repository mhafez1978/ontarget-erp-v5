"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";

type SubscriptionPlan = "ESSENTIAL" | "GROWTH" | "ENTERPRISE";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get plan from URL or default to ESSENTIAL
  const urlPlan = searchParams
    .get("plan")
    ?.toUpperCase() as SubscriptionPlan | null;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    urlPlan && ["ESSENTIAL", "GROWTH", "ENTERPRISE"].includes(urlPlan)
      ? urlPlan
      : "ESSENTIAL"
  );

  const initialFormData = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");

  // Track if form is dirty
  const isFormDirty = useFormDirty(initialFormData, formData);

  const [enabledProviders, setEnabledProviders] = useState<{
    google: boolean;
    microsoft: boolean;
  }>({
    google: false,
    microsoft: false,
  });

  // Function to capitalize each word in a name
  const capitalizeName = (name: string): string => {
    return name
      .split(" ")
      .map((word) => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  // Fetch enabled OAuth providers on mount
  useEffect(() => {
    const fetchEnabledProviders = async () => {
      try {
        const response = await fetch("/api/auth/enabled-providers");
        if (response.ok) {
          const data = await response.json();
          const providers = data.providers || [];
          setEnabledProviders({
            google: providers.some(
              (p: { provider: string }) => p.provider === "google"
            ),
            microsoft: providers.some(
              (p: { provider: string }) => p.provider === "microsoft"
            ),
          });
        }
      } catch (error) {
        console.error("Failed to fetch enabled providers:", error);
      }
    };
    fetchEnabledProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Redirect to success page
      router.push("/register/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const planDetails = {
    ESSENTIAL: {
      name: "Essential",
      price: "$24.99-$39.99",
      features: ["1 company", "5 accounts per type", "100 customers"],
    },
    GROWTH: {
      name: "Growth",
      price: "$199.99",
      features: ["Up to 3 companies", "20 accounts per type", "300 customers"],
    },
    ENTERPRISE: {
      name: "Enterprise",
      price: "$499.99",
      features: [
        "Unlimited companies",
        "Unlimited accounts",
        "Unlimited customers",
      ],
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your details to get started with your 30-day free trial
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            {/* Plan Selection */}
            <div className="space-y-3">
              <Label>Select Your Plan</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["ESSENTIAL", "GROWTH", "ENTERPRISE"] as const).map(
                  (plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        selectedPlan === plan
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {selectedPlan === plan && (
                        <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                      )}
                      <div className="font-semibold text-base mb-1">
                        {planDetails[plan].name}
                      </div>
                      <div className="text-lg font-bold text-primary mb-2">
                        {planDetails[plan].price}
                        <span className="text-xs font-normal text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {planDetails[plan].features.map((feature, idx) => (
                          <li key={idx}>• {feature}</li>
                        ))}
                      </ul>
                    </button>
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                30-day free trial • No credit card required
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: capitalizeName(e.target.value),
                    })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-6">
            <Button
              type="submit"
              className={`w-full ${getPulsateClassName(isFormDirty)}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>

            {(enabledProviders.google || enabledProviders.microsoft) && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div
                  className={`grid ${
                    enabledProviders.google && enabledProviders.microsoft
                      ? "grid-cols-2"
                      : "grid-cols-1"
                  } gap-4`}
                >
                  {enabledProviders.google && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        window.location.href = `/api/auth/google/login?plan=${selectedPlan}`;
                      }}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                  )}
                  {enabledProviders.microsoft && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        window.location.href = `/api/auth/microsoft/login?plan=${selectedPlan}`;
                      }}
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                      </svg>
                      Microsoft
                    </Button>
                  )}
                </div>
              </>
            )}

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">
                Create an account
              </CardTitle>
              <CardDescription className="text-center">
                Loading...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
