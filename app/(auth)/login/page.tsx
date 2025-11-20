"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const initialFormData = {
    email: "",
    password: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");

  // Track if form is dirty
  const isFormDirty = useFormDirty(initialFormData, formData);

  const [enabledProviders, setEnabledProviders] = useState<{
    google: boolean;
    microsoft: boolean;
    github: boolean;
    linkedin: boolean;
    yahoo: boolean;
  }>({
    google: false,
    microsoft: false,
    github: false,
    linkedin: false,
    yahoo: false,
  });

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
            github: providers.some(
              (p: { provider: string }) => p.provider === "github"
            ),
            linkedin: providers.some(
              (p: { provider: string }) => p.provider === "linkedin"
            ),
            yahoo: providers.some(
              (p: { provider: string }) => p.provider === "yahoo"
            ),
          });
        }
      } catch (error) {
        console.error("Failed to fetch enabled providers:", error);
      }
    };
    fetchEnabledProviders();
  }, []);

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: "OAuth authentication was cancelled",
        oauth_failed: "OAuth authentication failed",
        oauth_config_error: "OAuth is not properly configured",
        oauth_token_failed: "Failed to exchange OAuth token",
        oauth_profile_failed: "Failed to fetch user profile",
        no_email: "No email address found in OAuth profile",
        account_disabled: "Your account has been disabled",
        use_credentials:
          "Please login with your email and password. This account was created with credentials.",
        oauth_error: "An error occurred during OAuth authentication",
      };

      setError(errorMessages[errorParam] || "Authentication error occurred");

      // Clear error from URL
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login-secure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle email not verified
        if (response.status === 403 && data.emailNotVerified) {
          setUnverifiedEmail(data.email || formData.email);
          setShowResendVerification(true);
          throw new Error(data.error);
        }

        // Handle blocked IP with special formatting
        if (response.status === 403 && data.blocked) {
          const blockedUntil = new Date(data.blockedUntil);
          const now = new Date();
          const minutesRemaining = Math.ceil(
            (blockedUntil.getTime() - now.getTime()) / 60000
          );

          throw new Error(
            `Your IP address has been temporarily blocked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute(s).`
          );
        }

        throw new Error(data.error || "Login failed");
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <LogIn className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
                {error}
                {showResendVerification && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            "/api/auth/send-verification-public",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: unverifiedEmail }),
                            }
                          );
                          if (res.ok) {
                            setError(
                              "Verification email sent! Check your inbox."
                            );
                            setShowResendVerification(false);
                          } else {
                            setError(
                              "Failed to resend verification email. Try again later."
                            );
                          }
                        } catch {
                          setError("Failed to resend verification email.");
                        }
                      }}
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                )}
              </div>
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>

            {(enabledProviders.google ||
              enabledProviders.microsoft ||
              enabledProviders.github ||
              enabledProviders.linkedin ||
              enabledProviders.yahoo) && (
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

                <div className="grid grid-cols-3 gap-4">
                  {enabledProviders.google && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        window.location.href = "/api/auth/google/login";
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
                        window.location.href = "/api/auth/microsoft/login";
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
                  {enabledProviders.github && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        window.location.href = "/api/auth/github/login";
                      }}
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </Button>
                  )}
                  {enabledProviders.linkedin && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        window.location.href = "/api/auth/linkedin/login";
                      }}
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </Button>
                  )}
                  {enabledProviders.yahoo && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        window.location.href = "/api/auth/yahoo/login";
                      }}
                    >
                      <span className="mr-2 text-lg font-bold text-[#6001D2]">
                        Y!
                      </span>
                      Yahoo
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
