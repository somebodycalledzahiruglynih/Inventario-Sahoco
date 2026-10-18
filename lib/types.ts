export type UnitType = 'Paquete' | 'Unidad' | 'Cajas' | 'Libras' | 'Galón';

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
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  usuario: string;
  itemId: string;
  itemNombre: string;
  itemFoto?: string;
  tipo: 'INCREMENTO' | 'DECREMENTO' | 'SUGERIDO_EDITADO' | 'NUEVO_PRODUCTO' | 'ELIMINACION_PRODUCTO' | 'COMPRA_RECIBIDA';
  detalle: string;
  cantidadAnterior?: number;
  cantidadNueva?: number;
}

export const AUTHORIZED_USERS = [
  { name: 'Zahir', avatar: '👤' },
  { name: 'Alba', avatar: '👤' },
  { name: 'Elmy', avatar: '👤' },
  { name: 'Hugo', avatar: '👤' },
  { name: 'Leo', avatar: '👤' },
  { name: 'Rosalia', avatar: '👤' },
  { name: 'SAHOCO', avatar: '🏢' },
] as const;

export type UserName = typeof AUTHORIZED_USERS[number]['name'];

export const AUTH_PASSWORD = 's4hoco2026';
