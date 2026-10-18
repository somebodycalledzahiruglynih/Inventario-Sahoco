import { Recipe } from './types';

const STORAGE_KEY_RECIPES = 'sahoco_live_recipes_v1';

export function getLocalRecipes(): Recipe[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECIPES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(r => r && typeof r.id === 'string' && typeof r.nombre === 'string');
      }
    }
  } catch (e) {
    console.error('Error reading cached recipes', e);
  }
  return [];
}

export function saveLocalRecipes(recipes: Recipe[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(recipes));
  } catch (e) {
    console.error('Error saving recipes cache', e);
  }
}

export function createRecipeId(): string {
  return `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Normaliza una receta proveniente de Google Sheets o caché local,
 * garantizando que la lista de ingredientes sea válida.
 */
export function normalizeRecipe(raw: any): Recipe | null {
  if (!raw || typeof raw !== 'object') return null;
  const nombre = String(raw.nombre || '').trim();
  if (!nombre) return null;

  const ingredientes = Array.isArray(raw.ingredientes)
    ? raw.ingredientes
        .map((ing: any) => ({
          productId: String(ing?.productId || ''),
          rowIndex: Number(ing?.rowIndex || 0),
          nombre: String(ing?.nombre || '').trim(),
          cantidad: Number(ing?.cantidad) || 0,
          unidad: String(ing?.unidad || 'Unidad')
        }))
        .filter((ing: any) => ing.productId && ing.cantidad > 0)
    : [];

  const categorias = ['Salado', 'Postres', 'Bebidas', 'Otros'];
  const categoria = categorias.includes(raw.categoria) ? raw.categoria : 'Otros';

  return {
    id: String(raw.id || createRecipeId()),
    nombre,
    categoria,
    descripcion: String(raw.descripcion || ''),
    ingredientes,
    creadoPor: String(raw.creadoPor || 'SAHOCO'),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString())
  };
}
