import { ProductItem } from './types';

// ── BATCHING: acumulación de cambios de stock antes de sincronizar ──
// Los cambios de stock se guardan en esta cola persistente y se envían
// a Google Sheets en un solo lote (un único correo consolidado) cuando
// pasa la ventana configurada sin nuevos cambios o al pulsar "Sincronizar".
// Las alertas críticas (stock agotado, comisos) se envían al instante.

export interface PendingStockChange {
  rowIndex: number;
  id: string;
  nombre: string;
  actual: number;
  sugerido: number;
  stockAnterior: number;
  sugeridoAnterior?: number;
  usuario: string;
  lastAt: string;
  esPrioritario?: boolean;
  nivelPrioridad?: 'Alta' | 'Media' | 'Baja';
}

const QUEUE_KEY = 'sahoco_pending_changes_v1';
const WINDOW_KEY = 'sahoco_batch_window_min_v1';

// Minutos sin nuevos cambios antes de enviar el lote (configurable en localStorage).
export const SAHOCO_BATCH_DEFAULT_MIN = 12;

export function getBatchWindowMs(): number {
  const fallback = SAHOCO_BATCH_DEFAULT_MIN * 60 * 1000;
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(WINDOW_KEY);
    const min = raw === null ? NaN : Number(raw);
    if (!isNaN(min) && min >= 1 && min <= 180) return min * 60 * 1000;
  } catch {
    // localStorage no disponible: usar la ventana por defecto
  }
  return fallback;
}

function isSameProduct(
  a: { id: string; rowIndex: number },
  b: { id: string; rowIndex: number }
): boolean {
  if (a.id && b.id) return a.id === b.id;
  return !isNaN(a.rowIndex) && !isNaN(b.rowIndex) && a.rowIndex === b.rowIndex;
}

export function loadPendingChanges(): PendingStockChange[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c: Partial<PendingStockChange>): c is PendingStockChange =>
        !!c &&
        typeof c.id === 'string' &&
        typeof c.nombre === 'string' &&
        typeof c.actual === 'number' &&
        typeof c.rowIndex === 'number'
    );
  } catch {
    return [];
  }
}

export function savePendingChanges(changes: PendingStockChange[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (changes.length === 0) {
      window.localStorage.removeItem(QUEUE_KEY);
    } else {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(changes));
    }
  } catch {
    // Sin persistencia: la cola seguirá viva en memoria durante la sesión
  }
}

/**
 * Agrega (o fusiona) un cambio en la cola.
 * Si el producto ya está pendiente, se conserva el stockAnterior más antiguo
 * y solo se actualizan los valores finales: así el lote refleja el total real.
 */
export function queuePendingChange(
  queue: PendingStockChange[],
  change: PendingStockChange
): PendingStockChange[] {
  const existing = queue.find(c => isSameProduct(c, change));
  if (!existing) return [...queue, change];

  return queue.map(c =>
    isSameProduct(c, change)
      ? {
          ...c,
          nombre: change.nombre || c.nombre,
          actual: change.actual,
          sugerido: change.sugerido,
          sugeridoAnterior: c.sugeridoAnterior ?? change.sugeridoAnterior,
          usuario: change.usuario || c.usuario,
          lastAt: change.lastAt,
          esPrioritario: change.esPrioritario,
          nivelPrioridad: change.nivelPrioridad
        }
      : c
  );
}

export function removePendingForProduct(
  queue: PendingStockChange[],
  product: { id?: string; rowIndex?: number }
): PendingStockChange[] {
  const ref = { id: product.id || '', rowIndex: product.rowIndex ?? NaN };
  return queue.filter(c => !isSameProduct(c, ref));
}

/**
 * Superpone los cambios aún pendientes sobre los productos recién sincronizados,
 * para que la UI no pierda los ajustes que todavía no se han enviado.
 */
export function applyPendingToProducts(
  products: ProductItem[],
  queue: PendingStockChange[]
): ProductItem[] {
  if (queue.length === 0) return products;
  return products.map(p => {
    const change = queue.find(c => isSameProduct(c, p));
    if (!change) return p;
    return {
      ...p,
      stockActual: change.actual,
      cantidadSugerida: change.sugerido
    };
  });
}
