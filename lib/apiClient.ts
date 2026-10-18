import { ProductItem, HistoryRecord, UserName, ComisoPayload, Recipe } from './types';
import { PendingStockChange } from './pendingChanges';
import { normalizeRecipe } from './recipes';
import { PriorityEntry } from './priority';
import { APPS_SCRIPT_ENDPOINT } from './appsScriptUrl';

export { APPS_SCRIPT_ENDPOINT };

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

// --- GOOGLE APPS SCRIPT SYNC: CARGA REAL DE LOS INSUMOS ---
export interface RemoteProductsResult {
  items: ProductItem[];
  totalItems: number;
  source: 'remote' | 'cache' | 'empty';
  error?: string;
}

/**
 * Extrae la lista de productos desde cualquier envoltura JSON del backend:
 * - Array plano: [...]
 * - Envoltura SAHOCO: { status, totalItems, data: [...] }
 * - Variantes: { items: [...] }, { resultado: { data: [...] } }, data como string JSON.
 */
function extractItemsArray(json: any): any[] | null {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return null;

  const candidates: any[] = [json.data, json.items, json.rows, json.resultado, json.result];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.data)) return parsed.data;
          if (Array.isArray(parsed.items)) return parsed.items;
        }
      } catch {
        // El string no era JSON: ignorar
      }
      continue;
    }
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      if (Array.isArray(candidate.data)) return candidate.data;
      if (Array.isArray(candidate.items)) return candidate.items;
    }
  }
  return null;
}

/**
 * Detecta filas de encabezado que algunos despliegues del backend incluyen
 * como si fueran un producto más (ej. "Articulo", "No.") en lugar de empezar en la fila 3.
 */
function isHeaderLikeRow(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  const name = String(row.nombre || row.articulo || row.producto || '').trim().toLowerCase();
  const noCell = String(row.no ?? '').trim().toLowerCase();
  if (/^art[ií]culos?\.?$/.test(name)) return true;
  if (noCell === 'no' || noCell === 'no.' || noCell === 'nº' || noCell === '#') return true;
  return false;
}

