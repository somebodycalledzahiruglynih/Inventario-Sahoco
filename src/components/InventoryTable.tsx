import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Sparkles,
  ArrowUpDown,
  Building2,
  Tag,
  Mic,
  PackagePlus,
  RefreshCcw,
  Flame,
  PieChart
} from 'lucide-react';
import { InventoryItem, Category, StockStatus } from '../types/inventory';
import { CATEGORIES_CONFIG, SUPLIDORES_LIST } from '../data/initialData';
import { formatCurrency, formatDate } from '../lib/utils';

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdateStock: (itemId: string, newStock: number, reason: string) => void;
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onQuickLogWaste: (item: InventoryItem) => void;
  isUnlocked: boolean;
  onRequestUnlock: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onUpdateStock,
  onSaveItem,
  onDeleteItem,
  onQuickLogWaste,
  isUnlocked,
  onRequestUnlock
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'nombre' | 'stockActual' | 'costoUnitario' | 'stockRatio'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal States
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustValue, setAdjustValue] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);

  // Quick Adjustment handler with optimistic response
  const handleQuickTap = (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, Number((item.stockActual + delta).toFixed(2)));
    onUpdateStock(item.id, newStock, `Ajuste rápido ${delta > 0 ? '+' : ''}${delta} ${item.unidad}`);
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustValue(item.stockActual.toString());
  };

  const handleConfirmAdjust = () => {
    if (!adjustingItem) return;
    const val = parseFloat(adjustValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(adjustingItem.id, val, `Ajuste manual directo a ${val} ${adjustingItem.unidad}`);
    }
    setAdjustingItem(null);
  };

  const handleOpenNewItem = () => {
    if (!isUnlocked) {
      onRequestUnlock();
      return;
    }
    setEditingItem({
      id: `ITM-${Date.now().toString().slice(-4)}`,
      nombre: '',
      categoria: 'insumos_salado',
      suplidor: 'PriceSmart',
      unidad: 'lb',
      stockActual: 10,
      stockMinimo: 5,
      stockMaximo: 50,
      costoUnitario: 100,
      ubicacion: 'Almacén General'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    if (!isUnlocked) {
      onRequestUnlock();
      return;
    }
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.nombre) return;
    onSaveItem(editingItem as InventoryItem);
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Helper to determine status
  const getItemStatus = (item: InventoryItem): StockStatus => {
    if (item.stockActual <= 0) return 'out';
    if (item.stockActual <= item.stockMinimo) return 'low';
    return 'healthy';
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Search
        const matchesSearch = 
          item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.suplidor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.ubicacion && item.ubicacion.toLowerCase().includes(searchQuery.toLowerCase()));

        // Category
        const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;

        // Supplier
        const matchesSupplier = selectedSupplier === 'all' || item.suplidor === selectedSupplier;

        // Status
        const status = getItemStatus(item);
        const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

        return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'stockRatio') {
          valA = a.stockMaximo > 0 ? a.stockActual / a.stockMaximo : 0;
          valB = b.stockMaximo > 0 ? b.stockActual / b.stockMaximo : 0;
        } else {
          valA = a[sortField];
          valB = b[sortField];
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [items, searchQuery, selectedCategory, selectedSupplier, selectedStatus, sortField, sortDirection]);

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Action Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por insumo, postre Synthia, suplidor o ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-900/90 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Selectors & New Item Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs font-medium text-neutral-200 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Todas las Categorías</option>
              {CATEGORIES_CONFIG.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
              ))}
            </select>

            {/* Suplidor Filter */}
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs font-medium text-neutral-200 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Todos los Suplidores</option>
              {SUPLIDORES_LIST.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs font-medium text-neutral-200 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Cualquier Estado</option>
              <option value="out">🔴 Agotados</option>
              <option value="low">🟡 Stock Bajo</option>
              <option value="healthy">🟢 Saludable</option>
            </select>

            {/* Add Item Button */}
            <button
              onClick={handleOpenNewItem}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-semibold shadow-glow-orange transition-all active:scale-95 ml-auto"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Nuevo Insumo</span>
            </button>

          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-neutral-800 text-white border border-white/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            Todos ({items.length})
          </button>
          {CATEGORIES_CONFIG.map(cat => {
            const count = items.filter(i => i.categoria === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-900/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    if (sortField === 'nombre') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortField('nombre'); setSortDirection('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Artículo & Ubicación</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-3">Categoría & Suplidor</th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    if (sortField === 'stockActual') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortField('stockActual'); setSortDirection('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nivel de Stock</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    if (sortField === 'costoUnitario') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortField('costoUnitario'); setSortDirection('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Costo / Valor</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Ajuste Rápido (Quick-Tap)</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-400">
                    <p className="text-base font-medium">No se encontraron artículos</p>
                    <p className="text-xs text-neutral-500 mt-1">Prueba cambiando los filtros o la búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const status = getItemStatus(item);
                  const categoryInfo = CATEGORIES_CONFIG.find(c => c.id === item.categoria);
                  const percentage = item.stockMaximo > 0 
                    ? Math.min(100, Math.round((item.stockActual / item.stockMaximo) * 100))
                    : 0;

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name & Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white group-hover:text-orange-400 transition-colors flex items-center gap-2">
                            {item.nombre}
                          </span>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                            <span className="text-neutral-500">📍</span> {item.ubicacion || 'Almacén general'}
                          </span>
                        </div>
                      </td>

                      {/* Category & Supplier */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-white/10 font-medium">
                            {categoryInfo?.icon} {categoryInfo?.label || item.categoria}
                          </span>
                          <span className="text-xs text-neutral-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-neutral-500" />
                            {item.suplidor}
                          </span>
                        </div>
                      </td>

                      {/* Stock Level & Progress Bar */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="font-extrabold text-base text-white">
                              {item.stockActual} <span className="text-xs font-normal text-neutral-400">{item.unidad}</span>
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              Mín: {item.stockMinimo} / Máx: {item.stockMaximo}
                            </span>
                          </div>
                          {/* Visual progress bar */}
                          <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                status === 'out'
                                  ? 'bg-rose-500'
                                  : status === 'low'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(5, percentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cost & Total Value */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-xs">
                          <span className="text-neutral-300 font-medium">{formatCurrency(item.costoUnitario)}</span>
                          <span className="text-[10px] text-neutral-500">/{item.unidad}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Total: <span className="text-neutral-200">{formatCurrency(item.stockActual * item.costoUnitario)}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {status === 'out' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3.5 h-3.5" />
                            Agotado
                          </span>
                        )}
                        {status === 'low' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Stock Bajo
                          </span>
                        )}
                        {status === 'healthy' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Saludable
                          </span>
                        )}
                      </td>

                      {/* Quick-Tap Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 p-1 bg-neutral-900/90 rounded-xl border border-white/10 shadow-sm">
                          <button
                            onClick={() => handleQuickTap(item, -5)}
                            disabled={item.stockActual < 5}
                            className="px-2 py-1 text-xs font-bold rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Descontar 5"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleQuickTap(item, -1)}
                            disabled={item.stockActual <= 0}
                            className="px-2 py-1 text-xs font-bold rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Descontar 1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleQuickTap(item, 1)}
                            className="px-2 py-1 text-xs font-bold rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                            title="Sumar 1"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleQuickTap(item, 5)}
                            className="px-2 py-1 text-xs font-bold rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Sumar 5"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                            title="Ajuste exacto"
                          >
                            Ajustar
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Waste Action */}
                          <button
                            onClick={() => onQuickLogWaste(item)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Registrar merma / daño"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>

                          {/* Edit Item */}
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Editar artículo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => {
                              if (!isUnlocked) {
                                onRequestUnlock();
                                return;
                              }
                              if (confirm(`¿Estás seguro de eliminar "${item.nombre}"?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar artículo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer Summary */}
        <div className="py-3 px-4 bg-neutral-900/80 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
          <span>Mostrando {filteredItems.length} de {items.length} artículos</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {items.filter(i => i.stockActual <= 0).length} Agotados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {items.filter(i => i.stockActual > 0 && i.stockActual <= i.stockMinimo).length} Bajos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {items.filter(i => i.stockActual > i.stockMinimo).length} Saludables
            </span>
          </div>
        </div>
      </div>

      {/* Direct Adjust Dialog Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full border border-white/20 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">
              Ajustar Stock Físico
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              {adjustingItem.nombre} ({adjustingItem.unidad})
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Nuevo Stock Actual
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">
                  {adjustingItem.unidad}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-glow-orange transition-all"
              >
                Guardar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / New Item Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingItem.id && items.some(i => i.id === editingItem.id) ? 'Editar Insumo' : 'Nuevo Insumo SAHOCO'}
                </h3>
                <p className="text-xs text-neutral-400">Configure los umbrales de stock y costeo</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Nombre del Insumo / Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Pechuga de Pollo Fileteada, Tres Leches..."
                  value={editingItem.nombre || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Categoría *</label>
                  <select
                    value={editingItem.categoria || 'insumos_salado'}
                    onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value as Category })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    {CATEGORIES_CONFIG.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Suplidor Principal *</label>
                  <select
                    value={editingItem.suplidor || 'PriceSmart'}
                    onChange={(e) => setEditingItem({ ...editingItem, suplidor: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    {SUPLIDORES_LIST.map(sup => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Unidad</label>
                  <select
                    value={editingItem.unidad || 'lb'}
                    onChange={(e) => setEditingItem({ ...editingItem, unidad: e.target.value as any })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    <option value="kg">kg</option>
                    <option value="unidad">unidad</option>
                    <option value="paquete">paquete</option>
                    <option value="cubeta">cubeta</option>
                    <option value="galon">galon</option>
                    <option value="caja">caja</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Stock Actual</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingItem.stockActual ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, stockActual: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Stock Mínimo</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingItem.stockMinimo ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, stockMinimo: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Stock Máximo</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingItem.stockMaximo ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, stockMaximo: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Costo Unitario (RD$) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingItem.costoUnitario ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, costoUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">Ubicación Física</label>
                  <input
                    type="text"
                    placeholder="ej: Nevera Carnes, Vitrina Postres..."
                    value={editingItem.ubicacion || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, ubicacion: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-glow-orange transition-all"
                >
                  Guardar Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
