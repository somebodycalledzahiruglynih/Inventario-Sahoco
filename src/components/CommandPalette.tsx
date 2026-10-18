import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  Utensils, 
  ShoppingCart, 
  Trash2, 
  Building2, 
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { InventoryItem, Recipe } from '../types/inventory';
import { INITIAL_RECIPES } from '../data/initialData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onSelectTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onSelectTab
}) => {
  const [query, setQuery] = useState('');

  // Handle Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => 
    item.nombre.toLowerCase().includes(query.toLowerCase()) ||
    item.suplidor.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  const filteredRecipes = INITIAL_RECIPES.filter(recipe => 
    recipe.nombre.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div 
        className="glass-card rounded-2xl max-w-xl w-full border border-white/20 shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-neutral-900/80">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            placeholder="Escribe para buscar insumo, receta, proveedor o atajo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-bold rounded bg-neutral-800 text-neutral-400 border border-white/10">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          
          {/* Quick Actions / Navigation */}
          {!query && (
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-2 mb-2">
                Navegación Rápida
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { tab: 'inventory', label: '📦 Ver Inventario Completo' },
                  { tab: 'recipes', label: '🍔 Recetario y Simulador Venta' },
                  { tab: 'shopping', label: '🛒 Lista de Compras (Stock Bajo)' },
                  { tab: 'waste', label: '🗑️ Registrar Merma / Pérdida' },
                ].map(action => (
                  <button
                    key={action.tab}
                    onClick={() => {
                      onSelectTab(action.tab);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors border border-white/5"
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Insumos & Postres Synthia Results */}
          {filteredItems.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-2 mb-2 flex items-center justify-between">
                <span>Insumos & Postres ({filteredItems.length})</span>
                <span className="text-[10px] text-neutral-500">Stock Actual</span>
              </div>
              <div className="space-y-1">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item);
                      onSelectTab('inventory');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 text-xs text-left transition-colors border border-transparent hover:border-white/10 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-neutral-800 text-orange-400 group-hover:scale-105 transition-transform">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {item.nombre}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {item.suplidor} • {item.ubicacion || 'Almacén'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${item.stockActual <= item.stockMinimo ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.stockActual} {item.unidad}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recetario Results */}
          {filteredRecipes.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-2 mb-2">
                Platos & Recetas SAHOCO
              </div>
              <div className="space-y-1">
                {filteredRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => {
                      onSelectTab('recipes');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 text-xs text-left transition-colors border border-transparent hover:border-white/10 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-neutral-800 text-amber-400">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {recipe.nombre}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {recipe.categoria} • Venta: RD$ {recipe.precioVenta}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 && filteredRecipes.length === 0 && query && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No se encontraron coincidencias para "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-neutral-900/90 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Consejo: Usa flechas y Enter o haz clic para acceder rápidamente</span>
          <span className="font-semibold text-orange-400">SAHOCO QuickBar</span>
        </div>
      </div>
    </div>
  );
};
