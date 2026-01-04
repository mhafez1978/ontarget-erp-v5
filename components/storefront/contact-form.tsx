"use client";

import { useState } from "react";

interface ContactFormProps {
  slug: string;
}

export default function ContactForm({ slug }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch(`/api/storefront/${slug}/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Submission failed");
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      console.log(err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message ?? "Unknown error");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold">
          Thanks — we received your message!
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      className="max-w-xl p-6 bg-white rounded-lg shadow-sm"
      onSubmit={handleSubmit}
    >
      <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="grid grid-cols-1 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          className="border rounded px-3 py-2 h-28"
          placeholder="How can we help?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-white"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}
