'use client';

import React from 'react';
import { Package, ShoppingCart, Clock, Plus, BarChart3, ChefHat } from 'lucide-react';

export type ActiveTab = 'inventory' | 'analytics' | 'shopping' | 'history' | 'recipes';

interface BottomNavProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  shoppingAlertCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  shoppingAlertCount
}) => {
  const tabClass = (tab: ActiveTab) =>
    `flex-1 flex flex-col items-center justify-center py-1 transition-all ${
      currentTab === tab
        ? 'text-orange-400 font-bold'
        : 'text-slate-500 hover:text-slate-300'
    }`;

  const iconWrapper = (tab: ActiveTab) =>
    `p-1.5 rounded-xl transition-all ${currentTab === tab ? 'bg-orange-500/15' : ''}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#141414]/95 backdrop-blur-xl border-t border-white/[0.07] shadow-[0_-4px_24px_rgba(0,0,0,0.5)] safe-area-pb">
      <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center justify-between">

        {/* Analítica */}
        <button onClick={() => onSelectTab('analytics')} className={tabClass('analytics')}>
          <div className={iconWrapper('analytics')}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-0.5">Analítica</span>
        </button>

        {/* Insumos */}
        <button onClick={() => onSelectTab('inventory')} className={tabClass('inventory')}>
          <div className={iconWrapper('inventory')}>
            <Package className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-0.5">Insumos</span>
        </button>

        {/* Central Add Button */}
        <div className="flex-none px-1 -mt-5">
          <button
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            title="Añadir Insumo al Inventario"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Recetas */}
        <button onClick={() => onSelectTab('recipes')} className={tabClass('recipes')}>
          <div className={iconWrapper('recipes')}>
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-0.5">Recetas</span>
        </button>

        {/* Compras */}
        <button onClick={() => onSelectTab('shopping')} className={`${tabClass('shopping')} relative`}>
          <div className={`${iconWrapper('shopping')} relative`}>
            <ShoppingCart className="w-5 h-5" />
            {shoppingAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 text-[9px] font-extrabold rounded-full bg-red-500 text-white animate-pulse">
                {shoppingAlertCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5">Compras</span>
        </button>

        {/* Historial */}
        <button onClick={() => onSelectTab('history')} className={tabClass('history')}>
          <div className={iconWrapper('history')}>
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-0.5">Auditoría</span>
        </button>

      </div>
    </nav>
  );
};
