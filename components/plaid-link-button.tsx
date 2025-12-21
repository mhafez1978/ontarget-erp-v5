"use client";


import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
;
import { toast } from "sonner";

interface PlaidLinkButtonProps {
  companyId: string;
  onSuccess: () => void;
}

interface PlaidWindow extends Window {
  Plaid?: {
    create: (config: PlaidLinkConfig) => PlaidHandler;
  };
}

interface PlaidLinkConfig {
  token: string;
  onSuccess: (publicToken: string, metadata: PlaidMetadata) => void;
  onExit: (err: PlaidError | null, metadata: PlaidMetadata) => void;
  onEvent: (eventName: string, metadata: PlaidMetadata) => void;
}

interface PlaidHandler {
  open: () => void;
}

interface PlaidMetadata {
  institution?: {
    name: string;
    institution_id: string;
  };
  accounts?: Array<{
    id: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
  }>;
  link_session_id?: string;
  [key: string]: unknown;
}

interface PlaidError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message?: string;
}

export function PlaidLinkButton({
  companyId,
  onSuccess,
}: PlaidLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [plaidLoaded, setPlaidLoaded] = useState(false);

  // Load Plaid Link script
  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    script.onload = () => {
      setPlaidLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createLinkToken = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create link token");
      }

      const { linkToken } = await response.json();
      return linkToken;
    } catch (error) {
      console.error("Error creating link token:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initialize Plaid Link"
      );
      setLoading(false);
      return null;
    }
  };

  const openPlaidLink = useCallback(
    (token: string) => {
      if (
        !plaidLoaded ||
        typeof window === "undefined" ||
        !(window as PlaidWindow).Plaid
      ) {
        toast.error("Plaid Link is not loaded yet. Please try again.");
        setLoading(false);
        return;
      }

      const handler = (window as PlaidWindow).Plaid!.create({
        token,
        onSuccess: async (publicToken: string, metadata: PlaidMetadata) => {
          try {
            // Exchange public token for access token
            const response = await fetch("/api/plaid/exchange-public-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                companyId,
                publicToken,
                metadata,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to link bank account");
            }

            const data = await response.json();
            toast.success(data.message || "Bank account linked successfully!");
            onSuccess();
          } catch (error) {
            console.error("Error exchanging public token:", error);
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to link bank account"
            );
          } finally {
            setLoading(false);
          }
        },
        onExit: (err: PlaidError | null) => {
          if (err) {
            console.error("Plaid Link error:", err);
            toast.error("Failed to link bank account");
          }
          setLoading(false);
        },
        onEvent: (eventName: string, metadata: PlaidMetadata) => {
          console.log("Plaid Link event:", eventName, metadata);
        },
      });

      handler.open();
    },
    [companyId, onSuccess, plaidLoaded]
  );

  const handleClick = async () => {
    if (!plaidLoaded) {
      toast.error(
        "Plaid is still loading. Please wait a moment and try again."
      );
      return;
    }

    const token = await createLinkToken();
    if (token) {
      openPlaidLink(token);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading || !plaidLoaded}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Linking...
        </>
      ) : !plaidLoaded ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading Plaid...
        </>
      ) : (
        "Link Bank Account"
      )}
    </Button>
  );
}
