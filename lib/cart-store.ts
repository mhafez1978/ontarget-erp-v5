import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // Unique identifier (productId or serviceId)
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  type: "product" | "service";
  companyId: string; // Important: cart is per company
  companySlug: string;
}

interface CartStore {
  items: CartItem[];

  // Add item to cart (or increase quantity if exists)
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;

  // Remove item from cart
  removeItem: (itemId: string) => void;

  // Update item quantity
  updateQuantity: (itemId: string, quantity: number) => void;

  // Clear entire cart
  clearCart: () => void;

  // Clear cart for specific company (when switching companies)
  clearCompanyCart: (companyId: string) => void;

  // Get cart total
  getTotal: () => number;

  // Get item count
  getItemCount: () => number;

  // Get items for specific company
  getCompanyItems: (companyId: string) => CartItem[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.id === item.id);

        if (existingItem) {
          // Item exists, increase quantity
          set({
            items: items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          });
        } else {
          // New item, add to cart
          set({
            items: [...items, { ...item, quantity: item.quantity || 1 }],
          });
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearCompanyCart: (companyId) => {
        set((state) => ({
          items: state.items.filter((item) => item.companyId !== companyId),
        }));
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      getCompanyItems: (companyId) => {
        const { items } = get();
        return items.filter((item) => item.companyId === companyId);
      },
    }),
    {
      name: "v3-cart-storage", // localStorage key
      version: 1,
    }
  )
);
