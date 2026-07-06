"use client";

import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';

export default function CarritoPage() {
  // Traemos el estado del carrito desde nuestro store global
  const cart = useCartStore((state) => state.cart);
  
  // Calculamos el precio total sumando (precio * cantidad) de cada producto
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <span>🛒</span> Tu Carrito en <span className="text-blue-500">Kitson Kit</span>
          </h1>
          <Link href="/" className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-md font-medium transition">
            ← Volver a la tienda
          </Link>
        </div>

        {/* VALIDACIÓN DE CARRITO VACÍO */}
        {cart.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-800 border-dashed">
            <span className="text-6xl block mb-4">💨</span>
            <p className="text-xl text-gray-400 mb-6">Tu carrito está completamente vacío.</p>
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition">
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LISTA DE PRODUCTOS (Ocupa 2 columnas en pantallas grandes) */}
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl p-2 bg-gray-700 rounded-lg">{item.emoji}</div>
                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-gray-400 text-sm">
                        ${item.price} c/u × {item.quantity}
                      </p>
                    </div>
                  </div>
                  
                  {/* Subtotal del producto */}
                  <div className="text-right">
                    <span className="text-xl font-black text-blue-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMEN DE LA COMPRA (Ocupa 1 columna) */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit space-y-6">
              <h2 className="text-xl font-bold border-b border-gray-700 pb-3">Resumen del Pedido</h2>
              
              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span>Productos:</span>
                  <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span className="text-green-400 font-medium">Digital (Instantáneo)</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-white">Total a pagar:</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-black text-lg tracking-wide transition shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5">
                Proceder al Pago
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}