import { create } from 'zustand';

// 1. Definimos cómo es un Producto
export interface Product {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

// 2. Definimos cómo es un ítem en el carrito (Producto + Cantidad)
export interface CartItem extends Product {
  quantity: number;
}

// 3. Definimos qué funciones tendrá nuestro cerebro (Store)
interface CartState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  totalItems: () => number;
}

// 4. Creamos el Store
export const useCartStore = create((set, get) => ({
  cart: [],
  
  // Función para añadir productos
  addToCart: (product) => set((state) => {
    // Revisamos si el producto ya está en el carrito
    const existingItem = state.cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Si existe, le sumamos 1 a la cantidad
      return {
        cart: state.cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    // Si no existe, lo agregamos con cantidad 1
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),

  // Función para contar cuántos ítems hay en total
  totalItems: () => get().cart.reduce((total, item) => total + item.quantity, 0),
}));