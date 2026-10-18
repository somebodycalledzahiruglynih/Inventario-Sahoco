'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PackageCheck, Camera, X, Check, ArrowRight } from 'lucide-react';
import { ProductItem, UnitType } from '../lib/types';
import { ProductThumb } from './ProductThumb';
import { fileToBase64 } from '../lib/apiClient';

interface RestockModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onSaveRestock: (
    product: ProductItem, 
    addedAmount: number, 
    updatedFields: Partial<ProductItem>
  ) => void;
}

const UNITS: UnitType[] = ['Paquete', 'Unidad', 'Cajas', 'Libras', 'Galón'];

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  product,
  onClose,
  onSaveRestock
}) => {
  const [addedAmount, setAddedAmount] = useState<number>(10);
  const [unidad, setUnidad] = useState<UnitType>('Libras');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setAddedAmount(product.cantidadSugerida || Math.max(1, product.stockMaximo - product.stockActual));
      setUnidad(product.unidad);
      setFechaVencimiento(product.fechaVencimiento || '');
      setDescripcion(product.descripcion || '');
      setFoto(product.foto || '');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stockActual;
  const newProjectedStock = currentStock + (Number(addedAmount) || 0);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFoto(base64);
      } catch (err) {
        console.error('Failed reading photo:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addedAmount <= 0) return;

    onSaveRestock(product, Number(addedAmount), {
      unidad,
      fechaVencimiento,
      descripcion,
      foto: foto || product.foto
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] max-h-[92vh] overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-md p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Registrar Entrada / Reposición
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Actualiza existencias y fecha de caducidad del insumo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Product Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#282828] flex-none border border-white/[0.08] relative group">
              <ProductThumb foto={foto || product.foto} nombre={product.nombre} className="w-full h-full" iconClassName="w-6 h-6" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-4 h-4 text-orange-400" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm text-white block truncate">
                {product.nombre}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {product.suplidor} • {product.categoria}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="text-slate-400">Actual: <strong className="text-white">{currentStock}</strong> {product.unidad}</span>
                <ArrowRight className="w-3 h-3 text-orange-400" />
                <span className="text-emerald-400 font-extrabold">Nuevo: {newProjectedStock} {unidad}</span>
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Cantidad de Entrada & Unidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Cantidad a Ingresar (+) *
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={addedAmount}
                onChange={(e) => setAddedAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-base font-extrabold text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Unidad de Medida
              </label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value as UnitType)}
                className="w-full px-3.5 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              >
                {UNITS.map(u => <option key={u} value={u} className="bg-[#1f1f1f] text-white">{u}</option>)}
              </select>
            </div>
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Nueva Fecha de Vencimiento
            </label>
            <div className="relative">
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>
          </div>

          {/* Descripción / Notas del lote */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Descripción o Detalle del Lote
            </label>
            <input
              type="text"
              placeholder="ej: Lote nuevo de Sirena, fundas selladas..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          {/* Cambiar Foto Button */}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f1f] hover:bg-[#282828] border border-white/[0.08] hover:border-orange-500/30 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4 text-orange-400" />
              <span>Actualizar Foto con la Cámara</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all btn-thumb flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Guardar Entrada</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
