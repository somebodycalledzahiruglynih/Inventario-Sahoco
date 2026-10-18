export type StockStatus = 'healthy' | 'low' | 'out';

export type Category = 
  | 'insumos_salado' 
  | 'carnes_embutidos' 
  | 'quesos_lacteos' 
  | 'salsas_aderezos' 
  | 'postres_synthia' 
  | 'desechables_empaques' 
  | 'bebidas_toppings';

export interface InventoryItem {
  id: string;
  nombre: string;
  categoria: Category;
  suplidor: string;
  unidad: 'lb' | 'oz' | 'kg' | 'unidad' | 'paquete' | 'cubeta' | 'galon' | 'caja';
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  costoUnitario: number; // en RD$ (Pesos Dominicanos)
  precioVentaSugerido?: number;
  ubicacion?: string; // ej: "Nevera 1", "Congelador Carnes", "Estante Seco", "Vitrina Postres"
  ultimaModificacion?: string;
  modificadoPor?: string;
}

export interface WasteRecord {
  id: string;
  itemId: string;
  itemNombre: string;
  cantidad: number;
  unidad: string;
  motivo: 'Vencimiento' | 'Caída o Derrame' | 'Mal estado de origen' | 'Error en preparación' | 'Fallo de refrigeración' | 'Otro';
  costoPerdido: number;
  fecha: string;
  registradoPor: string;
  notas?: string;
}

export interface RecipeIngredient {
  itemId: string;
  cantidad: number; // en la unidad del insumo (ej: oz, lb, unidad)
}

export interface Recipe {
  id: string;
  nombre: string;
  categoria: 'Salado' | 'Postre' | 'Bebida';
  descripcion: string;
  precioVenta: number; // RD$
  ingredientes: RecipeIngredient[];
  imagen?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  usuario: string;
  accion: 'AJUSTE_STOCK' | 'VENTA_REGISTRADA' | 'MERMA_REGISTRADA' | 'CREACION_ITEM' | 'EDICION_ITEM' | 'ELIMINACION_ITEM' | 'SYNC_SHEETS';
  detalle: string;
  tipo: 'info' | 'warning' | 'alert';
}

export interface SyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  lastSynced: string | null;
  scriptUrl: string;
  pendingSyncCount: number;
  isSyncing: boolean;
  error?: string | null;
}
