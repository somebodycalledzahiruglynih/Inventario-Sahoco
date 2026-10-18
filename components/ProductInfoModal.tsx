'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Pencil,
  Check,
  Camera,
  Package,
  Building2,
  Calendar,
  Layers,
  AlertTriangle,
  Clock,
  User,
  Hash,
  Ruler,
  Info
} from 'lucide-react';
import { ProductItem, UnitType, MainCategory } from '../lib/types';
import { checkExpiration, fileToBase64 } from '../lib/apiClient';

interface ProductInfoModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onSave: (updated: ProductItem) => Promise<void> | void;
}

const CATEGORIES: MainCategory[] = [
  'Insumos & Salado',
  'Postres & Repostería',
  'Bebidas',
  'Desechables'
];

const UNITS: UnitType[] = ['Paquete', 'Unidad', 'Cajas', 'Libras', 'Galón'];

export const ProductInfoModal: React.FC<ProductInfoModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProductItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && product) {
      setDraft({ ...product });
      setIsEditing(false);
      setIsSaving(false);
      setSavedFlash(false);
      setError(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product || !draft) return null;

  const expStatus = checkExpiration(product.fechaVencimiento);
  const isOutOfStock = product.stockActual <= 0;
  const isLowStock = !isOutOfStock && product.stockActual <= product.stockMinimo;

  const updateDraft = (patch: Partial<ProductItem>) => {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        updateDraft({ foto: base64 });
      } catch (err) {
        console.error('Error reading photo:', err);
      }
    }
  };

  const handleSave = async () => {
    if (!draft.nombre.trim()) {
      setError('El nombre no puede quedar vacío.');
      return;
    }
    if (draft.stockMinimo < 0 || draft.stockMaximo < 0 || draft.stockActual < 0) {
      setError('Los stocks no pueden ser negativos.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({ ...draft, nombre: draft.nombre.trim() });
      setSavedFlash(true);
      setIsEditing(false);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar. Verifica la conexión e intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30';

  const labelClass =
    'text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] max-h-[94vh] overflow-y-auto text-slate-100">

        {/* Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-md p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Ficha del Insumo
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {isEditing ? 'Edita cualquier dato y guarda en Google Sheets' : 'Información completa del producto'}
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

        <div className="p-4 sm:p-5 space-y-4">

          {/* Saved confirmation */}
          {savedFlash && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 flex-none" />
              <span>¡Información actualizada y sincronizada!</span>
            </div>
          )}

          {/* Photo + main info */}
          <div className="flex items-start gap-3.5">
            <div className="relative flex-none">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#242424] border border-white/[0.08]">
                <img
                  src={isEditing ? draft.foto : product.foto}
                  alt={product.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                  }}
                />
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#1a1a1a] border border-orange-500/30 text-orange-400 shadow-md hover:bg-orange-500/15 active:scale-95 transition-all"
                  title="Cambiar foto"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              {isEditing ? (
                <input
                  type="text"
                  value={draft.nombre}
                  onChange={(e) => updateDraft({ nombre: e.target.value })}
                  className={inputClass}
                  placeholder="Nombre del insumo"
                />
              ) : (
                <h3 className="font-bold text-base text-white leading-snug">
                  {product.nombre}
                </h3>
              )}

              <div className="flex items-center flex-wrap gap-1.5">
                {isOutOfStock && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/25">
                    <AlertTriangle className="w-3 h-3" /> Agotado
                  </span>
                )}
                {isLowStock && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    <AlertTriangle className="w-3 h-3" /> Stock Bajo
                  </span>
                )}
                {expStatus.isExpired && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">
                    VENCIDO
                  </span>
                )}
                {expStatus.isNear && !expStatus.isExpired && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    <Clock className="w-3 h-3" /> Vence en {expStatus.daysRemaining} días
                  </span>
                )}
              </div>

              {isEditing ? (
                <textarea
                  rows={2}
                  value={draft.descripcion}
                  onChange={(e) => updateDraft({ descripcion: e.target.value })}
                  className={`${inputClass} resize-none`}
                  placeholder="Descripción del insumo"
                />
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {product.descripcion || 'Sin descripción registrada.'}
                </p>
              )}
            </div>
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Stock Actual */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>
                <Package className="w-3 h-3 inline mr-1 text-orange-400" />
                Stock Actual
              </span>
              {isEditing ? (
                <input
                  type="number"
                  step="any"
                  value={draft.stockActual}
                  onChange={(e) => updateDraft({ stockActual: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              ) : (
                <span className={`text-xl font-black ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-white'}`}>
                  {product.stockActual} <span className="text-xs font-semibold text-slate-400">{product.unidad}</span>
                </span>
              )}
            </div>

            {/* Unidad */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>
                <Ruler className="w-3 h-3 inline mr-1 text-orange-400" />
                Unidad de Medida
              </span>
              {isEditing ? (
                <select
                  value={draft.unidad}
                  onChange={(e) => updateDraft({ unidad: e.target.value as UnitType })}
                  className={inputClass}
                >
                  {UNITS.map(u => <option key={u} value={u} className="bg-[#1f1f1f] text-white">{u}</option>)}
                </select>
              ) : (
                <span className="text-sm font-bold text-slate-200">{product.unidad}</span>
              )}
            </div>

            {/* Stock Mínimo */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>Stock Mínimo</span>
              {isEditing ? (
                <input
                  type="number"
                  step="any"
                  value={draft.stockMinimo}
                  onChange={(e) => updateDraft({ stockMinimo: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              ) : (
                <span className="text-sm font-bold text-amber-300">{product.stockMinimo}</span>
              )}
            </div>

            {/* Stock Máximo */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>Stock Máximo</span>
              {isEditing ? (
                <input
                  type="number"
                  step="any"
                  value={draft.stockMaximo}
                  onChange={(e) => updateDraft({ stockMaximo: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              ) : (
                <span className="text-sm font-bold text-emerald-300">{product.stockMaximo}</span>
              )}
            </div>

            {/* Cantidad Sugerida */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>Sugerido de Compra</span>
              {isEditing ? (
                <input
                  type="number"
                  step="any"
                  value={draft.cantidadSugerida}
                  onChange={(e) => updateDraft({ cantidadSugerida: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              ) : (
                <span className="text-sm font-bold text-orange-300">{product.cantidadSugerida}</span>
              )}
            </div>

            {/* Suplidor */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>
                <Building2 className="w-3 h-3 inline mr-1 text-orange-400" />
                Suplidor
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={draft.suplidor}
                  onChange={(e) => updateDraft({ suplidor: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <span className="text-sm font-bold text-slate-200 truncate block">{product.suplidor}</span>
              )}
            </div>

            {/* Categoría */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>
                <Layers className="w-3 h-3 inline mr-1 text-orange-400" />
                Categoría
              </span>
              {isEditing ? (
                <select
                  value={draft.categoria}
                  onChange={(e) => updateDraft({ categoria: e.target.value as MainCategory })}
                  className={inputClass}
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1f1f1f] text-white">{c}</option>)}
                </select>
              ) : (
                <span className="text-xs font-bold text-slate-200">{product.categoria}</span>
              )}
            </div>

            {/* Fecha de Vencimiento */}
            <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className={labelClass}>
                <Calendar className="w-3 h-3 inline mr-1 text-orange-400" />
                Vencimiento
              </span>
              {isEditing ? (
                <input
                  type="date"
                  value={draft.fechaVencimiento}
                  onChange={(e) => updateDraft({ fechaVencimiento: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <span className={`text-xs font-bold ${expStatus.isExpired ? 'text-red-400' : 'text-slate-200'}`}>
                  {product.fechaVencimiento || 'Sin fecha'}
                </span>
              )}
            </div>
          </div>

          {/* Metadata */}
          {!isEditing && (
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 px-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" /> {product.id}
              </span>
              {product.modificadoPor && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {product.modificadoPor}
                </span>
              )}
              {product.ultimaModificacion && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(product.ultimaModificacion))}
                </span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2.5">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06]"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...product });
                    setIsEditing(true);
                  }}
                  className="flex-[1.6] py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Editar Información</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...product });
                    setIsEditing(false);
                    setError(null);
                  }}
                  disabled={isSaving}
                  className="flex-1 py-3.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06] disabled:opacity-40"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[1.6] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSaving ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
