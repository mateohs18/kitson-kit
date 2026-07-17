"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, CheckCircle2, Clock, Package, Wallet, Plus, ExternalLink, Inbox, ShoppingBag, Pencil, Trash2, X, Gamepad2, Star, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Producto { id: string; name: string; price: number; compare_at_price?: number | null; image_url?: string; delivery_type: 'regalo' | 'recarga'; }

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [recargas, setRecargas] = useState<any[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [solicitudesAmistad, setSolicitudesAmistad] = useState<any[]>([]);
  const [marcandoAmistadEmail, setMarcandoAmistadEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para la recarga de saldo
  const [emailSaldo, setEmailSaldo] = useState("");
  const [montoSaldo, setMontoSaldo] = useState("");
  const [loadingSaldo, setLoadingSaldo] = useState(false);
  const [aprobandoId, setAprobandoId] = useState<string | null>(null);
  const [busquedaPedidos, setBusquedaPedidos] = useState("");

  // Estados para el formulario de productos (sirve tanto para crear como editar)
  const [editandoProducto, setEditandoProducto] = useState<Producto | null>(null);
  const [nombreProducto, setNombreProducto] = useState("");
  const [precioProducto, setPrecioProducto] = useState("");
  const [precioOriginalProducto, setPrecioOriginalProducto] = useState("");
  const [imagenProducto, setImagenProducto] = useState("");
  const [tipoEntregaProducto, setTipoEntregaProducto] = useState<'regalo' | 'recarga'>('regalo');
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false);

  // La verificación real de admin ya se hace en middleware.ts (servidor).
  // Este chequeo es solo para no mostrar el panel un instante mientras
  // carga la sesión, o si por algo se llega a esta ruta sin pasar por el middleware.
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    fetchTodasLasOrdenes();
    fetchRecargas();
    fetchProductos();
    fetchResenas();
    fetchSolicitudesAmistad();
  }, [session, status, router]);

  async function fetchTodasLasOrdenes() {
    const res = await fetch('/api/pedidos-admin');
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }

  async function fetchRecargas() {
    const res = await fetch('/api/recargas-admin');
    if (res.ok) {
      const data = await res.json();
      setRecargas(data.recargas);
    }
  }

  async function aprobarRecarga(id: string) {
    setAprobandoId(id);
    const res = await fetch('/api/aprobar-recarga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recargaId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchRecargas();
      alert(`✅ Recarga aprobada. Nuevo saldo: $${data.nuevoSaldo.toFixed(2)} USD.`);
    } else {
      alert("Error al aprobar: " + data.error);
    }
    setAprobandoId(null);
  }

  async function marcarComoEntregado(id: string) {
    const res = await fetch('/api/marcar-entregado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchTodasLasOrdenes();
      alert("¡Pedido entregado! El cliente recibirá su correo.");
    } else {
      alert("Error al actualizar: " + data.error);
    }
  }

  // NUEVA FUNCIÓN: Agregar Saldo
  async function agregarSaldo() {
    if (!emailSaldo || !montoSaldo) return alert("Por favor, llena el correo y el monto.");
    setLoadingSaldo(true);

    const res = await fetch('/api/agregar-saldo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailSaldo, montoSaldo }),
    });
    const data = await res.json();

    if (res.ok) {
      alert(`✅ ¡Recarga exitosa!\nEl nuevo saldo de ${emailSaldo} es de $${data.nuevoSaldo.toFixed(2)} USD.`);
      setEmailSaldo("");
      setMontoSaldo("");
    } else {
      alert("❌ " + data.error);
    }
    setLoadingSaldo(false);
  }

  const recargasPendientes = recargas.filter(r => r.status === 'PENDIENTE');

  async function marcarAmistadEnviada(id: string) {
    const res = await fetch('/api/marcar-amistad-enviada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchTodasLasOrdenes();
    } else {
      alert("Error: " + data.error);
    }
  }

  async function fetchResenas() {
    const res = await fetch('/api/resenas-admin');
    if (res.ok) {
      const data = await res.json();
      setResenas(data.reviews);
    }
  }

  async function fetchSolicitudesAmistad() {
    const res = await fetch('/api/solicitudes-amistad-admin');
    if (res.ok) {
      const data = await res.json();
      setSolicitudesAmistad(data.solicitudes);
    }
  }

  async function marcarAmistadDesdeAdmin(email: string) {
    setMarcandoAmistadEmail(email);
    const res = await fetch('/api/marcar-amistad-cuenta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchSolicitudesAmistad();
    } else {
      alert('❌ ' + data.error);
    }
    setMarcandoAmistadEmail(null);
  }

  async function eliminarResena(id: string) {
    if (!confirm("¿Eliminar esta reseña? No se puede deshacer.")) return;
    const res = await fetch('/api/eliminar-resena', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchResenas();
    } else {
      alert("❌ " + data.error);
    }
  }

  async function fetchProductos() {
    const res = await fetch('/api/productos-admin');
    if (res.ok) {
      const data = await res.json();
      setProductos(data.products);
    }
  }

  function abrirFormNuevoProducto() {
    setEditandoProducto(null);
    setNombreProducto("");
    setPrecioProducto("");
    setPrecioOriginalProducto("");
    setImagenProducto("");
    setTipoEntregaProducto('regalo');
    setMostrarFormProducto(true);
  }

  function abrirFormEditarProducto(p: Producto) {
    setEditandoProducto(p);
    setNombreProducto(p.name);
    setPrecioProducto(String(p.price));
    setPrecioOriginalProducto(p.compare_at_price ? String(p.compare_at_price) : "");
    setImagenProducto(p.image_url || "");
    setTipoEntregaProducto(p.delivery_type || 'regalo');
    setMostrarFormProducto(true);
  }

  async function guardarProducto() {
    if (!nombreProducto.trim() || !precioProducto) return alert("Completá el nombre y el precio.");
    setGuardandoProducto(true);

    const body = {
      name: nombreProducto.trim(),
      price: precioProducto,
      compare_at_price: precioOriginalProducto ? Number(precioOriginalProducto) : null,
      image_url: imagenProducto.trim(),
      delivery_type: tipoEntregaProducto,
    };
    const res = await fetch('/api/gestionar-producto', {
      method: editandoProducto ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editandoProducto ? { id: editandoProducto.id, ...body } : body),
    });
    const data = await res.json();

    if (res.ok) {
      setMostrarFormProducto(false);
      fetchProductos();
    } else {
      alert("❌ " + data.error);
    }
    setGuardandoProducto(false);
  }

  async function eliminarProducto(id: string) {
    if (!confirm("¿Seguro que querés eliminar este producto? Ya no va a aparecer en la tienda.")) return;
    const res = await fetch('/api/gestionar-producto', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchProductos();
    } else {
      alert("❌ " + data.error);
    }
  }

  if (loading) return <div className="min-h-screen bg-[#14110C] flex justify-center items-center"><Package className="animate-spin text-[#E3A23D]" size={48}/></div>;

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">

        <div className="flex items-center gap-4 border-b-4 border-[#0A0806] pb-6">
          <ShieldAlert size={40} className="text-[#E3A23D]" />
          <div>
            <h1 className="font-display text-4xl font-bold">Centro de Mando</h1>
            <p className="text-[#9A9384]">Acceso restringido: nivel administrador</p>
          </div>
        </div>

        {/* GESTOR DE BILLETERA */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Recargar billetera</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="email" placeholder="Correo del cliente (ej: gamer@gmail.com)"
              value={emailSaldo} onChange={(e) => setEmailSaldo(e.target.value)}
              className="flex-1 bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-4 py-3 focus:border-[#E3A23D] focus:outline-none text-[#F5F1E6] font-medium"
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384] font-black">$</span>
              <input
                type="number" placeholder="0.00"
                value={montoSaldo} onChange={(e) => setMontoSaldo(e.target.value)}
                className="w-full md:w-32 bg-[#14110C] border-2 border-[#0A0806] rounded-xl pl-8 pr-4 py-3 focus:border-[#E3A23D] focus:outline-none text-[#F5F1E6] font-bold"
              />
            </div>
            <button
              onClick={agregarSaldo} disabled={loadingSaldo}
              className="bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold flex items-center justify-center gap-2 border-[3px] border-[#0A0806] transition-transform hover:scale-[1.02]"
            >
              {loadingSaldo ? <Package className="animate-spin" size={20} /> : <Plus size={20} />}
              Añadir saldo
            </button>
          </div>
        </div>

        {/* SOLICITUDES DE AMISTAD PENDIENTES */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Solicitudes de amistad pendientes</h2>
            {solicitudesAmistad.length > 0 && (
              <span className="bg-[#E3A23D] text-[#0A0806] text-xs font-black px-2.5 py-1 rounded-full">{solicitudesAmistad.length}</span>
            )}
          </div>
          {solicitudesAmistad.length === 0 ? (
            <p className="text-[#9A9384] text-sm">No hay solicitudes esperando — al día.</p>
          ) : (
            <div className="space-y-3">
              {solicitudesAmistad.map((s) => (
                <div key={s.email} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
                  <div>
                    <p className="font-bold text-[#F5F1E6]">{s.name || s.email}</p>
                    <p className="text-sm text-[#9A9384]">Epic Games: <span className="font-mono text-[#4A93D6]">{s.epic_id}</span></p>
                  </div>
                  <button
                    onClick={() => marcarAmistadDesdeAdmin(s.email)}
                    disabled={marcandoAmistadEmail === s.email}
                    className="bg-[#4A93D6] hover:bg-[#5ba3e6] disabled:opacity-40 text-[#0C2438] px-4 py-2 rounded-lg font-display font-bold text-sm border-2 border-[#0A0806] transition-transform hover:scale-105"
                  >
                    {marcandoAmistadEmail === s.email ? 'Marcando...' : 'Ya le mandé la solicitud'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECARGAS PENDIENTES (automatizadas desde /billetera) */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Inbox className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Recargas pendientes</h2>
            {recargasPendientes.length > 0 && (
              <span className="bg-[#E3A23D] text-[#0A0806] text-xs font-black px-2.5 py-1 rounded-full">{recargasPendientes.length}</span>
            )}
          </div>
          {recargasPendientes.length === 0 ? (
            <p className="text-[#9A9384] text-sm">No hay solicitudes esperando aprobación por ahora.</p>
          ) : (
            <div className="space-y-3">
              {recargasPendientes.map((r) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
                  <div>
                    <p className="font-bold text-[#F5F1E6]">{r.user_email}</p>
                    <p className="text-sm text-[#9A9384]">Pide cargar <span className="font-mono text-[#E3A23D] font-semibold">${Number(r.amount).toFixed(2)}</span> USD{r.package_label ? <span className="text-[#4A93D6]"> — {r.package_label}</span> : null}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.receipt_url && (
                      <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-[#4A93D6] hover:underline">
                        Ver comprobante <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => aprobarRecarga(r.id)}
                      disabled={aprobandoId === r.id}
                      className="bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-4 py-2 rounded-lg font-display font-bold text-sm border-2 border-[#0A0806] transition-transform hover:scale-105"
                    >
                      {aprobandoId === r.id ? 'Aprobando...' : 'Aprobar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CATÁLOGO DE PRODUCTOS */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-[#E3A23D]" size={28} />
              <h2 className="font-display text-2xl font-bold">Catálogo (Ofertas Exclusivas)</h2>
            </div>
            <button
              onClick={abrirFormNuevoProducto}
              className="bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] px-4 py-2.5 rounded-lg font-display font-bold text-sm flex items-center gap-2 border-2 border-[#0A0806] transition-transform hover:scale-105"
            >
              <Plus size={18} /> Nuevo producto
            </button>
          </div>

          {mostrarFormProducto && (
            <div className="bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold">{editandoProducto ? 'Editar producto' : 'Nuevo producto'}</h3>
                <button onClick={() => setMostrarFormProducto(false)} className="text-[#9A9384] hover:text-[#F5F1E6]"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text" placeholder="Nombre del producto"
                  value={nombreProducto} onChange={(e) => setNombreProducto(e.target.value)}
                  className="bg-[#1D1913] border-2 border-[#0A0806] rounded-xl px-4 py-3 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D]"
                />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384] font-black">$</span>
                  <input
                    type="number" placeholder="Precio en USD"
                    value={precioProducto} onChange={(e) => setPrecioProducto(e.target.value)}
                    className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-xl pl-8 pr-4 py-3 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] font-mono"
                  />
                </div>
              </div>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384] font-black">$</span>
                <input
                  type="number" placeholder="Precio original (opcional, para mostrar descuento tachado)"
                  value={precioOriginalProducto} onChange={(e) => setPrecioOriginalProducto(e.target.value)}
                  className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-xl pl-8 pr-4 py-3 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] font-mono"
                />
              </div>
              <p className="text-xs text-[#9A9384] mb-4 -mt-2">Dejalo vacío si no hay descuento real. Si lo cargás, tiene que ser mayor al precio actual.</p>
              <input
                type="text" placeholder="URL de la imagen (opcional)"
                value={imagenProducto} onChange={(e) => setImagenProducto(e.target.value)}
                className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-xl px-4 py-3 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] mb-2"
              />
              <p className="text-xs text-[#9A9384] mb-4">Tiene que ser una URL que termine en .jpg, .png o .webp, subida a Supabase Storage o a otro sitio ya autorizado. Si usás un dominio nuevo, avisame para agregarlo.</p>

              <label className="block text-sm font-bold text-[#D9D4C7] mb-2">¿Cómo se entrega este producto?</label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button" onClick={() => setTipoEntregaProducto('regalo')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black border-2 border-[#0A0806] transition-colors ${tipoEntregaProducto === 'regalo' ? 'bg-[#E3A23D] text-[#0A0806]' : 'bg-[#1D1913] text-[#9A9384]'}`}
                >
                  🎁 Regalo (requiere 48hs si es nuevo)
                </button>
                <button
                  type="button" onClick={() => setTipoEntregaProducto('recarga')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black border-2 border-[#0A0806] transition-colors ${tipoEntregaProducto === 'recarga' ? 'bg-[#4A93D6] text-[#0C2438]' : 'bg-[#1D1913] text-[#9A9384]'}`}
                >
                  ⚡ Recarga directa
                </button>
              </div>
              <button
                onClick={guardarProducto} disabled={guardandoProducto}
                className="bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-6 py-2.5 rounded-lg font-display font-bold text-sm border-2 border-[#0A0806]"
              >
                {guardandoProducto ? 'Guardando...' : editandoProducto ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          )}

          {productos.length === 0 ? (
            <p className="text-[#9A9384] text-sm">Todavía no agregaste ningún producto al catálogo.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {productos.map((p) => (
                <div key={p.id} className="bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4 flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-[#1D1913] border-2 border-[#0A0806] shrink-0 flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : <Gamepad2 size={24} className="text-[#9A9384]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-mono text-[#E3A23D] font-semibold text-sm">${Number(p.price).toFixed(2)}</p>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${p.delivery_type === 'recarga' ? 'bg-[#4A93D6] text-[#0C2438]' : 'bg-[#E3A23D] text-[#0A0806]'}`}>
                        {p.delivery_type === 'recarga' ? 'Recarga' : 'Regalo'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => abrirFormEditarProducto(p)} className="text-[#4A93D6] hover:underline text-xs font-bold flex items-center gap-1"><Pencil size={12}/> Editar</button>
                      <button onClick={() => eliminarProducto(p.id)} className="text-red-400 hover:underline text-xs font-bold flex items-center gap-1"><Trash2 size={12}/> Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODERACIÓN DE RESEÑAS */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Star className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Reseñas publicadas</h2>
            <span className="text-[#9A9384] text-sm font-medium">({resenas.length})</span>
          </div>
          {resenas.length === 0 ? (
            <p className="text-[#9A9384] text-sm">Todavía no hay reseñas publicadas.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
              {resenas.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-4 bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm">{r.user_name}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < r.rating ? "text-[#E3A23D] fill-[#E3A23D]" : "text-[#3A3527]"} />)}
                      </div>
                    </div>
                    <p className="text-sm text-[#9A9384]">{r.comment}</p>
                  </div>
                  <button onClick={() => eliminarResena(r.id)} className="shrink-0 text-red-400 hover:underline text-xs font-bold flex items-center gap-1">
                    <Trash2 size={12}/> Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PEDIDOS */}
        <div className="kk-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b-2 border-[#0A0806]">
            <input
              type="text" placeholder="Buscar por correo del cliente o estado..."
              value={busquedaPedidos} onChange={(e) => setBusquedaPedidos(e.target.value)}
              className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-4 py-2.5 text-sm text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D]"
            />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-[#14110C] border-b-2 border-[#0A0806] text-[#9A9384] text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4">ID pedido</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Regalo (48hs)</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders
                .filter(order => {
                  const q = busquedaPedidos.toLowerCase();
                  return !q || order.user_email?.toLowerCase().includes(q) || order.status?.toLowerCase().includes(q);
                })
                .map(order => {
                const isDelivered = order.status?.toUpperCase().includes('ENTREGAD');
                const tieneRegalos = Array.isArray(order.items) && order.items.some((it: any) => it.delivery_type === 'regalo');
                return (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-[#9A9384]">{order.id.slice(0,8)}...</td>
                    <td className="p-4 font-bold">{order.user_email}</td>
                    <td className="p-4 font-mono font-semibold text-[#E3A23D]">${order.total_price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-fit border ${isDelivered ? 'bg-[#7BC77E]/10 text-[#7BC77E] border-[#7BC77E]/30' : 'bg-[#E3A23D]/10 text-[#E3A23D] border-[#E3A23D]/30'}`}>
                        {isDelivered ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {!tieneRegalos ? (
                        <span className="text-[#5A554A] text-xs">—</span>
                      ) : order.friend_request_sent_at ? (
                        <span className="text-[#7BC77E] text-xs font-bold">✓ Enviada</span>
                      ) : (
                        <button onClick={() => marcarAmistadEnviada(order.id)} className="bg-[#4A93D6] hover:bg-[#5ba3e6] text-[#0C2438] px-3 py-1.5 rounded-lg font-display font-bold text-xs border-2 border-[#0A0806]">
                          Marcar enviada
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!isDelivered ? (
                        <button onClick={() => marcarComoEntregado(order.id)} className="bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] px-4 py-2 rounded-lg font-display font-bold text-sm border-2 border-[#0A0806] transition-transform hover:scale-105">
                          Entregar
                        </button>
                      ) : (
                        <span className="text-[#5A554A] font-bold text-sm">Completado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </div>
  );
}
