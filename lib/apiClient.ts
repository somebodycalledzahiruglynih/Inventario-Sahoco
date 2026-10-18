import { ProductItem, HistoryRecord, UserName } from './types';

export const APPS_SCRIPT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxC6VFpj8pijG8DoNd6F-L3bPVoa0PX-43qxqdzCfQBwe5xJJl1xkEeAoECA64Cg5Ey/exec';

const STORAGE_KEY_PRODUCTS = 'sahoco_live_products_v9';
const STORAGE_KEY_HISTORY = 'sahoco_live_history_v9';
const STORAGE_KEY_USER = 'sahoco_live_user_v9';

// --- SESSION STORAGE ---
export function getCurrentUser(): UserName | null {
  if (typeof window === 'undefined') return null;
  try {
    return (localStorage.getItem(STORAGE_KEY_USER) as UserName) || null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserName | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch (e) {
    console.error('Failed saving user session', e);
  }
}

// --- PRODUCTS CACHED STORAGE (CERO DATOS FICTICIOS) ---
export function getLocalProducts(): ProductItem[] {
  if (typeof window === 'undefined') return [];
  try {
    // Limpieza de claves obsoletas con mock data anterior o ids no únicos
    localStorage.removeItem('sahoco_live_products_v8');
    localStorage.removeItem('sahoco_real_products_v5');
    localStorage.removeItem('sahoco_nextjs_items_v2');

    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validar que no sea el arreglo antiguo de 17 productos de prueba
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed.length === 17 && parsed[0]?.nombre?.includes('Lamb Weston')) {
          localStorage.removeItem(STORAGE_KEY_PRODUCTS);
          return [];
        }
        // Deduplicar IDs para garantizar claves React 100% únicas
        const seen = new Set<string>();
        return parsed.map((item: ProductItem, idx: number) => {
          let id = String(item.id || '');
          if (!id || seen.has(id)) {
            id = `PRD-R${item.rowIndex || idx + 1}`;
          }
          seen.add(id);
          return { ...item, id };
        });
      }
    }
  } catch (e) {
    console.error('Error reading cached products', e);
  }
  return [];
}

export function saveLocalProducts(products: ProductItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products cache', e);
  }
}

// --- HISTORY LOCAL STORAGE ---
export function getLocalHistory(): HistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading cached history', e);
  }
  return [];
}

export function saveLocalHistory(history: HistoryRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 100)));
  } catch (e) {
    console.error('Error saving history cache', e);
  }
}

/**
 * Normaliza y auto-clasifica categorías según el estándar de SAHOCO
 */
function normalizeCategory(nombre: string, rawCat?: string): ProductItem['categoria'] {
  const cat = String(rawCat || '').toLowerCase();
  const n = String(nombre || '').toLowerCase();

  if (cat.includes('postre') || cat.includes('reposter') || cat.includes('synthia') ||
      n.includes('tres leches') || n.includes('cheesecake') || n.includes('flan') ||
      n.includes('gelatina') || n.includes('bizcocho') || n.includes('oreo')) {
    return 'Postres & Repostería';
  }

  if (cat.includes('bebida') || cat.includes('jugo') || cat.includes('refresco') || cat.includes('topping') ||
      n.includes('coca') || n.includes('agua') || n.includes('syrup') ||
      n.includes('nutella') || n.includes('soda')) {
    return 'Bebidas';
  }

  if (cat.includes('desechable') || cat.includes('empaque') || cat.includes('envase') ||
      n.includes('vaso') || n.includes('caja') || n.includes('funda') ||
      n.includes('tenedor') || n.includes('cuchara') || n.includes('tapa')) {
    return 'Desechables';
  }

  return 'Insumos & Salado';
}

function parseSafeNumber(val: any, defaultVal = 0): number {
  if (val === undefined || val === null || val === '') return defaultVal;
  const cleaned = String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, '').trim();
  const n = Number(cleaned);
  return isNaN(n) ? defaultVal : n;
}

