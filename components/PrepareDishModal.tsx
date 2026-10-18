'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Check,
  Search,
  Minus,
  Plus,
  Trash2,
  ChefHat,
  AlertTriangle,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { ProductItem, Recipe } from '../lib/types';
import { ProductThumb } from './ProductThumb';

export interface DishDeduction {
  product: ProductItem;
  cantidad: number;
}

interface PrepareDishModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  products: ProductItem[];
  onClose: () => void;
  onConfirm: (recipe: Recipe, deductions: DishDeduction[]) => Promise<void> | void;
}

export const PrepareDishModal: React.FC<PrepareDishModalProps> = ({
  isOpen,
  recipe,
  products,
  onClose,
  onConfirm
}) => {
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [extras, setExtras] = useState<Array<{ productId: string; cantidad: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExcludedIds(new Set());
      setExtras([]);
      setSearchQuery('');
      setIsSaving(false);
      setError(null);
    }
  }, [isOpen, recipe]);

  const extraSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 6);
    return products
      .filter(p => p.nombre.toLowerCase().includes(q) || p.suplidor.toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, searchQuery]);

  const deductions = useMemo<DishDeduction[]>(() => {
    if (!recipe) return [];
    const map = new Map<string, DishDeduction>();

    const add = (product: ProductItem, cantidad: number) => {
      if (cantidad <= 0) return;
      const existing = map.get(product.id);
      if (existing) {
        existing.cantidad = Number((existing.cantidad + cantidad).toFixed(2));
      } else {
        map.set(product.id, { product, cantidad: Number(cantidad.toFixed(2)) });
      }
    };

    recipe.ingredientes.forEach(ing => {
      if (excludedIds.has(ing.productId)) return;
      const product = products.find(p => p.id === ing.productId);
      if (product) add(product, ing.cantidad);
    });

    extras.forEach(extra => {
      const product = products.find(p => p.id === extra.productId);
      if (product) add(product, extra.cantidad);
    });

    return Array.from(map.values());
  }, [recipe, products, excludedIds, extras]);

  if (!isOpen || !recipe) return null;

  const toggleExclude = (productId: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleAddExtra = (p: ProductItem) => {
    if (extras.some(e => e.productId === p.id)) {
      setError(`"${p.nombre}" ya está como extra.`);
      return;
    }
    setError(null);
    setExtras(prev => [...prev, { productId: p.id, cantidad: 1 }]);
    setSearchQuery('');
  };

  const updateExtra = (productId: string, cantidad: number) => {
    setExtras(prev =>
      prev.map(e => (e.productId === productId ? { ...e, cantidad: Math.max(0, Number(cantidad.toFixed(2))) } : e))
    );
  };

  const removeExtra = (productId: string) => {
    setExtras(prev => prev.filter(e => e.productId !== productId));
  };

  const excludedCount = recipe.ingredientes.filter(i => excludedIds.has(i.productId)).length;
  const hasStockWarning = deductions.some(d => d.product.stockActual < d.cantidad);

  const handleConfirm = async () => {
    if (deductions.length === 0) {
      setError('Debes descontar al menos un ingrediente para preparar el plato.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onConfirm(recipe, deductions);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo registrar la preparación. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] max-h-[94vh] overflow-y-auto text-slate-100">

        {/* Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-md p-4 sm:p-5 border-b border-white/[0.08] z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[220px] sm:max-w-none">
                  Preparar: {recipe.nombre}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Desmarca lo que el cliente no quiere • Añade extras
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors btn-thumb flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">

          {/* Checklist de ingredientes */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Ingredientes de la receta ({recipe.ingredientes.length})
            </label>
            <div className="space-y-2">
              {recipe.ingredientes.map(ing => {
                const product = products.find(p => p.id === ing.productId);
                const isExcluded = excludedIds.has(ing.productId);
                const isMissing = !product;
                const insufficient = product ? product.stockActual < ing.cantidad : false;

                return (
                  <button
                    key={ing.productId}
                    type="button"
                    disabled={isMissing}
                    onClick={() => toggleExclude(ing.productId)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center gap-3 ${
                      isMissing
                        ? 'bg-[#1a1a1a] border-white/[0.06] opacity-50 cursor-not-allowed'
                        : isExcluded
                        ? 'bg-[#1a1a1a] border-white/[0.06] opacity-60'
                        : 'bg-[#1f1f1f] border-emerald-500/30'
                    }`}
                  >
                    {/* Big checkbox */}
                    <div className="flex-none">
                      {isExcluded || isMissing ? (
                        <Circle className="w-7 h-7 text-slate-600" />
                      ) : (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      )}
                    </div>

                    <ProductThumb
                      foto={product?.foto}
                      nombre={ing.nombre}
                      className="w-11 h-11 rounded-xl bg-[#282828] border border-white/[0.08] flex-none"
                    />

                    <div className="flex-1 min-w-0">
                      <span className={`font-bold text-xs sm:text-sm block truncate ${isExcluded ? 'line-through text-slate-500' : 'text-white'}`}>
                        {ing.nombre}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {isMissing ? (
                          <span className="text-amber-400">Insumo no encontrado en inventario</span>
                        ) : (
                          <>
                            Descontar <strong className="text-white">{ing.cantidad} {ing.unidad}</strong>
                            {' • '}Hay <strong className={insufficient ? 'text-red-400' : 'text-slate-300'}>{product!.stockActual} {product!.unidad}</strong>
                          </>
                        )}
                      </span>
                      {isExcluded && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          SIN {ing.nombre.split(' ')[0].toUpperCase()} — no se descuenta
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extras */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Extras añadidos ({extras.length})
            </label>

            {extras.length > 0 && (
              <div className="space-y-2 mb-2.5">
                {extras.map(extra => {
                  const product = products.find(p => p.id === extra.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={extra.productId}
                      className="p-2.5 rounded-2xl bg-[#1f1f1f] border border-sky-500/25 flex items-center gap-2.5"
                    >
                      <ProductThumb
                        foto={product.foto}
                        nombre={product.nombre}
                        className="w-10 h-10 rounded-xl bg-[#282828] border border-white/[0.08] flex-none"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-white truncate block">{product.nombre}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Disponible: {product.stockActual} {product.unidad}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-none">
                        <button
                          type="button"
                          onClick={() => updateExtra(extra.productId, extra.cantidad - 1)}
                          className="w-8 h-8 rounded-lg bg-[#282828] text-slate-300 hover:text-white border border-white/[0.08] flex items-center justify-center active:scale-95 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={extra.cantidad}
                          onChange={(e) => updateExtra(extra.productId, parseFloat(e.target.value) || 0)}
                          className="w-14 px-1 py-1.5 rounded-lg bg-[#141414] border border-white/[0.08] text-xs font-bold text-white text-center focus:outline-none focus:border-sky-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => updateExtra(extra.productId, extra.cantidad + 1)}
                          className="w-8 h-8 rounded-lg bg-[#282828] text-slate-300 hover:text-white border border-white/[0.08] flex items-center justify-center active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 w-10 text-center flex-none truncate">
                        {product.unidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExtra(extra.productId)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Buscador de extras */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar extra para añadir (ej: queso, tocineta)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15"
              />
            </div>

            <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {extraSearchResults.map(p => (
                <button
                  key={`${p.id}-${p.rowIndex}`}
                  type="button"
                  onClick={() => handleAddExtra(p)}
                  className="w-full p-2.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] hover:border-sky-500/35 hover:bg-[#242424] transition-all flex items-center gap-2.5 text-left"
                >
                  <ProductThumb
                    foto={p.foto}
                    nombre={p.nombre}
                    className="w-9 h-9 rounded-lg bg-[#282828] border border-white/[0.08] flex-none"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-white truncate block">{p.nombre}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {p.stockActual} {p.unidad} disponibles
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-none bg-sky-500/15 text-sky-400 border border-sky-500/25">
                    + Extra
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Resumen de descuento quirúrgico
            </span>
            {deductions.length === 0 ? (
              <p className="text-[11px] text-slate-500">Ningún ingrediente seleccionado.</p>
            ) : (
              <div className="space-y-1">
                {deductions.map(d => {
                  const insufficient = d.product.stockActual < d.cantidad;
                  const nuevo = Math.max(0, Number((d.product.stockActual - d.cantidad).toFixed(2)));
                  return (
                    <div key={d.product.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 truncate pr-2">{d.product.nombre}</span>
                      <span className={`font-bold whitespace-nowrap ${insufficient ? 'text-red-400' : 'text-emerald-400'}`}>
                        -{d.cantidad} {d.product.unidad} → {nuevo}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {excludedCount > 0 && (
              <p className="text-[10px] font-bold text-amber-400 pt-1 border-t border-white/[0.06]">
                {excludedCount} ingrediente{excludedCount > 1 ? 's' : ''} omitido{excludedCount > 1 ? 's' : ''} por modificación del cliente
              </p>
            )}
            {hasStockWarning && (
              <p className="text-[10px] font-bold text-red-400 flex items-center gap-1 pt-1 border-t border-white/[0.06]">
                <AlertTriangle className="w-3 h-3 flex-none" />
                Hay insumos con stock insuficiente; se ajustará a 0 automáticamente.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06] disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving || deductions.length === 0}
              className="flex-[1.6] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-[0_0_18px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span>Descontando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Preparación</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
