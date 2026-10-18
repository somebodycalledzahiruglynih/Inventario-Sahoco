'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, AlertTriangle, Plus, BarChart3, Package, ShoppingCart, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

import { ProductItem, HistoryRecord, UserName, MainCategory, ComisoPayload, Recipe, RecipeCategory, MotivoComiso, MovementCorrectionDraft } from '../lib/types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getLocalProducts, 
  saveLocalProducts, 
  getLocalHistory, 
  saveLocalHistory,
  fetchRemoteProducts, 
  sendStockUpdate, 
  sendStockBatch,
  sendNewProduct,
  sendDeleteProduct,
  sendBulkStockUpdate,
  fetchRemoteRecipes,
  sendSaveRecipe,
  sendDeleteRecipe,
  fetchRemotePriorities,
  sendPriorityToggle
} from '../lib/apiClient';
import { getLocalRecipes, saveLocalRecipes, createRecipeId } from '../lib/recipes';
import {
  PendingStockChange,
  getBatchWindowMs,
  loadPendingChanges,
  savePendingChanges,
  queuePendingChange,
  removePendingForProduct,
  applyPendingToProducts
} from '../lib/pendingChanges';
import {
  PriorityEntry,
  loadPriorities,
  savePriorities,
  isPriorityProduct,
  toggleProductPriority,
  applyPriorityToProducts,
  wasPriorityMigrationDone,
  markPriorityMigrationDone
} from '../lib/priority';

import { LoginScreen } from '../components/LoginScreen';
import { TopHeader } from '../components/TopHeader';
import { BottomNav, ActiveTab } from '../components/BottomNav';
import { ProductCard } from '../components/ProductCard';
import { ShoppingListView } from '../components/ShoppingListView';
import { HistoryView } from '../components/HistoryView';
import { AddProductModal } from '../components/AddProductModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ComisoModal } from '../components/ComisoModal';
import { MovementDetailModal } from '../components/MovementDetailModal';
import { RestockModal } from '../components/RestockModal';
import { ProductInfoModal } from '../components/ProductInfoModal';
import { RecipesView } from '../components/RecipesView';
import { RecipeFormModal, RecipeFormData } from '../components/RecipeFormModal';
import { PrepareDishModal, DishDeduction } from '../components/PrepareDishModal';
import { ProfileModal } from '../components/ProfileModal';
import { SettingsModal } from '../components/SettingsModal';

