import React from 'react';
import {
  RefreshCw,
  Lock,
  Unlock,
  Search,
  Settings,
  Moon,
  Sun,
  FileSpreadsheet
} from 'lucide-react';
import { SyncStatus } from '../types/inventory';

interface NavHeaderProps {
  syncStatus: SyncStatus;
  isUnlocked: boolean;
  onToggleLock: () => void;
  onOpenSettings: () => void;
  onOpenCommand: () => void;
  onManualSync: () => void;
  criticalCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const NavHeader: React.FC<NavHeaderProps> = ({
  syncStatus,
  isUnlocked,
  onToggleLock,
  onOpenSettings,
  onOpenCommand,
  onManualSync,
  criticalCount,
  activeTab,
  setActiveTab,
  isDarkMode,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white border-b border-gray-200 shadow-sm transition-colors text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('inventory')}>
              <img src="/logo.png" alt="SAHOCO logo" className="max-h-10 w-auto rounded-2xl object-contain block" />
              
            </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-neutral-900/80 rounded-xl border border-white/10 backdrop-blur-md">
            {[
              { id: 'inventory', label: 'Inventario', icon: '📦' },
              { id: 'recipes', label: 'Recetario & Venta', icon: '🍔' },
              { id: 'shopping', label: 'Lista Compras', icon: '🛒', badge: criticalCount > 0 ? criticalCount : null },
              { id: 'waste', label: 'Mermas', icon: '🗑️' },
              { id: 'audit', label: 'Auditoría', icon: '📋' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-amber-800 text-white shadow-sm border border-amber-500/15'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Search (CMD+K) */}
            <button
              onClick={onOpenCommand}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#3D2B1F]/80 hover:bg-[#5C3D2E]/80 border border-[#FDFBF7]/10 text-[#FDFBF7] text-xs transition-colors"
              title="Buscar (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Buscar insumo...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-800 text-neutral-400 border border-white/10">⌘K</kbd>
            </button>

            {/* Google Sheets Sync Pill */}
            <button
              onClick={onManualSync}
              disabled={syncStatus.isSyncing}
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                syncStatus.isConnected
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30'
                  : syncStatus.scriptUrl
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-400 hover:bg-amber-900/30'
                  : 'bg-neutral-900 border-white/10 text-neutral-400 hover:bg-neutral-800'
              }`}
              title={syncStatus.isConnected ? 'Sincronizado con Google Sheets' : 'Configurar conexión con Google Sheets'}
            >
              {syncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
              ) : syncStatus.isConnected ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-emerald animate-pulse" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span className="hidden sm:inline">
                {syncStatus.isSyncing
                  ? 'Sincronizando...'
                  : syncStatus.isConnected
                  ? '🟢 Sheets Online'
                  : '🟡 Modo Local'}
              </span>
            </button>

            {/* Security PIN Lock / Unlock */}
            <button
              onClick={onToggleLock}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isUnlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-neutral-900 border-white/10 text-neutral-400 hover:bg-neutral-800'
              }`}
              title={isUnlocked ? 'Modo Gerencia Desbloqueado (Clic para Bloquear)' : 'Bloqueado con PIN (Clic para Desbloquear)'}
            >
              {isUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-amber-300 font-semibold">Admin Activo</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">Seguridad PIN</span>
                </>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-[#3D2B1F]/80 hover:bg-[#5C3D2E] border border-[#FDFBF7]/10 text-[#FDFBF7] transition-colors"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-[#3D2B1F]/80 hover:bg-[#5C3D2E] border border-[#FDFBF7]/10 text-[#FDFBF7] hover:text-white transition-colors"
              title="Configuración y Google Apps Script"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-white/5 overflow-x-auto gap-2">
          {[
            { id: 'inventory', label: 'Inventario', icon: '📦' },
            { id: 'recipes', label: 'Recetario', icon: '🍔' },
            { id: 'shopping', label: 'Compras', icon: '🛒', badge: criticalCount > 0 ? criticalCount : null },
            { id: 'waste', label: 'Mermas', icon: '🗑️' },
            { id: 'audit', label: 'Historial', icon: '📋' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-neutral-800 text-orange-400 font-semibold border border-white/10'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
};
