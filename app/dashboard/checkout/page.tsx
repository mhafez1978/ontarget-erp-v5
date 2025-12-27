"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useCart } from "@/contexts/cart-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CreditCard, MapPin, Package, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, subtotal, tax, total, clearCart } = useCart();
  const [user, setUser] = useState({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Shipping Information
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });

  // Payment Information (placeholder)
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  const [notes, setNotes] = useState("");
  const [gatewayStatus, setGatewayStatus] = useState<{
    configured: boolean;
    enabled: boolean;
    provider: string | null;
    message: string;
  } | null>(null);
  const [checkingGateway, setCheckingGateway] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.authenticated && data.user) {
        const allowedRoles = ["ERP_CUSTOMER", "COMPANY_CUSTOMER"];

        if (!allowedRoles.includes(data.user.role)) {
          router.push("/dashboard");
          return;
        }

        setUser({
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          role: data.user.role,
        });

        // Pre-fill user info
        setShippingInfo((prev) => ({
          ...prev,
          fullName: data.user.name || "",
          email: data.user.email || "",
        }));
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Check payment gateway status when cart has items
  if (!loading && items.length > 0) {
    const companyId = items[0].companyId;
    if (companyId) {
      setCheckingGateway(true);
      fetch(`/api/checkout/gateway-status?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          setGatewayStatus(data);
          if (!data.configured || !data.enabled) {
            toast.warning("Payment gateway not configured", {
              description: data.message,
            });
          }
        })
        .catch((err) => {
          console.error("Error checking gateway status:", err);
        })
        .finally(() => {
          setCheckingGateway(false);
        });
    }
  }

  useEffect(() => {
    // Redirect if cart is empty
    if (!loading && items.length === 0) {
      toast.error("Your cart is empty");
      router.push("/dashboard/cart");
    }
  }, [items.length, loading, router]);

  const handleSubmitOrder = async () => {
    // Validate shipping info
    if (
      !shippingInfo.fullName ||
      !shippingInfo.email ||
      !shippingInfo.phone ||
      !shippingInfo.addressLine1 ||
      !shippingInfo.city ||
      !shippingInfo.state ||
      !shippingInfo.postalCode
    ) {
      toast.error("Please fill in all required shipping information");
      return;
    }

    // Validate payment info (basic validation)
    if (
      !paymentInfo.cardNumber ||
      !paymentInfo.cardName ||
      !paymentInfo.expiryDate ||
      !paymentInfo.cvv
    ) {
      toast.error("Please fill in all payment information");
      return;
    }

    setSubmitting(true);

    try {
      // Process checkout via API (verifies payment gateway and creates order)
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            type: item.type,
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            companyId: item.companyId,
          })),
          shipping: shippingInfo,
          payment: {
            method: "card",
            last4: paymentInfo.cardNumber.slice(-4),
            // In production, this would be handled securely via payment gateway
            // You would tokenize the card with Stripe/PayPal/etc before sending
          },
          subtotal,
          tax,
          total,
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Order placed successfully!");
        clearCart();
        router.push(`/dashboard/orders?new=${data.order.id}`);
      } else {
        // Show specific error message
        if (data.details) {
          toast.error(data.error, { description: data.details });
        } else {
          toast.error(data.error || "Failed to place order");
        }
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.er;

      {
        /* Payment Gateway Warning */
      }
      {
        gatewayStatus &&
          (!gatewayStatus.configured || !gatewayStatus.enabled) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Payment Gateway Not Available</AlertTitle>
              <AlertDescription>
                {gatewayStatus.message}. Please contact the company to complete
                your order.
              </AlertDescription>
            </Alert>
          );
      }
      ror("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order by providing shipping and payment information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        phone: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={shippingInfo.addressLine1}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        addressLine1: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={shippingInfo.addressLine2}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        addressLine2: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          city: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          state: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          postalCode: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={shippingInfo.country}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          country: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card *</Label>
                  <Input
                    id="cardName"
                    value={paymentInfo.cardName}
                    onChange={(e) =>
                      setPaymentInfo({
                        ...paymentInfo,
                        cardName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentInfo.cardNumber}
                    onChange={(e) =>
                      setPaymentInfo({
                        ...paymentInfo,
                        cardNumber: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={paymentInfo.expiryDate}
                      onChange={(e) =>
                        setPaymentInfo({
                          ...paymentInfo,
                          expiryDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentInfo.cvv}
                      onChange={(e) =>
                        setPaymentInfo({ ...paymentInfo, cvv: e.target.value })
                      }
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any special instructions or notes for your order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </div>
                  {items.slice(0, 3).map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex justify-between text-sm"
                    >
                      <span className="truncate">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      + {items.length - 3} more items
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={
                    submitting ||
                    checkingGateway ||
                    (gatewayStatus &&
                      (!gatewayStatus.configured || !gatewayStatus.enabled))
                  }
                >
                  {submitting
                    ? "Processing..."
                    : checkingGateway
                    ? "Checking Gateway..."
                    : gatewayStatus && !gatewayStatus.configured
                    ? "No Payment Gateway"
                    : gatewayStatus && !gatewayStatus.enabled
                    ? "Payment Gateway Disabled"
                    : "Place Order"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/dashboard/cart")}
                  disabled={submitting}
                >
                  Back to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