const CATEGORIES: { id: MainCategory | 'Todos'; label: string; icon: string }[] = [
  { id: 'Todos', label: 'Todos', icon: '✨' },
  { id: 'Insumos & Salado', label: 'Salado', icon: '🍟' },
  { id: 'Postres & Repostería', label: 'Postres & Repostería', icon: '🍰' },
  { id: 'Bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'Desechables', label: 'Desechables & Empaques', icon: '📦' },
];

// Clave de identidad de un cambio pendiente: sirve para quitar de la cola
// solo lo que ya se sincronizó, sin borrar cambios nuevos de la misma sesión.
const pendingChangeKey = (c: PendingStockChange) =>
  `${c.id}|${c.rowIndex}|${c.lastAt}|${c.actual}|${c.sugerido}`;

export default function MobileSahocoApp() {
  const [currentUser, setUser] = useState<UserName | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Data states
  const [rawProducts, setProducts] = useState<ProductItem[]>([]);
  // Prioridad de insumos clave (Configuración → Prioridad de Insumos).
  // Se superpone sobre los productos para que toda la UI vea los flags.
  const [priorities, setPriorities] = useState<PriorityEntry[]>([]);
  const products = useMemo(
    () => applyPriorityToProducts(rawProducts, priorities),
    [rawProducts, priorities]
  );
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Batching: cola de cambios de stock pendientes de enviar en un solo lote
  const [pendingChanges, setPendingChanges] = useState<PendingStockChange[]>([]);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);
  const flushRef = useRef<(auto?: boolean) => Promise<void>>(async () => {});

  // Navigation & Filter states
  const [currentTab, setCurrentTab] = useState<ActiveTab>('inventory');
  const [activeCategory, setActiveCategory] = useState<MainCategory | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);

  // Menú de usuario: Perfil + Ajustes del Sistema
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Comiso / Merma module
  const [comisoItem, setComisoItem] = useState<ProductItem | null>(null);
  const [isComisoOpen, setIsComisoOpen] = useState(false);
  const [movementDetail, setMovementDetail] = useState<HistoryRecord | null>(null);
  const [restockItem, setRestockItem] = useState<ProductItem | null>(null);

  // Info + quick edit module (derived from products so edits reflect instantly)
  const [infoItemId, setInfoItemId] = useState<string | null>(null);
  const infoItem = useMemo(
    () => (infoItemId ? products.find(p => p.id === infoItemId) || null : null),
    [products, infoItemId]
  );

  // Recipes module
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [recipeToPrepare, setRecipeToPrepare] = useState<Recipe | null>(null);

  // 1. Check Login Session on mount
  useEffect(() => {
    const savedUser = getCurrentUser();
    setUser(savedUser);
    
    // Load cached products & history (zero fake data)
    setProducts(getLocalProducts());
    setHistory(getLocalHistory());
    setRecipes(getLocalRecipes());
    setPriorities(loadPriorities());
    setIsInitializing(false);

    // Cola de batching de la jornada anterior: enviar al arrancar la app
    const pending = loadPendingChanges();
    setPendingChanges(pending);
    if (pending.length > 0) {
      flushTimerRef.current = setTimeout(() => flushRef.current(true), 8000);
    }

    // Initial background sync
    if (savedUser) {
      handleSync();
      handleSyncRecipes();
    }
  }, []);

  const handleLoginSuccess = (user: UserName) => {
    setUser(user);
    setCurrentUser(user);
    handleSync();
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  // Sync with Google Apps Script
  // Nunca vacía el inventario: si la respuesta falla o llega vacía,
  // se conservan los productos actuales y se muestra un aviso.
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Antes de traer datos frescos: enviar el lote pendiente para no pisarlo
      if (loadPendingChanges().length > 0) {
        await flushRef.current(true);
      }
      const result = await fetchRemoteProducts();
      if (result.items.length > 0) {
        const stillPending = loadPendingChanges();
        setProducts(stillPending.length > 0 ? applyPendingToProducts(result.items, stillPending) : result.items);
        if (stillPending.length > 0) setPendingChanges(stillPending);
      }
      if (result.source === 'remote') {
        setSyncError(null);
      } else if (result.error) {
        // Se están mostrando datos en caché mientras el backend falla
        setSyncError(result.error);
      }
    } catch (e: any) {
      console.warn('Sync notice:', e);
      setSyncError(e.message || 'Error al conectar con Google Sheets');
    } finally {
      setIsSyncing(false);
    }

    // Prioridades GLOBALES: viven en Google Sheets (pestaña "Prioridades") y las
    // comparten todos los perfiles/dispositivos. La caché local pinta al instante;
    // si el backend falla, se conserva lo que ya había en el dispositivo.
    // Migración única por dispositivo: si el backend todavía no tiene ninguna
    // prioridad y este dispositivo ya tenía marcas, se suben para volverlas
    // globales en lugar de perderlas.
    try {
      const remotePriorities = await fetchRemotePriorities();

      if (!wasPriorityMigrationDone()) {
        const local = loadPriorities();
        if (remotePriorities.length === 0 && local.length > 0) {
          // El autor de cada marca viaja en la propia entrada (marcadoPor)
          for (const entry of local) {
            await sendPriorityToggle(entry, true, entry.marcadoPor || 'SAHOCO');
          }
          setPriorities(local);
          savePriorities(local);
        } else {
          setPriorities(remotePriorities);
          savePriorities(remotePriorities);
        }
        markPriorityMigrationDone();
      } else {
        setPriorities(remotePriorities);
        savePriorities(remotePriorities);
      }
    } catch (e: any) {
      console.warn('Priorities sync notice:', e.message || e);
    }
  };

  // Sync recipes with Google Sheets (pestaña "Recetas"), con respaldo local
  const handleSyncRecipes = async () => {
    try {
      const remote = await fetchRemoteRecipes();
      if (remote && remote.length > 0) {
        setRecipes(remote);
        saveLocalRecipes(remote);
      }
    } catch (e: any) {
      console.warn('Recipes sync notice:', e.message || e);
    }
  };

  // Add History Record helper (functional update: soporta varias entradas seguidas)
  const addHistoryEntry = (
    item: ProductItem,
    tipo: HistoryRecord['tipo'],
    detalle: string,
    cantidadAnterior?: number,
    cantidadNueva?: number,
    extras?: Pick<HistoryRecord, 'motivo' | 'fechaVencimiento' | 'notas'>
  ) => {
    const newEntry: HistoryRecord = {
      id: `HIST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      usuario: currentUser || 'SAHOCO',
      itemId: item.id,
      itemNombre: item.nombre,
      itemFoto: item.foto,
      tipo,
      detalle,
      cantidadAnterior,
      cantidadNueva,
      ...(extras || {})
    };

    setHistory(prev => {
      const updated = [newEntry, ...prev];
      saveLocalHistory(updated);
      return updated;
    });
  };

  // Add History entry for non-product events (recetas, etc.)
  const addGeneralHistoryEntry = (
    tipo: HistoryRecord['tipo'],
    itemNombre: string,
    detalle: string
  ) => {
    const newEntry: HistoryRecord = {
      id: `HIST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      usuario: currentUser || 'SAHOCO',
      itemId: `SYS-${Date.now().toString(36)}`,
      itemNombre,
      tipo,
      detalle
    };

    setHistory(prev => {
      const updated = [newEntry, ...prev];
      saveLocalHistory(updated);
      return updated;
    });
  };

  // ── BATCHING: acumulación y envío agrupado de cambios de stock ──
  // Cada +/- de stock entra en la cola y se sincroniza en un lote único
  // cuando pasa la ventana sin nuevos cambios o al pulsar "Sincronizar".
  const updateQueue = (mutate: (queue: PendingStockChange[]) => PendingStockChange[]) => {
    setPendingChanges(prev => {
      const next = mutate(prev);
      savePendingChanges(next);
      return next;
    });
  };

  const showBatchNotice = (message: string) => {
    setBatchNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setBatchNotice(null), 5000);
  };

  const scheduleBatchFlush = () => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => flushRef.current(true), getBatchWindowMs());
  };

  const flushPendingChanges = async (auto: boolean = false) => {
    if (isFlushingRef.current) return;
    const queue = loadPendingChanges();
    if (queue.length === 0) return;

    isFlushingRef.current = true;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    try {
      const result = await sendStockBatch(queue, currentUser || 'SAHOCO');
      if (result.success) {
        const flushed = new Set(queue.map(pendingChangeKey));
        updateQueue(prev => prev.filter(c => !flushed.has(pendingChangeKey(c))));
        setSyncError(null);
        showBatchNotice(`✓ ${result.message}`);
      } else {
        setSyncError(result.message || 'No se pudo sincronizar el lote de cambios pendientes');
        if (!auto) showBatchNotice('No se pudo sincronizar; se reintentará automáticamente');
        scheduleBatchFlush();
      }
    } finally {
      isFlushingRef.current = false;
    }
  };

  const enqueueStockChange = (product: ProductItem, newActual: number, newSugerido: number) => {
    const change: PendingStockChange = {
      rowIndex: product.rowIndex,
      id: product.id,
      nombre: product.nombre,
      actual: newActual,
      sugerido: newSugerido,
      stockAnterior: product.stockActual,
      sugeridoAnterior: product.cantidadSugerida,
      usuario: currentUser || 'SAHOCO',
      lastAt: new Date().toISOString(),
      esPrioritario: product.esPrioritario === true,
      nivelPrioridad: product.nivelPrioridad
    };
    updateQueue(prev => queuePendingChange(prev, change));
    scheduleBatchFlush();
  };

  // ── PRIORIDAD DE INSUMOS: marca/desmarca GLOBAL (se guarda en Google Sheets) ──
  // Se aplica al instante en la UI y se sincroniza con el backend; si falla,
  // se revierte porque la prioridad no tiene sentido solo en este dispositivo.
  const handleTogglePriority = async (product: ProductItem) => {
    const usuario = currentUser || 'SAHOCO';
    const eraPrioritario = isPriorityProduct(priorities, product);

    const optimista = toggleProductPriority(priorities, product, usuario);
    setPriorities(optimista);
    savePriorities(optimista);

    const result = await sendPriorityToggle(product, !eraPrioritario, usuario);
    if (!result.success) {
      const revertido = toggleProductPriority(optimista, product, usuario);
      setPriorities(revertido);
      savePriorities(revertido);
      showBatchNotice('No se pudo guardar la prioridad; verifica la conexión e intenta de nuevo');
    } else {
      showBatchNotice(
        eraPrioritario
          ? 'Prioridad quitada para todos los perfiles'
          : 'Prioridad guardada para todos los perfiles'
      );
    }
  };

  // Mantiene la referencia de flush al día y limpia temporizadores al desmontar
  useEffect(() => {
    flushRef.current = flushPendingChanges;
  });

  useEffect(() => () => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
  }, []);

  // Stock Delta Adjustment [ - ] and [ + ] (Operational consumption / addition)
  const handleUpdateStockDelta = async (product: ProductItem, delta: number) => {
    const prevStock = product.stockActual;
    const newStock = Math.max(0, Number((product.stockActual + delta).toFixed(2)));
    if (newStock === prevStock) return;

    // Optimistic UI update
    const updated = products.map(p => p.id === product.id ? { ...p, stockActual: newStock } : p);
    setProducts(updated);
    saveLocalProducts(updated);

    // Audit log
    addHistoryEntry(
      product,
      delta > 0 ? 'INCREMENTO' : 'DECREMENTO',
      delta > 0 
        ? `Sumó existencias de ${prevStock} a ${newStock} ${product.unidad}`
        : `Consumo/Descuento de ${prevStock} a ${newStock} ${product.unidad}`,
      prevStock,
      newStock
    );

    if (newStock <= 0) {
      // Alerta crítica: producto agotado → se sincroniza de inmediato
      try {
        await sendStockUpdate(product, newStock, product.cantidadSugerida, currentUser || 'SAHOCO');
      } catch (err) {
        console.warn('Stock update notice:', err);
      }
      updateQueue(prev => removePendingForProduct(prev, product));
    } else {
      // Batching: se acumula para el lote de la jornada
      enqueueStockChange(product, newStock, product.cantidadSugerida);
    }
  };

  // Update Cantidad Sugerida
  const handleUpdateSugerido = async (product: ProductItem, newSugerido: number) => {
    const updated = products.map(p => p.id === product.id ? { ...p, cantidadSugerida: newSugerido } : p);
    setProducts(updated);
    saveLocalProducts(updated);

    addHistoryEntry(
      product,
      'SUGERIDO_EDITADO',
      `Ajustó cantidad sugerida de compra a ${newSugerido} ${product.unidad}`
    );

    enqueueStockChange(product, product.stockActual, newSugerido);
  };

  // Update Photo
  const handleUpdatePhoto = (product: ProductItem, newPhotoBase64: string) => {
    const updated = products.map(p => p.id === product.id ? { ...p, foto: newPhotoBase64 } : p);
    setProducts(updated);
    saveLocalProducts(updated);

    addHistoryEntry(
      product,
      'SUGERIDO_EDITADO',
      `Actualizó fotografía del insumo`
    );
  };

  // Restock from Shopping List
  const handleRestockItem = (
    product: ProductItem,
    addedAmount: number,
    info?: { descripcion?: string; suplidor?: string }
  ) => {
    const prevStock = product.stockActual;
    const newStock = Number((prevStock + addedAmount).toFixed(2));
    
    const updated = products.map(p => p.id === product.id ? { ...p, stockActual: newStock } : p);
    setProducts(updated);
    saveLocalProducts(updated);

    const notasPartes: string[] = [];
    if (info?.suplidor) notasPartes.push(`Repuesto de ${info.suplidor}`);
    if (info?.descripcion) notasPartes.push(info.descripcion);

    addHistoryEntry(
      product,
      'COMPRA_RECIBIDA',
      `Reabasteció pedido (+${addedAmount} ${product.unidad}). Nuevo stock: ${newStock}`,
      prevStock,
      newStock,
      notasPartes.length > 0 ? { notas: notasPartes.join(' • ') } : undefined
    );

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#D97706', '#5C3D2E', '#F59E0B', '#10b981']
    });

    enqueueStockChange(product, newStock, product.cantidadSugerida);
  };

  // Add New Product
  const handleAddNewProduct = async (productData: Omit<ProductItem, 'id' | 'rowIndex'>) => {
    const newProduct: ProductItem = {
      ...productData,
      id: `PRD-${Date.now().toString().slice(-4)}`,
      rowIndex: products.length + 2,
      ultimaModificacion: new Date().toISOString(),
      modificadoPor: currentUser || 'SAHOCO'
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    saveLocalProducts(updated);

    addHistoryEntry(
      newProduct,
      'NUEVO_PRODUCTO',
      `Registró nuevo insumo "${newProduct.nombre}" con stock inicial ${newProduct.stockActual} ${newProduct.unidad}`
    );

    try {
      await sendNewProduct(newProduct, currentUser || 'SAHOCO');
    } catch (e) {
      console.warn('Add notice:', e);
    }
  };

  // Permanent Delete Product Confirmation
  const handleConfirmDeleteProduct = async (product: ProductItem) => {
    const updated = products.filter(p => p.id !== product.id);
    setProducts(updated);
    saveLocalProducts(updated);

    addHistoryEntry(
      product,
      'ELIMINACION_PRODUCTO',
      `Eliminó permanentemente el insumo "${product.nombre}"`
    );

    try {
      await sendDeleteProduct(product, currentUser || 'SAHOCO');
    } catch (e) {
      console.warn('Delete notice:', e);
    }

    // Un insumo eliminado no debe quedar pendiente en el lote
    updateQueue(prev => removePendingForProduct(prev, product));
  };

  // ── MÓDULO 1: COMISO / MERMA ──
  const handleRequestComiso = (product: ProductItem | null) => {
    setComisoItem(product);
    setIsComisoOpen(true);
  };

  const handleConfirmComiso = async (product: ProductItem, payload: ComisoPayload) => {
    const current = products.find(p => p.id === product.id);
    if (!current) throw new Error('El insumo ya no existe en el inventario.');

    const prevStock = current.stockActual;
    const newStock = Math.max(0, Number((prevStock - payload.cantidad).toFixed(2)));

    const updated = products.map(p => (p.id === product.id ? { ...p, stockActual: newStock } : p));
    setProducts(updated);
    saveLocalProducts(updated);

    const detailParts = [
      `Comiso/Merma de ${payload.cantidad} ${current.unidad} (stock: ${prevStock} → ${newStock})`,
      `Motivo: ${payload.motivo}`
    ];
    if (payload.fechaVencimiento) detailParts.push(`Venció: ${payload.fechaVencimiento}`);
    if (payload.notas) detailParts.push(`Nota: ${payload.notas}`);

    addHistoryEntry(
      current,
      'COMISO',
      detailParts.join(' • '),
      prevStock,
      newStock,
      {
        motivo: payload.motivo,
        fechaVencimiento: payload.fechaVencimiento,
        notas: payload.notas
      }
    );

    try {
      await sendStockUpdate(
        current,
        newStock,
        current.cantidadSugerida,
        currentUser || 'SAHOCO',
        undefined,
        payload
      );
    } catch (err) {
      console.warn('Comiso sync notice:', err);
    }

    // El comiso ya viajó al instante: no debe repetirse dentro del lote
    updateQueue(prev => removePendingForProduct(prev, current));
  };

  // Detalle + corrección de un movimiento ya registrado (desde el historial)
  const handleSaveMovementCorrection = async (record: HistoryRecord, draft: MovementCorrectionDraft) => {
    const product = products.find(p => p.id === record.itemId) || null;
    const usuario = currentUser || 'SAHOCO';

    const hasQtyData = typeof record.cantidadAnterior === 'number' && typeof record.cantidadNueva === 'number';
    const signedOld = hasQtyData ? Number((record.cantidadNueva! - record.cantidadAnterior!).toFixed(2)) : null;
    const sign = signedOld !== null && signedOld < 0 ? -1 : 1;
    const canEditQty = signedOld !== null && signedOld !== 0;
    const newSigned = canEditQty ? Number((sign * draft.cantidad).toFixed(2)) : signedOld;
    const delta = canEditQty && signedOld !== null && newSigned !== null ? Number((newSigned - signedOld).toFixed(2)) : 0;
    const isComiso = record.tipo === 'COMISO';
    const comisoCantidad = canEditQty ? draft.cantidad : Math.abs(signedOld ?? 0);
    const motivoFinal = (draft.motivo || (record.motivo as MotivoComiso) || 'Otro') as MotivoComiso;
    const vencimientoFinal = isComiso ? (draft.fechaVencimiento ?? record.fechaVencimiento) : record.fechaVencimiento;
    const notasFinal = draft.notas ? draft.notas : undefined;

    // Ajustar el stock real por la diferencia corregida y sincronizar con Google Sheets
    if (product && (delta !== 0 || isComiso)) {
      const newStock = Math.max(0, Number((product.stockActual + delta).toFixed(2)));

      if (delta !== 0) {
        const updatedProducts = products.map(p => (p.id === product.id ? { ...p, stockActual: newStock } : p));
        setProducts(updatedProducts);
        saveLocalProducts(updatedProducts);
        // El lote pendiente ya no debe reescribir el stock corregido
        updateQueue(prev => removePendingForProduct(prev, product));
      }

      try {
        await sendStockUpdate(
          product,
          newStock,
          product.cantidadSugerida,
          usuario,
          undefined,
          isComiso
            ? {
                cantidad: comisoCantidad,
                motivo: motivoFinal,
                fechaVencimiento: vencimientoFinal || '',
                notas: notasFinal || ''
              }
            : undefined
        );
      } catch (err) {
        console.warn('Movement correction sync notice:', err);
      }
    }

    const stockNuevoRegistro = canEditQty && signedOld !== null && typeof record.cantidadAnterior === 'number' && newSigned !== null
      ? Number((record.cantidadAnterior + newSigned).toFixed(2))
      : record.cantidadNueva;

    const unidadTxt = product ? ` ${product.unidad}` : '';
    const A = record.cantidadAnterior;
    const N = stockNuevoRegistro;
    let detalle: string;

    switch (record.tipo) {
      case 'INCREMENTO':
        detalle = `Sumó existencias de ${A} a ${N}${unidadTxt}`;
        break;
      case 'DECREMENTO':
        detalle = `Consumo/Descuento de ${A} a ${N}${unidadTxt}`;
        break;
      case 'COMPRA_RECIBIDA':
        detalle = `Reabasteció pedido (+${Math.abs(newSigned ?? 0)}${unidadTxt}). Nuevo stock: ${N}`;
        break;
      case 'PREPARACION_PLATO': {
        const match = record.detalle.match(/preparación de "([^"]+)"/i);
        detalle = `Usado en preparación de "${match ? match[1] : 'un plato'}" (-${Math.abs(newSigned ?? 0)}${unidadTxt}, stock: ${A} → ${N})`;
        break;
      }
      case 'COMISO': {
        const parts = [`Comiso/Merma de ${comisoCantidad}${unidadTxt}`];
        if (typeof A === 'number' && typeof N === 'number') parts[0] += ` (stock: ${A} → ${N})`;
        parts.push(`Motivo: ${motivoFinal}`);
        if (vencimientoFinal) parts.push(`Venció: ${vencimientoFinal}`);
        if (notasFinal) parts.push(`Nota: ${notasFinal}`);
        detalle = parts.join(' • ');
        break;
      }
      default:
        detalle = record.detalle;
    }
    detalle += ` • Corregido por ${usuario}`;

    const updatedRecord: HistoryRecord = {
      ...record,
      detalle,
      cantidadNueva: stockNuevoRegistro,
      motivo: isComiso ? motivoFinal : record.motivo,
      fechaVencimiento: isComiso ? (vencimientoFinal || undefined) : record.fechaVencimiento,
      notas: notasFinal
    };

    setHistory(prev => {
      const updated = prev.map(h => (h.id === record.id ? updatedRecord : h));
      saveLocalHistory(updated);
      return updated;
    });
    setMovementDetail(updatedRecord);
  };

  // Eliminación de un registro del historial (revierte el stock cuando aplica)
  const handleDeleteMovement = async (record: HistoryRecord) => {
    const product = products.find(p => p.id === record.itemId) || null;
    const usuario = currentUser || 'SAHOCO';
    const hasQtyData = typeof record.cantidadAnterior === 'number' && typeof record.cantidadNueva === 'number';
    const signedOld = hasQtyData ? Number((record.cantidadNueva! - record.cantidadAnterior!).toFixed(2)) : null;
    const revertsStock = !!product && signedOld !== null && signedOld !== 0;

    if (revertsStock && product && signedOld !== null) {
      const newStock = Math.max(0, Number((product.stockActual - signedOld).toFixed(2)));
      const updatedProducts = products.map(p => (p.id === product.id ? { ...p, stockActual: newStock } : p));
      setProducts(updatedProducts);
      saveLocalProducts(updatedProducts);
      // El lote pendiente ya no debe reescribir el stock revertido
      updateQueue(prev => removePendingForProduct(prev, product));

      try {
        await sendStockUpdate(product, newStock, product.cantidadSugerida, usuario);
      } catch (err) {
        console.warn('Movement delete sync notice:', err);
      }
    }

    setHistory(prev => {
      const updated = prev.filter(h => h.id !== record.id);
      saveLocalHistory(updated);
      return updated;
    });

    setMovementDetail(null);
    showBatchNotice(
      revertsStock
        ? 'Registro eliminado y stock revertido en Google Sheets'
        : 'Registro eliminado del historial'
    );
  };

  // Deshacer los cambios del lote que todavía no se han enviado a Google Sheets
  const cancelPendingChanges = () => {
    if (isFlushingRef.current) return;
    const queue = loadPendingChanges();
    if (queue.length === 0) return;

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const revertedProducts = products.map(p => {
      const change = queue.find(c => c.rowIndex === p.rowIndex || (!!c.id && c.id === p.id));
      if (!change) return p;
      return {
        ...p,
        stockActual: typeof change.stockAnterior === 'number' ? change.stockAnterior : p.stockActual,
        cantidadSugerida: typeof change.sugeridoAnterior === 'number' ? change.sugeridoAnterior : p.cantidadSugerida
      };
    });
    setProducts(revertedProducts);
    saveLocalProducts(revertedProducts);

    // Quitar del historial las entradas de auditoría de esos cambios cancelados
    setHistory(prev => {
      const remaining = [...prev];
      queue.forEach(change => {
        const idx = remaining.findIndex(h =>
          h.itemId === change.id &&
          (h.tipo === 'INCREMENTO' || h.tipo === 'DECREMENTO' || h.tipo === 'COMPRA_RECIBIDA' || h.tipo === 'SUGERIDO_EDITADO') &&
          (h.tipo === 'SUGERIDO_EDITADO' || h.cantidadNueva === change.actual)
        );
        if (idx >= 0) remaining.splice(idx, 1);
      });
      saveLocalHistory(remaining);
      return remaining;
    });

    updateQueue(() => []);
    showBatchNotice('Cambios pendientes cancelados: el stock volvió a como estaba antes');
  };

  // ── MÓDULO 3: FICHA + EDICIÓN RÁPIDA DE INSUMO ──
  const handleSaveProductInfo = async (updatedProduct: ProductItem) => {
    const original = products.find(p => p.id === updatedProduct.id);
    if (!original) throw new Error('El insumo ya no existe en el inventario.');

    const finalProduct: ProductItem = {
      ...updatedProduct,
      ultimaModificacion: new Date().toISOString(),
      modificadoPor: currentUser || 'SAHOCO'
    };

    const withMeta = products.map(p => (p.id === finalProduct.id ? finalProduct : p));
    setProducts(withMeta);
    saveLocalProducts(withMeta);

    const changes: string[] = [];
    if (original.nombre !== finalProduct.nombre) changes.push(`nombre: "${original.nombre}" → "${finalProduct.nombre}"`);
    if (original.suplidor !== finalProduct.suplidor) changes.push(`suplidor: "${original.suplidor}" → "${finalProduct.suplidor}"`);
    if (original.categoria !== finalProduct.categoria) changes.push(`categoría: "${original.categoria}" → "${finalProduct.categoria}"`);
    if (original.unidad !== finalProduct.unidad) changes.push(`unidad: "${original.unidad}" → "${finalProduct.unidad}"`);
    if (original.stockActual !== finalProduct.stockActual) changes.push(`stock: ${original.stockActual} → ${finalProduct.stockActual}`);
    if (original.stockMinimo !== finalProduct.stockMinimo) changes.push(`mínimo: ${original.stockMinimo} → ${finalProduct.stockMinimo}`);
    if (original.stockMaximo !== finalProduct.stockMaximo) changes.push(`máximo: ${original.stockMaximo} → ${finalProduct.stockMaximo}`);
    if (original.cantidadSugerida !== finalProduct.cantidadSugerida) changes.push(`sugerido: ${original.cantidadSugerida} → ${finalProduct.cantidadSugerida}`);
    if (original.fechaVencimiento !== finalProduct.fechaVencimiento) changes.push(`vencimiento: "${original.fechaVencimiento || '—'}" → "${finalProduct.fechaVencimiento || '—'}"`);
    if (original.descripcion !== finalProduct.descripcion) changes.push('descripción actualizada');
    if (original.foto !== finalProduct.foto) changes.push('fotografía actualizada');

    addHistoryEntry(
      finalProduct,
      'INFO_EDITADO',
      changes.length > 0
        ? `Actualizó información: ${changes.join(', ')}`
        : 'Guardó la ficha del insumo (sin cambios detectados)'
    );

    try {
      await sendStockUpdate(
        finalProduct,
        finalProduct.stockActual,
        finalProduct.cantidadSugerida,
        currentUser || 'SAHOCO',
        finalProduct
      );
    } catch (err) {
      console.warn('Info update sync notice:', err);
    }

    // La ficha ya se sincronizó completa: quitar pendientes del lote para no repetir
    updateQueue(prev => removePendingForProduct(prev, finalProduct));
  };

  // ── MÓDULO 2: RECETAS ──
  const handleOpenCreateRecipe = () => {
    setRecipeToEdit(null);
    setIsRecipeFormOpen(true);
  };

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsRecipeFormOpen(true);
  };

  const handleSaveRecipe = async (data: RecipeFormData) => {
    const now = new Date().toISOString();

    if (recipeToEdit) {
      const updatedRecipe: Recipe = {
        ...recipeToEdit,
        nombre: data.nombre,
        categoria: data.categoria as RecipeCategory,
        descripcion: data.descripcion,
        ingredientes: data.ingredientes,
        updatedAt: now
      };
      const updated = recipes.map(r => (r.id === updatedRecipe.id ? updatedRecipe : r));
      setRecipes(updated);
      saveLocalRecipes(updated);
      addGeneralHistoryEntry('RECETA_EDITADA', updatedRecipe.nombre, `Editó la receta "${updatedRecipe.nombre}" (${updatedRecipe.ingredientes.length} ingredientes)`);
      try {
        await sendSaveRecipe(updatedRecipe, currentUser || 'SAHOCO');
      } catch (err) {
        console.warn('Recipe sync notice:', err);
      }
    } else {
      const newRecipe: Recipe = {
        id: createRecipeId(),
        nombre: data.nombre,
        categoria: data.categoria as RecipeCategory,
        descripcion: data.descripcion,
        ingredientes: data.ingredientes,
        creadoPor: currentUser || 'SAHOCO',
        createdAt: now,
        updatedAt: now
      };
      const updated = [newRecipe, ...recipes];
      setRecipes(updated);
      saveLocalRecipes(updated);
      addGeneralHistoryEntry('RECETA_CREADA', newRecipe.nombre, `Creó la receta "${newRecipe.nombre}" con ${newRecipe.ingredientes.length} ingredientes`);
      try {
        await sendSaveRecipe(newRecipe, currentUser || 'SAHOCO');
      } catch (err) {
        console.warn('Recipe sync notice:', err);
      }
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    const updated = recipes.filter(r => r.id !== recipe.id);
    setRecipes(updated);
    saveLocalRecipes(updated);
    addGeneralHistoryEntry('RECETA_ELIMINADA', recipe.nombre, `Eliminó la receta "${recipe.nombre}"`);
    try {
      await sendDeleteRecipe(recipe, currentUser || 'SAHOCO');
    } catch (err) {
      console.warn('Recipe delete notice:', err);
    }
  };

  // Deducción quirúrgica al preparar un plato (con modificaciones y extras)
  const handleConfirmPreparation = async (recipe: Recipe, deductions: DishDeduction[]) => {
    if (deductions.length === 0) return;

    const stockUpdates = new Map<string, number>();
    const auditEntries: Array<{ product: ProductItem; cantidad: number; prev: number; next: number }> = [];

    deductions.forEach(d => {
      const current = products.find(p => p.id === d.product.id);
      if (!current) return;
      const prev = current.stockActual;
      const next = Math.max(0, Number((prev - d.cantidad).toFixed(2)));
      stockUpdates.set(current.id, next);
      auditEntries.push({ product: current, cantidad: d.cantidad, prev, next });
    });

    if (auditEntries.length === 0) return;

    // 1. Actualización optimista e íntegra del stock local
    const updated = products.map(p => {
      const next = stockUpdates.get(p.id);
      return next !== undefined ? { ...p, stockActual: next } : p;
    });
    setProducts(updated);
    saveLocalProducts(updated);

    // 2. Auditoría detallada por ingrediente
    setHistory(prev => {
      const newEntries: HistoryRecord[] = auditEntries.map(({ product, cantidad, prev: p0, next }) => ({
        id: `HIST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        usuario: currentUser || 'SAHOCO',
        itemId: product.id,
        itemNombre: product.nombre,
        itemFoto: product.foto,
        tipo: 'PREPARACION_PLATO' as const,
        detalle: `Usado en preparación de "${recipe.nombre}" (-${cantidad} ${product.unidad}, stock: ${p0} → ${next})`,
        cantidadAnterior: p0,
        cantidadNueva: next
      }));
      const merged = [...newEntries, ...prev];
      saveLocalHistory(merged);
      return merged;
    });

    // 3. Sincronización en lote tolerante a fallos (cada insumo es independiente)
    try {
      await sendBulkStockUpdate(
        auditEntries.map(e => ({ product: { ...e.product, stockActual: e.next }, newStock: e.next })),
        currentUser || 'SAHOCO',
        `Preparación de plato "${recipe.nombre}" (${auditEntries.length} insumos)`
      );
    } catch (err) {
      console.warn('Dish prep sync notice:', err);
    }

    // Los insumos del plato ya bajaron en el lote de preparación: quitar pendientes
    updateQueue(prev => auditEntries.reduce((queue, e) => removePendingForProduct(queue, e.product), prev));
  };

  // Filtered products for Inventory View
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = searchQuery.trim() === '' ||
                          p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.suplidor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (activeCategory === 'Todos') return true;

      const catLower = (p.categoria || '').toLowerCase();
      if (activeCategory === 'Insumos & Salado') {
        return catLower.includes('salado') || catLower.includes('insumo') || catLower.includes('cocina');
      }
      if (activeCategory === 'Postres & Repostería') {
        return catLower.includes('postre') || catLower.includes('reposter') || catLower.includes('synthia');
      }
      if (activeCategory === 'Bebidas') {
        return catLower.includes('bebida') || catLower.includes('jugo') || catLower.includes('refresco') || catLower.includes('syrup') || catLower.includes('topping');
      }
      if (activeCategory === 'Desechables') {
        return catLower.includes('desechable') || catLower.includes('empaque') || catLower.includes('envase');
      }
      return p.categoria === activeCategory;
    });
  }, [products, searchQuery, activeCategory]);

  // Shopping Alert Count (items <= stockMinimo)
  const shoppingAlertCount = useMemo(() => {
    return products.filter(p => p.stockActual <= p.stockMinimo).length;
  }, [products]);

  // If loading or not logged in, show Login Screen
  if (isInitializing) {
    return <div className="min-h-screen bg-[#0f0f0f]" />;
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-slate-100 flex flex-col pb-safe-bottom">
      
      {/* 1. Top Header with User Badge */}
      <TopHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSyncing={isSyncing}
        onRefresh={handleSync}
        activeCount={products.length}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-3 sm:pt-5 space-y-4">
        
        {/* TAB 1: DASHBOARD & ANALÍTICA */}
        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            products={products}
            history={history}
            onNavigateToShopping={() => setCurrentTab('shopping')}
            onRequestComiso={() => handleRequestComiso(null)}
            onNavigateToRecipes={() => setCurrentTab('recipes')}
            onOpenRecord={setMovementDetail}
          />
        )}

        {/* TAB 2: INSUMOS & CONTROL OPERATIVO */}
        {currentTab === 'inventory' && (
          <div className="space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar entre los productos por nombre o proveedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl text-xs sm:text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/15"
              />
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => {
                const isSelected = activeCategory === cat.id;
                const count = cat.id === 'Todos'
                  ? products.length
                  : products.filter(p => {
                      const catLower = (p.categoria || '').toLowerCase();
                      if (cat.id === 'Insumos & Salado') return catLower.includes('salado') || catLower.includes('insumo') || catLower.includes('cocina') || p.categoria === 'Insumos & Salado';
                      if (cat.id === 'Postres & Repostería') return catLower.includes('postre') || catLower.includes('reposter') || catLower.includes('synthia') || p.categoria === 'Postres & Repostería';
                      if (cat.id === 'Bebidas') return catLower.includes('bebida') || catLower.includes('jugo') || catLower.includes('refresco') || catLower.includes('syrup') || catLower.includes('topping') || p.categoria === 'Bebidas';
                      if (cat.id === 'Desechables') return catLower.includes('desechable') || catLower.includes('empaque') || catLower.includes('envase') || p.categoria === 'Desechables';
                      return false;
                    }).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                        : 'bg-[#1a1a1a] border border-white/[0.08] text-slate-400 hover:bg-[#242424] hover:border-orange-500/20'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-[#242424] text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Summary Bar */}
            <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
              <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
              {isSyncing && (
                <span className="text-orange-400 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping inline-block" />
                  Sincronizando con Google Sheets...
                </span>
              )}
            </div>

            {/* Error Banner when products already exist */}
            {syncError && products.length > 0 && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between gap-2">
                <span className="truncate">⚠️ {syncError}</span>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white font-bold flex-none text-[11px]"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* 1. STATE: LOADING INITIAL PRODUCTS */}
            {isSyncing && products.length === 0 && (
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-10 text-center space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center mx-auto animate-spin">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Conectando en tiempo real con Google Sheets...
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Cargando los 131 productos del inventario operativo ('Inv.').
                  </p>
                </div>
              </div>
            )}

            {/* 2. STATE: ERROR CONNECTING (ZERO FAKE DATA) */}
            {!isSyncing && syncError && products.length === 0 && (
              <div className="bg-[#1a1a1a] border border-red-500/30 rounded-3xl p-7 text-center space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                <div className="w-13 h-13 rounded-2xl bg-red-500/15 border border-red-500/25 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    No se pudieron cargar los datos de Google Sheets
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {syncError}
                  </p>
                  <div className="p-3 bg-[#141414] rounded-xl border border-white/[0.06] text-left text-[11px] text-slate-400 max-w-md mx-auto space-y-1">
                    <p className="text-orange-400 font-bold">Instrucciones para activar la conexión en vivo:</p>
                    <p>1. Abre tu Google Sheet con la pestaña <strong>Inv.</strong></p>
                    <p>2. Ve a <strong>Extensiones &gt; Apps Script</strong> y pega el código de <code>google_apps_script/Código.gs</code>.</p>
                    <p>3. En <strong>Implementar &gt; Gestionar implementaciones</strong>, crea una versión nueva con acceso para <strong>"Cualquiera"</strong>.</p>
                  </div>
                </div>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-[0_0_15px_rgba(249,115,22,0.35)] transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Reintentar Conexión</span>
                </button>
              </div>
            )}

            {/* 3. STATE: INSUMOS LIST (NO PAGINATION LIMIT) */}
            {products.length > 0 && filteredProducts.length === 0 && (
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl p-10 text-center text-slate-500 text-xs">
                No se encontraron insumos con ese criterio de búsqueda.
              </div>
            )}

            {products.length > 0 && filteredProducts.length > 0 && (
              <div className="space-y-3">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={`${product.id}-${product.rowIndex || idx}`}
                    product={product}
                    onUpdateStockDelta={handleUpdateStockDelta}
                    onUpdateSugerido={handleUpdateSugerido}
                    onUpdatePhoto={handleUpdatePhoto}
                    onRequestDelete={(p) => setItemToDelete(p)}
                    onRequestComiso={(p) => handleRequestComiso(p)}
                    onRequestInfo={(p) => setInfoItemId(p.id)}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2.5: RECETAS DEL MENÚ & PREPARACIÓN INTELIGENTE */}
        {currentTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            products={products}
            onCreateRecipe={handleOpenCreateRecipe}
            onEditRecipe={handleOpenEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onPrepareRecipe={(recipe) => setRecipeToPrepare(recipe)}
          />
        )}

        {/* TAB 3: LISTA DE COMPRAS ESTÉTICA */}
        {currentTab === 'shopping' && (
          <ShoppingListView
            products={products}
            onRequestRestock={(product) => {
              const qty = product.cantidadSugerida || Math.max(1, product.stockMaximo - product.stockActual);
              handleRestockItem(product, qty);
            }}
            onOpenRestock={(product) => setRestockItem(product)}
            onUpdateSugerido={handleUpdateSugerido}
          />
        )}

        {/* TAB 4: HISTORIAL Y AUDITORÍA DE MOVIMIENTOS */}
        {currentTab === 'history' && (
          <HistoryView
            history={history}
            onOpenRecord={setMovementDetail}
          />
        )}

      </main>

      {/* 3. Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        shoppingAlertCount={shoppingAlertCount}
      />

      {/* Batching: aviso de lote sincronizado */}
      <AnimatePresence>
        {batchNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 left-0 right-0 z-50 px-4 pointer-events-none"
          >
            <div className="max-w-xl mx-auto bg-[#1a1a1a] border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl px-4 py-3 shadow-lg text-center">
              {batchNotice}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batching: cambios pendientes de sincronizar (lote de jornada) */}
      {pendingChanges.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-4">
          <div className="max-w-xl mx-auto bg-[#1a1a1a] border border-orange-500/30 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 flex-none">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100">
                {pendingChanges.length} {pendingChanges.length === 1 ? 'cambio pendiente' : 'cambios pendientes'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Se envía un solo correo al pasar {Math.round(getBatchWindowMs() / 60000)} min sin cambios
              </p>
            </div>
            <div className="flex items-center gap-2 flex-none">
              <button
                onClick={cancelPendingChanges}
                className="px-3 py-2 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] text-slate-300 border border-white/[0.08] text-[11px] font-bold active:scale-95 transition-all flex-none"
                title="Deshacer los cambios pendientes y volver al stock anterior"
              >
                Deshacer
              </button>
              <button
                onClick={() => flushPendingChanges(false)}
                className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold shadow-[0_0_15px_rgba(249,115,22,0.35)] active:scale-95 transition-all flex-none"
              >
                Sincronizar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddNewProduct}
      />

      {/* 5. Secure Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirmDelete={handleConfirmDeleteProduct}
      />

      {/* 6. Comiso / Merma Modal (desde tarjeta o panel de control) */}
      <ComisoModal
        isOpen={isComisoOpen}
        product={comisoItem}
        products={products}
        onClose={() => {
          setIsComisoOpen(false);
          setComisoItem(null);
        }}
        onConfirm={handleConfirmComiso}
      />

      {/* 6b. Detalle + Corrección de Movimientos (desde el historial) */}
      {movementDetail && (
        <MovementDetailModal
          key={movementDetail.id}
          record={movementDetail}
          product={products.find(p => p.id === movementDetail.itemId) || null}
          onClose={() => setMovementDetail(null)}
          onSaveCorrection={handleSaveMovementCorrection}
          onDelete={handleDeleteMovement}
        />
      )}

      {/* 6c. Ventana de Reposición: información + cantidad + suplidor/descripción */}
      <RestockModal
        isOpen={!!restockItem}
        product={restockItem}
        onClose={() => setRestockItem(null)}
        onConfirm={(product, cantidad, info) => {
          handleRestockItem(product, cantidad, info);
          setRestockItem(null);
        }}
      />

      {/* 7. Ficha de Información + Edición Rápida */}
      <ProductInfoModal
        isOpen={!!infoItem}
        product={infoItem}
        onClose={() => setInfoItemId(null)}
        onSave={handleSaveProductInfo}
      />

      {/* 8. Crear / Editar Receta */}
      <RecipeFormModal
        isOpen={isRecipeFormOpen}
        recipe={recipeToEdit}
        products={products}
        onClose={() => {
          setIsRecipeFormOpen(false);
          setRecipeToEdit(null);
        }}
        onSave={handleSaveRecipe}
      />

      {/* 9. Preparar Plato (Modo Cocina con modificaciones) */}
      <PrepareDishModal
        isOpen={!!recipeToPrepare}
        recipe={recipeToPrepare}
        products={products}
        onClose={() => setRecipeToPrepare(null)}
        onConfirm={handleConfirmPreparation}
      />

      {/* 10. Perfil del Usuario (menú del header) */}
      <ProfileModal
        isOpen={isProfileOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileOpen(false)}
        onChangeUser={() => {
          setIsProfileOpen(false);
          handleLogout();
        }}
      />

      {/* 11. Ajustes del Sistema: pestaña Prioridad de Insumos */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        products={products}
        currentUser={currentUser}
        onTogglePriority={handleTogglePriority}
      />

    </div>
  );
}
