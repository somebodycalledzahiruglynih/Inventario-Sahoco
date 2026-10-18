'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Minus,
  AlertTriangle,
  Calendar,
  Building2,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Info,
  ShieldAlert
} from 'lucide-react';
import { ProductItem } from '../lib/types';
import { checkExpiration, fileToBase64 } from '../lib/apiClient';

interface ProductCardProps {
  product: ProductItem;
  onUpdateStockDelta: (product: ProductItem, delta: number) => void;
  onUpdateSugerido: (product: ProductItem, newSugerido: number) => void;
  onUpdatePhoto: (product: ProductItem, newPhotoBase64: string) => void;
  onRequestDelete: (product: ProductItem) => void;
  onRequestComiso: (product: ProductItem) => void;
  onRequestInfo: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onUpdateStockDelta,
  onUpdateSugerido,
  onUpdatePhoto,
  onRequestDelete,
  onRequestComiso,
  onRequestInfo
}) => {
  const [sugeridoInput, setSugeridoInput] = useState<string>(product.cantidadSugerida?.toString() || '0');
  const [isEditingSugerido, setIsEditingSugerido] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expStatus = checkExpiration(product.fechaVencimiento);

  const isOutOfStock = product.stockActual <= 0;
  const isLowStock = !isOutOfStock && product.stockActual <= product.stockMinimo;
  const isHealthy = !isOutOfStock && !isLowStock;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        onUpdatePhoto(product, base64);
      } catch (err) {
        console.error('Error reading photo:', err);
      }
    }
  };

  const handleBlurSugerido = () => {
    setIsEditingSugerido(false);
    const parsed = parseFloat(sugeridoInput);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== product.cantidadSugerida) {
      onUpdateSugerido(product, parsed);
    } else {
      setSugeridoInput(product.cantidadSugerida?.toString() || '0');
    }
  };

  return (
    <div className="dark-card rounded-3xl p-4 sm:p-5 dark-card-hover relative overflow-hidden transition-all">

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      <div className="flex items-start gap-3.5 sm:gap-4">

        {/* Product Photo */}
        <div className="relative flex-none">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#242424] border border-white/[0.08]">
            <img
              src={product.foto}
              alt={product.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#1a1a1a] border border-orange-500/30 text-orange-400 shadow-md hover:bg-orange-500/15 active:scale-95 transition-all"
            title="Tomar foto o subir imagen"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">

          {/* Status Badges + Delete */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center flex-wrap gap-1.5">
              {isOutOfStock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/25">
                  <XCircle className="w-3 h-3" /> Agotado
                </span>
              )}
              {isLowStock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <AlertTriangle className="w-3 h-3" /> Stock Bajo
                </span>
              )}
              {isHealthy && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <CheckCircle2 className="w-3 h-3" /> Saludable
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-orange-400" />
                {product.suplidor}
              </span>
            </div>

            <div className="flex items-center gap-0.5 flex-none">
              <button
                type="button"
                onClick={() => onRequestInfo(product)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                title="Ver información completa del insumo"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onRequestDelete(product)}
                className="p-1.5 -mr-1 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Eliminar insumo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-sm sm:text-base text-white leading-snug">
            {product.nombre}
          </h3>

          {/* Description */}
          {product.descripcion && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {product.descripcion}
            </p>
          )}

          {/* Expiration */}
          {product.fechaVencimiento && (
            <div className="mt-1 flex items-center gap-1.5">
              {expStatus.isExpired ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> VENCIDO ({product.fechaVencimiento})
                </span>
              ) : expStatus.isNear ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Vence en {expStatus.daysRemaining} días ({product.fechaVencimiento})
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Vence: {product.fechaVencimiento}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock & Controls */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        {/* Stock Display + Sugerido */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
              Stock Actual
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black font-display ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-white'}`}>
                {product.stockActual}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {product.unidad}
              </span>
            </div>
          </div>

          {/* Editable Sugerido */}
          <div className="bg-[#242424] p-1.5 px-2.5 rounded-2xl border border-orange-500/20">
            <span className="text-[9px] uppercase font-extrabold text-orange-400 block tracking-wider">
              Sugerido Compra
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="number"
                min="0"
                step="any"
                value={sugeridoInput}
                onChange={(e) => setSugeridoInput(e.target.value)}
                onBlur={handleBlurSugerido}
                className="w-14 px-1.5 py-0.5 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-xs font-bold text-white text-center focus:outline-none focus:border-orange-500/50"
              />
              <span className="text-[10px] text-slate-500 font-semibold">{product.unidad}</span>
            </div>
          </div>
        </div>

        {/* [ - ] and [ + ] buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => onUpdateStockDelta(product, -1)}
            disabled={product.stockActual <= 0}
            className="w-12 h-12 rounded-2xl bg-[#242424] hover:bg-red-500/15 text-red-400 border border-white/[0.08] hover:border-red-500/30 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center btn-thumb"
            title="Descontar 1 unidad"
          >
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => onUpdateStockDelta(product, 1)}
            className="w-12 h-12 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_16px_rgba(249,115,22,0.3)] active:scale-95 transition-all flex items-center justify-center btn-thumb"
            title="Sumar 1 unidad"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Comiso / Merma action */}
      <button
        type="button"
        onClick={() => onRequestComiso(product)}
        disabled={product.stockActual <= 0}
        className="mt-3 w-full py-3 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/15 disabled:opacity-35 disabled:cursor-not-allowed text-red-400 border border-red-500/25 hover:border-red-500/45 text-xs font-bold active:scale-[0.99] transition-all btn-thumb flex items-center justify-center gap-2"
        title="Registrar pérdida, vencimiento o daño de este insumo"
      >
        <ShieldAlert className="w-4 h-4 flex-none" />
        <span>Comiso / Merma</span>
        <span className="text-[10px] font-semibold text-red-400/70 hidden sm:inline">
          Pérdida o vencimiento
        </span>
      </button>
    </div>
  );
};
