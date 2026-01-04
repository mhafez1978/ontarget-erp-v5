"use client";

import { useCartStore, type CartItem } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface CartPageClientProps {
  companyId: string;
  companySlug: string;
  companyName: string;
  primaryColor: string;
}

export function CartPageClient({
  companyId,
  companySlug,
  primaryColor,
}: CartPageClientProps) {
  const { updateQuantity, removeItem, clearCompanyCart } = useCartStore();

  // Subscribe to items directly so component re-renders when cart changes
  const items = useCartStore((state) =>
    state.items.filter((item) => item.companyId === companyId)
  );
  const subtotal = items.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      toast.success("Item removed from cart");
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeItem(itemId);
    toast.success(`${itemName} removed from cart`);
  };

  const handleClearCart = () => {
    clearCompanyCart(companyId);
    toast.success("Cart cleared");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag size={64} className="mx-auto mb-6 text-gray-300" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Add some items to your cart to get started!
          </p>
          <Link
            href={`/store/v3/${companySlug}`}
            className="inline-block py-3 px-8 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold" style={{ color: primaryColor }}>
            Shopping Cart
          </h1>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
          >
            <Trash2 size={18} />
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: CartItem) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-6 flex gap-6"
              >
                {item.image && (
                  <div className="relative w-24 h-24 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      ${item.price.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-2 rounded-lg border hover:bg-gray-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-lg w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-2 rounded-lg border hover:bg-gray-50"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal (
                    {items.reduce(
                      (sum: number, item: CartItem) => sum + item.quantity,
                      0
                    )}{" "}
                    items)
                  </span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href={`/store/v3/${companySlug}/checkout`}
                className="block w-full py-4 px-6 rounded-lg font-bold text-white text-center transition-all duration-300 hover:opacity-90 hover:shadow-lg text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Proceed to Checkout
              </Link>
              <Link
                href={`/store/v3/${companySlug}`}
                className="block w-full py-3 px-6 rounded-lg font-semibold text-center mt-4 border-2 transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
