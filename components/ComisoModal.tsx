'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Check,
  Search,
  Minus,
  Plus,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { ProductItem, MotivoComiso, MOTIVOS_COMISO, MOTIVO_STYLES, ComisoPayload } from '../lib/types';
import { checkExpiration } from '../lib/apiClient';
import { ProductThumb } from './ProductThumb';

interface ComisoModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  products: ProductItem[];
  onClose: () => void;
  onConfirm: (product: ProductItem, payload: ComisoPayload) => Promise<void> | void;
}

export const ComisoModal: React.FC<ComisoModalProps> = ({
  isOpen,
  product,
  products,
  onClose,
  onConfirm
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(product);
  const [searchQuery, setSearchQuery] = useState('');
  const [cantidad, setCantidad] = useState<string>('1');
  const [motivo, setMotivo] = useState<MotivoComiso>('Vencimiento');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(product);
      setSearchQuery('');
      setCantidad('1');
      setMotivo('Vencimiento');
      setFechaVencimiento(product?.fechaVencimiento || '');
      setNotas('');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, product]);

  const pickerResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.suplidor.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [products, searchQuery]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSaving) return;
    setSelectedProduct(null);
    onClose();
  };

  const parsedCantidad = parseFloat(cantidad) || 0;
  const expStatus = selectedProduct ? checkExpiration(selectedProduct.fechaVencimiento) : null;
  const stockNuevo = selectedProduct
    ? Math.max(0, Number((selectedProduct.stockActual - parsedCantidad).toFixed(2)))
    : 0;

  const handleConfirm = async () => {
    if (!selectedProduct) return;

    if (parsedCantidad <= 0) {
      setError('Indica una cantidad mayor a 0.');
      return;
    }
    if (parsedCantidad > selectedProduct.stockActual) {
      setError(`Solo hay ${selectedProduct.stockActual} ${selectedProduct.unidad} en stock. Ajusta la cantidad.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onConfirm(selectedProduct, {
        cantidad: parsedCantidad,
        motivo,
        fechaVencimiento: fechaVencimiento || '',
        notas: notas.trim()
      });
      setSelectedProduct(null);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo registrar el comiso. Intenta de nuevo.');
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
            <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Comiso / Merma
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {selectedProduct ? 'Registra la pérdida o vencimiento' : 'Selecciona el producto afectado'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors btn-thumb flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Product Picker (only when no product preselected) */}
        {!selectedProduct && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar insumo a comisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
              />
            </div>

            {products.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No hay productos cargados en el inventario.
              </p>
            ) : pickerResults.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No se encontraron insumos con ese criterio.
              </p>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {pickerResults.map(p => {
                  const out = p.stockActual <= 0;
                  return (
                    <button
                      key={`${p.id}-${p.rowIndex}`}
                      type="button"
                      disabled={out}
                      onClick={() => {
                        setSelectedProduct(p);
                        setFechaVencimiento(p.fechaVencimiento || '');
                      }}
                      className="w-full p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] hover:border-red-500/30 hover:bg-[#242424] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-3 text-left"
                    >
                      <ProductThumb
                        foto={p.foto}
                        nombre={p.nombre}
                        className="w-11 h-11 rounded-xl bg-[#282828] border border-white/[0.08] flex-none"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-white truncate block">
                          {p.nombre}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {p.suplidor} • {out ? 'Agotado' : `${p.stockActual} ${p.unidad} en stock`}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 flex-none" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Comiso Form */}
        {selectedProduct && (
          <div className="p-4 sm:p-5 space-y-4">

            {/* Product summary + change button */}
            <div className="p-3.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] flex items-center gap-3">
              <ProductThumb
                foto={selectedProduct.foto}
                nombre={selectedProduct.nombre}
                className="w-14 h-14 rounded-xl bg-[#282828] border border-white/[0.08] flex-none"
                iconClassName="w-6 h-6"
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-white truncate block">
                  {selectedProduct.nombre}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Stock actual: <strong className="text-white">{selectedProduct.stockActual} {selectedProduct.unidad}</strong>
                </span>
                {expStatus?.isExpired && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                    <AlertTriangle className="w-3 h-3" /> VENCIDO ({selectedProduct.fechaVencimiento})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setError(null);
                }}
                className="px-3 py-2.5 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] text-slate-300 text-[11px] font-bold border border-white/[0.08] transition-colors flex-none"
              >
                Cambiar
              </button>
            </div>

            {/* Cantidad */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Cantidad a retirar ({selectedProduct.unidad}) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCantidad(String(Math.max(0, Number((parsedCantidad - 1).toFixed(2)))))}
                  className="w-14 h-14 rounded-2xl bg-[#242424] hover:bg-red-500/15 text-red-400 border border-white/[0.08] hover:border-red-500/30 active:scale-95 transition-all flex items-center justify-center btn-thumb flex-none"
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
                  className="flex-1 h-14 px-3 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-xl font-black text-white text-center focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
                />
                <button
                  type="button"
                  onClick={() => setCantidad(String(Number((parsedCantidad + 1).toFixed(2))))}
                  className="w-14 h-14 rounded-2xl bg-[#242424] hover:bg-[#2c2c2c] text-white border border-white/[0.08] active:scale-95 transition-all flex items-center justify-center btn-thumb flex-none"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                Stock después del comiso: <strong className={stockNuevo <= 0 ? 'text-red-400' : 'text-white'}>{stockNuevo} {selectedProduct.unidad}</strong>
              </p>
            </div>

            {/* Motivo */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Motivo de la merma *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOTIVOS_COMISO.map(m => {
                  const style = MOTIVO_STYLES[m];
                  const isSelected = motivo === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMotivo(m)}
                      className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] flex items-center gap-2.5 ${
                        isSelected
                          ? `${style.color} ring-1 ring-white/20`
                          : 'bg-[#1f1f1f] border-white/[0.08] text-slate-400 hover:bg-[#242424]'
                      }`}
                    >
                      <span className="text-xl flex-none">{style.icon}</span>
                      <span className="min-w-0">
                        <span className="font-bold text-xs block truncate">{m}</span>
                        <span className="text-[10px] opacity-75 block truncate">{style.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha de vencimiento */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                Fecha en que venció (si aplica)
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3.5 py-3.5 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Notas u observaciones (opcional)
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="ej: Se dañó la funda al descargar, se quemó en la plancha..."
                className="w-full px-3.5 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 resize-none"
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
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1 py-3.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06] disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving || parsedCantidad <= 0 || parsedCantidad > selectedProduct.stockActual}
                className="flex-[1.6] py-3.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-[0_0_18px_rgba(239,68,68,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <span>Registrando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Comiso / Merma</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
