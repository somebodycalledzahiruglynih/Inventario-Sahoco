import React, { useState } from 'react';
import { 
  Utensils, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Zap, 
  Percent, 
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InventoryItem, Recipe } from '../types/inventory';
import { INITIAL_RECIPES } from '../data/initialData';
import { formatCurrency } from '../lib/utils';

interface MenuSimulatorProps {
  items: InventoryItem[];
  onSellRecipe: (recipe: Recipe, quantity: number) => { success: boolean; message: string };
}

export const MenuSimulator: React.FC<MenuSimulatorProps> = ({
  items,
  onSellRecipe
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'Salado' | 'Postre'>('Todos');
  const [saleQuantities, setSaleQuantities] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const getSaleQty = (recipeId: string) => saleQuantities[recipeId] || 1;

  const setSaleQty = (recipeId: string, qty: number) => {
    setSaleQuantities(prev => ({ ...prev, [recipeId]: Math.max(1, qty) }));
  };

  // Helper to calculate exact ingredient cost for a recipe
  const calculateRecipeCost = (recipe: Recipe) => {
    let cost = 0;
    recipe.ingredientes.forEach(ing => {
      const item = items.find(i => i.id === ing.itemId);
      if (item) {
        cost += ing.cantidad * item.costoUnitario;
      }
    });
    return cost;
  };

  // Helper to calculate maximum portions that can be made with current inventory
  const calculateAvailablePortions = (recipe: Recipe) => {
    let maxPortions = 9999;
    recipe.ingredientes.forEach(ing => {
      const item = items.find(i => i.id === ing.itemId);
      if (!item || item.stockActual <= 0) {
        maxPortions = 0;
      } else {
        const canMake = Math.floor(item.stockActual / ing.cantidad);
        if (canMake < maxPortions) {
          maxPortions = canMake;
        }
      }
    });
    return maxPortions === 9999 ? 0 : maxPortions;
  };

  const handleRegisterSale = (recipe: Recipe) => {
    const qty = getSaleQty(recipe.id);
    const result = onSellRecipe(recipe, qty);

    if (result.success) {
      // Trigger festive confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f97316', '#eab308', '#10b981', '#f43f5e']
      });

      setToastMessage({ text: result.message });
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      setToastMessage({ text: result.message, isError: true });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const filteredRecipes = recipes.filter(r => 
    selectedCategory === 'Todos' || r.categoria === selectedCategory
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-glow-orange">
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Costo, Porcionado y Simulador de Venta
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Fórmula de porcionado exacto por plato (oz/unidades). Al registrar venta, descuenta los ingredientes de cocina en tiempo real.
            </p>
          </div>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-white/10">
          {(['Todos', 'Salado', 'Postre'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat === 'Salado' ? '🍟 Salado' : cat === 'Postre' ? '🍰 Synthia Postres' : '✨ Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 ${
          toastMessage.isError
            ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.isError ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => {
          const cost = calculateRecipeCost(recipe);
          const margin = recipe.precioVenta > 0 
            ? ((recipe.precioVenta - cost) / recipe.precioVenta) * 100 
            : 0;
          const portions = calculateAvailablePortions(recipe);
          const saleQty = getSaleQty(recipe.id);

          return (
            <div 
              key={recipe.id}
              className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all group"
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                      {recipe.categoria}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">
                      {recipe.nombre}
                    </h3>
                  </div>

                  {/* Portions badge */}
                  <div className={`text-right px-2.5 py-1 rounded-xl border text-xs font-bold ${
                    portions > 10 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : portions > 0
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    <span className="block text-[10px] font-normal text-neutral-400">Disponible</span>
                    <span>{portions} raciones</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 mb-4 line-clamp-2">
                  {recipe.descripcion}
                </p>

                {/* Porcionado Breakdown */}
                <div className="bg-neutral-900/80 rounded-xl p-3 border border-white/5 mb-4">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Fórmula de Porcionado</span>
                    <span>Stock Actual</span>
                  </div>
                  <div className="space-y-1.5">
                    {recipe.ingredientes.map(ing => {
                      const item = items.find(i => i.id === ing.itemId);
                      const isLow = item ? item.stockActual < (ing.cantidad * saleQty) : true;

                      return (
                        <div key={ing.itemId} className="flex items-center justify-between text-xs">
                          <span className="text-neutral-300">
                            • <strong className="text-white">{ing.cantidad} {item?.unidad}</strong> {item?.nombre.split('(')[0]}
                          </span>
                          <span className={`font-medium ${isLow ? 'text-rose-400' : 'text-neutral-400'}`}>
                            {item ? `${item.stockActual} ${item.unidad}` : 'No encontrado'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial KPIs for this dish */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 mb-4 text-center">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Costo Insumos</span>
                    <span className="text-xs font-bold text-neutral-200">{formatCurrency(cost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Precio Venta</span>
                    <span className="text-xs font-bold text-white">{formatCurrency(recipe.precioVenta)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Margen Bruto</span>
                    <span className="text-xs font-bold text-emerald-400">+{margin.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Action: Sell / Deduct */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  {/* Quantity selector */}
                  <div className="flex items-center bg-neutral-900 border border-white/10 rounded-xl p-1">
                    <button
                      onClick={() => setSaleQty(recipe.id, saleQty - 1)}
                      className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center">
                      {saleQty}
                    </span>
                    <button
                      onClick={() => setSaleQty(recipe.id, saleQty + 1)}
                      className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  {/* Register Sale Button */}
                  <button
                    onClick={() => handleRegisterSale(recipe)}
                    disabled={portions < saleQty}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold shadow-glow-orange transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Registrar Venta ({saleQty > 1 ? `${saleQty}x ` : ''}{formatCurrency(recipe.precioVenta * saleQty)})</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
