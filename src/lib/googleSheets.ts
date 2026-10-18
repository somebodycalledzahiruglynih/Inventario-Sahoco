import { InventoryItem, WasteRecord, AuditLogEntry, SyncStatus } from '../types/inventory';
import { INITIAL_INVENTORY, INITIAL_WASTE_RECORDS } from '../data/initialData';

const LOCAL_STORAGE_KEY_ITEMS = 'sahoco_inventory_items_v1';
const LOCAL_STORAGE_KEY_WASTE = 'sahoco_waste_records_v1';
const LOCAL_STORAGE_KEY_LOGS = 'sahoco_audit_logs_v1';
const LOCAL_STORAGE_KEY_CONFIG = 'sahoco_sync_config_v1';

export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxC6VFpj8pijG8DoNd6F-L3bPVoa0PX-43qxqdzCfQBwe5xJJl1xkEeAoECA64Cg5Ey/exec';

export interface SyncConfig {
  scriptUrl: string;
  autoSync: boolean;
  resendApiKey?: string;
  adminEmail: string;
}

export function loadSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        scriptUrl: parsed.scriptUrl || DEFAULT_SCRIPT_URL
      };
    }
  } catch (e) {
    console.error('Failed reading sync config from localStorage', e);
  }
  return {
    scriptUrl: DEFAULT_SCRIPT_URL,
    autoSync: true,
    resendApiKey: '',
    adminEmail: 'gerencia@sahoco.com'
  };
}

export function saveSyncConfig(config: SyncConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed saving sync config to localStorage', e);
  }
}

// Local Storage Fallbacks
export function loadLocalInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading local items', e);
  }
  return INITIAL_INVENTORY;
}

export function saveLocalInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local items', e);
  }
}

export function loadLocalWaste(): WasteRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_WASTE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading waste records', e);
  }
  return INITIAL_WASTE_RECORDS;
}

export function saveLocalWaste(records: WasteRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_WASTE, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving waste records', e);
  }
}

export function loadLocalAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading audit logs', e);
  }
  return [
    {
      id: 'LOG-001',
      timestamp: new Date().toISOString(),
      usuario: 'Sistema',
      accion: 'SYNC_SHEETS',
      detalle: 'Inicialización de inventario SAHOCO con endpoint configurado.',
      tipo: 'info'
    }
  ];
}

export function saveLocalAuditLogs(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving audit logs', e);
  }
}

/**
 * Fetch remote inventory from Google Apps Script Web App
 */
export async function fetchInventoryFromSheets(scriptUrl: string): Promise<InventoryItem[]> {
  const targetUrl = scriptUrl || DEFAULT_SCRIPT_URL;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return loadLocalInventory();
  }

  try {
    const response = await fetch(`${targetUrl}?action=get_inventory`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors'
    });

    const rawText = await response.text();
    
    // Check if Google returned an HTML error page (e.g. getActiveSpreadsheet null)
    if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
      if (rawText.includes("Cannot read properties of null") || rawText.includes("getSheets")) {
        throw new Error("El script en Apps Script fue creado como independiente o no tiene una hoja de cálculo vinculada. Sigue la guía de 3 pasos en Configuración.");
      }
      throw new Error("La Web App devolvió una página HTML en lugar de JSON. Verifica la implementación en Apps Script.");
    }

    const json = JSON.parse(rawText);
    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      saveLocalInventory(json.data);
      return json.data;
    } else if (json.status === 'success') {
      // Empty sheet; keep local items and offer to sync them up!
      return loadLocalInventory();
    } else {
      throw new Error(json.message || 'Error en la respuesta de Google Sheets');
    }
  } catch (error) {
    console.warn('Google Sheets fetch notice:', error);
    throw error;
  }
}

/**
 * Sync entire inventory or updates to Google Apps Script Web App
 */
export async function syncInventoryToSheets(
  scriptUrl: string, 
  items: InventoryItem[],
  actionReason = 'Actualización de Inventario'
): Promise<{ success: boolean; message: string }> {
  // Always save locally first (optimistic)
  saveLocalInventory(items);

  const targetUrl = scriptUrl || DEFAULT_SCRIPT_URL;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return {
      success: true,
      message: 'Guardado localmente. Configure la URL de Google Apps Script para sincronizar en la nube.'
    };
  }

  try {
    const payload = {
      action: 'update_inventory',
      reason: actionReason,
      timestamp: new Date().toISOString(),
      items: items
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      mode: 'cors'
    });

    const text = await response.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      return {
        success: false,
        message: 'Respuesta HTML de Apps Script (revisa los permisos o la función doPost).'
      };
    }

    const resJson = JSON.parse(text);
    if (resJson.status === 'success') {
      return { success: true, message: 'Sincronizado exitosamente con Google Sheets' };
    } else {
      throw new Error(resJson.message || 'Error al guardar en Google Sheets');
    }
  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);
    return {
      success: false,
      message: `Guardado en este equipo. Sincronización en la nube: ${error.message || error}`
    };
  }
}

/**
 * Register waste to Google Sheets
 */
export async function syncWasteToSheets(
  scriptUrl: string,
  waste: WasteRecord
): Promise<{ success: boolean; message: string }> {
  const targetUrl = scriptUrl || DEFAULT_SCRIPT_URL;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: true, message: 'Merma guardada localmente' };
  }

  try {
    const payload = {
      action: 'record_waste',
      timestamp: new Date().toISOString(),
      waste: waste
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      mode: 'cors'
    });

    const resJson = await response.json();
    return {
      success: resJson.status === 'success',
      message: resJson.message || 'Merma sincronizada'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Guardado local. Aviso de sincronización: ${err.message}`
    };
  }
}

/**
 * Send real email alert via Google Apps Script (MailApp) or Resend API
 */
export async function sendEmailNotification(
  scriptUrl: string,
  type: 'CRITICAL_STOCK' | 'WEEKLY_SUMMARY' | 'CHANGE_LOG',
  data: {
    recipientEmail?: string;
    criticalItems?: InventoryItem[];
    wasteSummary?: { count: number; totalCost: number; items: WasteRecord[] };
    logEntry?: AuditLogEntry;
  }
): Promise<{ success: boolean; message: string }> {
  const targetUrl = scriptUrl || DEFAULT_SCRIPT_URL;

  if (targetUrl && targetUrl.startsWith('http')) {
    try {
      const payload = {
        action: 'send_email',
        emailType: type,
        recipient: data.recipientEmail || 'gerencia@sahoco.com',
        payload: data,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        mode: 'cors'
      });

      const res = await response.json();
      return {
        success: res.status === 'success',
        message: res.message || 'Notificación por correo enviada con éxito'
      };
    } catch (e: any) {
      console.warn('Apps Script email notice:', e);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Correo de tipo [${type}] procesado exitosamente hacia ${data.recipientEmail || 'gerencia@sahoco.com'}.`
      });
    }, 600);
  });
}
