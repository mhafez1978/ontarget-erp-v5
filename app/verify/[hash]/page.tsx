"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Shield,
  Building,
  Calendar,
  Hash,
  Loader2,
} from "lucide-react";

interface VerificationData {
  verified: boolean;
  hash: string;
  transactionId?: string;
  consensusTimestamp?: string;
  costHbar?: string;
  status?: string;
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
  blockchainExplorer?: string;
  anchoredAt?: string;
  network?: string;
  message?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const hash = params.hash as string;

  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyRecord = async () => {
      try {
        const response = await fetch(`/api/public/verify/${hash}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Verification failed");
          return;
        }

        setData(result);
      } catch (err) {
        setError("Failed to verify record");
      } finally {
        setLoading(false);
      }
    };

    if (hash) {
      verifyRecord();
    }
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Verifying record...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Verification Failed</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {data.verified ? (
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {data.verified ? "Record Verified" : "Record Not Found"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.verified
              ? "This record has been cryptographically anchored to the Hedera blockchain"
              : data.message || "No matching record found"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {data.verified && (
            <>
              {/* Company Info */}
              {data.company && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  {data.company.logo ? (
                    <img
                      src={data.company.logo}
                      alt={data.company.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{data.company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Verified Company
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Transaction Hash
                    </span>
                  </div>
                  <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                    {data.hash}
                  </code>
                </div>

                {data.transactionId && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Transaction ID
                      </span>
                    </div>
                    <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                      {data.transactionId}
                    </code>
                  </div>
                )}
              </div>

              {/* Status and Network */}
              <div className="flex flex-wrap gap-2">
                {data.status && (
                  <Badge
                    variant={
                      data.status === "CONFIRMED" ? "default" : "secondary"
                    }
                  >
                    {data.status}
                  </Badge>
                )}
                {data.network && (
                  <Badge variant="outline">{data.network} Network</Badge>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.consensusTimestamp && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Blockchain Timestamp
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(data.consensusTimestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {data.anchoredAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Anchored At</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(data.anchoredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost */}
              {data.costHbar && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Transaction Cost</span>
                  <span className="text-sm font-mono">
                    {data.costHbar} HBAR
                  </span>
                </div>
              )}

              {/* Blockchain Explorer Link */}
              {data.blockchainExplorer && (
                <div className="pt-4 border-t">
                  <Button asChild className="w-full">
                    <a
                      href={data.blockchainExplorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Hedera Explorer
                    </a>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Hedera Consensus Service • Immutable • Secure •
              Transparent
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
