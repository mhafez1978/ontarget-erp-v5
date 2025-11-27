"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Tag,
  Share2,
  Printer,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface KBArticleProps {
  title: string;
  description: string;
  category: string;
  tags: string[];
  readTime: string;
  lastUpdated: string;
  children: React.ReactNode;
  scopeLabel?: string;
}

export function KBArticle({
  title,
  description,
  category,
  tags,
  readTime,
  lastUpdated,
  scopeLabel,
  children,
}: KBArticleProps) {
  const [helpful, setHelpful] = useState<boolean | null>(null);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/support">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Button>
      </Link>

      {/* Article Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Category & Scope Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{category}</Badge>
              {scopeLabel && (
                <Badge variant="outline" className="text-xs">
                  {scopeLabel}
                </Badge>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {description}
              </p>
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{readTime} read</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span>Last updated: {lastUpdated}</span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Content */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Was this article helpful?</h3>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={helpful === true ? "default" : "outline"}
                size="lg"
                onClick={() => setHelpful(true)}
                className="gap-2"
              >
                <ThumbsUp className="h-5 w-5" />
                Yes
              </Button>
              <Button
                variant={helpful === false ? "default" : "outline"}
                size="lg"
                onClick={() => setHelpful(false)}
                className="gap-2"
              >
                <ThumbsDown className="h-5 w-5" />
                No
              </Button>
            </div>
            {helpful !== null && (
              <p className="text-sm text-muted-foreground">
                {helpful
                  ? "Thank you for your feedback! 🎉"
                  : "We're sorry this didn't help. Please contact support for more assistance."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Related Articles / Footer */}
      <div className="text-center py-8">
        <Link href="/dashboard/support">
          <Button variant="outline">Browse All Articles</Button>
        </Link>
      </div>
    </div>
  );
}
