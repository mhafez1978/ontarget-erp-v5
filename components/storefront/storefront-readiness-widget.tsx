"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Flag,
} from "lucide-react";
import { StorefrontReadiness } from "@/lib/storefront-readiness";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface StorefrontReadinessWidgetProps {
  companyId: string;
  slug?: string | null;
}

export function StorefrontReadinessWidget({
  companyId,
  slug,
}: StorefrontReadinessWidgetProps) {
  const [readiness, setReadiness] = useState<StorefrontReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  const handleRefresh = () => {
    setLoading(true);
    fetch(`/api/storefront/readiness/${companyId}`)
      .then((res) => res.json())
      .then((data) => setReadiness(data.readiness))
      .catch((error) => console.error("Failed to fetch readiness:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const fetchReadiness = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/storefront/readiness/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setReadiness(data.readiness);
        }
      } catch (error) {
        console.error("Failed to fetch readiness:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchReadiness();
    }
  }, [companyId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Storefront Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readiness) {
    return null;
  }

  const gradeColor = {
    A: "text-green-600",
    B: "text-blue-600",
    C: "text-yellow-600",
    D: "text-orange-600",
    F: "text-red-600",
  }[readiness.grade];

  const gradeBackground = {
    A: "bg-green-100 dark:bg-green-900/20",
    B: "bg-blue-100 dark:bg-blue-900/20",
    C: "bg-yellow-100 dark:bg-yellow-900/20",
    D: "bg-orange-100 dark:bg-orange-900/20",
    F: "bg-red-100 dark:bg-red-900/20",
  }[readiness.grade];

  return (
    <Card
      className={`border-2 ${
        readiness.isReady ? "border-green-200" : "border-yellow-200"
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Storefront Readiness
          </CardTitle>
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 mr-2" />
            <Badge
              variant="outline"
              className={`text-xl font-bold ${gradeBackground} ${gradeColor} border-0`}
            >
              {readiness.grade}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Completion Score</span>
            <span className={`font-bold ${gradeColor}`}>
              {readiness.score}%
            </span>
          </div>
          <Progress value={readiness.score} className="h-2" />
        </div>

        {/* Warnings */}
        {readiness.warnings.length > 0 && (
          <Alert variant="destructive" className="p-4 bg-red-300 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-white font-semibold">
                {readiness.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm ">
                    {warning}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-white font-semibold">
                Please go to the
                <span className="text-purple-900 ml-2 mr-2 font-bold text-md">
                  <Link href="/dashboard/catalog">Catalog Page</Link>
                </span>{" "}
                and add products and/or services to improve your store
                readiness.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Content Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                readiness.counts.products > 0 ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              <strong>{readiness.counts.products}</strong> Products
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                readiness.counts.services > 0 ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm">
              <strong>{readiness.counts.services}</strong> Services
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                readiness.counts.teamMembers > 0
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            />
            <span className="text-sm">
              <strong>{readiness.counts.teamMembers}</strong> Team Members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                readiness.counts.testimonials > 0
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            />
            <span className="text-sm">
              <strong>{readiness.counts.testimonials}</strong> Testimonials
            </span>
          </div>
        </div>

        {/* Priority Suggestions */}
        {readiness.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {readiness.suggestions.slice(0, 3).map((suggestion, idx) => (
                <li
                  key={idx}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status Badge */}
        <div className="pt-2 border-t">
          {readiness.isReady ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Ready to launch!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">
                Needs improvement before launch
              </span>
            </div>
          )}
        </div>

        {/* View Storefront Link */}
        {slug && (
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/store/${slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Storefront
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
