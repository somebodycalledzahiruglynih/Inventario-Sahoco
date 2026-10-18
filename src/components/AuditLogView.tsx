import React from 'react';
import { ClipboardList, Shield, Clock, User, Filter, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { AuditLogEntry } from '../types/inventory';
import { formatDate } from '../lib/utils';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onClearLogs?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Registro Auditado de Actividades (Audit Log)
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Trazabilidad completa: historial de quién ajustó stock, ventas de recetas, mermas y sincronizaciones.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-neutral-400 block">Total de Eventos</span>
          <span className="text-xl font-bold text-white">{logs.length} registrados</span>
        </div>
      </div>

      {/* Log Feed */}
      <div className="glass-card rounded-2xl p-5 border border-white/10">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No hay registros de auditoría aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => {
              const isAlert = log.tipo === 'alert';
              const isWarning = log.tipo === 'warning';

              return (
                <div 
                  key={log.id}
                  className="p-3.5 rounded-xl bg-neutral-900/70 border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3.5"
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    isAlert 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : isWarning 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {isAlert ? <AlertCircle className="w-4 h-4" /> : isWarning ? <Clock className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-200">
                          {log.accion.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-neutral-800 text-neutral-400 border border-white/5">
                          <User className="w-3 h-3 inline mr-1" />
                          {log.usuario}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300">
                      {log.detalle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
