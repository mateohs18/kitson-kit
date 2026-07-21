import { supabaseAdmin } from './supabase-admin';

// ============================================================================
// TIENDA DIARIA — lógica compartida de servidor
//
// Este módulo es la ÚNICA fuente de verdad para los precios de la tienda
// diaria. Lo usan tanto /api/tienda (lo que ve el cliente) como
// /api/checkout (lo que se cobra), así que es imposible que se desincronicen.
// ============================================================================

// ---------- Margen de ganancia (editable desde el admin, cacheado 60s) ----------
let margenCache: { value: number; fetchedAt: number } | null = null;
const MARGEN_CACHE_MS = 60 * 1000;

export async function getMargenTienda(): Promise<number> {
  if (margenCache && Date.now() - margenCache.fetchedAt < MARGEN_CACHE_MS) {
    return margenCache.value;
  }
  try {
    const { data } = await supabaseAdmin
      .from('site_config')
      .select('value')
      .eq('key', 'margen_tienda')
      .single();
    const margen = Number(data?.value);
    const value = Number.isFinite(margen) && margen >= 0 && margen <= 500 ? margen : 0;
    margenCache = { value, fetchedAt: Date.now() };
    return value;
  } catch {
    // Si la tabla no existe todavía o falla la consulta, margen 0 (precio de costo)
    return margenCache?.value ?? 0;
  }
}

// Permite que /api/actualizar-margen invalide el caché al instante
export function invalidarMargenCache() {
  margenCache = null;
}

// ---------- Catálogo de Fortnite (cacheado 5 min) ----------
let shopCache: { fetchedAt: number; entries: any[] } | null = null;
const SHOP_CACHE_MS = 5 * 60 * 1000;

export async function getShopEntries(): Promise<any[]> {
  if (shopCache && Date.now() - shopCache.fetchedAt < SHOP_CACHE_MS) {
    return shopCache.entries;
  }
  const res = await fetch('https://fortnite-api.com/v2/shop?language=es', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo consultar la tienda de Fortnite');
  const json = await res.json();
  const entries: any[] = json?.data?.entries || [];
  shopCache = { fetchedAt: Date.now(), entries };
  return entries;
}

// ---------- Precio final en USD ----------
// Fórmula: (pavos / 100) * (1 + margen%). Redondeado a 2 decimales.
// Con margen 0 se comporta exactamente igual que el sitio actual.
export function precioTiendaUsd(finalPriceVbucks: number, margen: number): number {
  const base = finalPriceVbucks / 100;
  return Number((base * (1 + margen / 100)).toFixed(2));
}

// ---------- Nombre visible de una entrada (mismo criterio que el frontend) ----------
export function entryName(entry: any): string | null {
  return (
    entry?.bundle?.name ||
    entry?.brItems?.[0]?.name ||
    entry?.tracks?.[0]?.title ||
    entry?.instruments?.[0]?.name ||
    entry?.cars?.[0]?.name ||
    entry?.legoKits?.[0]?.name ||
    null
  );
}
