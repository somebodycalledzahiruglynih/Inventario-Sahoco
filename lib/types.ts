export type UnitType = 'Paquete' | 'Unidad' | 'Cajas' | 'Libras' | 'Galón' | string;

export type MainCategory = 'Insumos & Salado' | 'Postres & Repostería' | 'Bebidas' | 'Desechables';

export interface ProductItem {
  id: string;
  rowIndex: number;
  nombre: string;
  suplidor: string;
  categoria: MainCategory;
  descripcion: string;
  foto: string;
  fechaVencimiento: string; // YYYY-MM-DD
  stockActual: number;
  unidad: UnitType;
  stockMinimo: number;
  stockMaximo: number;
  cantidadSugerida: number;
  ultimaModificacion?: string;
  modificadoPor?: string;
  // Prioridad de insumo clave de cocina (Configuración → Prioridad de Insumos)
  esPrioritario?: boolean;
  nivelPrioridad?: 'Alta' | 'Media' | 'Baja';
}

export type HistoryTipo =
  | 'INCREMENTO'
  | 'DECREMENTO'
  | 'SUGERIDO_EDITADO'
  | 'NUEVO_PRODUCTO'
  | 'ELIMINACION_PRODUCTO'
  | 'COMPRA_RECIBIDA'
  | 'COMISO'
  | 'PREPARACION_PLATO'
  | 'INFO_EDITADO'
  | 'RECETA_CREADA'
  | 'RECETA_EDITADA'
  | 'RECETA_ELIMINADA';

export interface HistoryRecord {
  id: string;
  timestamp: string;
  usuario: string;
  itemId: string;
  itemNombre: string;
  itemFoto?: string;
  tipo: HistoryTipo;
  detalle: string;
  cantidadAnterior?: number;
  cantidadNueva?: number;
  motivo?: string;
  fechaVencimiento?: string;
  notas?: string;
}

// ── Módulo de Comisos / Mermas ──
export type MotivoComiso = 'Vencimiento' | 'Daño físico' | 'Error de preparación' | 'Otro';

export const MOTIVOS_COMISO: MotivoComiso[] = [
  'Vencimiento',
  'Daño físico',
  'Error de preparación',
  'Otro'
];

export const MOTIVO_STYLES: Record<MotivoComiso, { icon: string; desc: string; color: string }> = {
  'Vencimiento': { icon: '📅', desc: 'Producto vencido o caducado', color: 'border-red-500/40 bg-red-500/10 text-red-300' },
  'Daño físico': { icon: '💔', desc: 'Roto, golpeado o derramado', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  'Error de preparación': { icon: '🍳', desc: 'Se quemó o quedó mal', color: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
  'Otro': { icon: '📝', desc: 'Otra razón de pérdida', color: 'border-slate-500/40 bg-slate-500/10 text-slate-300' }
};

export interface ComisoPayload {
  cantidad: number;
  motivo: MotivoComiso;
  fechaVencimiento?: string;
  notas?: string;
}

// ── Sistema de Recetas ──
export type RecipeCategory = 'Salado' | 'Postres' | 'Bebidas' | 'Otros';

export const RECIPE_CATEGORIES: { id: RecipeCategory; label: string; icon: string }[] = [
  { id: 'Salado', label: 'Salado', icon: '🍟' },
  { id: 'Postres', label: 'Postres', icon: '🍰' },
  { id: 'Bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'Otros', label: 'Otros', icon: '✨' }
];

export interface RecipeIngredient {
  productId: string;
  rowIndex: number;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface Recipe {
  id: string;
  nombre: string;
  categoria: RecipeCategory;
  descripcion?: string;
  ingredientes: RecipeIngredient[];
  creadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

export const AUTHORIZED_USERS = [
  { name: 'Zahir', avatar: '👤' },
  { name: 'Alba', avatar: '👤' },
  { name: 'Elmy', avatar: '👤' },
  { name: 'Hugo', avatar: '👤' },
  { name: 'Leo', avatar: '👤' },
  { name: 'Rosalia', avatar: '👤' },
  { name: 'Cecilio', avatar: '👤' },
  { name: 'SAHOCO', avatar: '🏢' },
] as const;

export type UserName = typeof AUTHORIZED_USERS[number]['name'];

export const AUTH_PASSWORD = 's4hoco2026';
