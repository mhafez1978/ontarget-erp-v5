import { CartProvider } from "@/contexts/cart-context";
import { CartSidebar, CartButton } from "@/components/cart/cart-sidebar";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
      <CartSidebar />
      <CartButton />
    </CartProvider>
  );
}
