import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Definimos cómo luce un producto
export interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  emoji?: string;
  delivery_type?: 'regalo' | 'recarga';
}

// 2. Definimos cómo luce un ítem dentro del carrito (Producto + Cantidad)
export interface CartItem extends Product {
  quantity: number;
}

// 3. Definimos todo lo que nuestro carrito debe saber hacer (El Tipo / Interfaz)
interface CartState {
  cart: CartItem[];
  isDrawerOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

// 4. Creamos la "memoria" del carrito, guardada en localStorage con persist
// (si el usuario cierra la pestaña sin querer, al volver el carrito sigue ahí).
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      isDrawerOpen: false,

      addToCart: (product) => {
        set((state) => {
          const existingItem = state.cart.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
              isDrawerOpen: true,
            };
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }], isDrawerOpen: true };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

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
      name: 'kitson-cart', // clave en localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }), // no persistimos si el drawer estaba abierto
    }
  )
);