import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Send, 
  Copy, 
  Check, 
  CheckCircle2, 
  Building2, 
  AlertCircle, 
  Package, 
  DollarSign,
  ArrowUpRight,
  ExternalLink,
  MessageCircle,
  Mail
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { formatCurrency } from '../lib/utils';

interface QuickShoppingListProps {
  items: InventoryItem[];
  onRestockItem: (itemId: string, addedStock: number) => void;
}

export const QuickShoppingList: React.FC<QuickShoppingListProps> = ({
  items,
  onRestockItem
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);
  const [receivedItems, setReceivedItems] = useState<Record<string, boolean>>({});

  // Filter items where stockActual <= stockMinimo
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.stockActual <= item.stockMinimo);
  }, [items]);

  // Group by Supplier
  const groupedBySupplier = useMemo(() => {
    const groups: Record<string, {
      items: InventoryItem[];
      totalEstimatedCost: number;
    }> = {};

    lowStockItems.forEach(item => {
      const sup = item.suplidor || 'Sin Suplidor';
      if (!groups[sup]) {
        groups[sup] = { items: [], totalEstimatedCost: 0 };
      }
      
      const suggestedQty = Math.max(1, item.stockMaximo - item.stockActual);
      const estCost = suggestedQty * item.costoUnitario;
      
      groups[sup].items.push(item);
      groups[sup].totalEstimatedCost += estCost;
    });

    return groups;
  }, [lowStockItems]);

  const suppliersList = Object.keys(groupedBySupplier);

  // Generate WhatsApp formatted text
  const generateWhatsAppMessage = (supplier: string) => {
    const group = groupedBySupplier[supplier];
    if (!group) return '';

    const today = new Intl.DateTimeFormat('es-DO', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(new Date());

    let message = `🍟 *ORDEN DE COMPRA - SAHOCO FAST FOOD & POSTRES*\n`;
    message += `🏪 *Suplidor:* ${supplier}\n`;
    message += `📅 *Fecha:* ${today}\n\n`;
    message += `📦 *LISTA DE ARTÍCULOS REQUERIDOS:*\n`;

    group.items.forEach((item, index) => {
      const suggestedQty = Math.max(1, item.stockMaximo - item.stockActual);
      message += `${index + 1}. *${item.nombre}*\n`;
      message += `   • Cantidad a pedir: *${suggestedQty} ${item.unidad}*\n`;
      message += `   • Stock actual: ${item.stockActual} ${item.unidad} (Mínimo: ${item.stockMinimo})\n\n`;
    });

    message += `💰 *Presupuesto Estimado:* ${formatCurrency(group.totalEstimatedCost)}\n`;
    message += `⚡ *Favor confirmar disponibilidad y tiempo de entrega.* Gracias!`;

    return message;
  };

  const handleSendWhatsApp = (supplier: string) => {
    const text = generateWhatsAppMessage(supplier);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyOrder = (supplier: string) => {
    const text = generateWhatsAppMessage(supplier);
    navigator.clipboard.writeText(text);
    setCopiedSupplier(supplier);
    setTimeout(() => setCopiedSupplier(null), 2500);
  };

  const handleReceiveStock = (item: InventoryItem) => {
    const suggestedQty = Math.max(1, item.stockMaximo - item.stockActual);
    onRestockItem(item.id, suggestedQty);
    setReceivedItems(prev => ({ ...prev, [item.id]: true }));
  };

  const grandTotalCost = Object.values(groupedBySupplier).reduce((acc, g) => acc + g.totalEstimatedCost, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-glow-orange">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Generador de Lista de Compras Inteligente
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Artículos con Stock Actual ≤ Mínimo agrupados por Suplidor para envío directo por WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] uppercase font-bold text-neutral-400 tracking-wider block">
                Presupuesto Total Estimado
              </span>
              <span className="text-2xl font-black text-amber-400 font-display">
                {formatCurrency(grandTotalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Filter Tabs */}
        {suppliersList.length > 0 && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSupplier('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSupplier === 'all'
                  ? 'bg-neutral-800 text-white border border-white/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              Todos los Suplidores ({suppliersList.length})
            </button>
            {suppliersList.map(sup => {
              const count = groupedBySupplier[sup]?.items.length || 0;
              const isSelected = selectedSupplier === sup;
              return (
                <button
                  key={sup}
                  onClick={() => setSelectedSupplier(sup)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{sup}</span>
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-neutral-800 text-neutral-300 font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* When everything is well stocked */}
      {lowStockItems.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/10">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">¡Inventario SAHOCO al 100%!</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            No hay ningún insumo ni postre por debajo de su umbral mínimo de seguridad. Todo el menú de frituras y repostería Synthia está listo para despachar.
          </p>
        </div>
      ) : (
        /* Supplier Groups Grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {suppliersList
            .filter(sup => selectedSupplier === 'all' || selectedSupplier === sup)
            .map(supplier => {
              const group = groupedBySupplier[supplier];
              const isCopied = copiedSupplier === supplier;

              return (
                <div 
                  key={supplier}
                  className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all"
                >
                  <div>
                    {/* Supplier Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-neutral-800 text-orange-400 border border-white/10">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{supplier}</h3>
                          <span className="text-xs text-neutral-400">
                            {group.items.length} {group.items.length === 1 ? 'artículo' : 'artículos'} por reabastecer
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          Subtotal Estimado
                        </span>
                        <div className="text-sm font-extrabold text-amber-400">
                          {formatCurrency(group.totalEstimatedCost)}
                        </div>
                      </div>
                    </div>

                    {/* Items List in this Supplier */}
                    <div className="divide-y divide-white/5 my-3">
                      {group.items.map(item => {
                        const suggestedQty = Math.max(1, item.stockMaximo - item.stockActual);
                        const isOut = item.stockActual <= 0;
                        const isReceived = receivedItems[item.id];

                        return (
                          <div 
                            key={item.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-neutral-200 truncate">
                                  {item.nombre}
                                </span>
                                {isOut ? (
                                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    AGOTADO
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    BAJO
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-3">
                                <span>Stock actual: <strong className="text-white">{item.stockActual}</strong> {item.unidad}</span>
                                <span>Mínimo: {item.stockMinimo}</span>
                                <span>Máximo: {item.stockMaximo}</span>
                              </div>
                            </div>

                            {/* Quantity to buy & Quick Restock */}
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <span className="text-xs text-neutral-400 block">Pedir</span>
                                <span className="text-sm font-extrabold text-orange-400">
                                  +{suggestedQty} {item.unidad}
                                </span>
                              </div>

                              <button
                                onClick={() => handleReceiveStock(item)}
                                className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                                  isReceived
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10 hover:border-emerald-500/30'
                                }`}
                                title="Marcar como recibido y actualizar stock"
                              >
                                {isReceived ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-neutral-400 hover:text-emerald-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* WhatsApp & Copy Action Bar */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyOrder(supplier)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Copiar Orden</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(supplier)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-glow-emerald transition-all active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Enviar por WhatsApp</span>
                    </button>
                  </div>

                </div>
              );
            })}
        </div>
      )}

    </div>
  );
};