export async function fetchRemoteProducts(): Promise<RemoteProductsResult> {
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

      // Respuesta de error explícita del backend (ej. { status: 'error', message: 'Hoja vacía' })
      if (json && !Array.isArray(json) && json.status === 'error') {
        throw new Error(json.message || 'El backend de Google Sheets reportó un error');
      }

      // El array interno vive en response.data (o variantes), nunca en la raíz
      const extracted = extractItemsArray(json);

      // Contador global reportado por el backend (si existe)
      const serverTotal = parseSafeNumber(
        json && !Array.isArray(json) ? (json.totalItems ?? json.count ?? json.total) : undefined,
        -1
      );

      if (extracted === null) {
        throw new Error('La respuesta del backend no contiene "data" con la lista de productos.');
      }

      // Nunca mostrar la fila de encabezado como producto (backend que inicia en la fila 2)
      const rawData = extracted.filter((row: any) => !isHeaderLikeRow(row));

      if (rawData.length === 0) {
        // No vaciar el inventario: registrar el aviso e intentar la siguiente URL / caché
        lastError = new Error(
          serverTotal > 0
            ? `El backend reporta ${serverTotal} productos pero "data" llegó vacío.`
            : 'El backend devolvió una lista de productos vacía.'
        );
        console.warn(`[SAHOCO] ${lastError.message} (${url})`);
        continue;
      }

      {
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
            foto: String(row.foto || row.imagen || ''),
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

        const totalReportado = serverTotal > 0 ? serverTotal : items.length;
        console.log(`[SAHOCO] Cargados en vivo ${items.length} productos de Google Sheets (totalItems backend: ${totalReportado})`);
        saveLocalProducts(items);
        return { items, totalItems: totalReportado, source: 'remote' };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[SAHOCO] Intento con ${url} falló:`, err.message);
    }
  }

  // Si fallaron todas las llamadas, usar la caché real sin vaciar el estado
  const cached = getLocalProducts();
  if (cached.length > 0) {
    return { items: cached, totalItems: cached.length, source: 'cache', error: lastError?.message };
  }

  // Sin datos remotos ni caché: informar al usuario
  throw lastError || new Error('No se pudo establecer conexión con Google Sheets ni hay productos en memoria.');
}

/**
 * Modificar Stock / Sugerido mediante petición POST en tiempo real.
 * `extraUpdates` permite sincronizar campos adicionales (nombre, suplidor, mínimos, etc.)
 * y `comiso` adjunta los detalles de una merma para auditoría + correo en Apps Script.
 */
export async function sendStockUpdate(
  item: ProductItem,
  newActual: number,
  newSugerido: number,
  usuario: string,
  extraUpdates?: Partial<ProductItem>,
  comiso?: ComisoPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const payload: Record<string, unknown> = {
      action: 'update',
      rowIndex: item.rowIndex,
      actual: newActual,
      sugerido: newSugerido,
      usuario: usuario,
      nombre: item.nombre,
      id: item.id,
      timestamp: new Date().toISOString()
    };

    // Insumo clave de cocina: la alerta viaja como MÁXIMA PRIORIDAD
    if (item.esPrioritario) {
      payload.esPrioritario = true;
      payload.nivelPrioridad = item.nivelPrioridad || 'Alta';
    }

    // Campos de ficha: solo se envían en la edición explícita (extraUpdates),
    // para que los +/- normales de stock no sobrescriban celdas de la hoja.
    if (extraUpdates) {
      const fichaFields: Array<keyof ProductItem> = [
        'nombre', 'suplidor', 'categoria', 'unidad',
        'stockMinimo', 'stockMaximo', 'descripcion',
        'fechaVencimiento', 'foto', 'rowIndex'
      ];
      fichaFields.forEach((field) => {
        if (extraUpdates[field] !== undefined && extraUpdates[field] !== null) {
          payload[field] = extraUpdates[field];
        }
      });
      if (typeof extraUpdates.nombre === 'string' && extraUpdates.nombre !== item.nombre) {
        payload.nombreAnterior = item.nombre;
      }
    }

    if (comiso) {
      payload.comiso = {
        cantidad: comiso.cantidad,
        motivo: comiso.motivo,
        fechaVencimiento: comiso.fechaVencimiento || '',
        notas: comiso.notas || '',
        stockAnterior: item.stockActual,
        stockNuevo: newActual,
        unidad: item.unidad
      };
    }

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=update'
      : `${APPS_SCRIPT_ENDPOINT}?action=update`;
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
 * Descarga quirúrgica en lote (preparación de platos).
 * Cada insumo se procesa de forma aislada en el backend: si uno falla,
 * los demás descuentos se mantienen íntegros.
 */
export async function sendBulkStockUpdate(
  changes: Array<{ product: ProductItem; newStock: number }>,
  usuario: string,
  detalle: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!changes.length) return { success: true, message: 'Sin cambios que sincronizar' };

    const payload = {
      action: 'bulk_update',
      usuario: usuario,
      detalle: detalle,
      changes: changes.map(c => ({
        rowIndex: c.product.rowIndex,
        id: c.product.id,
        nombre: c.product.nombre,
        actual: c.newStock,
        sugerido: c.product.cantidadSugerida,
        ...(c.product.esPrioritario ? { esPrioritario: true } : {})
      })),
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=bulk_update'
      : `${APPS_SCRIPT_ENDPOINT}?action=bulk_update`;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE')) {
      return { success: true, message: 'Descuentos guardados en dispositivo' };
    }
    const json = JSON.parse(text);
    return { success: json.status === 'success', message: json.message || `${changes.length} insumos sincronizados` };
  } catch (err: any) {
    return { success: true, message: `Guardado en dispositivo: ${err.message}` };
  }
}

/**
 * Carga las recetas guardadas en Google Sheets (pestaña "Recetas").
 * Si falla, el llamador usa la caché local.
 */
export async function fetchRemoteRecipes(): Promise<Recipe[]> {
  const urlsToTry: string[] = [];
  if (typeof window !== 'undefined') {
    urlsToTry.push('/api/inventory?action=get_recipes');
  }
  urlsToTry.push(`${APPS_SCRIPT_ENDPOINT}?action=get_recipes`);

  let lastError: Error | null = null;
  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Apps Script devolvió HTML en lugar de JSON');
      }

      const json = JSON.parse(text);
      const rawData = Array.isArray(json) ? json : (json.data || json.recipes || []);
      if (!Array.isArray(rawData)) throw new Error('Formato de recetas no reconocido');

      return rawData
        .map((r: any) => normalizeRecipe(r))
        .filter((r: Recipe | null): r is Recipe => r !== null);
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError || new Error('No se pudieron cargar las recetas remotas');
}

/**
 * Guarda (crea o actualiza) una receta en Google Sheets.
 */
export async function sendSaveRecipe(
  recipe: Recipe,
  usuario: string
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      action: 'save_recipe',
      recipe: recipe,
      usuario: usuario,
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=save_recipe'
      : `${APPS_SCRIPT_ENDPOINT}?action=save_recipe`;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE')) {
      return { success: true, message: 'Receta guardada en dispositivo' };
    }
    const json = JSON.parse(text);
    return { success: json.status === 'success', message: json.message || 'Receta sincronizada' };
  } catch (err: any) {
    return { success: true, message: `Receta guardada localmente: ${err.message}` };
  }
}

/**
 * Elimina una receta de Google Sheets.
 */
export async function sendDeleteRecipe(
  recipe: Recipe,
  usuario: string
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      action: 'delete_recipe',
      id: recipe.id,
      nombre: recipe.nombre,
      usuario: usuario,
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=delete_recipe'
      : `${APPS_SCRIPT_ENDPOINT}?action=delete_recipe`;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE')) {
      return { success: true, message: 'Receta eliminada en dispositivo' };
    }
    const json = JSON.parse(text);
    return { success: json.status === 'success', message: json.message || 'Receta eliminada' };
  } catch (err: any) {
    return { success: true, message: `Eliminada localmente: ${err.message}` };
  }
}

/**
 * Sincroniza un LOTE de cambios de stock acumulados (batching de jornada).
 * Envía TODO el lote en un solo POST `bulk_update` con `notificar: true`,
 * de modo que Apps Script envíe un único correo consolidado.
 * Si el backend aún no soporta `bulk_update` u `notificar`, reintenta cada
 * cambio de forma individual para no perder datos.
 */
export async function sendStockBatch(
  changes: PendingStockChange[],
  usuario: string
): Promise<{ success: boolean; message: string; fallbackUsed: boolean }> {
  if (!changes.length) {
    return { success: true, message: 'Sin cambios pendientes', fallbackUsed: false };
  }

  try {
    const payload = {
      action: 'bulk_update',
      usuario: usuario,
      detalle: `Lote de cambios de jornada (${changes.length} ${changes.length === 1 ? 'insumo' : 'insumos'})`,
      notificar: true,
      changes: changes.map(c => ({
        rowIndex: c.rowIndex,
        id: c.id,
        nombre: c.nombre,
        actual: c.actual,
        sugerido: c.sugerido,
        stockAnterior: c.stockAnterior,
        usuario: c.usuario || usuario,
        ...(c.esPrioritario ? { esPrioritario: true, nivelPrioridad: c.nivelPrioridad || 'Alta' } : {})
      })),
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=bulk_update'
      : `${APPS_SCRIPT_ENDPOINT}?action=bulk_update`;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!text.includes('<!DOCTYPE')) {
      try {
        const json = JSON.parse(text);
        if (json.status === 'success') {
          return {
            success: true,
            message: json.message || `${changes.length} cambios sincronizados en un solo lote`,
            fallbackUsed: false
          };
        }
        // Backend antiguo sin `bulk_update`: reintentar individualmente
        if (!/no v[aá]lida|inv[aá]lid|invalid/i.test(String(json.message || ''))) {
          return { success: false, message: json.message || 'No se pudo sincronizar el lote', fallbackUsed: false };
        }
      } catch {
        // Respuesta no JSON: se intenta el envío individual
      }
    }
  } catch (err: any) {
    return { success: false, message: `Sin conexión: ${err.message}`, fallbackUsed: false };
  }

  return sendStockBatchFallback(changes, usuario);
}

/**
 * Plan B del lote: reenvía cada cambio acumulado como `update` individual.
 * Se usa cuando el backend todavía no reconoce `bulk_update + notificar`.
 */
async function sendStockBatchFallback(
  changes: PendingStockChange[],
  usuario: string
): Promise<{ success: boolean; message: string; fallbackUsed: boolean }> {
  let ok = 0;
  let lastMessage = '';

  for (const c of changes) {
    const item: ProductItem = {
      id: c.id,
      rowIndex: c.rowIndex,
      nombre: c.nombre,
      suplidor: '',
      categoria: 'Insumos & Salado',
      descripcion: '',
      foto: '',
      fechaVencimiento: '',
      stockActual: c.stockAnterior,
      unidad: '',
      stockMinimo: 0,
      stockMaximo: 0,
      cantidadSugerida: c.sugerido,
      esPrioritario: c.esPrioritario,
      nivelPrioridad: c.nivelPrioridad
    };
    const res = await sendStockUpdate(item, c.actual, c.sugerido, c.usuario || usuario);
    if (res.success) ok++;
    else lastMessage = res.message;
  }

  const success = ok === changes.length;
  return {
    success,
    message: success
      ? `${ok} ${ok === 1 ? 'cambio sincronizado' : 'cambios sincronizados'}`
      : `Sincronizados ${ok} de ${changes.length}${lastMessage ? ` — ${lastMessage}` : ''}`,
    fallbackUsed: true
  };
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

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=add'
      : `${APPS_SCRIPT_ENDPOINT}?action=add`;
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

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=delete'
      : `${APPS_SCRIPT_ENDPOINT}?action=delete`;
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

/**
 * Carga las prioridades globales guardadas en Google Sheets (pestaña "Prioridades").
 * Son compartidas por TODOS los perfiles y dispositivos.
 */
export async function fetchRemotePriorities(): Promise<PriorityEntry[]> {
  const urlsToTry: string[] = [];
  if (typeof window !== 'undefined') {
    urlsToTry.push('/api/inventory?action=get_priorities');
  }
  urlsToTry.push(`${APPS_SCRIPT_ENDPOINT}?action=get_priorities`);

  let lastError: Error | null = null;
  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Apps Script devolvió HTML en lugar de JSON');
      }

      const json = JSON.parse(text);
      if (json && !Array.isArray(json) && json.status === 'error') {
        throw new Error(json.message || 'El backend no reconoce get_priorities');
      }

      const rawData = Array.isArray(json) ? json : (json.data || []);
      if (!Array.isArray(rawData)) throw new Error('Formato de prioridades no reconocido');

      const niveles: Array<PriorityEntry['nivelPrioridad']> = ['Alta', 'Media', 'Baja'];
      return rawData
        .map((r: any) => {
          const nivel = String(r.nivelPrioridad || r.nivel || 'Alta') as PriorityEntry['nivelPrioridad'];
          return {
            nombre: String(r.nombre || r.articulo || r.producto || '').trim(),
            nivelPrioridad: niveles.includes(nivel) ? nivel : 'Alta',
            marcadoPor: String(r.marcadoPor || r.usuario || ''),
            marcadoAt: String(r.marcadoAt || r.fecha || '')
          };
        })
        .filter(e => e.nombre !== '');
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError || new Error('No se pudieron cargar las prioridades remotas');
}

/**
 * Marca/desmarca un insumo como prioritario PARA TODOS los perfiles.
 * A diferencia de los cambios de stock, esta acción no tiene sentido solo
 * local: si el backend falla, se informa para que la UI revierta.
 */
export async function sendPriorityToggle(
  product: { id?: string; nombre: string; rowIndex?: number },
  prioritario: boolean,
  usuario: string
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      action: 'save_priority',
      nombre: product.nombre,
      id: product.id,
      rowIndex: product.rowIndex,
      prioritario: prioritario,
      nivelPrioridad: 'Alta',
      usuario: usuario,
      timestamp: new Date().toISOString()
    };

    const postUrl = typeof window !== 'undefined'
      ? '/api/inventory?action=save_priority'
      : `${APPS_SCRIPT_ENDPOINT}?action=save_priority`;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE')) {
      return { success: false, message: 'Apps Script no devolvió JSON' };
    }
    const json = JSON.parse(text);
    return { success: json.status === 'success', message: json.message || 'Prioridad actualizada' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

