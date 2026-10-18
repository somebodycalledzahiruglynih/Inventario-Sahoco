import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Trash2, 
  TrendingDown, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle2, 
  Send,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { InventoryItem, WasteRecord } from '../types/inventory';
import { formatCurrency, formatDate } from '../lib/utils';

interface LossTrackerProps {
  items: InventoryItem[];
  wasteRecords: WasteRecord[];
  onAddWaste: (waste: WasteRecord) => void;
  onSendWasteSummaryEmail: () => void;
  initialSelectedItem?: InventoryItem | null;
  onClearInitialSelected?: () => void;
}

export const LossTracker: React.FC<LossTrackerProps> = ({
  items,
  wasteRecords,
  onAddWaste,
  onSendWasteSummaryEmail,
  initialSelectedItem,
  onClearInitialSelected
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(initialSelectedItem?.id || (items[0]?.id || ''));
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<WasteRecord['motivo']>('Vencimiento');
  const [registradoPor, setRegistradoPor] = useState<string>('Cocinero Turno');
  const [notas, setNotas] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const selectedItem = items.find(i => i.id === selectedItemId);

  const calculatedCost = selectedItem 
    ? Number((cantidad * selectedItem.costoUnitario).toFixed(2)) 
    : 0;

  const totalWasteAmount = wasteRecords.reduce((acc, curr) => acc + (curr.costoPerdido || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || cantidad <= 0) return;

    const newWaste: WasteRecord = {
      id: `WST-${Date.now().toString().slice(-4)}`,
      itemId: selectedItem.id,
      itemNombre: selectedItem.nombre,
      cantidad: Number(cantidad),
      unidad: selectedItem.unidad,
      motivo,
      costoPerdido: calculatedCost,
      fecha: new Date().toISOString(),
      registradoPor: registradoPor.trim() || 'Personal de Turno',
      notas: notas.trim()
    };

    onAddWaste(newWaste);

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    // Reset fields
    setCantidad(1);
    setNotas('');
    if (onClearInitialSelected) onClearInitialSelected();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-glow-rose">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Control de Mermas y Productos Dañados
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Registra pérdidas por vencimiento, caídas o fallas de refrigeración. Se descuenta automáticamente del inventario.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] uppercase font-bold text-neutral-400 tracking-wider block">
              Pérdida Total Acumulada
            </span>
            <span className="text-2xl font-black text-rose-400 font-display">
              {formatCurrency(totalWasteAmount)}
            </span>
          </div>
          <button
            onClick={onSendWasteSummaryEmail}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-200 rounded-xl text-xs font-semibold transition-all hover:border-rose-500/30"
            title="Enviar reporte semanal por correo"
          >
            <Send className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Reporte por Correo</span>
          </button>
        </div>
      </div>

      {/* Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Waste Registration Form (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-white/10 h-fit">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            Registrar Nueva Merma / Descarte
          </h3>
          <p className="text-xs text-neutral-400 mb-5">
            El stock del insumo seleccionado se actualizará en tiempo real
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Select Insumo */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Insumo o Postre Dañado *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} (Stock: {item.stockActual} {item.unidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                  Cantidad a Descartar *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    max={selectedItem?.stockActual || 9999}
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    {selectedItem?.unidad || 'ud'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                  Costo de Pérdida
                </label>
                <div className="px-3.5 py-2.5 bg-neutral-950/60 border border-white/10 rounded-xl text-sm font-extrabold text-rose-400">
                  {formatCurrency(calculatedCost)}
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Motivo del Descarte *
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Vencimiento">⏳ Vencimiento / Caducidad</option>
                <option value="Caída o Derrame">💥 Caída o Derrame Accidental</option>
                <option value="Mal estado de origen">🚚 Mal estado de origen (Suplidor)</option>
                <option value="Error en preparación">👨‍🍳 Error en cocción o preparación</option>
                <option value="Fallo de refrigeración">❄️ Fallo de refrigeración / Temperatura</option>
                <option value="Otro">❓ Otro motivo</option>
              </select>
            </div>

            {/* Registrado Por */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Registrado Por (Responsable)
              </label>
              <input
                type="text"
                placeholder="ej: Cocinero Juan, Synthia, Supervisor..."
                value={registradoPor}
                onChange={(e) => setRegistradoPor(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Notas / Observaciones */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Notas u Observaciones
              </label>
              <textarea
                rows={2}
                placeholder="Detalle adicional del incidente..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-sm font-bold shadow-glow-rose transition-all active:scale-98 flex items-center justify-center gap-2 mt-4"
            >
              <Trash2 className="w-4 h-4" />
              <span>Registrar y Descontar Stock</span>
            </button>

            {showSuccessToast && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs text-center font-medium animate-in fade-in">
                ✓ Merma registrada y descontada del inventario exitosamente
              </div>
            )}
          </form>
        </div>

        {/* History Table (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-neutral-400" />
                  Historial de Mermas Registradas
                </h3>
                <p className="text-xs text-neutral-400">
                  {wasteRecords.length} incidentes registrados
                </p>
              </div>
            </div>

            {wasteRecords.length === 0 ? (
              <div className="py-16 text-center text-neutral-500">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No se han registrado mermas en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Fecha & Responsable</th>
                      <th className="py-2.5 px-3">Artículo & Cantidad</th>
                      <th className="py-2.5 px-3">Motivo</th>
                      <th className="py-2.5 px-3 text-right">Pérdida (RD$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {wasteRecords.map(record => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-medium text-neutral-300">
                            {formatDate(record.fecha)}
                          </div>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />
                            {record.registradoPor}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">
                            {record.itemNombre}
                          </div>
                          <div className="text-rose-400 font-bold mt-0.5">
                            -{record.cantidad} {record.unidad}
                          </div>
                          {record.notas && (
                            <div className="text-[11px] text-neutral-500 italic mt-0.5 truncate max-w-xs">
                              "{record.notas}"
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-white/10 text-[10px] font-medium">
                            {record.motivo}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-400">
                          {formatCurrency(record.costoPerdido)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
