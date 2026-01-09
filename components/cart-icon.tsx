"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useSyncExternalStore } from "react";

interface CartIconProps {
  companySlug: string;
  companyId: string;
  primaryColor: string;
}

export function CartIcon({
  companySlug,
  companyId,
  primaryColor,
}: CartIconProps) {
  const getCompanyItems = useCartStore((state) => state.getCompanyItems);

  const itemCount = useSyncExternalStore(
    useCartStore.subscribe,
    () => {
      const items = getCompanyItems(companyId);
      return items.reduce((sum, item) => sum + item.quantity, 0);
    },
    () => 0 // Server snapshot
  );

  return (
    <Link
      href={`/store/v3/${companySlug}/cart`}
      className="relative p-2 hover:opacity-80 transition-opacity"
    >
      <ShoppingCart size={24} style={{ color: primaryColor }} />
      {itemCount > 0 && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: primaryColor }}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </div>
      )}
    </Link>
  );
}
