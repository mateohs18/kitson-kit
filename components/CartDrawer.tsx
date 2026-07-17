"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { X, Trash2, ShoppingCart, Gamepad2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';

export default function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, removeFromCart, totalPrice } = useCartStore();
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  // Bloqueamos el scroll del fondo mientras el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const total = (totalPrice() * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Fondo oscuro */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      ></div>

      {/* Panel */}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#14110C] border-l border-white/10 z-[160] flex flex-col transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="font-display font-bold text-lg flex items-center gap-2"><ShoppingCart size={18} className="text-[#E3A23D]" /> Tu carrito</h3>
          <button onClick={closeDrawer} className="text-[#9A9384] hover:text-[#F5F1E6] p-1"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <Gamepad2 size={40} className="mx-auto text-[#3A3527] mb-3" />
              <p className="text-[#9A9384] text-sm font-medium">Tu carrito está vacío.</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemPrice = (item.price * item.quantity * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div key={item.id} className="flex items-center gap-3 bg-[#1D1913] border border-white/5 rounded-xl p-3">
                  <div className="w-14 h-14 rounded-lg bg-[#0A0806] shrink-0 overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                    ) : <Gamepad2 size={20} className="text-[#9A9384]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#F5F1E6] truncate">{item.name}</p>
                    <p className="text-xs text-[#9A9384]">Cantidad: {item.quantity}</p>
                    <p className="text-sm font-mono font-semibold text-[#E3A23D]">{activeCurrency.symbol}{itemPrice}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-[#5A554A] hover:text-red-400 p-1 shrink-0"><Trash2 size={16} /></button>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[#9A9384]">Subtotal</span>
              <span className="font-mono font-bold text-2xl text-[#E3A23D]">{activeCurrency.symbol}{total}</span>
            </div>
            <Link
              href="/carrito"
              onClick={closeDrawer}
              className="w-full bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] py-4 rounded-xl font-display font-bold text-base transition-all flex items-center justify-center gap-2"
            >
              Comprar ahora →
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
