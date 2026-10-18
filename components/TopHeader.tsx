'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { UserName, AUTHORIZED_USERS } from '../lib/types';

interface TopHeaderProps {
  currentUser: UserName;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
  activeCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  onLogout,
  onOpenProfile,
  onOpenSettings,
  isSyncing,
  onRefresh,
  activeCount
}) => {
  const userInfo = AUTHORIZED_USERS.find(u => u.name === currentUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al tocar fuera de él
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const closeAndRun = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#141414] border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">

        {/* ── Brand / Logo ── */}
        <div className="flex items-center gap-3">
          <div className="flex-none h-11 sm:h-12 flex items-center overflow-visible">
            <img
              src="/Logo.png"
              alt="SAHOCO"
              className="h-9 sm:h-10 w-auto max-w-[150px] sm:max-w-[180px] object-contain block drop-shadow-sm select-none"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest leading-none">
              Inventario Operativo
            </span>
            <span className="text-[11px] text-slate-300 font-semibold leading-tight mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>{activeCount} productos en inventario</span>
            </span>
          </div>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2">

          {/* Sync button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f1f1f] border border-white/[0.08] text-slate-300 text-xs font-semibold hover:border-orange-500/40 hover:text-orange-400 transition-all"
            title="Sincronizar con Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[11px]">
              {isSyncing ? 'Sincronizando…' : 'Sincronizado'}
            </span>
          </button>

          {/* User pill + dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(open => !open)}
              className={`flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-2xl bg-[#1f1f1f] border transition-all ${
                isMenuOpen ? 'border-orange-500/50' : 'border-white/[0.08] hover:border-orange-500/40'
              }`}
              title="Menú de usuario"
            >
              <span className="text-sm">{userInfo?.avatar || '👤'}</span>
              <div className="hidden sm:block text-left">
                <span className="text-[9px] text-slate-500 block font-medium uppercase tracking-wider leading-none">
                  Sesión
                </span>
                <span className="text-xs font-bold text-slate-200 leading-tight">
                  {currentUser}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06] bg-[#1f1f1f]/60">
                    <p className="text-xs font-bold text-white">{currentUser}</p>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => closeAndRun(onOpenProfile)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-[#242424] transition-colors"
                    >
                      <User className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-semibold">Perfil</span>
                    </button>

                    <button
                      onClick={() => closeAndRun(onOpenSettings)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-[#242424] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-semibold">Configuración</span>
                    </button>

                    <div className="my-1 h-px bg-white/[0.06]" />

                    <button
                      onClick={() => closeAndRun(onLogout)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs font-semibold">Cerrar Sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
};
