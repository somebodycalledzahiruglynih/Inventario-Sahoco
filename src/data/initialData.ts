import { InventoryItem, Recipe, Category } from '../types/inventory';

export const CATEGORIES_CONFIG: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'insumos_salado', label: 'Salado y Guarniciones', icon: '🍟', color: 'from-amber-500 to-orange-500' },
  { id: 'carnes_embutidos', label: 'Carnes y Embutidos', icon: '🥩', color: 'from-red-500 to-rose-600' },
  { id: 'quesos_lacteos', label: 'Quesos y Lácteos', icon: '🧀', color: 'from-yellow-400 to-amber-500' },
  { id: 'salsas_aderezos', label: 'Salsas y Aderezos', icon: '🥫', color: 'from-orange-500 to-red-500' },
  { id: 'postres_synthia', label: 'Postres y Repostería (Synthia)', icon: '🍰', color: 'from-pink-500 to-purple-500' },
  { id: 'desechables_empaques', label: 'Desechables y Empaques', icon: '📦', color: 'from-blue-500 to-cyan-500' },
  { id: 'bebidas_toppings', label: 'Bebidas y Toppings', icon: '🥤', color: 'from-emerald-500 to-teal-500' },
];

export const SUPLIDORES_LIST = [
  'PriceSmart',
  'Sirena',
  'Merca Jumbo',
  'Synthia Postres',
  'Neno Distribuidora',
  'Carnes El Primo',
  'Distribuidora Repostera'
];

// CERO DATOS FICTICIOS
export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'REC-001',
    nombre: 'Yaroa Pequeña de Pollo',
    categoria: 'Salado',
    descripcion: 'Papas fritas crujientes (6oz) coronadas con pechuga sazonada (6oz), queso mozzarella derretido (2oz) y salsas Sahoco.',
    precioVenta: 260.00,
    ingredientes: [
      { itemId: 'ITM-001', cantidad: 6 },
      { itemId: 'ITM-002', cantidad: 6 },
      { itemId: 'ITM-006', cantidad: 2 },
      { itemId: 'ITM-009', cantidad: 1 },
    ]
  }
];

export const INITIAL_WASTE_RECORDS = [];
