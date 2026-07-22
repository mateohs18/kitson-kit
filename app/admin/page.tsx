"use client";

import { useEffect, useState, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, CheckCircle2, Clock, Package, Wallet, Plus, ExternalLink, Inbox, ShoppingBag, Pencil, Trash2, X, Gamepad2, Star, UserPlus, DollarSign, Gift, Ticket, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Producto { id: string; name: string; price: number; compare_at_price?: number | null; image_url?: string; delivery_type: 'regalo' | 'recarga'; price_mx?: number | null; price_co?: number | null; price_pe?: number | null; }

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [recargas, setRecargas] = useState<any[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [solicitudesAmistad, setSolicitudesAmistad] = useState<any[]>([]);
  const [tasas, setTasas] = useState<{ MX: string; CO: string; PE: string }>({ MX: '', CO: '', PE: '' });
  const [guardandoTasa, setGuardandoTasa] = useState<string | null>(null);
  const [margenTienda, setMargenTienda] = useState('');
  const [guardandoMargen, setGuardandoMargen] = useState(false);
  const [cupones, setCupones] = useState<any[]>([]);
  const [cCodigo, setCCodigo] = useState('');
  const [cTipo, setCTipo] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [cValor, setCValor] = useState('');
  const [cUsosMax, setCUsosMax] = useState('');
  const [cMinTotal, setCMinTotal] = useState('');
  const [cExpira, setCExpira] = useState('');
  const [guardandoCupon, setGuardandoCupon] = useState(false);
  const [procesandoCupon, setProcesandoCupon] = useState<string | null>(null);
  const [refCfg, setRefCfg] = useState<{ recompensaReferidor: string; recompensaReferido: string; compraMinima: string }>({ recompensaReferidor: '', recompensaReferido: '', compraMinima: '' });
  const [guardandoRef, setGuardandoRef] = useState(false);
  const [marcandoAmistadEmail, setMarcandoAmistadEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para la recarga de saldo
  const [emailSaldo, setEmailSaldo] = useState("");
  const [montoSaldo, setMontoSaldo] = useState("");
  const [loadingSaldo, setLoadingSaldo] = useState(false);
  const [aprobandoId, setAprobandoId] = useState<string | null>(null);
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);

  // Estados para el formulario de productos (sirve tanto para crear como editar)
  const [editandoProducto, setEditandoProducto] = useState<Producto | null>(null);
  const [nombreProducto, setNombreProducto] = useState("");
  const [precioProducto, setPrecioProducto] = useState("");
  const [precioOriginalProducto, setPrecioOriginalProducto] = useState("");
  const [precioMX, setPrecioMX] = useState("");
  const [precioCO, setPrecioCO] = useState("");
  const [precioPE, setPrecioPE] = useState("");
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
    fetchTasas();
    fetchMargen();
    fetchCupones();
    fetchConfigReferidos();
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

  async function fetchTasas() {
    const res = await fetch('/api/tasas-cambio');
    if (res.ok) {
      const data = await res.json();
      setTasas({
        MX: data.rates?.MX ? String(data.rates.MX) : '',
        CO: data.rates?.CO ? String(data.rates.CO) : '',
        PE: data.rates?.PE ? String(data.rates.PE) : '',
      });
    }
  }

  async function guardarTasa(pais: 'MX' | 'CO' | 'PE') {
    if (!tasas[pais] || Number(tasas[pais]) <= 0) return alert('Ingresá una tasa válida.');
    setGuardandoTasa(pais);
    const res = await fetch('/api/actualizar-tasa-cambio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: pais, rate: tasas[pais] }),
    });
    const data = await res.json();
    if (!res.ok) alert('❌ ' + data.error);
    setGuardandoTasa(null);
  }

  async function fetchMargen() {
    const res = await fetch('/api/actualizar-margen');
    if (res.ok) {
      const data = await res.json();
      setMargenTienda(String(data.margen ?? 0));
    }
  }

  async function guardarMargen() {
    const m = Number(margenTienda);
    if (!Number.isFinite(m) || m < 0 || m > 500) return alert('Ingresá un margen entre 0 y 500 (%).');
    setGuardandoMargen(true);
    const res = await fetch('/api/actualizar-margen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ margen: m }),
    });
    const data = await res.json();
    if (!res.ok) alert('❌ ' + data.error);
    else alert(`✅ Margen actualizado: los ítems de la tienda diaria ahora se venden a costo + ${m}%.`);
    setGuardandoMargen(false);
  }

  async function fetchConfigReferidos() {
    const res = await fetch('/api/config-referidos');
    if (res.ok) {
      const d = await res.json();
      setRefCfg({
        recompensaReferidor: String(d.recompensaReferidor ?? 0),
        recompensaReferido: String(d.recompensaReferido ?? 0),
        compraMinima: String(d.compraMinima ?? 0),
      });
    }
  }

  async function guardarConfigReferidos() {
    const vals = [refCfg.recompensaReferidor, refCfg.recompensaReferido, refCfg.compraMinima].map(Number);
    if (vals.some((v) => !Number.isFinite(v) || v < 0)) return alert('Todos los valores deben ser números válidos (0 o más).');
    setGuardandoRef(true);
    const res = await fetch('/api/config-referidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recompensaReferidor: vals[0],
        recompensaReferido: vals[1],
        compraMinima: vals[2],
      }),
    });
    const data = await res.json();
    if (!res.ok) alert('❌ ' + data.error);
    else alert('✅ Programa de referidos actualizado.');
    setGuardandoRef(false);
  }

  async function fetchCupones() {
    const res = await fetch('/api/gestionar-cupon');
    if (res.ok) {
      const data = await res.json();
      setCupones(data.cupones || []);
    }
  }

  async function guardarCupon() {
    if (!cCodigo.trim() || cCodigo.trim().length < 3) return alert('El código necesita al menos 3 caracteres.');
    const v = Number(cValor);
    if (!Number.isFinite(v) || v <= 0 || (cTipo === 'porcentaje' && v > 100)) {
      return alert(cTipo === 'porcentaje' ? 'El porcentaje debe ser entre 1 y 100.' : 'El monto debe ser mayor a 0.');
    }
    setGuardandoCupon(true);
    const res = await fetch('/api/gestionar-cupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cCodigo.trim(),
        tipo: cTipo,
        valor: v,
        usos_maximos: cUsosMax.trim() ? Number(cUsosMax) : null,
        min_total: cMinTotal.trim() ? Number(cMinTotal) : 0,
        expira_at: cExpira ? new Date(cExpira).toISOString() : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) alert('❌ ' + data.error);
    else {
      setCCodigo(''); setCValor(''); setCUsosMax(''); setCMinTotal(''); setCExpira('');
      fetchCupones();
    }
    setGuardandoCupon(false);
  }

  async function alternarCupon(cupon: any) {
    setProcesandoCupon(cupon.code);
    await fetch('/api/gestionar-cupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cupon, activo: !cupon.activo }),
    });
    await fetchCupones();
    setProcesandoCupon(null);
  }

  async function borrarCupon(code: string) {
    if (!confirm(`¿Eliminar el cupón ${code}? Esta acción no se puede deshacer.`)) return;
    setProcesandoCupon(code);
    await fetch('/api/gestionar-cupon', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    await fetchCupones();
    setProcesandoCupon(null);
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
    setPrecioMX("");
    setPrecioCO("");
    setPrecioPE("");
    setImagenProducto("");
    setTipoEntregaProducto('regalo');
    setMostrarFormProducto(true);
  }

  function abrirFormEditarProducto(p: Producto) {
    setEditandoProducto(p);
    setNombreProducto(p.name);
    setPrecioProducto(String(p.price));
    setPrecioOriginalProducto(p.compare_at_price ? String(p.compare_at_price) : "");
    setPrecioMX(p.price_mx ? String(p.price_mx) : "");
    setPrecioCO(p.price_co ? String(p.price_co) : "");
    setPrecioPE(p.price_pe ? String(p.price_pe) : "");
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
      price_mx: precioMX ? Number(precioMX) : null,
      price_co: precioCO ? Number(precioCO) : null,
      price_pe: precioPE ? Number(precioPE) : null,
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

        {/* TASAS DE CAMBIO */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Tasas de cambio</h2>
          </div>
          <p className="text-[#9A9384] text-sm mb-6">Los precios de los productos siempre se cargan en dólares (USD) y no cambian. Esto solo define a cuántos pesos/soles equivale cada dólar hoy — actualizalo cuando cambie el valor real.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { code: 'MX' as const, label: '🇲🇽 México (MXN)', hint: '1 USD =' },
              { code: 'CO' as const, label: '🇨🇴 Colombia (COP)', hint: '1 USD =' },
              { code: 'PE' as const, label: '🇵🇪 Perú (PEN)', hint: '1 USD =' },
            ]).map((p) => (
              <div key={p.code} className="bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
                <p className="text-sm font-bold text-[#D9D4C7] mb-2">{p.label}</p>
                <div className="flex gap-2">
                  <input
                    type="number" step="0.01" placeholder={p.hint}
                    value={tasas[p.code]}
                    onChange={(e) => setTasas((t) => ({ ...t, [p.code]: e.target.value }))}
                    className="flex-1 bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]"
                  />
                  <button
                    onClick={() => guardarTasa(p.code)}
                    disabled={guardandoTasa === p.code}
                    className="bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-4 rounded-lg font-display font-bold text-xs border-2 border-[#0A0806]"
                  >
                    {guardandoTasa === p.code ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MARGEN TIENDA DIARIA */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Margen de la tienda diaria</h2>
          </div>
          <p className="text-[#9A9384] text-sm mb-6">Cuánto cobrás por encima del costo (pavos ÷ 100) en los ítems de la Tienda Diaria de Fortnite. Con 0% vendés a costo; con 15%, un ítem de $10 se vende a $11.50. Se aplica al instante en la tienda y en el checkout, sin redesplegar.</p>
          <div className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <input
                type="number" step="1" min="0" max="500" placeholder="0"
                value={margenTienda}
                onChange={(e) => setMargenTienda(e.target.value)}
                className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D] pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9384] text-sm font-bold">%</span>
            </div>
            <button
              onClick={guardarMargen}
              disabled={guardandoMargen}
              className="bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-4 rounded-lg font-display font-bold text-xs border-2 border-[#0A0806]"
            >
              {guardandoMargen ? '...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* PROGRAMA DE REFERIDOS */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Programa de referidos</h2>
          </div>
          <p className="text-[#9A9384] text-sm mb-6">Cada cliente tiene su link para invitar (lo ve en Mi Cuenta). Cuando su invitado hace la primera compra y se entrega, ambos reciben crédito en la billetera. Poné ambas recompensas en 0 para desactivar el programa (la tarjeta desaparece de Mi Cuenta).</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { key: 'recompensaReferidor' as const, label: '💰 Recompensa al que invita (USD)' },
              { key: 'recompensaReferido' as const, label: '🎁 Recompensa al invitado (USD)' },
              { key: 'compraMinima' as const, label: '🛒 Compra mínima del invitado (USD)' },
            ]).map((f) => (
              <div key={f.key} className="bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
                <p className="text-sm font-bold text-[#D9D4C7] mb-2">{f.label}</p>
                <input
                  type="number" step="0.01" min="0"
                  value={refCfg[f.key]}
                  onChange={(e) => setRefCfg((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]"
                />
              </div>
            ))}
          </div>
          <button
            onClick={guardarConfigReferidos}
            disabled={guardandoRef}
            className="mt-4 bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-6 py-2.5 rounded-lg font-display font-bold text-sm border-2 border-[#0A0806]"
          >
            {guardandoRef ? 'Guardando...' : 'Guardar cambios'}
          </button>
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

              <label className="block text-sm font-bold text-[#D9D4C7] mb-2">Precio fijo por país (opcional)</label>
              <p className="text-xs text-[#9A9384] mb-3">Si lo dejás vacío, ese país ve el precio en USD convertido automáticamente con la tasa de cambio. Si le ponés un número acá, ve ESE precio exacto (útil para redondear, ej. $99 en vez de $87.32).</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9384] mb-1">🇲🇽 MXN</label>
                  <input
                    type="number" placeholder="Auto"
                    value={precioMX} onChange={(e) => setPrecioMX(e.target.value)}
                    className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-2 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9384] mb-1">🇨🇴 COP</label>
                  <input
                    type="number" placeholder="Auto"
                    value={precioCO} onChange={(e) => setPrecioCO(e.target.value)}
                    className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-2 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9384] mb-1">🇵🇪 PEN</label>
                  <input
                    type="number" placeholder="Auto"
                    value={precioPE} onChange={(e) => setPrecioPE(e.target.value)}
                    className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-2 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]"
                  />
                </div>
              </div>
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
                  <Gift size={13} className="inline mr-1" /> Regalo (requiere 48hs si es nuevo)
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

        {/* CUPONES DE DESCUENTO */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Ticket className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Cupones de descuento</h2>
            <span className="text-[#9A9384] text-sm font-medium">({cupones.length})</span>
          </div>
          <p className="text-[#9A9384] text-sm mb-6">Creá códigos para promos en Discord, TikTok o para recuperar clientes. El límite de usos se respeta aunque haya compras simultáneas.</p>

          {/* Formulario de creación */}
          <div className="bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#9A9384] mb-1.5">Código</label>
                <input type="text" placeholder="BIENVENIDO10" value={cCodigo}
                  onChange={(e) => setCCodigo(e.target.value.toUpperCase())}
                  className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-[#E3A23D]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9A9384] mb-1.5">Tipo de descuento</label>
                <div className="flex gap-1.5 bg-[#1D1913] p-1 rounded-lg border-2 border-[#0A0806]">
                  <button onClick={() => setCTipo('porcentaje')} className={`flex-1 py-1.5 rounded-md text-xs font-black transition ${cTipo === 'porcentaje' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384]'}`}>Porcentaje %</button>
                  <button onClick={() => setCTipo('fijo')} className={`flex-1 py-1.5 rounded-md text-xs font-black transition ${cTipo === 'fijo' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384]'}`}>Monto USD</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9A9384] mb-1.5">{cTipo === 'porcentaje' ? 'Descuento (%)' : 'Descuento (USD)'}</label>
                <input type="number" step="0.01" placeholder={cTipo === 'porcentaje' ? '10' : '2.00'} value={cValor}
                  onChange={(e) => setCValor(e.target.value)}
                  className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9A9384] mb-1.5">Límite de usos <span className="font-normal">(vacío = ilimitado)</span></label>
                <input type="number" step="1" min="1" placeholder="100" value={cUsosMax}
                  onChange={(e) => setCUsosMax(e.target.value)}
                  className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9A9384] mb-1.5">Compra mínima USD <span className="font-normal">(vacío = sin mínimo)</span></label>
                <input type="number" step="0.01" min="0" placeholder="5.00" value={cMinTotal}
                  onChange={(e) => setCMinTotal(e.target.value)}
                  className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9A9384] mb-1.5">Vence el <span className="font-normal">(vacío = no vence)</span></label>
                <input type="date" value={cExpira}
                  onChange={(e) => setCExpira(e.target.value)}
                  className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#E3A23D]" />
              </div>
            </div>
            <button
              onClick={guardarCupon}
              disabled={guardandoCupon}
              className="mt-4 bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-6 py-2.5 rounded-lg font-display font-bold text-sm border-2 border-[#0A0806] flex items-center gap-2"
            >
              <Plus size={16} /> {guardandoCupon ? 'Guardando...' : 'Crear cupón'}
            </button>
          </div>

          {/* Lista de cupones */}
          {cupones.length === 0 ? (
            <p className="text-[#9A9384] text-sm">Todavía no creaste ningún cupón.</p>
          ) : (
            <div className="space-y-3">
              {cupones.map((c) => {
                const vencido = c.expira_at && new Date(c.expira_at) < new Date();
                const agotado = c.usos_maximos !== null && c.usos >= c.usos_maximos;
                return (
                  <div key={c.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono font-bold text-[#E3A23D]">{c.code}</p>
                        {!c.activo && <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">DESACTIVADO</span>}
                        {vencido && <span className="bg-[#9A9384]/20 text-[#9A9384] text-[10px] font-black px-2 py-0.5 rounded-full">VENCIDO</span>}
                        {agotado && <span className="bg-[#9A9384]/20 text-[#9A9384] text-[10px] font-black px-2 py-0.5 rounded-full">AGOTADO</span>}
                      </div>
                      <p className="text-sm text-[#9A9384] mt-1">
                        {c.tipo === 'porcentaje' ? `${c.valor}% de descuento` : `$${Number(c.valor).toFixed(2)} USD de descuento`}
                        {Number(c.min_total) > 0 && ` · mínimo $${Number(c.min_total).toFixed(2)}`}
                        {' · '}usos: {c.usos}{c.usos_maximos !== null ? ` / ${c.usos_maximos}` : ' (ilimitado)'}
                        {c.expira_at && ` · vence ${new Date(c.expira_at).toLocaleDateString('es-AR')}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => alternarCupon(c)}
                        disabled={procesandoCupon === c.code}
                        className={`px-4 py-2 rounded-lg font-display font-bold text-xs border-2 border-[#0A0806] transition disabled:opacity-40 ${c.activo ? 'bg-[#1D1913] text-[#9A9384] hover:text-[#F5F1E6]' : 'bg-[#7BC77E] text-[#0A0806] hover:opacity-90'}`}
                      >
                        {procesandoCupon === c.code ? '...' : c.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => borrarCupon(c.code)}
                        disabled={procesandoCupon === c.code}
                        className="bg-red-500/20 hover:bg-red-500/30 disabled:opacity-40 text-red-400 px-3 py-2 rounded-lg border-2 border-[#0A0806]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
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
                    {r.image_url && (
                      <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                        <img src={r.image_url} alt="Foto adjunta" className="h-16 w-16 object-cover rounded-lg border-2 border-[#0A0806]" />
                      </a>
                    )}
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
                <th className="p-4">Artículos</th>
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
                const expandido = pedidoExpandido === order.id;
                return (
                  <Fragment key={order.id}>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-[#9A9384]">{order.id.slice(0,8)}...</td>
                    <td className="p-4 font-bold">{order.user_email}</td>
                    <td className="p-4">
                      <button onClick={() => setPedidoExpandido(expandido ? null : order.id)} className="text-[#4A93D6] hover:underline text-xs font-bold">
                        {Array.isArray(order.items) ? order.items.length : 0} ítem(s) {expandido ? '▲' : '▼'}
                      </button>
                    </td>
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
                  {expandido && Array.isArray(order.items) && (
                    <tr key={`${order.id}-detalle`} className="bg-[#14110C]">
                      <td colSpan={7} className="p-4">
                        <div className="space-y-2">
                          {order.items.map((it: any, idx: number) => (
                            <div key={idx} className="flex flex-wrap items-center gap-3 text-xs bg-[#1D1913] border border-[#0A0806] rounded-lg px-3 py-2">
                              <span className="font-bold text-[#F5F1E6]">{it.name}</span>
                              {it.vbucks && <span className="text-[#E3A23D] font-mono">🪙 {Number(it.vbucks).toLocaleString('en-US')} pavos</span>}
                              {it.offer_id && <span className="text-[#9A9384] font-mono truncate max-w-xs" title={it.offer_id}>ID: {it.offer_id}</span>}
                              {it.delivery_type && <span className="text-[#4A93D6] inline-flex items-center gap-1">{it.delivery_type === 'recarga' ? '⚡ Recarga' : <><Gift size={11} /> Regalo</>}</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
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
