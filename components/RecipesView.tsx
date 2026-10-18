'use client';

import React, { useMemo, useState } from 'react';
import {
  ChefHat,
  Plus,
  Search,
  Pencil,
  Trash2,
  UtensilsCrossed,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { ProductItem, Recipe, RecipeCategory, RECIPE_CATEGORIES } from '../lib/types';

interface RecipesViewProps {
  recipes: Recipe[];
  products: ProductItem[];
  onCreateRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onPrepareRecipe: (recipe: Recipe) => void;
}

const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  Salado: '🍟',
  Postres: '🍰',
  Bebidas: '🥤',
  Otros: '✨'
};

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  products,
  onCreateRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onPrepareRecipe
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'Todas'>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: recipes.length };
    RECIPE_CATEGORIES.forEach(c => {
      counts[c.id] = recipes.filter(r => r.categoria === c.id).length;
    });
    return counts;
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes.filter(r => {
      const matchCat = selectedCategory === 'Todas' || r.categoria === selectedCategory;
      const matchSearch = !q ||
        r.nombre.toLowerCase().includes(q) ||
        (r.descripcion || '').toLowerCase().includes(q) ||
        r.ingredientes.some(i => i.nombre.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [recipes, selectedCategory, searchQuery]);

  const getStockStatus = (recipe: Recipe) => {
    let ready = 0;
    let low = 0;
    let missing = 0;
    recipe.ingredientes.forEach(ing => {
      const product = products.find(p => p.id === ing.productId);
      if (!product) {
        missing++;
      } else if (product.stockActual < ing.cantidad) {
        low++;
      } else {
        ready++;
      }
    });
    return { ready, low, missing, total: recipe.ingredientes.length };
  };

  return (
    <div className="space-y-4">

      {/* Header Banner */}
      <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/25 text-orange-400 shadow-sm flex-none">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Recetas del Menú</span>
              {recipes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {recipes.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Crea platos y prepara con descuento exacto de inventario
            </p>
          </div>
        </div>

        <button
          onClick={onCreateRecipe}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-95 transition-all btn-thumb self-stretch sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nueva Receta</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      {recipes.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[{ id: 'Todas' as const, label: 'Todas', icon: '📖' }, ...RECIPE_CATEGORIES].map(cat => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_2px_12px_rgba(249,115,22,0.4)]'
                    : 'bg-[#1a1a1a] border border-white/[0.08] text-slate-400 hover:bg-[#242424] hover:border-orange-500/20'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#242424] text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      {recipes.length > 3 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar receta o ingrediente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>
      )}

      {/* Empty states */}
      {recipes.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <ChefHat className="w-10 h-10 text-orange-400/60 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            Aún no hay recetas creadas
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Crea la primera receta del menú con sus ingredientes del inventario y podrás preparar platos descontando stock automáticamente.
          </p>
          <button
            onClick={onCreateRecipe}
            className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-95 transition-all inline-flex items-center gap-2 btn-thumb"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear Primera Receta</span>
          </button>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-10 text-center text-slate-500 text-xs">
          No se encontraron recetas con ese criterio.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredRecipes.map(recipe => {
            const status = getStockStatus(recipe);
            const isConfirmingDelete = confirmingDeleteId === recipe.id;

            return (
              <div
                key={recipe.id}
                className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark-card-hover flex flex-col gap-3"
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#242424] border border-white/[0.08] flex items-center justify-center text-2xl flex-none">
                    {CATEGORY_EMOJI[recipe.categoria]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-white truncate">
                        {recipe.nombre}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-500/15 text-orange-400 border border-orange-500/25">
                        {recipe.categoria}
                      </span>
                    </div>
                    {recipe.descripcion && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {recipe.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold">
                      <span className="text-slate-400">
                        {recipe.ingredientes.length} ingrediente{recipe.ingredientes.length !== 1 ? 's' : ''}
                      </span>
                      {status.total > 0 && (
                        <>
                          {status.missing > 0 || status.low > 0 ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {status.low + status.missing} por revisar
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Listo para preparar
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ingredients preview */}
                <div className="flex flex-wrap gap-1.5">
                  {recipe.ingredientes.slice(0, 4).map(ing => (
                    <span
                      key={ing.productId}
                      className="px-2 py-1 rounded-lg bg-[#242424] border border-white/[0.06] text-[10px] font-semibold text-slate-300"
                    >
                      {ing.nombre} · {ing.cantidad} {ing.unidad}
                    </span>
                  ))}
                  {recipe.ingredientes.length > 4 && (
                    <span className="px-2 py-1 rounded-lg bg-[#242424] border border-white/[0.06] text-[10px] font-bold text-orange-400">
                      +{recipe.ingredientes.length - 4} más
                    </span>
                  )}
                </div>

                {/* Actions */}
                {isConfirmingDelete ? (
                  <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                      ¿Eliminar "{recipe.nombre}"?
                    </span>
                    <div className="flex items-center gap-1.5 flex-none">
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="px-3 py-2 rounded-xl bg-[#242424] text-slate-300 text-[11px] font-bold border border-white/[0.08] hover:bg-[#2c2c2c] transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> No
                      </button>
                      <button
                        onClick={() => {
                          onDeleteRecipe(recipe);
                          setConfirmingDeleteId(null);
                        }}
                        className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Sí, eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => onPrepareRecipe(recipe)}
                      className="flex-[1.6] py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 transition-all btn-thumb flex items-center justify-center gap-2"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Preparar Plato</span>
                    </button>
                    <button
                      onClick={() => onEditRecipe(recipe)}
                      className="py-3 px-3.5 rounded-2xl bg-[#242424] hover:bg-[#2c2c2c] text-slate-200 border border-white/[0.08] text-xs font-bold transition-colors btn-thumb flex items-center justify-center"
                      title="Editar receta"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(recipe.id)}
                      className="py-3 px-3.5 rounded-2xl bg-[#242424] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/25 text-xs font-bold transition-colors btn-thumb flex items-center justify-center"
                      title="Eliminar receta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
