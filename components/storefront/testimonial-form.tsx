"use client";


import { Star, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";



import { toast } from "sonner";

interface TestimonialFormProps {
  slug?: string;
  /** Optional full API path to POST/GET testimonials. If present it takes precedence over slug. */
  apiPath?: string;
}

export function TestimonialForm({ slug, apiPath }: TestimonialFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerTitle: "",
    testimonial: "",
  });
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use explicit apiPath when provided (homepage root case) otherwise fall back to slug-based storefront endpoint
      const path =
        apiPath || (slug ? `/api/storefront/${slug}/testimonials` : undefined);

      if (!path) {
        throw new Error(
          "No target endpoint configured for testimonial submission"
        );
      }

      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          rating,
          // include base64 data URL if user attached a photo
          customerPhoto: customerPhoto || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // log server details for easier debugging in dev
        console.error("Testimonial submit error response:", data);
        throw new Error(data.error || "Failed to submit testimonial");
      }

      toast.success(
        data.message ||
          "Thank you! Your testimonial has been submitted for review.",
        {
          duration: 5000,
          position: "top-center",
        }
      );

      // Reset form
      setFormData({
        customerName: "",
        customerEmail: "",
        customerTitle: "",
        testimonial: "",
      });
      setCustomerPhoto(null);
      setRating(5);
      setOpen(false);
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit testimonial. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gap-3 px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300 bg-linear-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:via-primary hover:to-primary/90 border-2 border-primary/20"
        >
          <MessageSquare className="h-6 w-6" />
          <span>Share Your Experience</span>
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Experience</DialogTitle>
          <DialogDescription>
            Tell us about your experience. Your testimonial helps others make
            informed decisions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground self-center">
                {rating} / 5
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Your Name *</Label>
            <Input
              id="customerName"
              placeholder="John Doe"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email Address *</Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="john@example.com"
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData({ ...formData, customerEmail: e.target.value })
              }
              required
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="customerTitle">Title / Company (Optional)</Label>
            <Input
              id="customerTitle"
              placeholder="CEO at TechCorp"
              value={formData.customerTitle}
              onChange={(e) =>
                setFormData({ ...formData, customerTitle: e.target.value })
              }
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label htmlFor="customerPhoto">Upload a photo (optional)</Label>
            <input
              id="customerPhoto"
              type="file"
              accept="image/*"
              disabled={loading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // basic validations
                if (!file.type.startsWith("image/")) {
                  toast.error("Please select an image file.");
                  return;
                }

                // limit to 2MB client-side
                const MAX = 2 * 1024 * 1024;
                if (file.size > MAX) {
                  toast.error("Image too large. Max 2MB.");
                  return;
                }

                // convert to data url
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string | ArrayBuffer | null;
                  if (typeof result === "string") setCustomerPhoto(result);
                };
                reader.readAsDataURL(file);
              }}
            />

            {customerPhoto ? (
              <div className="flex items-center gap-3">
                <Image
                  src={customerPhoto}
                  alt="preview"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <button
                  type="button"
                  className="text-xs underline text-muted-foreground"
                  onClick={() => setCustomerPhoto(null)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Optional: upload a small profile photo for your testimonial (max
                2MB).
              </p>
            )}
          </div>

          {/* Testimonial */}
          <div className="space-y-2">
            <Label htmlFor="testimonial">Your Testimonial *</Label>
            <Textarea
              id="testimonial"
              placeholder="Share your experience with us..."
              value={formData.testimonial}
              onChange={(e) =>
                setFormData({ ...formData, testimonial: e.target.value })
              }
              required
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your testimonial will be reviewed before being published.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Testimonial"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
