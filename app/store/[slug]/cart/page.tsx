"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CartItem {
  id: string;
  itemType: "PRODUCT" | "SERVICE";
  itemId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
    inventory: number | null;
  };
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number | null;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface Company {
  name: string;
  logo: string | null;
  slug: string;
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
      await fetchCart();
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Failed to fetch cart");
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) throw new Error("Failed to update quantity");

      await fetchCart();
      toast.success("Cart updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update cart");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove item");

      await fetchCart();
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
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

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
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

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href={`/store/${slug}`}
                className="text-sm font-medium hover:underline"
              >
                Home
              </Link>
              <Link
                href={`/store/${slug}/products`}
                className="text-sm font-medium hover:underline"
              >
                Products
              </Link>
              <Link
                href={`/store/${slug}/services`}
                className="text-sm font-medium hover:underline"
              >
                Services
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/store/${slug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {isEmpty
              ? "Your cart is empty"
              : `${cart.items.length} item${
                  cart.items.length !== 1 ? "s" : ""
                } in your cart`}
          </p>
        </div>

        {isEmpty ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Start shopping to add items to your cart
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href={`/store/${slug}/products`}>Browse Products</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/store/${slug}/services`}>Browse Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const itemData = item.product || item.service;
                const itemName = itemData?.name || "Unknown Item";
                const itemPrice = Number(itemData?.price || 0);
                const itemImage =
                  item.product?.images && item.product.images[0];

                return (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Item Image */}
                        {itemImage && (
                          <div className="relative w-24 h-24 shrink-0 bg-muted rounded overflow-hidden">
                            <Image
                              src={itemImage}
                              alt={itemName}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">
                            {itemName}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.itemType === "PRODUCT"
                              ? "Product"
                              : "Service"}
                          </p>
                          {item.service?.duration && (
                            <p className="text-sm text-muted-foreground">
                              Duration: {item.service.duration} mins
                            </p>
                          )}
                          <p className="text-lg font-semibold mt-2">
                            ${itemPrice.toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={
                                updating === item.id || item.quantity <= 1
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={
                                updating === item.id ||
                                (item.product?.inventory !== null &&
                                  item.quantity >=
                                    (item.product?.inventory || 0))
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <p className="text-sm font-semibold">
                            ${(itemPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      ${calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="font-medium">
                      ${calculateTax().toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => router.push(`/store/${slug}/checkout`)}
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
