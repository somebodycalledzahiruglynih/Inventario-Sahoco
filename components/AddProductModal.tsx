'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Check, PackagePlus } from 'lucide-react';
import { ProductItem, UnitType, MainCategory } from '../lib/types';
import { fileToBase64 } from '../lib/apiClient';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<ProductItem, 'id' | 'rowIndex'>) => void;
}

const CATEGORIES: MainCategory[] = [
  'Insumos & Salado',
  'Postres & Repostería',
  'Bebidas',
  'Desechables'
];

const UNITS: UnitType[] = ['Paquete', 'Unidad', 'Cajas', 'Libras', 'Galón'];

const COMMON_SUPPLIERS = [
  'PriceSmart',
  'Sirena',
  'Synthia',
  'Neno Distribuidora',
  'Merca Jumbo',
  'Carnes El Primo'
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct
}) => {
  const [nombre, setNombre] = useState('');
  const [suplidor, setSuplidor] = useState('PriceSmart');
  const [categoria, setCategoria] = useState<MainCategory>('Insumos & Salado');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<string>('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80');
  const [stockActual, setStockActual] = useState<number>(10);
  const [unidad, setUnidad] = useState<UnitType>('Libras');
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [stockMaximo, setStockMaximo] = useState<number>(30);
  const [cantidadSugerida, setCantidadSugerida] = useState<number>(15);
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFoto(base64);
      } catch (err) {
        console.error('Failed reading file:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onAddProduct({
      nombre: nombre.trim(),
      suplidor: suplidor.trim(),
      categoria,
      descripcion: descripcion.trim(),
      foto,
      fechaVencimiento,
      stockActual: Number(stockActual) || 0,
      unidad,
      stockMinimo: Number(stockMinimo) || 5,
      stockMaximo: Number(stockMaximo) || 30,
      cantidadSugerida: Number(cantidadSugerida) || 10,
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
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Añadir Nuevo Producto
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Completa los datos del insumo o postre
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
          
          {/* Photo Upload / Camera Viewfinder */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Fotografía del Producto
            </label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#1f1f1f] border border-white/[0.08] relative">
                <img src={foto} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f1f] hover:bg-[#282828] border border-white/[0.08] hover:border-orange-500/30 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4 text-orange-400" />
                  <span>Tomar Foto / Subir Imagen</span>
                </button>
                <p className="text-[10px] text-slate-500">
                  Usa la cámara del móvil o selecciona de la galería
                </p>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Nombre del Artículo *
            </label>
            <input
              type="text"
              required
              placeholder="ej: Pechuga de Pollo, Tres Leches..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          {/* Suplidor & Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Proveedor *
              </label>
              <input
                type="text"
                list="suppliers-list"
                required
                value={suplidor}
                onChange={(e) => setSuplidor(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-medium text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
              <datalist id="suppliers-list">
                {COMMON_SUPPLIERS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as MainCategory)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-medium text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#1f1f1f] text-white">{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Descripción Breve
            </label>
            <input
              type="text"
              placeholder="Detalle de uso o porción..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          {/* Stock Actual & Unidad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Cantidad Inicial
              </label>
              <input
                type="number"
                step="any"
                required
                value={stockActual}
                onChange={(e) => setStockActual(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Unidad
              </label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value as UnitType)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-medium text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              >
                {UNITS.map(u => <option key={u} value={u} className="bg-[#1f1f1f] text-white">{u}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                step="any"
                required
                value={stockMinimo}
                onChange={(e) => setStockMinimo(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Stock Máximo
              </label>
              <input
                type="number"
                step="any"
                required
                value={stockMaximo}
                onChange={(e) => setStockMaximo(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>
          </div>

          {/* Cantidad Sugerida & Fecha de Vencimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Cantidad Sugerida de Compra
              </label>
              <input
                type="number"
                step="any"
                required
                value={cantidadSugerida}
                onChange={(e) => setCantidadSugerida(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-bold text-orange-400 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#1f1f1f] border border-white/[0.08] rounded-xl text-xs font-medium text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>
          </div>

          {/* Submit */}
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
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-xs shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-95 transition-all btn-thumb flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Guardar Producto</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
