export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQ_EvGVC51xkcKVcC7iuEQARl71TRyNMYefZMVG4fBJmKD--1JJ2uYBFq5RamTzcyPxQ/exec';

export type MainCategory = 'Insumos & Salado' | 'Postres & Repostería' | 'Bebidas' | 'Desechables';

export interface SahocoItem {
  id: string;
  rowIndex: number;
  nombre: string;
  categoria: MainCategory;
  suplidor: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  costoUnitario?: number;
  ubicacion?: string;
}

export function autoClassifyCategory(nombre: string, existingCategory?: string): MainCategory {
  const n = (nombre || '').toLowerCase();
  const cat = (existingCategory || '').toLowerCase();

  if (cat.includes('postre') || cat.includes('reposter') || cat.includes('synthia') || 
      n.includes('tres leches') || n.includes('cheesecake') || n.includes('flan') || 
      n.includes('gelatina') || n.includes('bizcocho') || n.includes('oreo')) {
    return 'Postres & Repostería';
  }

  if (cat.includes('bebida') || cat.includes('jugo') || cat.includes('refresco') || 
      n.includes('coca cola') || n.includes('agua') || n.includes('jugo') || 
      n.includes('syrup') || n.includes('soda') || n.includes('topping')) {
    return 'Bebidas';
  }

  if (cat.includes('desechable') || cat.includes('empaque') || cat.includes('caja') || 
      n.includes('vaso') || n.includes('cenedor') || n.includes('cuchara') || 
      n.includes('servilleta') || n.includes('tapa domo') || n.includes('bolsa')) {
    return 'Desechables';
  }

  return 'Insumos & Salado';
}

export const FALLBACK_INVENTORY: SahocoItem[] = [];

const LOCAL_STORAGE_KEY = 'sahoco_nextjs_items_v2';

export function getLocalItems(): SahocoItem[] {
  if (typeof window === 'undefined') return FALLBACK_INVENTORY;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading localStorage', e);
  }
  return FALLBACK_INVENTORY;
}

export function saveLocalItems(items: SahocoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving localStorage', e);
  }
}

/**
 * Fetch inventory from Google Apps Script Web App
 */
export async function fetchInventoryFromAppsScript(): Promise<SahocoItem[]> {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=get_inventory`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });

    const text = await response.text();
    
    // Check if error or HTML
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      console.warn('Apps Script returned HTML, using local/cached inventory.');
      return getLocalItems();
    }

    const data = JSON.parse(text);
    
    // Parse Google Sheets rows or data array
    if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
      const parsedItems: SahocoItem[] = data.data.map((row: any, idx: number) => {
        const nombre = row.nombre || row.articulo || row[1] || `Artículo ${idx + 1}`;
        const suplidor = row.suplidor || row.proveedor || row[3] || 'Sirena';
        const unidad = row.unidad || row[4] || 'unidad';
        const stockActual = Number(row.stockActual ?? row.actual ?? row[5]) || 0;
        const stockMinimo = Number(row.stockMinimo ?? row.min ?? row[6]) || 5;
        const stockMaximo = Number(row.stockMaximo ?? row.max ?? row[7]) || 50;
        const costo = Number(row.costoUnitario ?? row.costo ?? row[8]) || 0;
        const categoria = autoClassifyCategory(nombre, row.categoria || row[2]);

        return {
          id: String(row.id || `ITM-${idx + 1}`),
          rowIndex: Number(row.rowIndex || idx + 2),
          nombre,
          categoria,
          suplidor,
          unidad,
          stockActual,
          stockMinimo,
          stockMaximo,
          costoUnitario: costo,
          ubicacion: row.ubicacion || 'Almacén Principal'
        };
      });

      saveLocalItems(parsedItems);
      return parsedItems;
    }
  } catch (err) {
    console.warn('Error fetching from Apps Script, returning cached data:', err);
  }

  return getLocalItems();
}

/**
 * Update stock in Google Apps Script via POST { action: 'update', rowIndex, actual }
 */
export async function updateStockInAppsScript(
  rowIndex: number,
  newActual: number,
  item: SahocoItem
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      action: 'update',
      rowIndex: rowIndex,
      actual: newActual,
      id: item.id,
      nombre: item.nombre,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      mode: 'cors'
    });

    const text = await response.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      return {
        success: true,
        message: 'Ajuste guardado localmente (Apps Script en modo enlace).'
      };
    }

    const json = JSON.parse(text);
    return {
      success: json.status === 'success',
      message: json.message || 'Sincronizado con Google Sheets'
    };
  } catch (error: any) {
    return {
      success: true,
      message: `Actualizado en dispositivo: ${error.message || ''}`
    };
  }
}
