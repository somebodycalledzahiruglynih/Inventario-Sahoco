'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Minus,
  PackageCheck,
  Plus,
  StickyNote,
  X
} from 'lucide-react';
import { ProductItem } from '../lib/types';
import { ProductThumb } from './ProductThumb';

interface RestockModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onConfirm: (
    product: ProductItem,
    addedAmount: number,
    info: { descripcion?: string; suplidor?: string }
  ) => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15';

const labelClass =
  'text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5';

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm
}) => {
  const [cantidad, setCantidad] = useState('1');
  const [descripcion, setDescripcion] = useState('');
  const [suplidor, setSuplidor] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const sugerida = product.cantidadSugerida || Math.max(1, product.stockMaximo - product.stockActual);
      setCantidad(String(sugerida));
      setDescripcion('');
      setSuplidor(product.suplidor || '');
      setError(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const parsed = parseFloat(cantidad) || 0;
  const nuevoStock = Number((product.stockActual + parsed).toFixed(2));
  const isOutOfStock = product.stockActual <= 0;

  const handleConfirm = () => {
    if (parsed <= 0) {
      setError('Indica una cantidad mayor a 0.');
      return;
    }
    onConfirm(product, parsed, {
      descripcion: descripcion.trim() || undefined,
      suplidor: suplidor.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] max-h-[94vh] overflow-y-auto text-slate-100">

        {/* Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-md p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Reponer Insumo
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Registra la entrada y quién lo repuso
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

          {/* Información del insumo */}
          <div className="p-3.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] flex items-center gap-3">
            <ProductThumb
              foto={product.foto}
              nombre={product.nombre}
              className="w-14 h-14 rounded-xl bg-[#282828] border border-white/[0.08] flex-none"
              iconClassName="w-6 h-6"
            />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm text-white break-words block">
                {product.nombre}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {product.categoria} • {product.suplidor}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="text-slate-400">
                  Stock: <strong className={isOutOfStock ? 'text-red-400' : 'text-white'}>{product.stockActual}</strong> {product.unidad}
                </span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-extrabold">
                  Nuevo: {nuevoStock} {product.unidad}
                </span>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Mínimo</span>
              <span className="text-sm font-bold text-slate-200">{product.stockMinimo} {product.unidad}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Máximo</span>
              <span className="text-sm font-bold text-slate-200">{product.stockMaximo} {product.unidad}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Sugerido</span>
              <span className="text-sm font-bold text-orange-400">{product.cantidadSugerida} {product.unidad}</span>
            </div>
          </div>

          {isOutOfStock && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-none" />
              <span>Este insumo está AGOTADO. Registra la entrada cuanto antes.</span>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <label className={labelClass}>Cantidad a reponer ({product.unidad}) *</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCantidad(String(Math.max(0, Number((parsed - 1).toFixed(2)))))}
                className="w-14 h-14 rounded-2xl bg-[#242424] hover:bg-emerald-500/15 text-emerald-400 border border-white/[0.08] hover:border-emerald-500/30 active:scale-95 transition-all flex items-center justify-center btn-thumb flex-none"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="flex-1 h-14 px-3 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-xl font-black text-white text-center focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
              />
              <button
                type="button"
                onClick={() => setCantidad(String(Number((parsed + 1).toFixed(2))))}
                className="w-14 h-14 rounded-2xl bg-[#242424] hover:bg-[#2c2c2c] text-white border border-white/[0.08] active:scale-95 transition-all flex items-center justify-center btn-thumb flex-none"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Suplidor (escrito por el usuario) */}
          <div>
            <label className={labelClass}>
              <Building2 className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
              ¿De qué suplidor lo repusiste?
            </label>
            <input
              type="text"
              value={suplidor}
              onChange={(e) => setSuplidor(e.target.value)}
              placeholder="ej: Mercado, Sirena, Distribuidora..."
              className={inputClass}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Escríbelo tú mismo; quedará registrado en el historial de este movimiento.
            </p>
          </div>

          {/* Descripción opcional */}
          <div>
            <label className={labelClass}>
              <StickyNote className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
              Descripción (opcional)
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="ej: Lote nuevo, fundas selladas, factura #123..."
              className={`${inputClass} resize-none`}
            />
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
              className="flex-1 py-3.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={parsed <= 0}
              className="flex-[1.6] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Reponer {parsed > 0 ? `${parsed} ${product.unidad}` : ''}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
