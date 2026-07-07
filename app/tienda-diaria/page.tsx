"use client";

import { useCartStore } from '../store/cartStore';
import Link from 'next/link';
import { ShoppingCart, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, totalPrice, totalItems } = useCartStore();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* NAVBAR UNIFICADA */}
      <nav className="flex items-center justify-between p-6 border-b border-white/5">
        <Link href="/" className="text-2xl font-black">Kitson <span className="text-orange-500">Kit</span></Link>
        <Link href="/carrito" className="bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full flex items-center gap-2">
          <ShoppingCart size={18} /> {totalItems()}
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6 mt-10">
        <h1 className="text-3xl font-black mb-8">Tu Carrito</h1>
        {cart.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <p className="text-gray-400 mb-4">Tu carrito está vacío</p>
            <Link href="/" className="text-orange-500 font-bold">Volver al inicio</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-orange-500">${item.price}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2"><Trash2 size={20}/></button>
              </div>
            ))}
            <div className="text-right mt-8 border-t border-white/5 pt-4">
              <p className="text-xl font-bold">Total: <span className="text-orange-500">${totalPrice().toFixed(2)}</span></p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}