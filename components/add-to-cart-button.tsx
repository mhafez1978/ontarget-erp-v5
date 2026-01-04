"use client";

import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";

interface AddToCartButtonProps {
  item: {
    id?: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
  };
  type: "product" | "service";
  companyId: string;
  companySlug: string;
  primaryColor: string;
  fallbackId: string;
}

export function AddToCartButton({
  item,
  type,
  companyId,
  companySlug,
  primaryColor,
  fallbackId,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: item.id || fallbackId,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: 1,
      image: item.image,
      type,
      companyId,
      companySlug,
    });
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <button
      onClick={handleAddToCart}
      className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
      style={{ backgroundColor: primaryColor }}
    >
      Add to Cart
    </button>
  );
}
