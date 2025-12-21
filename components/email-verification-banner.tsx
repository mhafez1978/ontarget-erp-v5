"use client";


import { X, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";


;
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EmailVerificationBannerProps {
  userEmail: string;
  emailVerified: boolean;
}

export function EmailVerificationBanner({
  userEmail,
  emailVerified,
}: EmailVerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(!emailVerified);
  const [isLoading, setIsLoading] = useState(false);

  if (!isVisible || emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send verification email");
      }

      toast.success("Verification email sent!", {
        description: `Check your inbox at ${userEmail}`,
      });
    } catch (error) {
      toast.error("Failed to send email", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Email Verification Required
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Please verify your email address to access all features. We sent a
              verification link to <strong>{userEmail}</strong>
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendVerification}
                disabled={isLoading}
                className="bg-white dark:bg-gray-800"
              >
                {isLoading ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface EmailVerifiedBannerProps {
  onDismiss?: () => void;
}

export function EmailVerifiedBanner({ onDismiss }: EmailVerifiedBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
              Email Verified Successfully!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your email has been verified. You now have full access to all
              features.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
