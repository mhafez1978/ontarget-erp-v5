"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate effect for redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/login?registered=true");
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <div className="text-center space-y-8">
        {/* Beating Red Heart */}
        <div className="flex justify-center">
          <div className="relative">
            <Heart
              className="h-32 w-32 text-red-500 fill-red-500 animate-heartbeat"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Account Created Successfully!
          </h1>
          <p className="text-xl dark:text-gray-200 max-w-md mx-auto">
            Welcome aboard! Your account has been created and your 30-day free
            trial has started.
          </p>
        </div>

        {/* Countdown */}
        <div className="text-sm dark:text-gray-200">
          Redirecting to login in{" "}
          <span className="font-bold text-primary">{countdown}</span> seconds...
        </div>
      </div>

      <style jsx>{`
        @keyframes heartbeat {
          0% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.15);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.15);
          }
          70% {
            transform: scale(1);
          }
        }

        :global(.animate-heartbeat) {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
