// Endpoint OFICIAL actual: despliegue del dueño (cuenta SAHOCO) con correos de
// auditoría, comisos y eliminaciones a soyzahirxd@gmail.com y somebodycallezahir@gmail.com.
// Cuarta implementación (mismo código, nuevo id/url tras eliminar la anterior).
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyHBVhV5jS6mlyn5QnP-5_zvgCPwbLKEcvTnA0eBB0e95q_6jkDRwLY0pBbgQr1qZoBvQ/exec';

// Endpoints conocidos que NO deben usarse como variable de entorno (se ignoran
// si NEXT_PUBLIC_APPS_SCRIPT_URL en Vercel todavía apunta a alguno de ellos):
// - ...yg8...: responde siempre {"status":"error","message":"Hoja vacía"} (script sin vincular a la hoja real)
// - ...yg5...: versión vieja que incluye la fila de encabezado como producto (131 items)
// - ...c6...:  versión de otra cuenta sin funciones nuevas (recetas, comisos, correos)
// - ...wQ...:  implementación anterior del dueño, eliminada (hoy responde 404)
const IGNORED_ENDPOINT_TOKENS = [
  'AKfycbyg8SOTyfvp7jUnIPp1VFE3',
  'AKfycby5zpMfGWMFCXruuPgyUGdfHWlqpc9NrYwHcE-riAuNn3E',
  'AKfycbxC6VFpj8pijG8DoNd6F',
  'AKfycbwQ_EvGVC51xkcKVcC7iuEQARl71TRyNMYefZMVG4fBJmKD--1JJ2uYBFq5RamTzcyPxQ',
];

/**
 * Resuelve el endpoint de Google Apps Script a utilizar:
 * - Usa la variable de entorno si es válida y no es un endpoint conocido como obsoleto/roto.
 * - En caso contrario, usa el endpoint oficial actual.
 */
export function resolveAppsScriptUrl(envUrl?: string | null): string {
  if (
    envUrl &&
    envUrl.startsWith('https://script.google.com/') &&
    !IGNORED_ENDPOINT_TOKENS.some((token) => envUrl.includes(token))
  ) {
    return envUrl;
  }
  return DEFAULT_APPS_SCRIPT_URL;
}

export const APPS_SCRIPT_ENDPOINT = resolveAppsScriptUrl(
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
);
