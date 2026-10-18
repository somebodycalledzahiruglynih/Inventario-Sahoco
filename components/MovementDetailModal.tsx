'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Minus,
  Pencil,
  Plus,
  ShieldAlert,
  StickyNote,
  Trash2,
  User,
  X
} from 'lucide-react';
import {
  HistoryRecord,
  ProductItem,
  MotivoComiso,
  MOTIVOS_COMISO,
  MOTIVO_STYLES,
  MovementCorrectionDraft,
  HISTORY_TYPE_LABELS,
  STOCK_MOVEMENT_TYPES
} from '../lib/types';
import { ProductThumb } from './ProductThumb';

interface MovementDetailModalProps {
  record: HistoryRecord;
  product: ProductItem | null;
  onClose: () => void;
  onSaveCorrection: (record: HistoryRecord, draft: MovementCorrectionDraft) => Promise<void> | void;
  onDelete: (record: HistoryRecord) => Promise<void> | void;
}

const inputClass =
  'w-full px-3.5 py-3 bg-[#1f1f1f] border border-white/[0.08] rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15';

const labelClass =
  'text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1';

const formatFullDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const MovementDetailModal: React.FC<MovementDetailModalProps> = ({
  record,
  product,
  onClose,
  onSaveCorrection,
  onDelete
}) => {
  const hasQtyData = typeof record.cantidadAnterior === 'number' && typeof record.cantidadNueva === 'number';
  const signedOld = hasQtyData ? Number((record.cantidadNueva! - record.cantidadAnterior!).toFixed(2)) : null;
  const magnitudeOld = signedOld !== null ? Math.abs(signedOld) : null;
  const isComiso = record.tipo === 'COMISO';
  const isStockMovement = STOCK_MOVEMENT_TYPES.includes(record.tipo);
  const isOutgoing = signedOld !== null && signedOld < 0;
  const canEditQty = signedOld !== null && signedOld !== 0;
  const canEdit = canEditQty || isComiso;
  const typeLabel = HISTORY_TYPE_LABELS[record.tipo] || 'Movimiento';
  const unidadSuffix = product?.unidad ? ` ${product.unidad}` : '';
  const qtyLabel = canEditQty ? (isOutgoing ? 'Cantidad descontada' : 'Cantidad agregada') : 'Cantidad';

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cantidad, setCantidad] = useState(() => String(magnitudeOld ?? 1));
  const [motivo, setMotivo] = useState<MotivoComiso>(
    MOTIVOS_COMISO.includes(record.motivo as MotivoComiso) ? (record.motivo as MotivoComiso) : 'Otro'
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(record.fechaVencimiento || '');
  const [notas, setNotas] = useState(record.notas || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const parsedCantidad = parseFloat(cantidad) || 0;
  const sign = signedOld !== null && signedOld < 0 ? -1 : 1;

  const stockProyectado = product && signedOld !== null && canEditQty
    ? Math.max(0, Number((product.stockActual - signedOld + sign * parsedCantidad).toFixed(2)))
    : null;

  const stockTrasEliminar = product && signedOld !== null && signedOld !== 0
    ? Math.max(0, Number((product.stockActual - signedOld).toFixed(2)))
    : null;

  const headerIcon = signedOld !== null && signedOld > 0
    ? <ArrowUpRight className="w-5 h-5" />
    : <ShieldAlert className="w-5 h-5" />;
  const headerTone = signedOld !== null && signedOld > 0
    ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
    : 'bg-red-500/15 border-red-500/25 text-red-400';

  const handleSave = async () => {
    if (canEditQty) {
      if (parsedCantidad <= 0) {
        setError('Indica una cantidad mayor a 0.');
        return;
      }
      if (isOutgoing && typeof record.cantidadAnterior === 'number' && parsedCantidad > record.cantidadAnterior) {
        setError(`La cantidad no puede superar las ${record.cantidadAnterior}${unidadSuffix} que había en stock antes de este movimiento.`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSaveCorrection(record, {
        cantidad: canEditQty ? parsedCantidad : (magnitudeOld ?? 0),
        motivo: isComiso ? motivo : undefined,
        fechaVencimiento: isComiso ? fechaVencimiento : undefined,
        notas: notas.trim()
      });
      setJustSaved(true);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar la corrección. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(record);
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar el registro. Intenta de nuevo.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] max-h-[94vh] overflow-y-auto text-slate-100">

        {/* Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-md p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${headerTone}`}>
              {headerIcon}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Detalle del Movimiento
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {isEditing ? 'Corrige el error y guarda los cambios' : typeLabel}
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
          {justSaved && !isEditing && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 flex-none" />
              <span>¡Corrección guardada y sincronizada con Google Sheets!</span>
            </div>
          )}

          {/* Product banner */}
          <div className="p-3.5 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] flex items-center gap-3">
            <ProductThumb
              foto={record.itemFoto || product?.foto}
              nombre={record.itemNombre}
              className="w-14 h-14 rounded-xl bg-[#282828] border border-white/[0.08] flex-none"
              iconClassName="w-6 h-6"
            />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm text-white break-words block">
                {record.itemNombre}
              </span>
              <span className={`inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                signedOld !== null && signedOld > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                  : 'bg-[#242424] text-slate-300 border-white/[0.08]'
              }`}>
                {typeLabel}
              </span>
              {product ? (
                <span className="text-[11px] text-slate-400 block mt-1">
                  En stock ahora: <strong className="text-white">{product.stockActual} {product.unidad}</strong>
                </span>
              ) : isStockMovement ? (
                <span className="text-[11px] text-amber-400 block mt-1">
                  Este insumo ya no está en el inventario actual
                </span>
              ) : null}
            </div>
          </div>

          {!isEditing ? (
            <>
              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {magnitudeOld !== null && (
                  <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                    <span className={labelClass}>{qtyLabel}</span>
                    <span className={`text-lg font-black ${isOutgoing ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isOutgoing ? '-' : '+'}{magnitudeOld}
                      <span className="text-xs font-semibold text-slate-400">{unidadSuffix}</span>
                    </span>
                  </div>
                )}

                {hasQtyData && (
                  <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                    <span className={labelClass}>Stock antes / después</span>
                    <span className="text-xs font-bold text-slate-200">
                      {record.cantidadAnterior}
                      {' → '}
                      {record.cantidadNueva}
                    </span>
                  </div>
                )}

                {record.motivo && (
                  <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                    <span className={labelClass}>Motivo</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold border ${MOTIVO_STYLES[record.motivo as MotivoComiso]?.color || 'border-slate-500/40 bg-slate-500/10 text-slate-300'}`}>
                      <span>{MOTIVO_STYLES[record.motivo as MotivoComiso]?.icon || '📝'}</span>
                      {record.motivo}
                    </span>
                  </div>
                )}

                {record.fechaVencimiento && (
                  <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                    <span className={labelClass}>
                      <Calendar className="w-3 h-3 inline mr-1 text-orange-400" />
                      Fecha de vencimiento
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {record.fechaVencimiento}
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                  <span className={labelClass}>
                    <User className="w-3 h-3 inline mr-1 text-orange-400" />
                    Registrado por
                  </span>
                  <span className="text-xs font-bold text-slate-200">{record.usuario}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                  <span className={labelClass}>
                    <Clock className="w-3 h-3 inline mr-1 text-orange-400" />
                    Fecha de registro
                  </span>
                  <span className="text-xs font-bold text-slate-200">{formatFullDate(record.timestamp)}</span>
                </div>
              </div>

              {/* Detalle completo */}
              <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                <span className={labelClass}>Detalle</span>
                <p className="text-xs text-slate-300 leading-relaxed break-words">
                  {record.detalle}
                </p>
              </div>

              {/* Observaciones */}
              <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
                <span className={labelClass}>
                  <StickyNote className="w-3 h-3 inline mr-1 text-orange-400" />
                  Observaciones / Notas
                </span>
                <p className="text-xs text-slate-300 leading-relaxed break-words">
                  {record.notas || 'Sin observaciones registradas.'}
                </p>
              </div>

              <p className="text-[10px] text-slate-600 font-medium px-1">
                Registro: {record.id}
              </p>

              {/* Delete confirmation */}
              {isConfirmingDelete && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-3">
                  <div className="flex items-center gap-2 text-red-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 flex-none" />
                    <span>¿Eliminar este registro del historial?</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {stockTrasEliminar !== null && magnitudeOld !== null
                      ? (isOutgoing
                        ? `Se devolverán ${magnitudeOld}${unidadSuffix} al stock (quedará en ${stockTrasEliminar}${unidadSuffix}) y se actualizará Google Sheets.`
                        : `Se restarán ${magnitudeOld}${unidadSuffix} del stock (quedará en ${stockTrasEliminar}${unidadSuffix}) y se actualizará Google Sheets.`)
                      : 'Este registro no ajusta stock: solo se eliminará del historial.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeleting}
                      className="flex-1 py-3 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-white/[0.06] disabled:opacity-40"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold rounded-2xl text-xs shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <span>Eliminando...</span>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Sí, eliminar</span>
                        </>
                      )}
                    </button>
                  </div>
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
              {!isConfirmingDelete && (
                <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="flex-1 py-3.5 px-4 bg-red-500/10 hover:bg-red-500/15 text-red-400 font-bold rounded-2xl text-xs transition-colors btn-thumb border border-red-500/25 hover:border-red-500/45 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setError(null);
                      }}
                      className="flex-[1.6] py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Editar Registro</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-[1.6] py-3.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 font-bold rounded-2xl text-sm transition-colors btn-thumb border border-white/[0.06]"
                    >
                      Cerrar
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Cantidad */}
              {canEditQty ? (
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    {qtyLabel} ({product?.unidad || 'unidades'}) *
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
                  {stockProyectado !== null ? (
                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                      Stock después de la corrección: <strong className={stockProyectado <= 0 ? 'text-red-400' : 'text-white'}>{stockProyectado}{unidadSuffix}</strong>
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-400/90 mt-1.5 font-medium">
                      Sin datos de stock original: el inventario no se ajustará automáticamente.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] flex items-start gap-2 text-[11px] text-slate-400">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-none" />
                  <span>Sin datos de cantidad: solo puedes corregir las observaciones de este registro.</span>
                </div>
              )}

              {/* Motivo (solo comiso) */}
              {isComiso && (
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
              )}

              {/* Fecha de vencimiento (solo comiso) */}
              {isComiso && (
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    Fecha en que venció (si aplica)
                  </label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Notas u observaciones (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="ej: Se corrige porque se contó mal..."
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
                  onClick={() => {
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
                  disabled={isSaving || (canEditQty && parsedCantidad <= 0)}
                  className="flex-[1.6] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all btn-thumb flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Corrección</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
