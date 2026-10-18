'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ProductItem } from '../lib/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: ProductItem | null;
  onClose: () => void;
  onConfirmDelete: (item: ProductItem) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirmDelete,
}) => {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !item) return null;

  const handleDelete = () => {
    if (!hasConfirmed) return;
    setIsDeleting(true);
    setTimeout(() => {
      onConfirmDelete(item);
      setHasConfirmed(false);
      setIsDeleting(false);
      onClose();
    }, 250);
  };

  const handleClose = () => {
    setHasConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#141414] rounded-3xl p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] animate-in zoom-in-95 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <Trash2 className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Title & Warning message */}
        <div className="text-center mb-5">
          <h3 className="font-display font-extrabold text-lg sm:text-xl text-white">
            ¿Eliminar este producto permanentemente?
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Esta acción borrará el insumo del inventario oficial de SAHOCO y no se podrá recuperar.
          </p>
        </div>

        {/* Insumo Preview Card */}
        <div className="p-3.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] flex items-center gap-3 mb-5">
          <img
            src={item.foto}
            alt={item.nombre}
            className="w-12 h-12 rounded-xl object-cover bg-[#282828] flex-none border border-white/[0.08]"
          />
          <div className="min-w-0">
            <span className="font-bold text-xs sm:text-sm text-white truncate block">
              {item.nombre}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {item.suplidor} • {item.stockActual} {item.unidad} en stock
            </span>
          </div>
        </div>

        {/* Mandatory Checkbox */}
        <div className="p-3.5 rounded-2xl border border-red-500/25 bg-red-500/10 mb-6">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-red-600 bg-[#1f1f1f] border-red-500/40 focus:ring-red-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-red-200 leading-snug">
              He leído y acepto que este elemento se eliminará de forma permanente.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06]"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleDelete}
            disabled={!hasConfirmed || isDeleting}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-xs shadow-[0_0_15px_rgba(239,68,68,0.35)] active:scale-95 transition-all btn-thumb flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Eliminando...' : 'Eliminar Definitivamente'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
