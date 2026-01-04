"use client";

import { useState } from "react";
import { useCartStore, type CartItem } from "@/lib/cart-store";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

interface CheckoutPageClientProps {
  companyId: string;
  companySlug: string;
  companyName: string;
  companyEmail: string;
  primaryColor: string;
}

export function CheckoutPageClient({
  companyId,
  companySlug,
  companyName,
  companyEmail,
  primaryColor,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { clearCompanyCart } = useCartStore();

  // Subscribe to items directly so component re-renders when cart changes
  const items = useCartStore((state) =>
    state.items.filter((item) => item.companyId === companyId)
  );

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Customer Info
    fullName: "",
    email: "",
    phone: "",
    // Billing Address
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    // Payment (placeholder - would integrate Stripe)
    paymentMethod: "card",
    // Terms
    agreeToTerms: false,
  });

  const subtotal = items.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  if (items.length === 0) {
    router.push(`/store/v3/${companySlug}/cart`);
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Please enter your billing address");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (!formData.state.trim()) {
      toast.error("Please enter your state");
      return false;
    }
    if (!formData.zipCode.trim()) {
      toast.error("Please enter your ZIP code");
      return false;
    }
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
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
      // Submit order to API
      const response = await fetch("/api/storefront/v3/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          companySlug,
          companyName,
          companyEmail,
          items,
          customer: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          },
          billing: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          subtotal,
          tax,
          total,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const { orderId } = await response.json();

      // Clear cart
      clearCompanyCart(companyId);

      // Redirect to confirmation
      toast.success("Order placed successfully!");
      router.push(`/store/v3/${companySlug}/order/${orderId}`);
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: primaryColor }}>
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: primaryColor }}
                >
                  Customer Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: primaryColor }}
                >
                  Billing Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Country *
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                        required
                      >
                        <option>United States</option>
                        <option>Canada</option>
                        <option>United Kingdom</option>
                        <option>Australia</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: primaryColor }}
                >
                  Payment Method
                </h2>
                <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Lock size={20} className="text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Payment processing will be handled securely via Stripe
                    (integration pending)
                  </p>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the terms and conditions and privacy policy *
                  </span>
                </label>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: primaryColor }}
                >
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-3">
                      {item.image && (
                        <div className="relative w-16 h-16 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </p>
                        <p
                          className="text-sm font-bold"
                          style={{ color: primaryColor }}
                        >
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (10%)</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold pt-3 border-t">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-4 px-6 rounded-lg font-bold text-white text-lg transition-all duration-300 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
