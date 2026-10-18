import React from 'react';
import { Package, AlertCircle, DollarSign, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { InventoryItem, WasteRecord } from '../types/inventory';
import { formatCurrency } from '../lib/utils';

interface KPICardsProps {
  items: InventoryItem[];
  wasteRecords: WasteRecord[];
  onViewLowStock: () => void;
  onViewShoppingList: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  items,
  wasteRecords,
  onViewLowStock,
  onViewShoppingList
}) => {
  // Calculations
  const totalItems = items.length;
  const outOfStockCount = items.filter(i => i.stockActual <= 0).length;
  const lowStockCount = items.filter(i => i.stockActual > 0 && i.stockActual <= i.stockMinimo).length;
  const criticalTotal = outOfStockCount + lowStockCount;

  const totalValue = items.reduce((acc, item) => acc + (item.stockActual * item.costoUnitario), 0);
  
  const totalWasteCost = wasteRecords.reduce((acc, w) => acc + (w.costoPerdido || 0), 0);
  
  const healthPercentage = totalItems > 0 
    ? Math.round(((totalItems - criticalTotal) / totalItems) * 100) 
    : 100;

  const synthiaItems = items.filter(i => i.categoria === 'postres_synthia');
  const saladoItems = items.filter(i => i.categoria === 'insumos_salado' || i.categoria === 'carnes_embutidos');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* KPI 1: Total Artículos */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Total Artículos
          </span>
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-display tracking-tight">
            {totalItems}
          </span>
          <span className="text-xs text-neutral-400">SKUs activos</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-white/5">
          <span>{saladoItems.length} Salado</span>
          <span className="w-1 h-1 rounded-full bg-neutral-600" />
          <span>{synthiaItems.length} Postres Synthia</span>
        </div>
      </div>

      {/* KPI 2: Stock Crítico / Por Reabastecer */}
      <div 
        onClick={criticalTotal > 0 ? onViewShoppingList : undefined}
        className={`glass-card rounded-2xl p-5 relative overflow-hidden transition-all ${
          criticalTotal > 0 
            ? 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60 cursor-pointer group shadow-glow-rose' 
            : 'hover:border-white/20'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
            {criticalTotal > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            Stock Crítico
          </span>
          <div className={`p-2.5 rounded-xl ${criticalTotal > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold font-display tracking-tight ${criticalTotal > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {criticalTotal}
          </span>
          <span className="text-xs text-neutral-400">
            {outOfStockCount > 0 ? `(${outOfStockCount} agotados, ${lowStockCount} bajos)` : 'requieren compra'}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
          {criticalTotal > 0 ? (
            <span className="text-rose-400 font-medium flex items-center gap-1 group-hover:underline">
              Generar lista de compras <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Niveles óptimos
            </span>
          )}
        </div>
      </div>

      {/* KPI 3: Valoración de Inventario */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Valor de Inventario
          </span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            {formatCurrency(totalValue)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-white/5">
          <span>Costo total en almacén</span>
          <span className="text-amber-400 font-medium">Activo circulante</span>
        </div>
      </div>

      {/* KPI 4: Mermas y Salud */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Salud Operativa
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-display tracking-tight">
            {healthPercentage}%
          </span>
          <span className="text-xs text-neutral-400">abastecido</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-white/5">
          <span className="flex items-center gap-1 text-neutral-400">
            <TrendingDown className="w-3.5 h-3.5 text-neutral-500" />
            Mermas: {formatCurrency(totalWasteCost)}
          </span>
          <span className="text-[11px] text-neutral-500">{wasteRecords.length} registros</span>
        </div>
      </div>

    </div>
  );
};
