'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, AlertTriangle, Plus, BarChart3, Package, ShoppingCart, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

import { ProductItem, HistoryRecord, UserName, MainCategory, ComisoPayload, Recipe, RecipeCategory } from '../lib/types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getLocalProducts, 
  saveLocalProducts, 
  getLocalHistory, 
  saveLocalHistory,
  fetchRemoteProducts, 
  sendStockUpdate, 
  sendNewProduct,
  sendDeleteProduct,
  sendBulkStockUpdate,
  fetchRemoteRecipes,
  sendSaveRecipe,
  sendDeleteRecipe
} from '../lib/apiClient';
import { getLocalRecipes, saveLocalRecipes, createRecipeId } from '../lib/recipes';

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
import { ProductInfoModal } from '../components/ProductInfoModal';
import { RecipesView } from '../components/RecipesView';
import { RecipeFormModal, RecipeFormData } from '../components/RecipeFormModal';
import { PrepareDishModal, DishDeduction } from '../components/PrepareDishModal';

const CATEGORIES: { id: MainCategory | 'Todos'; label: string; icon: string }[] = [
  { id: 'Todos', label: 'Todos', icon: '✨' },
  { id: 'Insumos & Salado', label: 'Salado', icon: '🍟' },
  { id: 'Postres & Repostería', label: 'Postres & Repostería', icon: '🍰' },
  { id: 'Bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'Desechables', label: 'Desechables & Empaques', icon: '📦' },
];

export default function MobileSahocoApp() {
  const [currentUser, setUser] = useState<UserName | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Data states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Navigation & Filter states
  const [currentTab, setCurrentTab] = useState<ActiveTab>('inventory');
  const [activeCategory, setActiveCategory] = useState<MainCategory | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);

  // Comiso / Merma module
  const [comisoItem, setComisoItem] = useState<ProductItem | null>(null);
  const [isComisoOpen, setIsComisoOpen] = useState(false);

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
    setIsInitializing(false);

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
      const result = await fetchRemoteProducts();
      if (result.items.length > 0) {
        setProducts(result.items);
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

    // Send POST to Google Apps Script with user identity
    try {
      await sendStockUpdate(product, newStock, product.cantidadSugerida, currentUser || 'SAHOCO');
    } catch (err) {
      console.warn('Stock update notice:', err);
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

    try {
      await sendStockUpdate(product, product.stockActual, newSugerido, currentUser || 'SAHOCO');
    } catch (err) {
      console.warn('Sugerido update notice:', err);
    }
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
  const handleRestockItem = (product: ProductItem, addedAmount: number) => {
    const prevStock = product.stockActual;
    const newStock = prevStock + addedAmount;
    
    const updated = products.map(p => p.id === product.id ? { ...p, stockActual: newStock } : p);
    setProducts(updated);
    saveLocalProducts(updated);

    addHistoryEntry(
      product,
      'COMPRA_RECIBIDA',
      `Reabasteció pedido (+${addedAmount} ${product.unidad}). Nuevo stock: ${newStock}`,
      prevStock,
      newStock
    );

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#D97706', '#5C3D2E', '#F59E0B', '#10b981']
    });

    sendStockUpdate(product, newStock, product.cantidadSugerida, currentUser || 'SAHOCO');
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
            onUpdateSugerido={handleUpdateSugerido}
          />
        )}

        {/* TAB 4: HISTORIAL Y AUDITORÍA DE MOVIMIENTOS */}
        {currentTab === 'history' && (
          <HistoryView
            history={history}
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

    </div>
  );
}
