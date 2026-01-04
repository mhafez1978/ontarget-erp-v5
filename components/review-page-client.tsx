"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ReviewPageClientProps {
  companyId: string;
  companySlug: string;
  companyName: string;
  primaryColor: string;
}

export function ReviewPageClient({
  companyId,
  companySlug,
  companyName,
  primaryColor,
}: ReviewPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerTitle: "",
    testimonial: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (
      !formData.customerEmail.trim() ||
      !/\S+@\S+\.\S+/.test(formData.customerEmail)
    ) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.testimonial.trim() || formData.testimonial.length < 20) {
      toast.error("Please enter a review with at least 20 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/storefront/v3/${companySlug}/testimonials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerTitle: formData.customerTitle,
            testimonial: formData.testimonial,
            rating,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setSubmitted(true);
      toast.success("Review submitted successfully!");

      // Redirect to home page after 3 seconds
      setTimeout(() => {
        router.push(`/store/v3/${companySlug}`);
      }, 3000);
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle size={48} style={{ color: primaryColor }} />
          </div>
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: primaryColor }}
          >
            Thank You!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Your review has been submitted and is pending approval.
          </p>
          <p className="text-gray-600">
            We appreciate you taking the time to share your experience!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: primaryColor }}
          >
            Share Your Experience
          </h1>
          <p className="text-xl text-gray-600">
            Tell us about your experience with {companyName}
          </p>
        </div>

        {/* Hero Image */}
        <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg mb-12">
          <Image
            src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=1200&q=80"
            alt="Leave a Review"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-white text-center">
              <Star
                size={48}
                className="mx-auto mb-4 fill-yellow-400 text-yellow-400"
              />
              <p className="text-2xl font-bold">Your feedback matters to us</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Rating */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-4 text-center">
              How would you rate your experience? *
            </label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125"
                >
                  <Star
                    size={48}
                    className={`${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-2">
              {rating === 5 && "Excellent!"}
              {rating === 4 && "Great!"}
              {rating === 3 && "Good"}
              {rating === 2 && "Fair"}
              {rating === 1 && "Poor"}
            </p>
          </div>

          {/* Customer Info */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Your Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2"
                style={
                  { "--tw-ring-color": primaryColor } as React.CSSProperties
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Title/Position (Optional)
              </label>
              <input
                type="text"
                name="customerTitle"
                value={formData.customerTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2"
                placeholder="CEO at Company Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Your Review *
              </label>
              <textarea
                name="testimonial"
                value={formData.testimonial}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2"
                placeholder="Share your experience with us..."
                required
                minLength={20}
              />
              <p className="text-sm text-gray-500 mt-2">
                Minimum 20 characters ({formData.testimonial.length}/20)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/store/v3/${companySlug}`)}
              className="flex-1 py-4 px-6 rounded-lg font-semibold border-2 transition-all duration-300 hover:bg-gray-50"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 px-6 rounded-lg font-bold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Your review will be reviewed by our team before being published. We
            respect your privacy and will never share your email address.
          </p>
        </form>
      </div>
    </div>
  );
}
