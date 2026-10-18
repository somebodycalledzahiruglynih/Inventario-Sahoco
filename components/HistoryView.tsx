'use client';

import React from 'react';
import { Clock, User, ArrowUpRight, ArrowDownRight, Edit3, Trash2, ShieldAlert, ChefHat, Pencil, NotebookPen } from 'lucide-react';
import { HistoryRecord } from '../lib/types';

interface HistoryViewProps {
  history: HistoryRecord[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
  const formatTimeAgo = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return new Intl.DateTimeFormat('es-DO', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(new Date(timestamp));
    } catch {
      return 'Reciente';
    }
  };

  const getRecordStyle = (record: HistoryRecord) => {
    switch (record.tipo) {
      case 'COMISO':
        return { badge: 'bg-red-600', icon: <ShieldAlert className="w-3 h-3" />, accent: 'text-red-400' };
      case 'PREPARACION_PLATO':
        return { badge: 'bg-emerald-600', icon: <ChefHat className="w-3 h-3" />, accent: 'text-emerald-400' };
      case 'INFO_EDITADO':
        return { badge: 'bg-sky-600', icon: <Pencil className="w-3 h-3" />, accent: 'text-sky-400' };
      case 'RECETA_CREADA':
      case 'RECETA_EDITADA':
        return { badge: 'bg-violet-600', icon: <NotebookPen className="w-3 h-3" />, accent: 'text-violet-400' };
      case 'RECETA_ELIMINADA':
        return { badge: 'bg-violet-800', icon: <Trash2 className="w-3 h-3" />, accent: 'text-violet-300' };
      case 'ELIMINACION_PRODUCTO':
        return { badge: 'bg-red-600', icon: <Trash2 className="w-3 h-3" />, accent: 'text-red-400' };
      case 'INCREMENTO':
      case 'COMPRA_RECIBIDA':
        return { badge: 'bg-emerald-600', icon: <ArrowUpRight className="w-3 h-3" />, accent: 'text-emerald-400' };
      case 'DECREMENTO':
        return { badge: 'bg-amber-600', icon: <ArrowDownRight className="w-3 h-3" />, accent: 'text-amber-400' };
      default:
        return { badge: 'bg-orange-500', icon: <Edit3 className="w-3 h-3" />, accent: 'text-orange-400' };
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/25 text-orange-400 shadow-sm flex-none">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Historial de Movimientos Reales
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Auditoría en vivo de consumos, reposiciones y cambios
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#242424] text-slate-300 border border-white/[0.06] flex-none">
          {history.length} {history.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Clean Zero-Data Empty State */}
      {history.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="w-12 h-12 rounded-2xl bg-[#242424] border border-white/[0.06] text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            No hay movimientos registrados hoy
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Las modificaciones de existencias, entradas de reposición y nuevos insumos se registrarán automáticamente aquí con el perfil que realizó el cambio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {history.map((record) => {
            const style = getRecordStyle(record);

            return (
              <div
                key={record.id}
                className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3 hover:bg-[#222222] hover:border-orange-500/25 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
              >
                {/* Product Photo Thumbnail */}
                <div className="relative flex-none">
                  <img
                    src={record.itemFoto || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                    alt={record.itemNombre}
                    className="w-12 h-12 rounded-xl object-cover bg-[#242424] border border-white/[0.08]"
                  />
                  <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white text-[9px] shadow-sm ${style.badge}`}>
                    {style.icon}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white truncate block">
                      {record.itemNombre}
                    </span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap flex-none">
                      {formatTimeAgo(record.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-0.5 truncate">
                    {record.detalle}
                  </p>

                  {/* Comiso detail chips */}
                  {(record.motivo || record.fechaVencimiento || record.notas) && (
                    <div className="mt-1 flex items-center flex-wrap gap-1">
                      {record.motivo && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-300 border border-red-500/25">
                          {record.motivo}
                        </span>
                      )}
                      {record.fechaVencimiento && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          Venció: {record.fechaVencimiento}
                        </span>
                      )}
                      {record.notas && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#242424] text-slate-400 border border-white/[0.06] truncate max-w-[180px]">
                          {record.notas}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`mt-1 flex items-center gap-1.5 text-[10px] font-semibold ${style.accent}`}>
                    <User className="w-3 h-3 flex-none" />
                    <span>Realizado por {record.usuario}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
