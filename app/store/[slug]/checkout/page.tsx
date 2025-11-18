"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CartItem {
  id: string;
  itemType: "PRODUCT" | "SERVICE";
  quantity: number;
  product?: {
    name: string;
    price: number;
  };
  service?: {
    name: string;
    price: number;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    },
    billingAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    },
    sameAsShipping: true,
    paymentMethod: "card",
  });

  useEffect(() => {
    fetchStoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchStoreData = async () => {
    try {
      // Fetch store info
      const storeResponse = await fetch(`/api/store/${slug}`);
      if (!storeResponse.ok) throw new Error("Store not found");
      const storeData = await storeResponse.json();
      setCompany(storeData);

      // Fetch cart
      const cartResponse = await fetch("/api/cart");
      if (!cartResponse.ok) throw new Error("Failed to fetch cart");
      const cartData = await cartResponse.json();

      if (!cartData.items || cartData.items.length === 0) {
        router.push(`/store/${slug}/cart`);
        return;
      }

      setCart(cartData);
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("Failed to load checkout");
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      const price = item.product?.price || item.service?.price || 0;
      return total + Number(price) * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateShipping = () => {
    // Only charge shipping for physical products
    const hasProducts = cart?.items.some((item) => item.itemType === "PRODUCT");
    return hasProducts ? 10 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !formData.customerName ||
      !formData.customerEmail ||
      !formData.shippingAddress.addressLine1 ||
      !formData.shippingAddress.city ||
      !formData.shippingAddress.state ||
      !formData.shippingAddress.postalCode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/store/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          shippingAddress: formData.shippingAddress,
          billingAddress: formData.sameAsShipping
            ? formData.shippingAddress
            : formData.billingAddress,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process order");
      }

      setOrderNumber(data.orderNumber);
      setOrderComplete(true);
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error processing order:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process order"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              {company?.logo && (
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <h1 className="text-2xl font-bold">{company?.name}</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="pt-12 pb-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Order Confirmed!</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for your order. We&apos;ve sent a confirmation email
                  to <strong>{formData.customerEmail}</strong>
                </p>
                {orderNumber && (
                  <div className="bg-muted p-4 rounded-lg inline-block">
                    <p className="text-sm text-muted-foreground mb-1">
                      Order Number
                    </p>
                    <p className="text-2xl font-bold">{orderNumber}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 text-left bg-muted/30 p-6 rounded-lg mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${calculateShipping().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href={`/store/${slug}`}>Back to Store</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/store/${slug}/products`}>
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {company?.logo && (
              <Image
                src={company.logo}
                alt={company.name}
                width={40}
                height={40}
                className="object-contain"
              />
            )}
            <h1 className="text-2xl font-bold">{company?.name}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/store/${slug}/cart`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerName"
                        required
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        required
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customerEmail: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress1">
                      Address Line 1 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shippingAddress1"
                      required
                      value={formData.shippingAddress.addressLine1}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            addressLine1: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress2">Address Line 2</Label>
                    <Input
                      id="shippingAddress2"
                      value={formData.shippingAddress.addressLine2}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            addressLine2: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCity">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingCity"
                        required
                        value={formData.shippingAddress.city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            shippingAddress: {
                              ...prev.shippingAddress,
                              city: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingState">
                        State <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingState"
                        required
                        value={formData.shippingAddress.state}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            shippingAddress: {
                              ...prev.shippingAddress,
                              state: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingPostal">
                        ZIP Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingPostal"
                        required
                        value={formData.shippingAddress.postalCode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            shippingAddress: {
                              ...prev.shippingAddress,
                              postalCode: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>
                    Payment will be processed upon order confirmation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-4 border rounded-lg">
                    <CreditCard className="h-5 w-5" />
                    <span>Credit / Debit Card</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart?.items.map((item) => {
                      const itemData = item.product || item.service;
                      const itemName = itemData?.name || "Unknown Item";
                      const itemPrice = Number(itemData?.price || 0);

                      return (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {itemName} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            ${(itemPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>${calculateShipping().toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
