"use client";

import { useState } from "react";
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

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Implement form submission logic
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    // Reset form
    setFormData({ name: "", email: "", company: "", message: "" });
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
            <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Your Name *
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
                  Email Address *
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
                  Message *
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
                    Send Message
                    <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting this form, you agree to our privacy policy.
                We&apos;ll respond within 24-48 hours.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
