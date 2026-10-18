'use client';

import React from 'react';
import { RefreshCw, LogOut } from 'lucide-react';
import { UserName, AUTHORIZED_USERS } from '../lib/types';

interface TopHeaderProps {
  currentUser: UserName;
  onLogout: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
  activeCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  onLogout,
  isSyncing,
  onRefresh,
  activeCount
}) => {
  const userInfo = AUTHORIZED_USERS.find(u => u.name === currentUser);

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

          {/* User pill */}
          <div className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-2xl bg-[#1f1f1f] border border-white/[0.08]">
            <span className="text-sm">{userInfo?.avatar || '👤'}</span>
            <div className="hidden xs:block text-left">
              <span className="text-[9px] text-slate-500 block font-medium uppercase tracking-wider leading-none">
                Sesión
              </span>
              <span className="text-xs font-bold text-slate-200 leading-tight">
                {currentUser}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-0.5"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
