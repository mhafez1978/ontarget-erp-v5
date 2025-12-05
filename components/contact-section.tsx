"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Github,
  Linkedin,
  Globe,
  MapPin,
  Send,
  Twitter,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

declare global {
  interface Window {
    grecaptcha?: {
      execute: (
        siteKey: string,
        options?: { action?: string }
      ) => Promise<string>;
    };
  }
}

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [captchaActive, setCaptchaActive] = useState(false);
  const [captchaBypass, setCaptchaBypass] = useState(false);

  useEffect(() => {
    const loadSiteKey = async () => {
      try {
        const resp = await fetch("/api/public/captcha/site-key");
        if (resp.ok) {
          const data = await resp.json();
          const bypass = Boolean(data?.bypassActive);
          setCaptchaBypass(bypass);
          const active = !bypass && Boolean(data?.active && data?.siteKey);
          setCaptchaActive(active);
          setSiteKey(active ? String(data.siteKey) : null);
        }
      } catch (e) {
        console.warn("Failed to load captcha site key", e);
        setSiteKey(null);
      }
    };
    loadSiteKey();
  }, []);

  // Load Google reCAPTCHA v3 script when siteKey becomes available
  useEffect(() => {
    if (!siteKey) return;
    if (typeof window === "undefined") return;
    if (document.getElementById("grecaptcha-script")) {
      try {
        // prefer readiness over script onload
        // @ts-ignore
        window.grecaptcha?.ready?.(() => setCaptchaLoaded(true));
      } catch {
        setCaptchaLoaded(true);
      }
      return;
    }
    const script = document.createElement("script");
    script.id = "grecaptcha-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        // @ts-ignore
        window.grecaptcha?.ready?.(() => setCaptchaLoaded(true));
      } catch {
        setCaptchaLoaded(true);
      }
    };
    script.onerror = () => setCaptchaLoaded(false);
    document.head.appendChild(script);
  }, [siteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // simple client-side validation
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (captchaActive && siteKey && !captchaLoaded && !captchaBypass) {
        toast.error(
          "Captcha is still loading. Please wait a moment and try again."
        );
        return;
      }
      // Obtain captcha token if captcha is active
      // If not available/inactive, omit the token entirely.
      let captchaToken = "";
      try {
        if (!captchaBypass && window.grecaptcha && siteKey && captchaLoaded) {
          // Ensure grecaptcha is fully ready before executing
          await new Promise<void>((resolve) => {
            try {
              // @ts-ignore — grecaptcha types not fully defined
              window.grecaptcha.ready(() => resolve());
            } catch {
              resolve();
            }
          });
          captchaToken = await window.grecaptcha.execute(siteKey, {
            action: "contact",
          });
        }
      } catch (e) {
        console.warn("Captcha execute failed:", e);
      }

      // Build payload and only include captchaToken when non-empty
      if (
        !captchaBypass &&
        captchaActive &&
        siteKey &&
        (!captchaToken || captchaToken.length < 10)
      ) {
        toast.error(
          "Captcha did not generate a token. Please wait a moment, disable ad-blockers, and ensure this domain is allowed in your reCAPTCHA settings."
        );
        return;
      }

      const payload: Record<string, unknown> = { ...formData };
      if (captchaToken && captchaToken.length > 0) {
        payload["captchaToken"] = captchaToken;
      }

      const res = await fetch("/api/send-contact-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({} as any));
        if (payload?.errorCode === "captcha_missing") {
          toast.error(
            "Captcha is enabled but no token was generated. Ensure the reCAPTCHA script loaded (disable ad-blockers) and your domain is allowed in the reCAPTCHA console."
          );
        } else if (payload?.errorCode === "captcha_failed") {
          const scoreInfo =
            typeof payload?.captcha?.score === "number"
              ? ` (score: ${payload.captcha.score})`
              : "";
          toast.error(
            `Captcha verification failed${scoreInfo}. Please retry or contact support.`
          );
        } else {
          toast.error(
            payload?.message ||
              "There was an issue sending your message. Please try again later."
          );
        }
        return;
      }

      // success -> reset form and notify user
      setFormData({ name: "", email: "", company: "", message: "" });
      setSubmitted(true);
      toast.success("Message sent to the super admin. Thank you!");
    } catch (err: unknown) {
      console.error("Contact form error:", err);
      const message =
        err instanceof Error
          ? err.message
          : String(
              err ?? "Unable to send the message. Please try again later."
            );
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section id="contact" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about OnTarget ERP? Want to discuss your business
            needs? Let&apos;s connect!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Contact Information */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold mb-6">
                Connect With the Developer
              </h3>

              {/* Company Info */}
              <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Nodes Unlimited LLC</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Lowell, Massachusetts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <Link
                  href="https://www.linkedin.com/in/mohamedhafez1978/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all group"
                >
                  <div className="rounded-lg bg-[#0A66C2]/10 p-3 group-hover:bg-[#0A66C2]/20 transition-colors">
                    <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">LinkedIn</div>
                    <div className="text-sm text-muted-foreground">
                      /in/mohamedhafez1978
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://github.com/mhafez1978"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all group"
                >
                  <div className="rounded-lg bg-foreground/10 p-3 group-hover:bg-foreground/20 transition-colors">
                    <Github className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">GitHub</div>
                    <div className="text-sm text-muted-foreground">
                      @mhafez1978 • 75+ repositories
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://twitter.com/geeksondemand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all group"
                >
                  <div className="rounded-lg bg-[#1DA1F2]/10 p-3 group-hover:bg-[#1DA1F2]/20 transition-colors">
                    <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Twitter / X</div>
                    <div className="text-sm text-muted-foreground">
                      @geeksondemand
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://beingmohamedhafez.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all group"
                >
                  <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Personal Website</div>
                    <div className="text-sm text-muted-foreground">
                      beingmohamedhafez.com
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Additional Info */}
            <div className="rounded-lg border bg-linear-to-br from-primary/5 to-primary/10 p-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Business Inquiries
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                For partnership opportunities, enterprise solutions, or custom
                development needs, feel free to reach out through the contact
                form or connect on LinkedIn.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Enterprise consulting available</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Custom development solutions</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Cloud architecture design</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="rounded-2xl border bg-card p-8 shadow-lg">
            <h3 className="flex flex-row gap-2 items-center text-2xl font-bold mb-6">
              <Send className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
              Send us a message
            </h3>
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-10">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="h-10 w-10 text-green-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"
                    />
                  </svg>
                </div>
                <div className="text-xl font-semibold">Message Sent</div>
                <div className="text-sm text-muted-foreground max-w-md">
                  Thank you for contacting us. We’ll get back to you within
                  24–48 hours.
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="mt-2"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="company"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Company Name
                  </label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell me about your project or inquiry..."
                    className="min-h-[150px] resize-none"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full group"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send
                      <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
                {captchaActive && siteKey ? (
                  <div className="mt-2 text-[11px] text-muted-foreground text-center">
                    Protected by reCAPTCHA •
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline ml-1"
                    >
                      Privacy
                    </a>
                    <span> • </span>
                    <a
                      href="https://policies.google.com/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Terms
                    </a>
                  </div>
                ) : null}
                {captchaBypass ? (
                  <div className="mt-2 text-[11px] text-muted-foreground text-center">
                    Captcha bypass active for localhost testing.
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  By submitting this form, you agree to our privacy policy.
                  We&apos;ll respond within 24-48 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
