import { ProductItem } from './types';

// ── PRIORIDAD DE INSUMOS CRÍTICOS ──
// Los insumos marcados como clave (ej. papas, carne, aceite, pan) se guardan
// localmente para que persistan entre sesiones y viajen como flag en cada
// actualización de stock (Apps Script los destaca en el correo).

export interface PriorityEntry {
  nombre: string;
  id?: string;
  nivelPrioridad: 'Alta' | 'Media' | 'Baja';
  marcadoPor?: string;
  marcadoAt?: string;
}

const PRIORITY_KEY = 'sahoco_priority_products_v1';

export function normalizeProductKey(nombre: string): string {
  return String(nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSameProduct(entry: PriorityEntry, product: { id?: string; nombre?: string }): boolean {
  // El nombre normalizado es la clave más estable (los id cambian si se mueven filas en Sheets)
  if (normalizeProductKey(entry.nombre) === normalizeProductKey(product.nombre || '')) {
    return true;
  }
  if (entry.id && product.id) return entry.id === product.id;
  return false;
}

export function loadPriorities(): PriorityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PRIORITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p: Partial<PriorityEntry>): p is PriorityEntry =>
        !!p && typeof p.nombre === 'string' && p.nombre.trim() !== ''
    );
  } catch {
    return [];
  }
}

export function savePriorities(entries: PriorityEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (entries.length === 0) {
      window.localStorage.removeItem(PRIORITY_KEY);
    } else {
      window.localStorage.setItem(PRIORITY_KEY, JSON.stringify(entries));
    }
  } catch {
    // Sin persistencia: las prioridades seguirán vivas durante la sesión
  }
}

export function isPriorityProduct(
  entries: PriorityEntry[],
  product: { id?: string; nombre?: string }
): boolean {
  return entries.some(e => isSameProduct(e, product));
}

/**
 * Marca o desmarca un insumo como prioritario.
 * Al marcar se guarda con nivel "Alta" (insumo clave de cocina).
 */
export function toggleProductPriority(
  entries: PriorityEntry[],
  product: { id?: string; nombre: string },
  usuario: string
): PriorityEntry[] {
  if (isPriorityProduct(entries, product)) {
    return entries.filter(e => !isSameProduct(e, product));
  }
  return [
    ...entries,
    {
      nombre: product.nombre,
      id: product.id,
      nivelPrioridad: 'Alta',
      marcadoPor: usuario,
      marcadoAt: new Date().toISOString()
    }
  ];
}

/**
 * Superpone las prioridades guardadas sobre la lista de productos,
 * para que toda la UI (carrito, tarjetas, correos) vea los flags.
 */
export function applyPriorityToProducts(
  products: ProductItem[],
  entries: PriorityEntry[]
): ProductItem[] {
  if (entries.length === 0) return products;
  return products.map(p => {
    const entry = entries.find(e => isSameProduct(e, p));
    if (!entry) {
      if (!p.esPrioritario) return p;
      return { ...p, esPrioritario: false, nivelPrioridad: undefined };
    }
    return { ...p, esPrioritario: true, nivelPrioridad: entry.nivelPrioridad || 'Alta' };
  });
}
