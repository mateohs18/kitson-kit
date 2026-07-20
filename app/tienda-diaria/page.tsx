"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { signIn, useSession } from 'next-auth/react';
import { ShoppingCart, Menu, X, Gamepad2, List, Search, ArrowUp, Eye, ChevronLeft, Calendar } from 'lucide-react';

const rarityMeta: Record<string, { label: string; className: string }> = {
  legendary: { label: 'Legendario', className: 'bg-[#E3A23D] text-[#0A0806]' },
  epic: { label: 'Épico', className: 'bg-[#4A93D6] text-[#0C2438]' },
  rare: { label: 'Raro', className: 'bg-[#6B7D91] text-[#F5F1E6]' },
  uncommon: { label: 'Poco común', className: 'bg-[#6FA85A] text-[#0A0806]' },
  marvel: { label: 'Marvel', className: 'bg-[#C24A3D] text-[#F5F1E6]' },
  starwars: { label: 'Star Wars', className: 'bg-[#3B5B8C] text-[#F5F1E6]' },
  icon: { label: 'Icónico', className: 'bg-[#4BA89A] text-[#0A0806]' },
};
const defaultRarity = { label: 'Común', className: 'bg-[#5A554A] text-[#F5F1E6]' };

const typeLabels: Record<string, string> = {
  outfit: 'Skins', emote: 'Emotes', pickaxe: 'Picos', glider: 'Planeadores',
  wrap: 'Envolturas', backpack: 'Mochilas', music: 'Música', car: 'Vehículos',
  instrument: 'Instrumentos', lego: 'LEGO', bundle: 'Lotes',
};

// Extrae toda la info relevante de una entrada de la tienda una sola vez,
// para no repetir la misma lógica en el filtro y en la tarjeta.
function getEntryMeta(entry: any) {
  const safeItems = [...(entry.brItems || []), ...(entry.tracks || []), ...(entry.instruments || []), ...(entry.cars || []), ...(entry.legoKits || []), ...(entry.items || [])];
  const isBundle = !!entry.bundle;
  const mainItem = safeItems.find((i: any) => i.type?.value === 'outfit') || safeItems[0] || {};

  let name = '';
  let rarityValue = 'common';
  if (isBundle) {
    name = entry.bundle?.name || 'Lote';
    rarityValue = mainItem?.rarity?.value || 'epic';
  } else {
    name = mainItem?.name || mainItem?.title || 'Cosmético';
    rarityValue = mainItem?.rarity?.value || 'common';
  }

  const displayImage =
    entry.bundle?.image ||
    entry.newDisplayAsset?.materialInstances?.[0]?.images?.OfferImage ||
    mainItem?.images?.featured ||
    mainItem?.images?.icon ||
    mainItem?.images?.large ||
    mainItem?.albumArt ||
    mainItem?.image ||
    '';

  const typeValue = isBundle ? 'bundle' : (mainItem?.type?.value || 'other');

  // Variantes de estilo con imagen propia (ej: Default, Camuflaje, Festiva...).
  // Tomamos el primer grupo de variantes que tenga al menos 2 opciones con imagen.
  const styleVariants: { tag: string; name: string; image: string }[] =
    (mainItem?.variants || []).find((v: any) => (v.options || []).filter((o: any) => o.image).length > 1)?.options?.filter((o: any) => o.image) || [];

  // Todas las imágenes de presentación que trae la entrada (varios ángulos/versiones),
  // para armar el carrusel que rota solo. Si no hay más de una, usamos solo displayImage.
  const renderImages: string[] = (entry.newDisplayAsset?.renderImages || [])
    .map((r: any) => r.image)
    .filter(Boolean);
  const carouselImages = renderImages.length > 1 ? renderImages : [displayImage];

  const description = isBundle ? (entry.offerTag?.text?.replace(/<[^>]+>/g, '') || '') : (mainItem?.description || '');

  // Descuento real de Epic Games (no inventado): a veces regularPrice > finalPrice de verdad.
  const hasRealDiscount = typeof entry.regularPrice === 'number' && entry.regularPrice > entry.finalPrice;

  // Cada objeto individual dentro de un lote, con su propia imagen y rareza,
  // para poder mostrarlos por separado en la vista rápida.
  const subItems = safeItems.map((it: any) => ({
    name: it.name || it.title || 'Objeto',
    description: it.description || '',
    image: it.images?.featured || it.images?.icon || it.images?.large || it.albumArt || it.image || '',
    rarityValue: it.rarity?.value || 'common',
    typeLabel: it.type?.displayValue || '',
  })).filter((it: any) => it.image);

  return {
    name, rarityValue, displayImage, typeValue, isBundle, itemCount: safeItems.length, mainItem,
    styleVariants, carouselImages, description, hasRealDiscount, subItems,
  };
}

