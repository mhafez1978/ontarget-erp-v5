"use client";

import { useState } from "react";
import MapSectionV2 from "./map-section-v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Send } from "lucide-react";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  type: string;
  isMain: boolean;
  latitude: number;
  longitude: number;
  addressLine1: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

interface ContactMapSectionV2Props {
  title: string;
  description?: string;
  locations: Location[];
  primaryEmail?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  accentColor?: string;
  layout?: "horizontal" | "vertical"; // AI decides based on content
  spacing?: number; // px between sections
}

export default function ContactMapSectionV2({
  title,
  description,
  locations,
  primaryEmail,
  backgroundColor = "white",
  textColor = "text-gray-900",
  buttonColor = "bg-blue-600",
  accentColor = "border-blue-200",
  layout = "horizontal",
  spacing = 32,
}: ContactMapSectionV2Props) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Integrate with actual contact form API
      // For now, just show success toast
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Thank you! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainLocation = locations.find((loc) => loc.isMain) || locations[0];

  // Determine if vertical layout (mobile/tablet responsive)
  const isVertical =
    layout === "vertical" ||
    (typeof window !== "undefined" && window.innerWidth < 768);

  return (
    <section style={{ backgroundColor }} className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className={`text-3xl font-bold ${textColor} mb-2`}>{title}</h2>
          {description && (
            <p className={`text-lg ${textColor} opacity-80`}>{description}</p>
          )}
        </div>

        {/* Content Grid */}
        <div
          className={`grid ${isVertical ? "grid-cols-1" : "md:grid-cols-2"}`}
          style={{ gap: `${spacing || 32}px` }}
        >
          {/* Contact Form */}
          <div className="flex flex-col justify-start">
            <div
              className="rounded-lg border bg-white p-8 shadow-sm"
              style={{ borderColor: accentColor }}
            >
              <h3 className={`text-xl font-semibold ${textColor} mb-6`}>
                Send us a Message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <Label htmlFor="contact-name" className="text-sm font-medium">
                    Your Name *
                  </Label>
                  <Input
                    id="contact-name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label
                    htmlFor="contact-email"
                    className="text-sm font-medium"
                  >
                    Email Address *
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label
                    htmlFor="contact-phone"
                    className="text-sm font-medium"
                  >
                    Phone Number
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                {/* Message */}
                <div>
                  <Label
                    htmlFor="contact-message"
                    className="text-sm font-medium"
                  >
                    Message *
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    required
                    rows={5}
                    className="mt-1"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white hover:opacity-90 gap-2"
                  style={{ backgroundColor: buttonColor }}
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>

              {/* Contact Info */}
              {mainLocation && (
                <div
                  className="mt-8 pt-8 border-t"
                  style={{ borderColor: accentColor }}
                >
                  <h4 className={`font-semibold ${textColor} mb-4`}>
                    {mainLocation.name}
                  </h4>

                  <div className="space-y-3 text-sm">
                    <p className={`${textColor} opacity-75`}>
                      {mainLocation.addressLine1}
                      {mainLocation.addressLine2 && <br />}
                      {mainLocation.addressLine2}
                      <br />
                      {mainLocation.city}, {mainLocation.state}{" "}
                      {mainLocation.postalCode}
                      <br />
                      {mainLocation.country}
                    </p>

                    {mainLocation.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <a
                          href={`tel:${mainLocation.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {mainLocation.phone}
                        </a>
                      </p>
                    )}

                    {(mainLocation.email || primaryEmail) && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <a
                          href={`mailto:${mainLocation.email || primaryEmail}`}
                          className="text-blue-600 hover:underline"
                        >
                          {mainLocation.email || primaryEmail}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex flex-col justify-start">
            <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
              {locations.length > 0 ? (
                <MapSectionV2
                  locations={locations}
                  height={isVertical ? 300 : 450}
                  interactive={true}
                />
              ) : (
                <div className="h-96 bg-gray-100 flex items-center justify-center text-gray-500">
                  No locations available
                </div>
              )}
            </div>

            {/* Additional Locations */}
            {locations.length > 1 && (
              <div className="mt-6">
                <h4 className={`font-semibold ${textColor} mb-3`}>
                  Other Locations
                </h4>
                <div className="space-y-2">
                  {locations
                    .filter((loc) => !loc.isMain)
                    .map((location) => (
                      <div
                        key={location.id}
                        className={`text-sm ${textColor} opacity-75`}
                      >
                        <p className="font-medium">{location.name}</p>
                        <p className="text-xs">
                          {location.addressLine1}, {location.city}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
