'use client';

import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Copy, 
  Check, 
  Building2, 
  CheckCircle2, 
  FileText,
  PackagePlus,
  Search,
  Sparkles
} from 'lucide-react';
import { ProductItem, MainCategory } from '../lib/types';

interface ShoppingListViewProps {
  products: ProductItem[];
  onRequestRestock: (product: ProductItem) => void;
  onUpdateSugerido: (product: ProductItem, newSugerido: number) => void;
}

const REPOSICION_CATEGORIES: { id: MainCategory | 'Todos'; label: string; icon: string }[] = [
  { id: 'Todos', label: 'Todos', icon: '✨' },
  { id: 'Insumos & Salado', label: 'Salado', icon: '🍟' },
  { id: 'Postres & Repostería', label: 'Postres & Repostería', icon: '🍰' },
  { id: 'Bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'Desechables', label: 'Desechables', icon: '📦' },
];

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  products,
  onRequestRestock,
  onUpdateSugerido: _onUpdateSugerido
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Filter all items where stockActual <= stockMinimo
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stockActual <= p.stockMinimo);
  }, [products]);

  // Count items needing restock per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Todos': lowStockItems.length,
      'Insumos & Salado': 0,
      'Postres & Repostería': 0,
      'Bebidas': 0,
      'Desechables': 0,
    };
    lowStockItems.forEach(item => {
      if (counts[item.categoria] !== undefined) {
        counts[item.categoria]++;
      }
    });
    return counts;
  }, [lowStockItems]);

  // Filter by category and search term
  const filteredItems = useMemo(() => {
    return lowStockItems.filter(item => {
      const matchCat = selectedCategory === 'Todos' || item.categoria === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.nombre.toLowerCase().includes(q) || 
        item.suplidor.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [lowStockItems, selectedCategory, searchQuery]);

  // Group by Supplier based on filtered items
  const grouped = useMemo(() => {
    const map: Record<string, ProductItem[]> = {};
    filteredItems.forEach(item => {
      const sup = item.suplidor || 'Proveedor General';
      if (!map[sup]) map[sup] = [];
      map[sup].push(item);
    });
    return map;
  }, [filteredItems]);

  const suppliers = Object.keys(grouped);

  // Text formatter for supplier
  const getSupplierOrderText = (supplier: string) => {
    const items = grouped[supplier] || [];
    const date = new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    
    let text = `LISTA DE REPOSICIÓN - SAHOCO\n`;
    text += `Proveedor: ${supplier}\n`;
    if (selectedCategory !== 'Todos') {
      text += `Categoría: ${selectedCategory}\n`;
    }
    text += `Fecha: ${date}\n`;
    text += `----------------------------------------\n`;
    
    items.forEach((item, idx) => {
      const cantidadPedir = item.cantidadSugerida || Math.max(1, item.stockMaximo - item.stockActual);
      text += `${idx + 1}. ${item.nombre}: ${cantidadPedir} ${item.unidad} (Stock actual: ${item.stockActual})\n`;
    });
    
    text += `----------------------------------------\n`;
    text += `Total insumos a reponer: ${items.length}\n`;
    return text;
  };

  const handleCopySupplierOrder = (supplier: string) => {
    const text = getSupplierOrderText(supplier);
    navigator.clipboard.writeText(text);
    setCopiedSupplier(supplier);
    setTimeout(() => setCopiedSupplier(null), 2000);
  };

  const handleCopyAllOrders = () => {
    const date = new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    let allText = `RESUMEN GENERAL DE REPOSICIÓN - SAHOCO\n`;
    if (selectedCategory !== 'Todos') {
      allText += `Filtro de Categoría: ${selectedCategory}\n`;
    }
    allText += `Fecha: ${date}\n`;
    allText += `========================================\n\n`;

    suppliers.forEach(sup => {
      allText += getSupplierOrderText(sup);
      allText += `\n`;
    });

    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Header Banner */}
      <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/25 text-orange-400 shadow-sm flex-none">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Lista de Reposición Directa</span>
              {lowStockItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {lowStockItems.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Insumos con existencia menor o igual al stock mínimo
            </p>
          </div>
        </div>

        {filteredItems.length > 0 && (
          <button
            onClick={handleCopyAllOrders}
            className="flex items-center justify-center gap-2 py-2 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-95 transition-all self-start sm:self-auto"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-white" /> : <FileText className="w-3.5 h-3.5" />}
            <span>
              {copiedAll 
                ? '¡Copiado!' 
                : selectedCategory === 'Todos' 
                  ? 'Copiar Resumen Completo' 
                  : `Copiar Resumen (${selectedCategory})`}
            </span>
          </button>
        )}
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {REPOSICION_CATEGORIES.map(cat => {
          const count = categoryCounts[cat.id] || 0;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_2px_12px_rgba(249,115,22,0.4)]'
                  : 'bg-[#1a1a1a] border border-white/[0.08] text-slate-400 hover:bg-[#242424] hover:border-orange-500/20'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : count > 0
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                    : 'bg-[#242424] text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search Bar for Shopping List (when items exist) */}
      {lowStockItems.length > 3 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por insumo o proveedor a reponer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* 4. Active Filter Summary */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
        <span>
          Mostrando {filteredItems.length} {filteredItems.length === 1 ? 'insumo' : 'insumos'}
          {selectedCategory !== 'Todos' && (
            <span> en <strong className="text-orange-400">{selectedCategory}</strong></span>
          )}
          {lowStockItems.length !== filteredItems.length && (
            <span> (de {lowStockItems.length} en total)</span>
          )}
        </span>
        {(selectedCategory !== 'Todos' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory('Todos');
              setSearchQuery('');
            }}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold underline ml-2 transition-colors"
          >
            Restablecer filtros
          </button>
        )}
      </div>

      {/* 5. STATE: Zero Low Stock In Entire Inventory */}
      {lowStockItems.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2.5" />
          <h3 className="text-base font-bold text-white mb-1">
            ¡Todos los insumos están abastecidos!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Ningún producto se encuentra por debajo de su umbral mínimo de seguridad.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        /* STATE: Zero Low Stock for Selected Category */
        <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            No hay insumos por reponer en {selectedCategory !== 'Todos' ? `"${selectedCategory}"` : 'esta búsqueda'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Todos los insumos de esta sección se encuentran en niveles seguros de stock.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Todos');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition-all"
          >
            Ver todos los insumos a reponer
          </button>
        </div>
      ) : (
        /* 6. Supplier Groups Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suppliers.map(supplier => {
            const items = grouped[supplier] || [];
            const isCopied = copiedSupplier === supplier;

            return (
              <div 
                key={supplier}
                className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Supplier Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-orange-400 flex-none" />
                      <h3 className="font-bold text-sm text-white">
                        {supplier}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#242424] text-slate-300 border border-white/[0.06]">
                        {items.length} {items.length === 1 ? 'insumo' : 'insumos'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopySupplierOrder(supplier)}
                      className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] text-slate-200 text-xs font-bold transition-colors border border-white/[0.06]"
                      title="Copiar texto de reposición"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                      <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* Items in this supplier */}
                  <div className="divide-y divide-white/[0.06] mt-1">
                    {items.map((item, idx) => {
                      const isOutOfStock = item.stockActual <= 0;

                      return (
                        <div 
                          key={`${item.id}-${item.rowIndex || idx}`} 
                          className="py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={item.foto} 
                              alt={item.nombre} 
                              className="w-10 h-10 rounded-xl object-cover bg-[#242424] flex-none border border-white/[0.08]" 
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs sm:text-sm text-white truncate block">
                                  {item.nombre}
                                </span>
                                {isOutOfStock ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/25 flex-none">
                                    Agotado
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/25 flex-none">
                                    Bajo
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>
                                  Stock: <strong className="text-white">{item.stockActual}</strong> {item.unidad} • Mín: {item.stockMinimo}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/[0.05] text-slate-400 border border-white/[0.05]">
                                  {item.categoria}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button: Reponer Stock / Registrar Entrada */}
                          <div className="flex items-center gap-2 flex-none">
                            <button
                              onClick={() => onRequestRestock(item)}
                              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                              title="Registrar entrada de insumo"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span className="whitespace-nowrap">Reponer</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
