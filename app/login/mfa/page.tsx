"use client";


import { Loader2, Shield } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MfaLoginDialog } from "@/components/mfa-login-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

;
import { toast } from "sonner";

function MfaLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || undefined;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(true);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await fetch("/api/auth/mfa/status", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!data.pending) {
          router.replace("/login");
          return;
        }
        setUserId(data.userId);
        setEmail(data.email || null);
      } catch (error) {
        console.error("Failed to load MFA status:", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkPending();
  }, [router]);

  const handleSuccess = () => {
    toast.success("MFA verified");
    router.replace("/dashboard");
  };

  const handleError = (message: string) => {
    toast.error(message);
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Preparing MFA challenge...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Verify your login</CardTitle>
          </div>
          {email && (
            <p className="text-sm text-muted-foreground">
              Account: {email} {provider ? `(via ${provider})` : ""}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <MfaLoginDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) router.replace("/login");
            }}
            userId={userId}
            validatePath="/api/auth/mfa/login"
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function MfaLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Preparing MFA challenge...</span>
          </div>
        </div>
      }
    >
      <MfaLoginPageContent />
    </Suspense>
  );
}
