import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// CARRITO DE LA TIENDA DE FORTNITE — completamente separado del carrito
// general (que usan los productos del catálogo con envío de código por
// correo). Este es exclusivo para artículos de la tienda diaria de Fortnite,
// con todo el flujo del bot: Epic ID, solicitud de amistad automática,
// entrega vía regalo, seguimiento de 48hs.
// ============================================================================

export interface FortniteItem {
  id: string;
  name: string;
  price: number; // USD, siempre real — la tienda diaria nunca tiene precio fijo por país
  image_url?: string;
  offer_id?: string | null;
  vbucks?: number;
}

export interface FortniteCartItem extends FortniteItem {
  quantity: number;
}

interface FortniteCartState {
  cart: FortniteCartItem[];
  isDrawerOpen: boolean;
  addToCart: (item: FortniteItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useFortniteCartStore = create<FortniteCartState>()(
  persist(
    (set, get) => ({
      cart: [],
      isDrawerOpen: false,

      addToCart: (item) => {
        set((state) => {
          const existente = state.cart.find((i) => i.id === item.id);
          if (existente) {
            return {
              cart: state.cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)),
              isDrawerOpen: true,
            };
          }
          return { cart: [...state.cart, { ...item, quantity: 1 }], isDrawerOpen: true };
        });
      },

      removeFromCart: (itemId) => {
        set((state) => ({ cart: state.cart.filter((i) => i.id !== itemId) }));
      },

      clearCart: () => set({ cart: [] }),

      totalPrice: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      totalItems: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    }),
    {
      name: 'kitson-fortnite-cart', // clave DISTINTA en localStorage — nunca se mezcla con el otro carrito
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
