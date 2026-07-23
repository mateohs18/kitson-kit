import { NextResponse } from 'next/server';
import { permitirPeticion, respuesta429 } from '../../../lib/rate-limit';

// Busca cualquier cosmético de Fortnite por nombre, en el catálogo completo
// de fortnite-api.com. Busca primero por el nombre en ESPAÑOL y, si no hay
// resultados, reintenta en inglés (así "renegada" y "renegade" funcionan).
// Nota: esta API devuelve 404 cuando no hay coincidencias — lo tratamos
// como lista vacía, no como error.

async function buscar(q: string, searchLanguage?: string): Promise<any[]> {
  const params = new URLSearchParams({ name: q, language: 'es', matchMethod: 'contains' });
  if (searchLanguage) params.set('searchLanguage', searchLanguage);
  try {
    const res = await fetch(`https://fortnite-api.com/v2/cosmetics/br/search/all?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return []; // 404 = sin coincidencias
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  if (!permitirPeticion(req, 'buscar-cosmetico', 20)) return respuesta429();

  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  if (q.length < 3) return NextResponse.json({ resultados: [] });

  // 1º en español; si nada, 2º en inglés
  let data = await buscar(q, 'es');
  if (data.length === 0) data = await buscar(q);

  const resultados = data.slice(0, 12).map((c: any) => ({
    id: c.id,
    name: c.name,
    type: c.type?.displayValue || '',
    rarity: c.rarity?.displayValue || '',
    image: c.images?.icon || c.images?.smallIcon || null,
  }));

  return NextResponse.json({ resultados });
}
