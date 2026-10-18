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
  NotebookPen
} from 'lucide-react';
import { ProductItem, Recipe, RecipeCategory, RecipeIngredient, RECIPE_CATEGORIES } from '../lib/types';
import { ProductThumb } from './ProductThumb';

export interface RecipeFormData {
  nombre: string;
  categoria: RecipeCategory;
  descripcion: string;
  ingredientes: RecipeIngredient[];
}

interface RecipeFormModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  products: ProductItem[];
  onClose: () => void;
  onSave: (data: RecipeFormData) => Promise<void> | void;
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  isOpen,
  recipe,
  products,
  onClose,
  onSave
}) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<RecipeCategory>('Salado');
  const [descripcion, setDescripcion] = useState('');
  const [ingredientes, setIngredientes] = useState<RecipeIngredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNombre(recipe?.nombre || '');
      setCategoria(recipe?.categoria || 'Salado');
      setDescripcion(recipe?.descripcion || '');
      setIngredientes(recipe ? recipe.ingredientes.map(i => ({ ...i })) : []);
      setSearchQuery('');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, recipe]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products
      .filter(p => p.nombre.toLowerCase().includes(q) || p.suplidor.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, searchQuery]);

  if (!isOpen) return null;

  const handleAddIngredient = (p: ProductItem) => {
    if (ingredientes.some(i => i.productId === p.id)) {
      setError(`"${p.nombre}" ya está en la receta.`);
      return;
    }
    setError(null);
    setIngredientes(prev => [
      ...prev,
      {
        productId: p.id,
        rowIndex: p.rowIndex,
        nombre: p.nombre,
        cantidad: 1,
        unidad: p.unidad
      }
    ]);
    setSearchQuery('');
  };

  const handleUpdateCantidad = (productId: string, cantidad: number) => {
    setIngredientes(prev =>
      prev.map(i => (i.productId === productId ? { ...i, cantidad: Math.max(0, Number(cantidad.toFixed(2))) } : i))
    );
  };

  const handleRemoveIngredient = (productId: string) => {
    setIngredientes(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setError('El nombre del plato es obligatorio.');
      return;
    }
    const validIngredients = ingredientes.filter(i => i.cantidad > 0);
    if (validIngredients.length === 0) {
      setError('Agrega al menos un ingrediente con cantidad mayor a 0.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim(),
        ingredientes: validIngredients
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar la receta.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] max-h-[94vh] overflow-y-auto text-slate-100">

        {/* Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-md p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {recipe ? 'Editar Receta' : 'Nueva Receta'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Asocia los ingredientes del inventario general
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">

          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Nombre del Plato *
            </label>
            <input
              type="text"
              required
              placeholder="ej: Tres Leches, Picadera Familiar, Jugo de Chinola..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-3.5 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/15"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Categoría *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {RECIPE_CATEGORIES.map(cat => {
                const isSelected = categoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoria(cat.id)}
                    className={`py-3 rounded-2xl border text-center transition-all active:scale-[0.97] ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/30'
                        : 'bg-[#1f1f1f] border-white/[0.08] text-slate-400 hover:bg-[#242424]'
                    }`}
                  >
                    <span className="text-lg block">{cat.icon}</span>
                    <span className="text-[10px] font-bold block mt-0.5">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              placeholder="Detalle breve del plato..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/15"
            />
          </div>

          {/* Ingredientes agregados */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Ingredientes de la Receta ({ingredientes.length})
            </label>

            {ingredientes.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-dashed border-white/[0.12] text-center">
                <ChefHat className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-500 font-medium">
                  Busca abajo y toca un insumo para agregarlo
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredientes.map(ing => {
                  const product = products.find(p => p.id === ing.productId);
                  return (
                    <div
                      key={ing.productId}
                      className="p-2.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] flex items-center gap-2.5"
                    >
                      <ProductThumb
                        foto={product?.foto}
                        nombre={ing.nombre}
                        className="w-10 h-10 rounded-xl bg-[#282828] border border-white/[0.08] flex-none"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-white truncate block">{ing.nombre}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Disponible: {product ? `${product.stockActual} ${product.unidad}` : 'No encontrado'}
                        </span>
                      </div>

                      {/* Cantidad */}
                      <div className="flex items-center gap-1 flex-none">
                        <button
                          type="button"
                          onClick={() => handleUpdateCantidad(ing.productId, ing.cantidad - 1)}
                          className="w-8 h-8 rounded-lg bg-[#282828] text-slate-300 hover:text-white border border-white/[0.08] flex items-center justify-center active:scale-95 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={ing.cantidad}
                          onChange={(e) => handleUpdateCantidad(ing.productId, parseFloat(e.target.value) || 0)}
                          className="w-14 px-1 py-1.5 rounded-lg bg-[#141414] border border-white/[0.08] text-xs font-bold text-white text-center focus:outline-none focus:border-orange-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCantidad(ing.productId, ing.cantidad + 1)}
                          className="w-8 h-8 rounded-lg bg-[#282828] text-slate-300 hover:text-white border border-white/[0.08] flex items-center justify-center active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-400 w-12 text-center flex-none truncate">
                        {ing.unidad}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(ing.productId)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-none"
                        title="Quitar ingrediente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buscador de insumos */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Agregar ingrediente del inventario
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar insumo por nombre o proveedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/15"
              />
            </div>

            <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-3">
                  No se encontraron insumos.
                </p>
              ) : (
                searchResults.map(p => {
                  const already = ingredientes.some(i => i.productId === p.id);
                  return (
                    <button
                      key={`${p.id}-${p.rowIndex}`}
                      type="button"
                      disabled={already}
                      onClick={() => handleAddIngredient(p)}
                      className="w-full p-2.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] hover:border-orange-500/35 hover:bg-[#242424] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2.5 text-left"
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
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-none ${already ? 'bg-[#242424] text-slate-500' : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'}`}>
                        {already ? 'Agregado' : '+ Añadir'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
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
              type="submit"
              disabled={isSaving}
              className="flex-[1.6] py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isSaving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{recipe ? 'Guardar Cambios' : 'Crear Receta'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
