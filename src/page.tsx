import React, { useState, useEffect, useCallback } from 'react';
import { 
  InventoryItem, 
  WasteRecord, 
  AuditLogEntry, 
  SyncStatus, 
  Recipe 
} from './types/inventory';
import { 
  loadLocalInventory, 
  saveLocalInventory, 
  loadLocalWaste, 
  saveLocalWaste, 
  loadLocalAuditLogs, 
  saveLocalAuditLogs,
  loadSyncConfig,
  saveSyncConfig,
  fetchInventoryFromSheets,
  syncInventoryToSheets,
  syncWasteToSheets,
  sendEmailNotification,
  SyncConfig
} from './lib/googleSheets';
import { NavHeader } from './components/NavHeader';
import { KPICards } from './components/KPICards';
import { InventoryTable } from './components/InventoryTable';
import { QuickShoppingList } from './components/QuickShoppingList';
import { LossTracker } from './components/LossTracker';
import { MenuSimulator } from './components/MenuSimulator';
import { AuditLogView } from './components/AuditLogView';
import { CommandPalette } from './components/CommandPalette';
import { PinModal } from './components/PinModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { AlertCircle, ArrowRight, ShoppingCart, RefreshCw, CheckCircle2, Flame } from 'lucide-react';

export default function SahocoApp() {
  // Primary States
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('inventory');
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Security Lock
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // Modals & Panels
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [preselectedWasteItem, setPreselectedWasteItem] = useState<InventoryItem | null>(null);

  // Sync Status
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(loadSyncConfig());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConfigured: !!syncConfig.scriptUrl,
    isConnected: false,
    lastSynced: null,
    scriptUrl: syncConfig.scriptUrl,
    pendingSyncCount: 0,
    isSyncing: false
  });

  // Notification Banner
  const [bannerNotice, setBannerNotice] = useState<{ message: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const showBanner = (message: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setBannerNotice({ message, type });
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const loadedItems = loadLocalInventory();
    const loadedWaste = loadLocalWaste();
    const loadedLogs = loadLocalAuditLogs();
    const cfg = loadSyncConfig();

    setItems(loadedItems);
    setWasteRecords(loadedWaste);
    setAuditLogs(loadedLogs);
    setSyncConfig(cfg);

    if (cfg.scriptUrl) {
      // Attempt background sync
      handleBackgroundSync(cfg.scriptUrl);
    }
  }, []);

  // Sync with Google Apps Script
  const handleBackgroundSync = async (url: string) => {
    if (!url) return;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const remoteData = await fetchInventoryFromSheets(url);
      if (remoteData && remoteData.length > 0) {
        setItems(remoteData);
        setSyncStatus(prev => ({
          ...prev,
          isConnected: true,
          isSyncing: false,
          lastSynced: new Date().toLocaleTimeString(),
          error: null
        }));
        showBanner('Sincronizado exitosamente con Google Sheets', 'success');
      }
    } catch (err: any) {
      setSyncStatus(prev => ({
        ...prev,
        isConnected: false,
        isSyncing: false,
        error: err.message
      }));
    }
  };

  // Add an audit log entry
  const logAudit = (accion: AuditLogEntry['accion'], detalle: string, tipo: AuditLogEntry['tipo'] = 'info') => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      usuario: isUnlocked ? 'Admin Gerencia' : 'Cocinero / Personal',
      accion,
      detalle,
      tipo
    };
    const updated = [newEntry, ...auditLogs];
    setAuditLogs(updated);
    saveLocalAuditLogs(updated);
  };

  // Update Stock with Optimistic UI
  const handleUpdateStock = (itemId: string, newStock: number, reason: string) => {
    const previousItem = items.find(i => i.id === itemId);
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          stockActual: newStock,
          ultimaModificacion: new Date().toISOString(),
          modificadoPor: isUnlocked ? 'Admin' : 'Personal'
        };
      }
      return item;
    });

    setItems(updatedItems);
    saveLocalInventory(updatedItems);

    logAudit(
      'AJUSTE_STOCK', 
      `${previousItem?.nombre}: De ${previousItem?.stockActual} a ${newStock} ${previousItem?.unidad}. (${reason})`,
      newStock <= (previousItem?.stockMinimo || 0) ? 'warning' : 'info'
    );

    // Sync in background if configured
    if (syncConfig.scriptUrl) {
      syncInventoryToSheets(syncConfig.scriptUrl, updatedItems, reason);
    }
  };

  // Save new or updated item
  const handleSaveItem = (itemToSave: InventoryItem) => {
    const exists = items.some(i => i.id === itemToSave.id);
    let updated: InventoryItem[];

    if (exists) {
      updated = items.map(i => i.id === itemToSave.id ? itemToSave : i);
      logAudit('EDICION_ITEM', `Modificado insumo "${itemToSave.nombre}"`, 'info');
      showBanner(`Insumo "${itemToSave.nombre}" actualizado`, 'success');
    } else {
      updated = [itemToSave, ...items];
      logAudit('CREACION_ITEM', `Creado nuevo insumo "${itemToSave.nombre}"`, 'info');
      showBanner(`Nuevo insumo "${itemToSave.nombre}" agregado`, 'success');
    }

    setItems(updated);
    saveLocalInventory(updated);

    if (syncConfig.scriptUrl) {
      syncInventoryToSheets(syncConfig.scriptUrl, updated, 'Creación/Edición de insumo');
    }
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    const updated = items.filter(i => i.id !== itemId);
    setItems(updated);
    saveLocalInventory(updated);
    logAudit('ELIMINACION_ITEM', `Eliminado insumo "${item?.nombre}"`, 'alert');
    showBanner(`Insumo eliminado`, 'info');

    if (syncConfig.scriptUrl) {
      syncInventoryToSheets(syncConfig.scriptUrl, updated, 'Eliminación de insumo');
    }
  };

  // Add Waste Record
  const handleAddWaste = (waste: WasteRecord) => {
    // 1. Deduct stock from item
    const item = items.find(i => i.id === waste.itemId);
    if (item) {
      const newStock = Math.max(0, Number((item.stockActual - waste.cantidad).toFixed(2)));
      handleUpdateStock(waste.itemId, newStock, `Merma: ${waste.motivo} (-${waste.cantidad} ${waste.unidad})`);
    }

    // 2. Save waste record
    const updatedWaste = [waste, ...wasteRecords];
    setWasteRecords(updatedWaste);
    saveLocalWaste(updatedWaste);

    logAudit('MERMA_REGISTRADA', `Merma de ${waste.cantidad} ${waste.unidad} de ${waste.itemNombre} por motivo: ${waste.motivo}`, 'alert');
    showBanner(`Merma registrada: -${waste.cantidad} ${waste.unidad}`, 'alert');

    // 3. Sync waste to sheets
    if (syncConfig.scriptUrl) {
      syncWasteToSheets(syncConfig.scriptUrl, waste);
    }
  };

  // Restock item from Shopping List
  const handleRestockFromShopping = (itemId: string, addedStock: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newStock = Number((item.stockActual + addedStock).toFixed(2));
    handleUpdateStock(itemId, newStock, `Compra reabastecida (+${addedStock} ${item.unidad})`);
    showBanner(`Reabastecido: +${addedStock} ${item.unidad} de ${item.nombre}`, 'success');
  };

  // Recipe Sale Simulator Deduction
  const handleSellRecipe = (recipe: Recipe, quantity: number): { success: boolean; message: string } => {
    // Check if sufficient ingredients exist
    for (const ing of recipe.ingredientes) {
      const item = items.find(i => i.id === ing.itemId);
      const needed = ing.cantidad * quantity;
      if (!item || item.stockActual < needed) {
        return {
          success: false,
          message: `Stock insuficiente de "${item?.nombre || 'Ingrediente'}". Se necesitan ${needed} ${item?.unidad || 'unidades'}, disponible: ${item?.stockActual || 0}.`
        };
      }
    }

    // Deduct all ingredients proportionally
    const updatedItems = items.map(item => {
      const match = recipe.ingredientes.find(ing => ing.itemId === item.id);
      if (match) {
        const deduct = match.cantidad * quantity;
        const newStock = Math.max(0, Number((item.stockActual - deduct).toFixed(2)));
        return {
          ...item,
          stockActual: newStock,
          ultimaModificacion: new Date().toISOString(),
          modificadoPor: 'Venta Registrada'
        };
      }
      return item;
    });

    setItems(updatedItems);
    saveLocalInventory(updatedItems);

    logAudit(
      'VENTA_REGISTRADA', 
      `Venta de ${quantity}x "${recipe.nombre}" (Total: RD$ ${(recipe.precioVenta * quantity).toLocaleString()}) - Ingredientes descontados de inventario.`,
      'info'
    );

    if (syncConfig.scriptUrl) {
      syncInventoryToSheets(syncConfig.scriptUrl, updatedItems, `Venta ${quantity}x ${recipe.nombre}`);
    }

    return {
      success: true,
      message: `¡Venta de ${quantity}x "${recipe.nombre}" registrada! Insumos descontados exitosamente.`
    };
  };

  // Test Connection in Settings
  const handleTestConnection = async (): Promise<boolean> => {
    if (!syncConfig.scriptUrl) return false;
    try {
      await fetchInventoryFromSheets(syncConfig.scriptUrl);
      setSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        isConfigured: true,
        scriptUrl: syncConfig.scriptUrl,
        lastSynced: new Date().toLocaleTimeString()
      }));
      return true;
    } catch {
      setSyncStatus(prev => ({
        ...prev,
        isConnected: false,
        isConfigured: true
      }));
      return false;
    }
  };

  // Send Email Notification Alert
  const handleSendEmailAlert = async (type: 'CRITICAL_STOCK' | 'WEEKLY_SUMMARY', email: string): Promise<string> => {
    const criticalList = items.filter(i => i.stockActual <= i.stockMinimo);
    const wasteCost = wasteRecords.reduce((a, b) => a + (b.costoPerdido || 0), 0);

    const result = await sendEmailNotification(syncConfig.scriptUrl, type, {
      recipientEmail: email,
      criticalItems: criticalList,
      wasteSummary: {
        count: wasteRecords.length,
        totalCost: wasteCost,
        items: wasteRecords
      }
    });

    logAudit('SYNC_SHEETS', `Notificación de correo [${type}] enviada a ${email}.`, 'info');
    showBanner(result.message, 'success');
    return result.message;
  };

  // Critical items count
  const criticalCount = items.filter(i => i.stockActual <= i.stockMinimo).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-200">
      
      {/* Navigation Header */}
      <NavHeader
        syncStatus={syncStatus}
        isUnlocked={isUnlocked}
        onToggleLock={() => {
          if (isUnlocked) {
            setIsUnlocked(false);
            showBanner('Modo Gerencia bloqueado.', 'info');
          } else {
            setIsPinModalOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommand={() => setIsCommandOpen(true)}
        onManualSync={() => {
          if (syncConfig.scriptUrl) {
            handleBackgroundSync(syncConfig.scriptUrl);
          } else {
            setIsSettingsOpen(true);
          }
        }}
        criticalCount={criticalCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
      />

      {/* Floating Banner Notice */}
      {bannerNotice && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 fade-in duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-glass border flex items-center gap-3 backdrop-blur-xl ${
            bannerNotice.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
              : bannerNotice.type === 'alert'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
              : 'bg-neutral-900/90 border-white/10 text-neutral-200'
          }`}>
            {bannerNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {bannerNotice.type === 'alert' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span className="text-xs font-semibold">{bannerNotice.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* KPI Summary Cards */}
        <KPICards
          items={items}
          wasteRecords={wasteRecords}
          onViewLowStock={() => setActiveTab('inventory')}
          onViewShoppingList={() => setActiveTab('shopping')}
        />

        {/* Tab 1: Inventory Table */}
        {activeTab === 'inventory' && (
          <InventoryTable
            items={items}
            onUpdateStock={handleUpdateStock}
            onSaveItem={handleSaveItem}
            onDeleteItem={handleDeleteItem}
            onQuickLogWaste={(item) => {
              setPreselectedWasteItem(item);
              setActiveTab('waste');
            }}
            isUnlocked={isUnlocked}
            onRequestUnlock={() => setIsPinModalOpen(true)}
          />
        )}

        {/* Tab 2: Recipes & Sale Simulator */}
        {activeTab === 'recipes' && (
          <MenuSimulator
            items={items}
            onSellRecipe={handleSellRecipe}
          />
        )}

        {/* Tab 3: Quick Shopping List (WhatsApp Export) */}
        {activeTab === 'shopping' && (
          <QuickShoppingList
            items={items}
            onRestockItem={handleRestockFromShopping}
          />
        )}

        {/* Tab 4: Waste and Losses Tracker */}
        {activeTab === 'waste' && (
          <LossTracker
            items={items}
            wasteRecords={wasteRecords}
            onAddWaste={handleAddWaste}
            onSendWasteSummaryEmail={() => handleSendEmailAlert('WEEKLY_SUMMARY', syncConfig.adminEmail)}
            initialSelectedItem={preselectedWasteItem}
            onClearInitialSelected={() => setPreselectedWasteItem(null)}
          />
        )}

        {/* Tab 5: Audit Log & Accountability */}
        {activeTab === 'audit' && (
          <AuditLogView
            logs={auditLogs}
          />
        )}

      </main>

      {/* Security PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          showBanner('Acceso de Gerencia desbloqueado', 'success');
        }}
      />

      {/* Command Palette (CMD+K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        items={items}
        onSelectItem={(item) => {
          // Open adjust or highlight item
        }}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Google Sheets & Notifications Settings Modal */}
      <SyncSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        syncConfig={syncConfig}
        onSaveConfig={(cfg) => {
          setSyncConfig(cfg);
          saveSyncConfig(cfg);
          setSyncStatus(prev => ({
            ...prev,
            isConfigured: !!cfg.scriptUrl,
            scriptUrl: cfg.scriptUrl
          }));
          showBanner('Configuración guardada', 'success');
        }}
        syncStatus={syncStatus}
        onTestConnection={handleTestConnection}
        onSendEmailAlert={handleSendEmailAlert}
        criticalItems={items.filter(i => i.stockActual <= i.stockMinimo)}
        wasteRecords={wasteRecords}
      />

    </div>
  );
}