const rarityHex: Record<string, string> = {
  legendary: '#E3A23D', epic: '#4A93D6', rare: '#6B7D91', uncommon: '#6FA85A',
  marvel: '#C24A3D', starwars: '#3B5B8C', icon: '#4BA89A',
};
const defaultRarityHex = '#5A554A';

const FortniteItemCard = ({ entry, activeCurrency, addToCart, featured = false, onQuickView }: { entry: any, activeCurrency: any, addToCart: any, featured?: boolean, onQuickView: (entry: any) => void }) => {
  const { name, rarityValue, displayImage, isBundle, itemCount, carouselImages, hasRealDiscount, description } = getEntryMeta(entry);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Rota sola entre las imágenes disponibles, si hay más de una.
  useEffect(() => {
    if (carouselImages.length < 2) return;
    const t = setInterval(() => setCarouselIndex((i) => (i + 1) % carouselImages.length), 3200);
    return () => clearInterval(t);
  }, [carouselImages.length]);

  if (!name || !displayImage) return null;

  const imagenMostrada = carouselImages[carouselIndex];

  const rarity = rarityMeta[rarityValue.toLowerCase()] || defaultRarity;
  const colorRareza = rarityHex[rarityValue.toLowerCase()] || defaultRarityHex;
  const baseUsdPrice = entry.finalPrice / 100;
  const localPrice = (baseUsdPrice * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const regularUsdPrice = entry.regularPrice / 100;
  const regularLocalPrice = (regularUsdPrice * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Precio real en pavos, tal como lo da la API (esto NO es lo que le cobrás al
  // cliente — eso lo sigue definiendo baseUsdPrice de arriba — es solo para que
  // vos como admin sepas cuántos pavos vale el objeto a la hora de entregarlo).
  const vbucksPrice = entry.finalPrice;
  // ID determinístico: si la API no trae offerId, usamos nombre+precio para que
  // el mismo objeto siempre genere el mismo ID (y así se agrupe con quantity: 2
  // en vez de duplicarse como dos líneas distintas en el carrito).
  const itemId = entry.offerId || encodeURIComponent(`${name}-${baseUsdPrice}`);
  const itemPayload = { id: itemId, name, price: baseUsdPrice, image_url: imagenMostrada, offer_id: entry.offerId || null, vbucks: vbucksPrice };

  return (
    <div
      className={`group kk-panel kk-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col ${featured ? 'md:flex-row' : ''}`}
      onClick={() => onQuickView(entry)}
    >
      <div className={`relative w-full flex items-center justify-center overflow-hidden bg-[#14110C] ${featured ? 'md:w-1/2 aspect-[4/5] md:aspect-auto' : 'aspect-[4/5]'}`}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: featured ? `linear-gradient(160deg, ${colorRareza}55, #14110C 75%)` : `radial-gradient(circle at 50% 55%, ${colorRareza}33, transparent 65%)` }}
        ></div>
        {featured && <div className="absolute inset-0 kk-dots opacity-[0.06] pointer-events-none"></div>}
        <div className={`absolute top-0 left-0 z-10 flex items-center justify-between px-3 py-1.5 border-b-[3px] border-r-[3px] border-[#0A0806] rounded-br-xl ${rarity.className}`}>
          <span className="font-display font-bold text-[10px] uppercase tracking-wide">{isBundle ? `Lote · ${itemCount} objetos` : rarity.label}</span>
        </div>
        <Image
          src={imagenMostrada}
          alt={name}
          fill
          sizes={featured ? "(max-width: 768px) 100vw, 55vw" : "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"}
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />
        {carouselImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[2] flex gap-1">
            {carouselImages.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === carouselIndex ? 'w-4 bg-[#E3A23D]' : 'w-1.5 bg-white/40'}`}></span>
            ))}
          </div>
        )}
        <div className="absolute top-2 right-2 z-[2] flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickView(entry); }}
            className="bg-[#0A0806]/80 hover:bg-[#0A0806] text-[#F5F1E6] p-2.5 rounded-full border-2 border-[#0A0806] transition-transform hover:scale-110 flex items-center justify-center"
            title="Vista rápida"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(itemPayload);
            }}
            className="bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] p-2.5 rounded-full border-2 border-[#0A0806] transition-transform hover:scale-110 flex items-center justify-center"
            title="Añadir al carrito"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>

      <div className={`p-4 flex flex-col justify-center ${featured ? 'md:w-1/2' : ''}`}>
        <h3 className={`font-bold text-[#F5F1E6] leading-tight mb-2 ${featured ? 'font-display text-2xl' : 'text-sm truncate'}`}>{name}</h3>
        {featured && !isBundle && (
          <span className={`inline-block w-fit text-[10px] font-display font-bold uppercase tracking-wide px-2 py-1 rounded mb-3 ${rarity.className}`}>{rarity.label}</span>
        )}
        {featured && description && (
          <p className="text-sm text-[#9A9384] leading-relaxed mb-3 line-clamp-3">{description}</p>
        )}
        {hasRealDiscount && (
          <span className="text-[#5A554A] font-mono text-xs line-through mr-1">{activeCurrency.symbol}{regularLocalPrice}</span>
        )}
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-[#E3A23D] font-mono font-semibold ${featured ? 'text-3xl' : 'text-lg'}`}>{activeCurrency.symbol}{localPrice}</span>
          <span className="text-[#9A9384] text-[10px] font-bold uppercase">{activeCurrency.currency}</span>
        </div>
        <div className="flex items-center gap-1 text-[#9A9384] text-[10px] font-mono">
          <span>🪙</span> {vbucksPrice.toLocaleString('en-US')} pavos
        </div>
        {featured && entry.offerId && (
          <p className="text-[9px] font-mono text-[#5A554A] mt-2 truncate" title={entry.offerId}>ID: {entry.offerId}</p>
        )}
      </div>
    </div>
  );
};

const QuickViewModal = ({ entry, activeCurrency, addToCart, onClose }: { entry: any; activeCurrency: any; addToCart: any; onClose: () => void }) => {
  const meta = getEntryMeta(entry);
  const [subIndex, setSubIndex] = useState<number | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const viendoSubItem = subIndex !== null && meta.subItems[subIndex];
  const imagenesActuales = viendoSubItem ? [viendoSubItem.image] : meta.carouselImages;

  useEffect(() => {
    if (imagenesActuales.length < 2) return;
    const t = setInterval(() => setImgIndex((i) => (i + 1) % imagenesActuales.length), 3200);
    return () => clearInterval(t);
  }, [imagenesActuales.length, viendoSubItem]);

  const rarity = rarityMeta[(viendoSubItem ? viendoSubItem.rarityValue : meta.rarityValue).toLowerCase()] || defaultRarity;
  const baseUsdPrice = entry.finalPrice / 100;
  const localPrice = (baseUsdPrice * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const regularLocalPrice = ((entry.regularPrice / 100) * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const itemId = entry.offerId || encodeURIComponent(`${meta.name}-${baseUsdPrice}`);
  const itemPayload = { id: itemId, name: meta.name, price: baseUsdPrice, image_url: meta.displayImage, offer_id: entry.offerId || null, vbucks: entry.finalPrice };

  const fechaFmt = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="kk-panel rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative aspect-[4/5] bg-[#14110C] flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 55%, ${rarity.className.includes('4A93D6') ? '#4A93D6' : '#E3A23D'}33, transparent 65%)` }}
            ></div>
            <img src={imagenesActuales[imgIndex] || meta.displayImage} alt={viendoSubItem ? viendoSubItem.name : meta.name} className="w-full h-full object-contain z-[1]" />
            {imagenesActuales.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[2] flex gap-1">
                {imagenesActuales.map((_: string, i: number) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-[#E3A23D]' : 'w-1.5 bg-white/40'}`}></span>
                ))}
              </div>
            )}
            <button onClick={onClose} className="absolute top-3 right-3 z-[3] bg-[#0A0806]/80 hover:bg-[#0A0806] text-[#F5F1E6] p-2 rounded-full"><X size={18} /></button>
          </div>

          <div className="p-6 flex flex-col">
            {viendoSubItem ? (
              <>
                <button onClick={() => { setSubIndex(null); setImgIndex(0); }} className="flex items-center gap-1 text-[#9A9384] hover:text-[#E3A23D] text-xs font-bold mb-3 w-fit">
                  <ChevronLeft size={14} /> Volver al lote
                </button>
                <span className={`inline-block w-fit text-[10px] font-display font-bold uppercase tracking-wide px-2 py-1 rounded mb-2 ${rarity.className}`}>{viendoSubItem.typeLabel || rarity.label}</span>
                <h2 className="font-display font-bold text-2xl mb-3">{viendoSubItem.name}</h2>
                {viendoSubItem.description && <p className="text-sm text-[#9A9384] leading-relaxed mb-4">{viendoSubItem.description}</p>}
                <p className="text-xs text-[#9A9384] bg-[#14110C] border border-[#0A0806] rounded-xl p-3 mb-4">Este objeto es parte del lote — se compra junto con el resto, no por separado.</p>
              </>
            ) : (
              <>
                <span className={`inline-block w-fit text-[10px] font-display font-bold uppercase tracking-wide px-2 py-1 rounded mb-2 ${rarity.className}`}>{meta.isBundle ? 'Lote' : rarity.label}</span>
                <h2 className="font-display font-bold text-2xl mb-3">{meta.name}</h2>
                {meta.description && <p className="text-sm text-[#9A9384] leading-relaxed mb-4">{meta.description}</p>}

                {meta.isBundle && meta.subItems.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-[#D9D4C7] uppercase tracking-wide mb-2">Incluye:</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {meta.subItems.map((it: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => { setSubIndex(i); setImgIndex(0); }}
                          className="aspect-square bg-[#14110C] border-2 border-[#0A0806] hover:border-[#E3A23D] rounded-lg overflow-hidden transition-colors"
                          title={it.name}
                        >
                          <img src={it.image} alt={it.name} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-auto pt-4">
              {entry.inDate && entry.outDate && (
                <div className="flex items-center gap-2 text-[#9A9384] text-xs mb-4">
                  <Calendar size={14} />
                  Disponible hasta el {fechaFmt(entry.outDate)}
                </div>
              )}
              <div className="flex items-baseline gap-2 mb-1">
                {meta.hasRealDiscount && <span className="text-[#5A554A] font-mono text-sm line-through">{activeCurrency.symbol}{regularLocalPrice}</span>}
                <span className="text-[#E3A23D] font-mono font-bold text-3xl">{activeCurrency.symbol}{localPrice}</span>
                <span className="text-[#9A9384] text-xs font-bold uppercase">{activeCurrency.currency}</span>
              </div>
              <p className="text-[#9A9384] text-xs font-mono mb-5">🪙 {entry.finalPrice.toLocaleString('en-US')} pavos</p>
              <button
                onClick={() => { addToCart(itemPayload); onClose(); }}
                className="w-full bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] py-4 rounded-xl font-display font-bold text-base border-[3px] border-[#0A0806] transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} /> {meta.isBundle ? 'Añadir lote al carrito' : 'Añadir al carrito'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 12;

export default function TiendaFortnite() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();
  const { data: session } = useSession();

  const [groupedShop, setGroupedShop] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [shopError, setShopError] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [quickViewEntry, setQuickViewEntry] = useState<any | null>(null);

  // La tienda de Fortnite rota todos los días a las 00:00 UTC — calculamos
  // cuánto falta para eso y lo actualizamos cada segundo.
  useEffect(() => {
    function actualizarContador() {
      const ahora = new Date();
      const proximoReinicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1, 0, 0, 0));
      const restante = proximoReinicio.getTime() - ahora.getTime();
      const h = Math.floor(restante / 3600000);
      const m = Math.floor((restante % 3600000) / 60000);
      const s = Math.floor((restante % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    }
    actualizarContador();
    const t = setInterval(actualizarContador, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function fetchShop() {
      try {
        const response = await fetch('https://fortnite-api.com/v2/shop?language=es');
        const data = await response.json();
        if (data.status === 200 && data.data?.entries) {
          const groups: Record<string, any[]> = {};
          data.data.entries.forEach((entry: any) => {
            const sectionName = entry.layout?.name || entry.section?.name || 'Otras Ofertas';
            if (!groups[sectionName]) groups[sectionName] = [];
            groups[sectionName].push(entry);
          });
          setGroupedShop(groups);
        } else {
          setShopError(true);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
        setShopError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tipos disponibles hoy en la tienda, calculados una sola vez por carga
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    Object.values(groupedShop).forEach((items) => {
      items.forEach((entry) => types.add(getEntryMeta(entry).typeValue));
    });
    return Array.from(types).filter((t) => typeLabels[t]);
  }, [groupedShop]);

  const filteredShop = useMemo(() => {
    return Object.entries(groupedShop).reduce((acc, [section, items]) => {
      const filteredItems = items.filter((entry) => {
        const meta = getEntryMeta(entry);
        const matchesSearch = meta.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeType === 'all' || meta.typeValue === activeType;
        return matchesSearch && matchesType;
      });
      if (filteredItems.length > 0) acc[section] = filteredItems;
      return acc;
    }, {} as Record<string, any[]>);
  }, [groupedShop, searchTerm, activeType]);

  const showMore = useCallback((section: string, total: number) => {
    setVisibleCounts((prev) => ({ ...prev, [section]: Math.min((prev[section] || PAGE_SIZE) + PAGE_SIZE, total) }));
  }, []);

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body flex flex-col selection:bg-[#E3A23D] selection:text-[#0A0806] scroll-smooth">
      <header className="flex items-center justify-between p-4 md:px-8 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#0A0806] overflow-hidden bg-[#F5F1E6]">
              <Image src="/logo.jpg" alt="Logo Kitson Kit" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-xl text-[#0A0806] hidden xl:block">KITSON KIT</span>
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-semibold text-sm text-[#0A0806]">
          <Link href="/" className="hover:opacity-70 transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:opacity-70 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="opacity-100 underline underline-offset-4 transition">Tienda Fortnite</Link>
          <Link href="/vincular-cuenta" className="hover:opacity-70 transition">Vincular Cuenta</Link>
          <Link href="/mi-cuenta" className="hover:opacity-70 transition">Mi Cuenta</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="hidden sm:block"><CurrencySelector /></div>

          <Link href="/carrito" className="flex items-center gap-2 bg-[#0A0806] text-[#E3A23D] py-2 px-4 rounded-lg font-bold hover:opacity-90 transition">
            <ShoppingCart size={18} />
            <span className="text-xs font-black">{totalItemsCount}</span>
          </Link>

          {session ? (
            <Link href="/mi-cuenta" className="hidden sm:flex items-center gap-2 bg-[#0A0806] py-1.5 px-1.5 pr-4 rounded-lg hover:opacity-80 transition">
              <Image src={session.user?.image || "/logo.jpg"} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-[#E3A23D] object-cover" />
            </Link>
          ) : (
            <button onClick={() => signIn()} className="hidden sm:block bg-[#0A0806] hover:opacity-90 text-[#E3A23D] px-6 py-2 rounded-lg font-black text-sm border-2 border-[#0A0806]">Iniciar Sesión</button>
          )}

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-[#0A0806] ml-1 p-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1D1913] border-t-4 border-[#0A0806] flex flex-col p-6 gap-6 fixed top-[73px] bottom-0 left-0 w-full z-[90] overflow-y-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Inicio</Link>
          <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Catálogo</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Tienda Fortnite</Link>
          <Link href="/vincular-cuenta" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Vincular Cuenta</Link>
          <Link href="/mi-cuenta" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Mi Cuenta</Link>
          <div className="pt-2"><CurrencySelector /></div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-6 md:px-10 pt-10 w-full">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-2 bg-[#4A93D6] text-[#0C2438] font-bold text-xs px-4 py-2 rounded-lg border-2 border-[#0A0806]">
            <span className="flex h-2 w-2 rounded-full bg-[#0C2438] animate-pulse"></span>
            TIENDA ACTIVA HOY
          </span>
          <span className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 border-2 border-red-500/30 font-mono font-bold text-xs px-4 py-2 rounded-lg">
            ⏳ Se reinicia en: {timeLeft}
          </span>
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-5xl mb-2">Tienda <span className="text-[#E3A23D]">Fortnite</span></h1>
        <p className="text-[#9A9384] max-w-xl mb-4">Todo lo disponible hoy en la tienda del juego.</p>

        <div className="flex items-start gap-3 bg-[#1D1913] border-2 border-[#4A93D6] rounded-xl p-4 mb-6 max-w-2xl">
          <span className="text-lg leading-none mt-0.5">🎁</span>
          <p className="text-xs text-[#D9D4C7] leading-relaxed">
            <strong className="text-[#F5F1E6]">Estos objetos se entregan como regalo dentro del juego.</strong> Si es la primera vez que te agregamos como amigo, Epic Games exige <strong className="text-[#4A93D6]">48 horas de amistad</strong> antes de poder enviarte un regalo — no es un error nuestro, es una regla de Epic. Si ya tenés más de 48hs de amigo con nosotros, la entrega es en minutos.
          </p>
        </div>

        {availableTypes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button
              onClick={() => setActiveType('all')}
              className={`shrink-0 px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wide border-2 border-[#0A0806] transition-colors ${activeType === 'all' ? 'bg-[#E3A23D] text-[#0A0806]' : 'bg-[#1D1913] text-[#9A9384] hover:text-[#F5F1E6]'}`}
            >
              Todos
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`shrink-0 px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wide border-2 border-[#0A0806] transition-colors ${activeType === type ? 'bg-[#E3A23D] text-[#0A0806]' : 'bg-[#1D1913] text-[#9A9384] hover:text-[#F5F1E6]'}`}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full flex flex-col md:flex-row gap-10">

        {!loading && Object.keys(groupedShop).length > 0 && (
          <aside className="hidden md:block w-72 shrink-0">
            <div className="sticky top-28 space-y-6">

              <div className="kk-panel rounded-2xl p-2 relative">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9A9384]" />
                <input
                  type="text" placeholder="Buscar cosmético..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl py-3 pl-12 pr-4 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] font-medium transition-colors"
                />
              </div>

              <div className="kk-panel rounded-2xl p-6">
                <span className="block text-[#9A9384] font-display font-bold text-[11px] uppercase tracking-widest mb-1">Filtros</span>
                <h3 className="text-[#F5F1E6] font-display font-bold text-lg mb-6 flex items-center gap-2">
                  <List size={20} className="text-[#E3A23D]"/> Secciones
                </h3>
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(filteredShop).map((section) => (
                    <li key={section}>
                      <a href={`#${section.replace(/\s+/g, '-')}`} className="group flex items-center gap-2 text-[#9A9384] hover:text-[#0A0806] hover:bg-[#E3A23D] transition-all font-bold text-sm px-3 py-2 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3A3527] group-hover:bg-[#0A0806] shrink-0"></span>
                        {section}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-40">
              <Gamepad2 size={64} className="animate-spin text-[#E3A23D] mb-4" />
              <h2 className="font-display text-2xl font-bold text-[#9A9384] animate-pulse">Cargando tienda...</h2>
            </div>
          ) : shopError ? (
            <div className="flex flex-col justify-center items-center py-40 kk-panel rounded-3xl text-center px-6">
              <Gamepad2 size={64} className="text-[#3A3527] mb-4" />
              <h2 className="text-2xl font-bold text-[#D9D4C7]">No pudimos cargar la tienda de Fortnite</h2>
              <p className="text-[#9A9384] mt-2 max-w-md">El servicio que trae los objetos del día puede estar caído por un momento. Probá de nuevo en unos minutos.</p>
              <button onClick={() => window.location.reload()} className="mt-6 bg-[#E3A23D] text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806]">Reintentar</button>
            </div>
          ) : Object.keys(filteredShop).length === 0 ? (
            <div className="flex flex-col justify-center items-center py-40 kk-panel rounded-3xl">
              <Search size={64} className="text-[#3A3527] mb-4" />
              <h2 className="text-2xl font-bold text-[#D9D4C7]">No se encontraron cosméticos</h2>
              <p className="text-[#9A9384] mt-2">Intenta buscar con otro nombre o cambiar el filtro.</p>
              <button onClick={() => { setSearchTerm(''); setActiveType('all'); }} className="mt-6 text-[#E3A23D] font-bold hover:underline">Limpiar filtros</button>
            </div>
          ) : (
            <div className="space-y-20 pb-24">
              {Object.entries(filteredShop).map(([sectionName, items]) => {
                const bundleEntries = items.filter((entry) => !!entry.bundle);
                const singleEntries = items.filter((entry) => !entry.bundle);
                const visible = visibleCounts[sectionName] || PAGE_SIZE;
                const visibleSingles = singleEntries.slice(0, visible);
                const hasMore = singleEntries.length > visible;

                return (
                  <section key={sectionName} id={sectionName.replace(/\s+/g, '-')} className="relative scroll-mt-28">
                    <div className="flex items-center gap-6 mb-8">
                      <h2 className="font-display text-3xl md:text-4xl font-bold text-[#F5F1E6]">{sectionName}</h2>
                      <div className="flex-1 h-1 bg-[#1D1913] border-t-2 border-[#0A0806]"></div>
                    </div>

                    {bundleEntries.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {bundleEntries.map((entry, idx) => (
                          <FortniteItemCard
                            key={`bundle-${entry.bundle?.name || idx}-${idx}`}
                            entry={entry}
                            activeCurrency={activeCurrency}
                            addToCart={addToCart}
                            onQuickView={setQuickViewEntry}
                            featured
                          />
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {visibleSingles.map((entry, idx) => (
                        <FortniteItemCard
                          key={`single-${idx}`}
                          entry={entry}
                          activeCurrency={activeCurrency}
                          addToCart={addToCart}
                          onQuickView={setQuickViewEntry}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => showMore(sectionName, singleEntries.length)}
                          className="bg-[#1D1913] hover:bg-[#E3A23D] hover:text-[#0A0806] text-[#F5F1E6] px-8 py-3 rounded-xl font-display font-bold border-2 border-[#0A0806] transition-colors"
                        >
                          Mostrar más ({singleEntries.length - visible} restantes)
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-[110] bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] p-3.5 rounded-full border-[3px] border-[#0A0806] shadow-lg transition-all duration-300 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        title="Volver arriba"
      >
        <ArrowUp size={22} />
      </button>

      {quickViewEntry && (
        <QuickViewModal
          entry={quickViewEntry}
          activeCurrency={activeCurrency}
          addToCart={addToCart}
          onClose={() => setQuickViewEntry(null)}
        />
      )}
    </div>
  );
}
