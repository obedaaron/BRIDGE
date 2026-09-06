import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = { listingId: string; vendorSlug: string; vendorName: string; title: string; price: number; currency: string; quantity: number; imageUrl: string | null };
type CartContextValue = { items: CartItem[]; add: (item: Omit<CartItem, "quantity">) => void; remove: (listingId: string) => void; setQuantity: (listingId: string, quantity: number) => void; clear: () => void; total: number };
const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "bridge-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => { try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; } });
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(items)); }, [items]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (item) => setItems((current) => {
      const sameStore = current.length === 0 || current[0].vendorSlug === item.vendorSlug;
      const base = sameStore ? current : [];
      const existing = base.find((entry) => entry.listingId === item.listingId);
      return existing ? base.map((entry) => entry.listingId === item.listingId ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...base, { ...item, quantity: 1 }];
    }),
    remove: (listingId) => setItems((current) => current.filter((item) => item.listingId !== listingId)),
    setQuantity: (listingId, quantity) => setItems((current) => quantity < 1 ? current.filter((item) => item.listingId !== listingId) : current.map((item) => item.listingId === listingId ? { ...item, quantity: Math.min(100, quantity) } : item)),
    clear: () => setItems([]),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used inside CartProvider"); return context; }
