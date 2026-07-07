"use client";
import { ShoppingCart, Trash2, ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCartStore();
  const { data: session } = useSession();
  
  // Evitamos errores de hidratación de Next.js al cargar el estado de Zustand
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // No renderizamos nada hasta que el componente esté montado en el cliente

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-orange-500 selection:text-white">
      
      {/* BARRA DE NAVEGACIÓN GLOBAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition group">
            <img 
              src="/logo.jpg" 
              alt="Kitson Kit Logo" 
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-transparent group-hover:border-orange-500 transition duration-300 object-cover"
            />
            <span className="text-2xl font-black tracking-tighter text-white">
              Kitson <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">Kit</span>
            </span>
          </Link>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white transition"
          >
            <span className="text-2xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
        
        <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-6 mt-6 md:mt-0 font-medium text-sm text-gray-400 w-full md:w-auto items-center`}>
          <Link href="/" className="hover:text-orange-400 transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-orange-400 transition">Tienda Fortnite</Link>
          <Link href="/#faq" className="hover:text-orange-400 transition">Soporte</Link>
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 py-2 px-5 rounded-full border border-orange-500/20 w-full md:w-auto justify-center">
            <span className="text-lg">🛒</span> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">
              {totalItems()}
            </span>
          </div>

          {session ? (
            <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 py-2 px-5 rounded-full border border-orange-500/20 ...">
              <ShoppingCart size={64} className="text-gray-700 mb-6" /> 
              <span className="bg-orange-500 ...">{totalItems()}</span>
            </div>
          ) : (
             <button onClick={() => signIn('discord')} className="bg-orange-500 hover:bg-orange-400 text-[#050505] w-full md:w-auto text-sm px-6 py-2.5 rounded-full font-black transition shadow-[0_0_15px_rgba(249,115,22,0.3)]">
               Iniciar Sesión
             </button>
          )}
        </div>
      </header>

      {/* CONTENIDO DEL CARRITO */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Tu Carrito</h1>
        
        {cart.length === 0 ? (
          // ESTADO: CARRITO VACÍO
          <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0A] border border-white/5 rounded-3xl mt-10">
            <div className="text-6xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-400 mb-8 max-w-md text-center">Parece que aún no has añadido ningún producto. Explora nuestro catálogo o la tienda de Fortnite para empezar.</p>
            <div className="flex gap-4">
              <Link href="/" className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-full font-bold transition border border-white/10">
                Ver Catálogo
              </Link>
              <Link href="/tienda-diaria" className="bg-orange-500 hover:bg-orange-400 text-[#050505] px-6 py-3 rounded-full font-bold transition shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                Tienda Fortnite
              </Link>
            </div>
          </div>
        ) : (
          // ESTADO: CARRITO CON PRODUCTOS
          <div className="flex flex-col lg:flex-row gap-10 mt-10">
            
            {/* Lista de Productos */}
            <div className="flex-1">
              <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
                <span className="text-gray-400 font-medium">{totalItems()} artículo(s)</span>
                <button 
                  onClick={clearCart}
                  className="text-sm font-bold text-red-500 hover:text-red-400 transition flex items-center gap-2"
                >
                  Vaciar carrito
                </button>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 bg-[#0A0A0A] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition group relative overflow-hidden">
                    
                    {/* Imagen del producto */}
                    <div className="w-full sm:w-24 h-24 bg-[#151515] rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{item.emoji || '🎮'}</span>
                      )}
                    </div>
                    
                    {/* Detalles */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-lg text-white mb-1 group-hover:text-orange-400 transition">{item.name}</h3>
                      <p className="text-gray-500 text-sm font-medium">Precio unitario: ${item.price.toFixed(2)} USD</p>
                    </div>

                    {/* Controles de Precio y Cantidad */}
                    <div className="flex items-center gap-6">
                      <div className="bg-[#151515] border border-white/10 px-4 py-2 rounded-lg font-bold text-gray-300">
                        x{item.quantity}
                      </div>
                      <div className="font-black text-xl w-24 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del Pedido (Sidebar derecho) */}
            <div className="w-full lg:w-96">
              <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl sticky top-28">
                <h2 className="text-2xl font-black mb-6">Resumen</h2>
                
                <div className="space-y-4 mb-6 text-sm font-medium text-gray-400 border-b border-white/10 pb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">${totalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos / Cargos</span>
                    <span className="text-green-400">Calculados en el pago</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-gray-300 font-bold">Total</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-orange-500">${totalPrice().toFixed(2)}</span>
                    <p className="text-xs text-gray-500 mt-1">USD</p>
                  </div>
                </div>

                {session ? (
                  <button 
                    onClick={() => alert("¡Próximamente conectaremos esto con Stripe!")}
                    className="w-full bg-orange-500 hover:bg-orange-400 text-[#050505] py-4 rounded-xl font-black text-lg transition shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02]"
                  >
                    Proceder al Pago
                  </button>
                ) : (
                  <button 
                    onClick={() => signIn('discord')}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 rounded-xl font-black transition flex items-center justify-center gap-3"
                  >
                    Inicia sesión con Discord
                  </button>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-green-500/20 text-green-500">🔒</span>
                  Pago 100% seguro y cifrado
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}