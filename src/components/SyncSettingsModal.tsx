import React, { useState } from 'react';
import { 
  Settings, 
  FileSpreadsheet, 
  Mail, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  Send,
  HelpCircle,
  Code
} from 'lucide-react';
import { SyncStatus, InventoryItem, WasteRecord } from '../types/inventory';
import { SyncConfig } from '../lib/googleSheets';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncConfig;
  onSaveConfig: (config: SyncConfig) => void;
  syncStatus: SyncStatus;
  onTestConnection: () => Promise<boolean>;
  onSendEmailAlert: (type: 'CRITICAL_STOCK' | 'WEEKLY_SUMMARY', email: string) => Promise<string>;
  criticalItems: InventoryItem[];
  wasteRecords: WasteRecord[];
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onSaveConfig,
  syncStatus,
  onTestConnection,
  onSendEmailAlert,
  criticalItems,
  wasteRecords
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'email' | 'script'>('config');
  const [url, setUrl] = useState(syncConfig.scriptUrl || '');
  const [email, setEmail] = useState(syncConfig.adminEmail || 'gerencia@sahoco.com');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      ...syncConfig,
      scriptUrl: url.trim(),
      adminEmail: email.trim()
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      handleSave();
      const ok = await onTestConnection();
      if (ok) {
        setTestResult({ success: true, msg: '¡Conexión exitosa con Google Apps Script y hoja de cálculo!' });
      } else {
        setTestResult({ success: false, msg: 'No se pudo conectar con la URL especificada. Verifica los permisos de la Web App.' });
      }
    } catch (e: any) {
      setTestResult({ success: false, msg: e.message || 'Error de conexión' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTriggerEmail = async (type: 'CRITICAL_STOCK' | 'WEEKLY_SUMMARY') => {
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const resMsg = await onSendEmailAlert(type, email);
      setEmailStatus(resMsg);
    } catch (e: any) {
      setEmailStatus(`Error: ${e.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyAppsScriptCode = () => {
    const code = `/** SAHOCO GOOGLE APPS SCRIPT WEB APP - Copiar desde google_apps_script/Code.gs **/`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="glass-card rounded-2xl max-w-2xl w-full border border-white/20 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Integración con Google Sheets & Notificaciones
              </h3>
              <p className="text-xs text-neutral-400">
                Sincronización en tiempo real y alertas por correo electrónico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-white/5 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            🔗 Conexión Sheets Web App
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'email'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            📧 Alertas por Correo
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'script'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            📋 Código Apps Script (Guía)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: Config */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs text-neutral-300">
                <span className="font-bold text-orange-400 block mb-1">
                  💡 ¿Cómo funciona la sincronización?
                </span>
                La aplicación utiliza un Web App Endpoint de Google Apps Script. Cada vez que ajustas stock, registras una merma o una venta, los datos se sincronizan con las hojas "Inventario", "Mermas" y "Auditoria" de tu Google Sheet oficial.
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                  URL del Web App de Google Apps Script:
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Debe terminar en <code className="text-neutral-400">/exec</code> y tener acceso configurado a "Cualquiera".
                </span>
              </div>

              {testResult && (
                <div className={`p-3.5 rounded-xl border text-xs font-medium ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                }`}>
                  {testResult.msg}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-xs text-neutral-400">
                  Estado actual:{' '}
                  <strong className={syncStatus.isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                    {syncStatus.isConnected ? 'Conectado a Google Sheets' : 'Modo Almacenamiento Local'}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTest}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Probar Conexión</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSave();
                      onClose();
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-glow-orange transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Email Alerts */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                  Correo Electrónico de Destino (Gerencia / Comprador):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerencia@sahoco.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Alert 1 */}
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-400 block mb-1">
                      🚨 Alerta de Stock Crítico
                    </span>
                    <p className="text-xs text-neutral-400 mb-3">
                      Envía un correo inmediato con la lista de insumos agotados o por debajo del mínimo ({criticalItems.length} artículos detectados).
                    </p>
                  </div>
                  <button
                    onClick={() => handleTriggerEmail('CRITICAL_STOCK')}
                    disabled={isSendingEmail || criticalItems.length === 0}
                    className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-glow-rose transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Alerta Crítica</span>
                  </button>
                </div>

                {/* Alert 2 */}
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400 block mb-1">
                      📊 Resumen Semanal de Mermas
                    </span>
                    <p className="text-xs text-neutral-400 mb-3">
                      Envía un informe de costos por vencimientos, productos dañados y descartes del período.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTriggerEmail('WEEKLY_SUMMARY')}
                    disabled={isSendingEmail}
                    className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enviar Resumen de Mermas</span>
                  </button>
                </div>

              </div>

              {emailStatus && (
                <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs text-emerald-300 font-medium">
                  {emailStatus}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Google Apps Script Guide */}
          {activeTab === 'script' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2">
                <span className="font-bold text-white text-sm block">
                  Pasos de Instalación en Google Sheets (60 segundos):
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
                  <li>Abre tu hoja de cálculo oficial de <strong>SAHOCO</strong> en Google Drive.</li>
                  <li>Ve al menú superior: <strong>Extensiones &gt; Apps Script</strong>.</li>
                  <li>Borra el contenido existente y pega el código del archivo <code className="text-orange-400 font-mono">google_apps_script/Code.gs</code>.</li>
                  <li>Selecciona la función <code className="text-orange-400 font-mono">setupSahocoSheets</code> y haz clic en <strong>Ejecutar</strong> para preparar las tablas.</li>
                  <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                  <li>Elige Tipo: <strong>Aplicación Web</strong>, Acceso: <strong>Cualquiera</strong>.</li>
                  <li>Copia la URL de la aplicación web y pégala en la pestaña "Conexión Sheets Web App".</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-mono text-neutral-300 font-semibold">google_apps_script/Code.gs</span>
                  <span className="text-[11px] text-neutral-500 block">Archivo listo para producción incluido en el proyecto</span>
                </div>
                <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                  <Check className="w-4 h-4" /> Listo
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
