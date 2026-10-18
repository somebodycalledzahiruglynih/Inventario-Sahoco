'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Flame, Search, X, Info, Server, Timer, ShieldCheck } from 'lucide-react';
import { ProductItem, UserName } from '../lib/types';
import { getBatchWindowMs } from '../lib/pendingChanges';
import { APPS_SCRIPT_ENDPOINT } from '../lib/appsScriptUrl';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  currentUser: UserName;
  onTogglePriority: (product: ProductItem) => void;
}

type SettingsTab = 'prioridad' | 'sistema';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUser,
  onTogglePriority
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('prioridad');
  const [searchQuery, setSearchQuery] = useState('');

  const priorityCount = useMemo(
    () => products.filter(p => p.esPrioritario).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter(p => !q || p.nombre.toLowerCase().includes(q) || p.suplidor.toLowerCase().includes(q))
      .sort((a, b) => {
        if (!!a.esPrioritario !== !!b.esPrioritario) return a.esPrioritario ? -1 : 1;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [products, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0.6 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-[#1a1a1a] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] max-h-[88vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ajustes del Sistema</h3>
                  <p className="text-[10px] text-slate-400">Configuración operativa de SAHOCO</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242424] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 px-5 pt-3">
              <button
                onClick={() => setActiveTab('prioridad')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'prioridad'
                    ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                    : 'bg-[#242424] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Prioridad de Insumos
                {priorityCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'prioridad' ? 'bg-white/20' : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'}`}>
                    {priorityCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sistema')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'sistema'
                    ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                    : 'bg-[#242424] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                Sistema
              </button>
            </div>

            {/* TAB: Prioridad de Insumos */}
            {activeTab === 'prioridad' && (
              <div className="flex-1 flex flex-col min-h-0 px-5 pb-5 pt-3">
                <div className="rounded-2xl bg-gradient-to-r from-red-500/[0.10] to-orange-500/[0.06] border border-orange-500/25 p-3 flex items-start gap-2.5">
                  <Flame className="w-4 h-4 text-orange-400 flex-none mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Marca los insumos indispensables de la cocina (papas, carne, aceite, pan…).
                    Se destacarán en la <strong className="text-orange-400">Lista de Reposición</strong> y sus
                    correos de alerta llevarán <strong className="text-red-400">MÁXIMA PRIORIDAD</strong>.
                  </p>
                </div>

                <div className="relative mt-3">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar insumo para marcar prioridad..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#242424] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>

                <div className="flex-1 overflow-y-auto mt-2 -mx-1 px-1 divide-y divide-white/[0.05]">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-8">
                      No se encontraron insumos con esa búsqueda.
                    </p>
                  ) : (
                    filteredProducts.map(product => {
                      const isPriority = product.esPrioritario === true;
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl transition-colors ${
                            isPriority ? 'bg-orange-500/[0.06]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={product.foto}
                              alt={product.nombre}
                              className="w-9 h-9 rounded-xl object-cover bg-[#242424] flex-none border border-white/[0.08]"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{product.nombre}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {product.suplidor} • Stock: {product.stockActual} {product.unidad}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => onTogglePriority(product)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex-none active:scale-95 ${
                              isPriority
                                ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(248,113,113,0.15)]'
                                : 'bg-[#242424] border-white/[0.08] text-slate-400 hover:text-orange-400 hover:border-orange-500/30'
                            }`}
                          >
                            <Flame className={`w-3.5 h-3.5 ${isPriority ? 'text-red-400' : ''}`} />
                            {isPriority ? 'Prioridad Alta' : 'Marcar'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    <Flame className="w-3.5 h-3.5 text-orange-400 inline-block mr-1 -mt-0.5" />
                    {priorityCount} {priorityCount === 1 ? 'insumo clave' : 'insumos clave'} marcados
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Se guardan en este dispositivo y viajan en cada alerta
                  </span>
                </div>
              </div>
            )}

            {/* TAB: Sistema */}
            {activeTab === 'sistema' && (
              <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 space-y-2">
                <div className="rounded-2xl bg-[#1f1f1f] border border-white/[0.06] divide-y divide-white/[0.06]">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Sesión activa
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {currentUser}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                      <Server className="w-3.5 h-3.5 text-orange-400" />
                      Insumos en inventario
                    </span>
                    <span className="text-xs font-bold text-slate-200">{products.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-red-400" />
                      Insumos de prioridad alta
                    </span>
                    <span className="text-xs font-bold text-red-400">{priorityCount}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                      <Timer className="w-3.5 h-3.5 text-orange-400" />
                      Ventana de envío en lote
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {Math.round(getBatchWindowMs() / 60000)} min sin cambios
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#1f1f1f] border border-white/[0.06] px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Servidor de datos (Google Sheets)
                  </p>
                  <p className="text-[10px] text-slate-500 break-all leading-relaxed">
                    {APPS_SCRIPT_ENDPOINT}
                  </p>
                </div>

                <p className="text-[10px] text-slate-500 text-center pt-1">
                  Los insumos marcados con <span className="text-red-400 font-bold">🔥 Prioridad Alta</span> envían
                  alertas con el prefijo «MÁXIMA PRIORIDAD - INSUMO CLAVE» y borde destacado en el correo.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