// --- GOOGLE APPS SCRIPT SYNC: CARGA REAL DE LOS 131 INSUMOS ---
export async function fetchRemoteProducts(): Promise<ProductItem[]> {
  let lastError: Error | null = null;

  // Determinar qué URLs intentar:
  // En el browser usamos el proxy /api/inventory para evitar CORS.
  // En SSR (sin window) llamamos directo al endpoint de Apps Script.
  const urlsToTry: Array<{ url: string; opts: RequestInit }> = [];

  if (typeof window !== 'undefined') {
    // Browser: usar proxy
    urlsToTry.push({ url: '/api/inventory', opts: { method: 'GET', headers: { 'Accept': 'application/json' } } });
  }
  // Siempre incluir el endpoint directo como respaldo (funciona en SSR / ambientes sin CORS)
  urlsToTry.push({
    url: `${APPS_SCRIPT_ENDPOINT}?action=get`,
    opts: { method: 'GET', headers: { 'Accept': 'application/json' }, mode: 'cors' as RequestMode }
  });

  for (const { url, opts } of urlsToTry) {
    try {
      const response = await fetch(url, opts);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const text = await response.text();

      // Si el Apps Script devuelve HTML, contiene un error de ejecución
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        let errorMsg = 'Error en Google Apps Script';
        const match = text.match(/<div class="errorMessage"[^>]*>([^<]+)<\/div>/i) ||
                      text.match(/<div[^>]*>([^<]+)<\/div>/i);
        if (match && match[1]) {
          errorMsg = match[1].trim();
        }
        throw new Error(`Google Apps Script devolvió error: ${errorMsg}`);
      }

      const json = JSON.parse(text);
      const rawData = Array.isArray(json) ? json : (json.data || json.items || []);

      if (Array.isArray(rawData)) {
        if (rawData.length === 0) {
          return [];
        }

        const seen = new Set<string>();
        const items: ProductItem[] = rawData.map((row: any, idx: number) => {
          const nombre = String(row.nombre || row.articulo || row.producto || `Insumo ${idx + 1}`).trim();
          const suplidor = String(row.suplidor || row.proveedor || 'Proveedor General').trim();
          const categoria = normalizeCategory(nombre, row.categoria);

          const stockActual = parseSafeNumber(row.stockActual ?? row.actual ?? row.restante, 0);
          const stockMinimo = parseSafeNumber(row.stockMinimo ?? row.min ?? row.minimo, 0);
          const stockMaximo = parseSafeNumber(row.stockMaximo ?? row.max ?? row.maximo, 0);
          let cantidadSugerida = parseSafeNumber(row.cantidadSugerida ?? row.sugerido, 0);
          if (cantidadSugerida === 0 && stockMaximo > stockActual) {
            cantidadSugerida = Math.max(0, stockMaximo - stockActual);
          }

          let generatedId = String(row.id || (row.rowIndex ? `PRD-R${row.rowIndex}` : (row.no ? `PRD-${row.no}-${idx + 1}` : `PRD-${idx + 1}`)));
          if (seen.has(generatedId)) {
            generatedId = `${generatedId}-idx${idx + 1}`;
          }
          seen.add(generatedId);

          return {
            id: generatedId,
            rowIndex: Number(row.rowIndex || idx + 3),
            nombre,
            suplidor,
            categoria,
            descripcion: String(row.descripcion || ''),
            foto: String(row.foto || row.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'),
            fechaVencimiento: String(row.fechaVencimiento || row.vencimiento || ''),
            stockActual,
            unidad: String(row.unidad || 'Unidad'),
            stockMinimo,
            stockMaximo,
            cantidadSugerida,
            ultimaModificacion: new Date().toISOString(),
            modificadoPor: String(row.modificadoPor || 'Google Sheets')
          };
        });

        console.log(`[SAHOCO] Cargados en vivo ${items.length} productos de Google Sheets (${json.sheet || 'Inv.'})`);
        saveLocalProducts(items);
        return items;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[SAHOCO] Intento con ${url} falló:`, err.message);
    }
  }

  // Si fallaron todas las llamadas, comprobar si hay datos en caché real
  const cached = getLocalProducts();
  if (cached.length > 0) {
    return cached;
  }

  // Si no hay datos ni remotos ni en caché, lanzar error para que la UI informe al usuario
  throw lastError || new Error('No se pudo establecer conexión con Google Sheets ni hay productos en memoria.');
}

/**
 * Modificar Stock / Sugerido mediante petición POST en tiempo real
 */
export async function sendStockUpdate(
  item: ProductItem,
  newActual: number,
  newSugerido: number,
  usuario: string,
  extraUpdates?: Partial<ProductItem>
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      action: 'update',
      rowIndex: item.rowIndex,
      actual: newActual,
      sugerido: newSugerido,
      usuario: usuario,
      nombre: item.nombre,
      id: item.id,
      fechaVencimiento: extraUpdates?.fechaVencimiento || item.fechaVencimiento,
      descripcion: extraUpdates?.descripcion || item.descripcion,
      unidad: extraUpdates?.unidad || item.unidad,
      foto: extraUpdates?.foto || item.foto,
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined' ? '/api/inventory' : APPS_SCRIPT_ENDPOINT;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE')) {
      return { success: true, message: 'Guardado local (Apps Script no devolvió JSON)' };
    }
    const json = JSON.parse(text);
    return { success: json.status === 'success', message: json.message || 'Sincronizado con Google Sheets' };
  } catch (err: any) {
    return { success: true, message: `Guardado en dispositivo: ${err.message}` };
  }
}

/**
 * Agregar nuevo producto
 */
export async function sendNewProduct(
  item: ProductItem,
  usuario: string
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      action: 'add',
      item: item,
      usuario: usuario,
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined' ? '/api/inventory' : APPS_SCRIPT_ENDPOINT;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE')) {
      return { success: true, message: 'Insumo guardado localmente' };
    }
    const json = JSON.parse(text);
    return { success: json.status === 'success', message: json.message || 'Insumo registrado en Google Sheets' };
  } catch (err: any) {
    return { success: true, message: `Guardado local: ${err.message}` };
  }
}

/**
 * Eliminar insumo
 */
export async function sendDeleteProduct(
  item: ProductItem,
  usuario: string
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      action: 'delete',
      rowIndex: item.rowIndex,
      id: item.id,
      nombre: item.nombre,
      usuario: usuario,
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined' ? '/api/inventory' : APPS_SCRIPT_ENDPOINT;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE')) {
      return { success: true, message: 'Eliminado localmente' };
    }
    const json = JSON.parse(text);
    return { success: json.status === 'success', message: json.message || 'Eliminado de Google Sheets' };
  } catch (err: any) {
    return { success: true, message: `Eliminado local: ${err.message}` };
  }
}

/**
 * Comprueba estado de vencimiento del insumo
 */
export function checkExpiration(dateString?: string): { isExpired: boolean; isNear: boolean; daysRemaining: number } {
  if (!dateString) return { isExpired: false, isNear: false, daysRemaining: 999 };
  try {
    const target = new Date(dateString).getTime();
    if (isNaN(target)) return { isExpired: false, isNear: false, daysRemaining: 999 };
    const now = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return {
      isExpired: diffDays < 0,
      isNear: diffDays >= 0 && diffDays <= 7,
      daysRemaining: diffDays
    };
  } catch {
    return { isExpired: false, isNear: false, daysRemaining: 999 };
  }
}

/**
 * Convierte archivo de imagen a base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

