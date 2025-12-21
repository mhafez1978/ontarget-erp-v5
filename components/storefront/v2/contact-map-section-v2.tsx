"use client";


import { Mail, Phone, Send, CheckCircle2, MapPin } from "lucide-react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import MapSectionV2 from "./map-section-v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";




;
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  type: string;
  isMain: boolean;
  latitude: number;
  longitude: number;
  addressLine1: string;
  addressLine2?: string;
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
  companyId: string; // Required for API call
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
  companyId,
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
  const [formSuccess, setFormSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to contact API with company ID
      const response = await fetch("/api/storefront/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Contact form error:", data);
        toast.error(data.error || "Failed to send message. Please try again.");
        return;
      }

      setFormSuccess(true);
      toast.success(data.message || "Thank you! We'll get back to you soon.");

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
        });
        setFormSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Contact form submission error:", error);
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
    <section
      style={{ backgroundColor }}
      className="py-20 relative overflow-hidden"
    >
      {/* Animated background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-5"
          style={{ background: buttonColor }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-5"
          style={{ background: buttonColor }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with animation */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-4xl md:text-5xl font-bold ${textColor} mb-3`}>
            {title}
          </h2>
          {description && (
            <p className={`text-lg ${textColor} opacity-75 max-w-2xl mx-auto`}>
              {description}
            </p>
          )}
        </motion.div>

        {/* Content Grid */}
        <div
          className={`grid ${isVertical ? "grid-cols-1" : "lg:grid-cols-2"}`}
          style={{ gap: `${spacing || 32}px` }}
        >
          {/* Contact Form */}
          <motion.div
            className="flex flex-col justify-start"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div
              className="rounded-2xl border backdrop-blur-md bg-white/95 p-8 md:p-10 shadow-xl transition-all duration-300 hover:shadow-2xl"
              style={{ borderColor: accentColor }}
            >
              <h3 className={`text-2xl font-semibold ${textColor} mb-7`}>
                Send us a Message
              </h3>

              {formSuccess ? (
                <motion.div
                  className="py-8 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <CheckCircle2
                      className="h-16 w-16 mx-auto mb-4"
                      style={{ color: buttonColor }}
                    />
                  </motion.div>
                  <p className="text-lg font-semibold mb-2">Message Sent!</p>
                  <p className={`${textColor} opacity-75`}>
                    Thank you for reaching out. We&apos;ll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Name */}
                  <div>
                    <Label
                      htmlFor="contact-name"
                      className="text-sm font-semibold block mb-2"
                    >
                      Your Name
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
                      className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 transition-all focus:bg-white focus:ring-2 focus:ring-offset-0"
                      style={
                        {
                          "--tw-ring-color": buttonColor,
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label
                      htmlFor="contact-email"
                      className="text-sm font-semibold block mb-2"
                    >
                      Email Address
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
                      className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 transition-all focus:bg-white focus:ring-2 focus:ring-offset-0"
                      style={
                        {
                          "--tw-ring-color": buttonColor,
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label
                      htmlFor="contact-phone"
                      className="text-sm font-semibold block mb-2"
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
                      className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 transition-all focus:bg-white focus:ring-2 focus:ring-offset-0"
                      style={
                        {
                          "--tw-ring-color": buttonColor,
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label
                      htmlFor="contact-message"
                      className="text-sm font-semibold block mb-2"
                    >
                      Message
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
                      rows={4}
                      className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 transition-all focus:bg-white focus:ring-2 focus:ring-offset-0 resize-none"
                      style={
                        {
                          "--tw-ring-color": buttonColor,
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                      style={{ backgroundColor: buttonColor }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              )}

              {/* Contact Info */}
              {mainLocation && (
                <motion.div
                  className="mt-8 pt-8 border-t space-y-4"
                  style={{ borderColor: accentColor }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div>
                    <p
                      className={`text-xs uppercase tracking-wide font-semibold opacity-60`}
                    >
                      {mainLocation.isMain ? "Main Office" : "Location"}
                    </p>
                    <h4 className={`font-bold text-lg ${textColor} mt-1`}>
                      {mainLocation.name}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <p
                      className={`${textColor} opacity-70 text-sm leading-relaxed`}
                    >
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
                      <motion.a
                        href={`tel:${mainLocation.phone}`}
                        className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-50"
                        whileHover={{ x: 4 }}
                      >
                        <Phone
                          className="h-5 w-5"
                          style={{ color: buttonColor }}
                        />
                        <span className="text-sm font-medium">
                          {mainLocation.phone}
                        </span>
                      </motion.a>
                    )}

                    {(mainLocation.email || primaryEmail) && (
                      <motion.a
                        href={`mailto:${mainLocation.email || primaryEmail}`}
                        className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-50"
                        whileHover={{ x: 4 }}
                      >
                        <Mail
                          className="h-5 w-5"
                          style={{ color: buttonColor }}
                        />
                        <span className="text-sm font-medium">
                          {mainLocation.email || primaryEmail}
                        </span>
                      </motion.a>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            className="flex flex-col justify-start"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              {locations.length > 0 &&
              locations.some((loc) => loc.latitude && loc.longitude) ? (
                <MapSectionV2
                  locations={locations.filter(
                    (loc) => loc.latitude && loc.longitude
                  )}
                  height={isVertical ? 300 : 450}
                  interactive={true}
                />
              ) : (
                <div
                  className="bg-linear-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-500 relative overflow-hidden"
                  style={{ height: isVertical ? "300px" : "450px" }}
                >
                  {/* Decorative map-like background */}
                  <div className="absolute inset-0 opacity-10">
                    <svg
                      width="100%"
                      height="100%"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id="grid"
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.3"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="150"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.2"
                      />
                    </svg>
                  </div>
                  <div className="text-center relative z-10">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">
                      {locations.length > 0
                        ? "Location coordinates not available"
                        : "No locations available"}
                    </p>
                    <p className="text-xs opacity-50 mt-2">
                      {locations.length > 0 &&
                        "Contact information is available below"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Locations */}
            {locations.length > 1 && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h4 className={`font-semibold text-lg ${textColor} mb-4`}>
                  Other Locations
                </h4>
                <div className="grid gap-3">
                  {locations
                    .filter((loc) => !loc.isMain)
                    .map((location, idx) => (
                      <motion.div
                        key={location.id}
                        className="p-4 rounded-lg border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin
                            className="h-4 w-4 shrink-0 mt-0.5"
                            style={{ color: buttonColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              {location.name}
                            </p>
                            <p className="text-xs opacity-70 mt-1">
                              {location.addressLine1}, {location.city}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
