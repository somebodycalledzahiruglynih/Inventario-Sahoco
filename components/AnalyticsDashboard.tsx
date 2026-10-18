'use client';

import React, { useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Activity, 
  Clock, 
  TrendingDown, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  ChefHat
} from 'lucide-react';
import { ProductItem, HistoryRecord, MainCategory } from '../lib/types';

interface AnalyticsDashboardProps {
  products: ProductItem[];
  history: HistoryRecord[];
  onNavigateToShopping: () => void;
  onRequestComiso: () => void;
  onNavigateToRecipes: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  products,
  history,
  onNavigateToShopping,
  onRequestComiso,
  onNavigateToRecipes
}) => {
  // Real dynamic KPI calculations from sheet data
  const totalInsumos = products.length;
  const criticalItems = useMemo(() => products.filter(p => p.stockActual <= p.stockMinimo), [products]);
  const outOfStockItems = useMemo(() => products.filter(p => p.stockActual <= 0), [products]);
  const comisosCount = useMemo(() => history.filter(h => h.tipo === 'COMISO').length, [history]);
  
  const healthRate = totalInsumos > 0 
    ? Math.round(((totalInsumos - criticalItems.length) / totalInsumos) * 100) 
    : 100;

  const totalMovimientos = history.length;

  // Real Category Distribution from active items
  const categoriesConfig: { cat: MainCategory; label: string; icon: string; color: string }[] = [
    { cat: 'Insumos & Salado', label: 'Salado y Cocina', icon: '🍟', color: '#f97316' },
    { cat: 'Postres & Repostería', label: 'Postres Synthia', icon: '🍰', color: '#fb923c' },
    { cat: 'Bebidas', label: 'Bebidas & Syrups', icon: '🥤', color: '#38bdf8' },
    { cat: 'Desechables', label: 'Desechables & Empaques', icon: '📦', color: '#a855f7' },
  ];

  const categoryStats = useMemo(() => {
    return categoriesConfig.map(cfg => {
      const itemsInCat = products.filter(p => p.categoria === cfg.cat);
      const criticalInCat = itemsInCat.filter(p => p.stockActual <= p.stockMinimo).length;
      const percentage = totalInsumos > 0 ? Math.round((itemsInCat.length / totalInsumos) * 100) : 0;
      return {
        ...cfg,
        count: itemsInCat.length,
        critical: criticalInCat,
        percentage
      };
    });
  }, [products, totalInsumos]);

  // Top 5 Insumos with lowest stock
  const topLowestStock = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const ratioA = a.stockMaximo > 0 ? a.stockActual / a.stockMaximo : 0;
        const ratioB = b.stockMaximo > 0 ? b.stockActual / b.stockMaximo : 0;
        return ratioA - ratioB;
      })
      .slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* 0. Quick Actions: Comiso / Merma & Recetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onRequestComiso}
          className="bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 hover:border-red-500/40 rounded-3xl p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] btn-thumb"
        >
          <div className="p-2.5 rounded-2xl bg-red-500/15 border border-red-500/25 text-red-400 flex-none">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm text-white block">Registrar Comiso / Merma</span>
            <span className="text-[11px] text-red-300/80 font-semibold block">
              {comisosCount > 0 ? `${comisosCount} merma${comisosCount > 1 ? 's' : ''} registrada${comisosCount > 1 ? 's' : ''}` : 'Pérdidas, vencimientos y daños'}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-red-400 flex-none" />
        </button>

        <button
          onClick={onNavigateToRecipes}
          className="bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 hover:border-emerald-500/40 rounded-3xl p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] btn-thumb"
        >
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex-none">
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm text-white block">Recetas del Menú</span>
            <span className="text-[11px] text-emerald-300/80 font-semibold block">
              Preparar platos con descuento exacto
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-400 flex-none" />
        </button>
      </div>

      {/* 1. Real KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Total Insumos */}
        <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Insumos
            </span>
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 flex-none">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              {totalInsumos}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">registrados</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/[0.06]">
            Existencias en tiempo real
          </div>
        </div>

        {/* KPI 2: Stock Crítico */}
        <div 
          onClick={onNavigateToShopping}
          className={`bg-[#1a1a1a] border shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all ${
            criticalItems.length > 0
              ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/15'
              : 'border-white/[0.08]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              {criticalItems.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-none" />}
              Stock Crítico
            </span>
            <div className={`p-2 rounded-xl flex-none ${criticalItems.length > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#242424] text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-2xl sm:text-3xl font-extrabold font-display ${criticalItems.length > 0 ? 'text-red-400' : 'text-white'}`}>
              {criticalItems.length}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">
              ({outOfStockItems.length} agotados)
            </span>
          </div>
          <div className="text-[10px] text-red-400 font-bold mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between">
            <span>Ver reposición</span>
            <ArrowRight className="w-3 h-3 flex-none" />
          </div>
        </div>

        {/* KPI 3: Salud del Inventario */}
        <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Salud Operativa
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex-none">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-display">
              {healthRate}%
            </span>
            <span className="text-xs text-slate-400 ml-1.5">abastecido</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/[0.06]">
            Nivel óptimo de cocina
          </div>
        </div>

        {/* KPI 4: Total de Movimientos */}
        <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Movimientos
            </span>
            <div className="p-2 rounded-xl bg-[#242424] text-slate-400 border border-white/[0.06] flex-none">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              {totalMovimientos}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">registrados</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/[0.06]">
            Auditoría de usuarios
          </div>
        </div>

      </div>

      {/* 2. Key Indicators: Categories Distribution & Top 5 Lowest Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Card A: Gráfica de Stock por Categoría */}
        <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400 flex-none" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                Distribución por Categoría
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              4 Secciones
            </span>
          </div>

          <div className="space-y-3">
            {categoryStats.map(stat => (
              <div key={stat.cat} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{stat.icon}</span>
                    <span>{stat.label}</span>
                  </span>
                  <span className="text-slate-400 font-semibold">
                    {stat.count} insumos ({stat.percentage}%)
                  </span>
                </div>
                
                {/* Visual Bar */}
                <div className="w-full h-2 rounded-full bg-[#242424] overflow-hidden flex">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.color 
                    }}
                  />
                </div>

                {stat.critical > 0 && (
                  <span className="text-[10px] font-bold text-red-400 block text-right">
                    ⚠️ {stat.critical} con stock bajo o agotado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Top 5 Insumos con Menor Existencia */}
        <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400 flex-none" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                Top 5 Menor Existencia (Urgentes)
              </h3>
            </div>
            <span className="text-xs text-red-400 font-bold">
              Prioridad
            </span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {topLowestStock.map((item, index) => {
              const isOut = item.stockActual <= 0;
              const ratio = item.stockMaximo > 0 ? Math.round((item.stockActual / item.stockMaximo) * 100) : 0;

              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center text-xs font-black text-orange-400 flex-none">
                      #{index + 1}
                    </span>
                    <img 
                      src={item.foto} 
                      alt={item.nombre} 
                      className="w-10 h-10 rounded-xl object-cover bg-[#242424] flex-none border border-white/[0.08]" 
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-white truncate block">
                        {item.nombre}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {item.suplidor} • Mín: {item.stockMinimo}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-none">
                    <span className={`text-sm font-extrabold block ${isOut ? 'text-red-400' : 'text-amber-400'}`}>
                      {item.stockActual} {item.unidad}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {ratio}% de capacidad
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Real Audit Trail Report */}
      <div className="bg-[#1a1a1a] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400 flex-none" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              Reporte de Actividad Real
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {history.length} {history.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs font-medium text-slate-400">
              No hay movimientos registrados hoy
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Los cambios de existencias y reposiciones aparecerán aquí en tiempo real.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {history.slice(0, 5).map(record => (
              <div key={record.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={record.itemFoto || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                    alt={record.itemNombre}
                    className="w-8 h-8 rounded-lg object-cover bg-[#242424] flex-none border border-white/[0.08]"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">
                      {record.itemNombre}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {record.detalle}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-none">
                  <span className="font-bold text-orange-400 block text-[11px]">
                    {record.usuario}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Intl.DateTimeFormat('es-DO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(record.timestamp))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
