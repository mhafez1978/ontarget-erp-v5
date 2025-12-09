"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you out...");

  useEffect(() => {
    let cancelled = false;

    async function doLogout() {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });

        if (!cancelled) {
          if (res.ok) {
            setMessage("You have been signed out. Redirecting...");
            // Slight delay so the user sees the message
            setTimeout(() => router.push("/"), 900);
          } else {
            // Still redirect to '/' but show a helpful message first
            setMessage("Sign-out failed (server). Redirecting to home...");
            setTimeout(() => router.push("/"), 1500);
          }
        }
      } catch {
        if (!cancelled) {
          setMessage("Unable to sign out right now — redirecting to home...");
          setTimeout(() => router.push("/"), 1500);
        }
      }
    }

    doLogout();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <div className="max-w-md w-full rounded-lg border bg-card p-6 text-center shadow">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-2">Signing out</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
