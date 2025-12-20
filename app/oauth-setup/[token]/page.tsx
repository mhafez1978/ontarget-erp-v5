"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PasswordRequirement {
  text: string;
  met: boolean;
}

export default function OAuthSetupPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load onboarding data
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        if (!token) {
          setError("Invalid onboarding link");
          setLoading(false);
          return;
        }

        // Fetch onboarding data to pre-fill user info
        const response = await fetch(
          `/api/auth/onboarding-info?token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Onboarding link not found or has expired");
          } else {
            setError("Failed to load onboarding data");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setEmail(data.email || "");
        setName(data.name || "");
        setLoading(false);
      } catch (err) {
        console.error("Error loading onboarding data:", err);
        setError("Failed to load onboarding information");
        setLoading(false);
      }
    };

    loadOnboardingData();
  }, [token]);

  // Password requirements validation
  const passwordRequirements: PasswordRequirement[] = [
    {
      text: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      text: "At least one uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      text: "At least one number",
      met: /[0-9]/.test(password),
    },
    {
      text: "At least one special character (!@#$%^&*)",
      met: /[!@#$%^&*]/.test(password),
    },
    {
      text: "Passwords match",
      met: password && password === confirmPassword,
    },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/set-password-oauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const errorMessages = data.errors
            .map((e: any) => e.message)
            .join(", ");
          setError(errorMessages);
          toast.error(errorMessages);
        } else {
          setError(data.error || "Failed to set password");
          toast.error(data.error || "Failed to set password");
        }
        return;
      }

      toast.success("Password set successfully!");

      // Redirect to plan selection with the same token
      // The token proves they've completed password setup
      setTimeout(() => {
        router.push(`/select-plan?onboard=${encodeURIComponent(token)}`);
      }, 500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to set password";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
          <CardDescription>
            Complete your account setup by creating a password. You can use this
            to sign in anytime.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={submitting}
                required
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-muted-foreground">
                This email was verified through your OAuth provider
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Password Requirements:
              </p>
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-muted-foreground"
                  >
                    {req.met ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 mr-2 rounded-full border border-muted-foreground" />
                    )}
                    <span className={req.met ? "text-green-700" : ""}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!allRequirementsMet || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Continue to Plan Selection
                </>
              )}
            </Button>

            {/* Help Text */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              You can use this password to sign in as an alternative to using
              your OAuth provider.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
